/**
 * Renders one 1200x630 share card per ledger week into `public/og/w/`.
 *
 * Runs LOCALLY ONLY (`npm run og`), driving whatever Chrome/Chromium is
 * already installed in headless mode. CI never runs a browser: it only copies
 * the PNGs committed here, so the build stays free and dependency-light.
 *
 *   npm run og                     # render missing cards
 *   npm run og -- --force          # re-render everything
 *   npm run og -- --week=2026-07-26
 */
import { spawn } from 'node:child_process'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { config } from '../src/config.ts'
import { parseLedger } from '../src/lib/ledger.ts'
import type { OgFonts } from '../src/lib/ogCard.ts'
import { OG_HEIGHT, OG_WIDTH, weekOgCards } from '../src/lib/ogCard.ts'
import { weekOgPath } from '../src/lib/urls.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
const ledgerPath = path.join(root, 'src/data/ledger.json')
const fontsDir = path.join(root, 'public/fonts')
const outDir = path.join(root, 'public')

const CHROME_CANDIDATES = [
  process.env.CHROME_BIN,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
]

function findChrome(): string {
  for (const candidate of CHROME_CANDIDATES) {
    if (candidate && existsSync(candidate)) return candidate
  }
  throw new Error(
    'No Chrome/Chromium found. Install Chrome or set CHROME_BIN to its binary.\n' +
      'Cards are optional: without them week pages fall back to the site-wide og.png.',
  )
}

/**
 * Fonts are inlined as data URIs so the card renders from any temp path.
 * Each face concatenates its latin and latin-ext subsets: a Turkish card
 * needs İ, Ş and Ğ, which live only in the ext file.
 */
function loadFonts(): OgFonts {
  const dataUri = (file: string) =>
    `data:font/woff2;base64,${readFileSync(path.join(fontsDir, file)).toString('base64')}`
  const subsets = (latin: string, ext: string) => ({ latin: dataUri(latin), ext: dataUri(ext) })
  return {
    display: subsets('bricolage-grotesque-latin.woff2', 'bricolage-grotesque-latin-ext.woff2'),
    mono: subsets('ibm-plex-mono-latin-500.woff2', 'ibm-plex-mono-latin-ext-500.woff2'),
    body: subsets('public-sans-latin.woff2', 'public-sans-latin-ext.woff2'),
  }
}

/** Size from the IHDR header — only meaningful for a complete PNG. */
function pngSize(file: string): { width: number; height: number } {
  const buffer = readFileSync(file)
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
}

/** True once the file ends with the IEND chunk, i.e. the PNG is complete. */
function isCompletePng(file: string): boolean {
  const buffer = readFileSync(file)
  return buffer.length > 45 && buffer.subarray(-8, -4).toString('latin1') === 'IEND'
}

const SETTLE_MS = 400
const RENDER_TIMEOUT_MS = 90_000

/**
 * Screenshot one card. Headless Chrome writes the PNG and then sometimes
 * lingers instead of exiting, so we wait for the file to stop growing and
 * shut the browser down ourselves rather than blocking forever.
 */
function screenshot(chrome: string, args: readonly string[], target: string): Promise<void> {
  rmSync(target, { force: true })
  return new Promise((resolve, reject) => {
    const child = spawn(chrome, [...args], { stdio: ['ignore', 'ignore', 'pipe'] })
    let stderr = ''
    let settled = false
    let lastSize = -1

    const finish = (error?: Error) => {
      if (settled) return
      settled = true
      clearInterval(poll)
      clearTimeout(deadline)
      child.kill('SIGKILL')
      if (error) reject(error)
      else resolve()
    }

    // Fallback only: Chrome normally exits on its own. A half-written file
    // must never count as done, so require a settled size AND the IEND chunk.
    const poll = setInterval(() => {
      if (!existsSync(target)) return
      const size = statSync(target).size
      if (size > 0 && size === lastSize && isCompletePng(target)) finish()
      lastSize = size
    }, SETTLE_MS)

    const deadline = setTimeout(
      () => finish(new Error(`Chrome timed out after ${RENDER_TIMEOUT_MS / 1000}s\n${stderr}`)),
      RENDER_TIMEOUT_MS,
    )

    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })
    child.on('error', (error) => finish(error))
    child.on('exit', (code) => {
      if (existsSync(target) && isCompletePng(target)) finish()
      else finish(new Error(`Chrome exited (${code}) without a complete screenshot\n${stderr}`))
    })
  })
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const force = args.includes('--force')
  const only = args.find((arg) => arg.startsWith('--week='))?.slice('--week='.length)

  const ledger = parseLedger(JSON.parse(readFileSync(ledgerPath, 'utf8')))
  const cards = weekOgCards(ledger, loadFonts(), config.SITE_NAME).filter(
    (card) => !only || card.weekEnding === only,
  )
  if (cards.length === 0) throw new Error(`No ledger week matches --week=${only}`)

  const pending = cards.filter(
    (card) => force || !existsSync(path.join(outDir, weekOgPath(card.weekEnding, card.lang))),
  )
  if (pending.length === 0) {
    console.log(`og: ${cards.length} card(s) already rendered — nothing to do (use --force to redo)`)
    return
  }

  const chrome = findChrome()
  const work = mkdtempSync(path.join(tmpdir(), 'roadto100k-og-'))
  try {
    for (const card of pending) {
      const htmlFile = path.join(work, `${card.lang}-${card.weekEnding}.html`)
      const target = path.join(outDir, weekOgPath(card.weekEnding, card.lang))
      // Render into the temp dir first: a failed run must never leave the
      // committed card deleted or half-written.
      const staged = path.join(work, `${card.lang}-${card.weekEnding}.png`)
      writeFileSync(htmlFile, card.html)
      await screenshot(
        chrome,
        [
          '--headless=new',
          '--disable-gpu',
          '--hide-scrollbars',
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-extensions',
          '--force-device-scale-factor=1',
          `--user-data-dir=${path.join(work, 'profile')}`,
          `--window-size=${OG_WIDTH},${OG_HEIGHT}`,
          '--virtual-time-budget=4000',
          `--screenshot=${staged}`,
          pathToFileURL(htmlFile).href,
        ],
        staged,
      )
      const size = pngSize(staged)
      if (size.width !== OG_WIDTH || size.height !== OG_HEIGHT) {
        throw new Error(
          `${weekOgPath(card.weekEnding, card.lang)} rendered at ${size.width}x${size.height}, expected ${OG_WIDTH}x${OG_HEIGHT}`,
        )
      }
      mkdirSync(path.dirname(target), { recursive: true })
      copyFileSync(staged, target)
      console.log(`og: ${weekOgPath(card.weekEnding, card.lang)} (${size.width}x${size.height})`)
    }
    console.log(`og: ${pending.length} card(s) written — commit public/og/ with the ledger.`)
  } finally {
    rmSync(work, { recursive: true, force: true })
  }
}

await main()
