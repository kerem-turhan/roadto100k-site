/**
 * `npm run leaks` — the machine behind CLAUDE.md's leak-prevention rule.
 *
 *   npm run leaks              scan the working sources
 *   npm run leaks -- --dist    also scan the built output in dist/
 *   npm run leaks -- --git     also scan every commit message
 *   npm run leaks:add          add a term, read from stdin, never echoed
 *
 * The terms live nowhere in this repository — not as words, not as hashes.
 * They come from $LEAK_DENYLIST (a repository secret in CI) or from a
 * gitignored local file. See `src/lib/leakScan.ts` for the matching semantics.
 *
 * ## The one rule this file exists to honour: no silent green
 *
 * A guard that cannot look must go RED. Every condition under which this
 * script fails to actually check something — a missing or malformed denylist,
 * a glob that matched nothing, an unreadable file, `--dist` without a build, a
 * shallow clone under `--git`, a failing canary self-test, an unknown flag —
 * exits 1. "I don't know" is reported as failure, never as success.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Denylist, Finding, ScanFile } from '../src/lib/leakScan.ts'
import { addTerm, parseDenylist, runSelfTest, scanFiles, scanText } from '../src/lib/leakScan.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
const localDenylistPath = path.join(root, '.leak-denylist.local.json')

const USAGE = [
  'usage:',
  '  npm run leaks              scan sources',
  '  npm run leaks -- --dist    also scan dist/ (run after npm run build)',
  '  npm run leaks -- --git     also scan commit messages (needs full history)',
  '  npm run leaks:add          add one term, read from stdin',
].join('\n')

const KNOWN_FLAGS = new Set(['--dist', '--git', '--add'])

function fail(message: string): never {
  console.error(`leaks: ERROR ${message}`)
  process.exit(1)
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

const plural = (n: number, noun: string): string => `${n.toLocaleString('en-US')} ${noun}${n === 1 ? '' : 's'}`

/* -------------------------------------------------------------------------- */
/* Denylist                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Where the terms come from — never from this repository.
 *
 * The denylist used to be committed. Even as salted hashes that was close to
 * plaintext: the file also carried the salt, a known-plaintext canary that
 * confirms the hash construction, each term's exact length, and a note saying
 * what category it belonged to. Enough to recover a term by brute force, and
 * enough to use the file as an oracle — one guess, instant confirmation.
 *
 * So it lives outside the tree: an environment variable in CI (a repository
 * secret), or a gitignored file locally. Missing means RED, never green: a
 * guard that cannot see its terms has not checked anything.
 */
const ENV_VAR = 'LEAK_DENYLIST'
const LOCAL_FILE = '.leak-denylist.local.json'

function parseOrFail(text: string, source: string): Denylist {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch (error) {
    fail(`${source} is not valid JSON: ${describe(error)}`)
  }
  try {
    return parseDenylist(raw)
  } catch (error) {
    fail(`${source} is malformed: ${describe(error)}`)
  }
}

function loadDenylist(): { denylist: Denylist; source: string } {
  const fromEnv = process.env[ENV_VAR]
  if (fromEnv !== undefined && fromEnv.trim() !== '') {
    return { denylist: parseOrFail(fromEnv, `$${ENV_VAR}`), source: `$${ENV_VAR}` }
  }

  if (existsSync(localDenylistPath)) {
    let text: string
    try {
      text = readFileSync(localDenylistPath, 'utf8')
    } catch (error) {
      fail(`${LOCAL_FILE} could not be read: ${describe(error)}`)
    }
    return { denylist: parseOrFail(text, LOCAL_FILE), source: LOCAL_FILE }
  }

  fail(
    `no denylist: set $${ENV_VAR} (a repository secret in CI) or create ${LOCAL_FILE} ` +
      '(gitignored, never committed). The guard will not pass without one — see README ' +
      '"Leak guard".',
  )
}

/* -------------------------------------------------------------------------- */
/* File discovery                                                             */
/* -------------------------------------------------------------------------- */

const SKIP_DIRS = new Set(['node_modules', 'dist', 'coverage'])

/** Text formats that can carry a leak. Binaries (woff2, png, ico) are skipped. */
const SOURCE_EXT = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.html', '.css',
  '.md', '.txt', '.xml', '.svg', '.yml', '.yaml', '.webmanifest',
])
const PUBLIC_EXT = new Set(['.json', '.txt', '.xml', '.svg', '.webmanifest'])
const DIST_EXT = new Set(['.html', '.js', '.css', '.xml', '.txt', '.json'])

function walk(dir: string, extensions: ReadonlySet<string>, found: string[]): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      // Dot directories are agent/tool workspaces (.git, .claude, .playwright-mcp);
      // .github is reached through its own explicit target instead.
      if (SKIP_DIRS.has(entry.name) || entry.name.startsWith('.')) continue
      walk(full, extensions, found)
      continue
    }
    if (!entry.isFile()) continue
    if (!extensions.has(path.extname(entry.name).toLowerCase())) continue
    // The denylist is the one file allowed to hold the plaintext canary.
    if (full === localDenylistPath) continue
    found.push(full)
  }
}

type Target = { label: string; files: () => string[] }

function directoryTarget(relative: string, extensions: ReadonlySet<string>): Target {
  return {
    label: `${relative}/`,
    files: () => {
      const dir = path.join(root, relative)
      if (!existsSync(dir)) {
        fail(`${relative}/ does not exist — the guard cannot scan what it cannot find`)
      }
      const found: string[] = []
      walk(dir, extensions, found)
      return found
    },
  }
}

const SOURCE_TARGETS: Target[] = [
  directoryTarget('src', SOURCE_EXT),
  directoryTarget('scripts', SOURCE_EXT),
  directoryTarget('docs', SOURCE_EXT),
  directoryTarget('.github/workflows', SOURCE_EXT),
  directoryTarget('public', PUBLIC_EXT),
  {
    label: 'index.html',
    files: () => (existsSync(path.join(root, 'index.html')) ? [path.join(root, 'index.html')] : []),
  },
  {
    label: 'root *.md',
    files: () =>
      readdirSync(root)
        .filter((name) => name.toLowerCase().endsWith('.md'))
        .map((name) => path.join(root, name)),
  },
]

/**
 * Collect every target's files, failing on any target that matched nothing.
 * A moved directory silently shrinking the guard's coverage is exactly the
 * failure this rule exists to prevent.
 */
function collect(targets: readonly Target[]): string[] {
  const files: string[] = []
  for (const target of targets) {
    const matched = target.files()
    if (matched.length === 0) {
      fail(`0 files matched ${target.label} — a path that matches nothing must not read as "clean"`)
    }
    files.push(...matched)
  }
  return [...new Set(files)].sort()
}

/**
 * Read every file. Deliberately unguarded: a file the guard cannot read is a
 * file it cannot clear, so the error propagates and the run exits non-zero
 * instead of quietly scanning less than it claims.
 */
function read(paths: readonly string[]): { files: ScanFile[]; bytes: number } {
  let bytes = 0
  const files = paths.map((absolute) => {
    const buffer = readFileSync(absolute)
    bytes += buffer.length
    return { path: path.relative(root, absolute), text: buffer.toString('utf8') }
  })
  return { files, bytes }
}

/* -------------------------------------------------------------------------- */
/* Commit messages                                                            */
/* -------------------------------------------------------------------------- */

function git(args: readonly string[]): string {
  try {
    return execFileSync('git', [...args], {
      cwd: root,
      encoding: 'utf8',
      maxBuffer: 256 * 1024 * 1024,
    })
  } catch (error) {
    return fail(`--git: \`git ${args.join(' ')}\` failed: ${describe(error)}`)
  }
}

function commitMessages(): ScanFile[] {
  if (git(['rev-parse', '--is-shallow-repository']).trim() === 'true') {
    fail(
      '--git: this clone is shallow, so most commit messages are not here to check. ' +
        'Use actions/checkout with `fetch-depth: 0`.',
    )
  }
  // \x1f separates the sha from the body, \x1e separates commits — neither can
  // occur in a commit message.
  const raw = git(['log', '--format=%H%x1f%B%x1e'])
  const records = raw
    .split('\x1e')
    .map((record) => record.replace(/^\s+/, ''))
    .filter((record) => record.length > 0)
  if (records.length === 0) {
    fail('--git: git log returned no commits — nothing was checked, so nothing is cleared')
  }
  return records.map((record) => {
    const separator = record.indexOf('\x1f')
    if (separator === -1) fail('--git: could not parse git log output')
    return {
      path: `commit ${record.slice(0, separator).slice(0, 7)}`,
      text: record.slice(separator + 1),
    }
  })
}

/* -------------------------------------------------------------------------- */
/* Reporting                                                                  */
/* -------------------------------------------------------------------------- */

const MAX_REPORTED = 40

/**
 * Print `file:line` plus redacted context. The matched span is replaced by
 * `[REDACTED len=N]`: printing the term would leak it into CI logs, which on a
 * public repository are public.
 */
function report(findings: readonly Finding[]): never {
  console.error(`leaks: ${plural(findings.length, 'hit')} — a denied term appears in this repo:`)
  for (const finding of findings.slice(0, MAX_REPORTED)) {
    console.error(`  ${finding.file}:${finding.line}  ${finding.excerpt}`)
  }
  if (findings.length > MAX_REPORTED) {
    console.error(`  … and ${plural(findings.length - MAX_REPORTED, 'more hit')}`)
  }
  console.error(
    'leaks: FAILED — see CLAUDE.md "Leak prevention". Remove the term and re-run; ' +
      'do not paste it anywhere to check whether it was the right one.',
  )
  process.exit(1)
}

/* -------------------------------------------------------------------------- */
/* leaks:add                                                                  */
/* -------------------------------------------------------------------------- */

async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) {
    console.error('leaks: reading one term from stdin — type it, then press Ctrl-D.')
  }
  const chunks: Buffer[] = []
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk))
  return Buffer.concat(chunks).toString('utf8')
}

/**
 * Add a term from stdin — never argv, which would land in shell history. The
 * term is hashed and appended; only its length is ever printed back.
 */
async function runAdd(denylist: Denylist, source: string): Promise<void> {
  const input = (await readStdin()).trim()
  if (input.length === 0) {
    fail(
      'leaks:add expects the term on stdin, e.g. `printf %s \'the-term\' | npm run leaks:add`. ' +
        'Never pass it as an argument — argv is recorded in your shell history.',
    )
  }
  if (source !== LOCAL_FILE) {
    fail(
      `--add writes to ${LOCAL_FILE}, but this run is using ${source}. Run it locally, then ` +
        'update the CI secret from the resulting file.',
    )
  }
  const result = addTerm(denylist, input)
  if (!result.added) {
    console.log(`already present (len ${result.len})`)
    return
  }
  writeFileSync(localDenylistPath, `${JSON.stringify(result.denylist, null, 2)}\n`)
  console.log(`added (len ${result.len})`)
}

/* -------------------------------------------------------------------------- */
/* Entry point                                                                */
/* -------------------------------------------------------------------------- */

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  for (const arg of args) {
    if (!KNOWN_FLAGS.has(arg)) fail(`unknown flag ${JSON.stringify(arg)}\n${USAGE}`)
  }
  const isAdd = args.includes('--add')
  if (isAdd && args.length > 1) fail(`--add runs on its own\n${USAGE}`)

  const { denylist, source } = loadDenylist()

  // Before scanning anything real: prove the scanner still matches, still
  // rejects ordinary text, and still redacts what it reports. A guard that
  // cannot flag its own canary is broken, and a broken guard must not pass.
  const selfTestError = runSelfTest(denylist, scanText)
  if (selfTestError) {
    fail(
      `guard self-test failed — ${selfTestError}. This run proves nothing; ` +
        'fix src/lib/leakScan.ts before trusting a green result.',
    )
  }
  console.log(`leaks: denylist ${source} — ${plural(denylist.terms.length, 'term')}, self-test ok`)

  if (isAdd) {
    await runAdd(denylist, source)
    return
  }

  const findings: Finding[] = []

  const sources = read(collect(SOURCE_TARGETS))
  findings.push(...scanFiles(sources.files, denylist))
  console.log(`leaks: sources ${plural(sources.files.length, 'file')}, ${plural(sources.bytes, 'byte')}`)

  if (args.includes('--dist')) {
    const distDir = path.join(root, 'dist')
    if (!existsSync(distDir)) {
      fail('--dist: dist/ does not exist — run `npm run build` first; an unbuilt tree is not a clean tree')
    }
    const distPaths: string[] = []
    walk(distDir, DIST_EXT, distPaths)
    if (distPaths.length === 0) {
      fail('--dist: dist/ holds no scannable text output — 0 files must not read as "clean"')
    }
    const built = read(distPaths.sort())
    findings.push(...scanFiles(built.files, denylist))
    console.log(`leaks: dist ${plural(built.files.length, 'file')}, ${plural(built.bytes, 'byte')}`)
  }

  if (args.includes('--git')) {
    const commits = commitMessages()
    findings.push(...scanFiles(commits, denylist))
    console.log(`leaks: history ${plural(commits.length, 'commit message')} scanned`)
  }

  if (findings.length > 0) report(findings)
  console.log('leaks: clean — no denied term found')
}

try {
  await main()
} catch (error) {
  // Not swallowing: re-reported with context and still exit 1. Anything that
  // stops the scan mid-way leaves the tree unchecked, which is a failure.
  fail(`the scan could not complete: ${describe(error)}`)
}
