/**
 * Leak guard — the scanning logic behind `npm run leaks`.
 *
 * CLAUDE.md's leak-prevention rule is binding but was, until this file existed,
 * enforced by trust alone. This module is the machine behind it.
 *
 * ## Why hashes, and what they are not
 *
 * This repository is public, so the forbidden words can never be committed —
 * not in a denylist, not in a fixture, not in a comment. The denylist therefore
 * stores only the first 32 hex characters of `sha256(salt + normalizedTerm)`.
 *
 * **This is obfuscation, not secrecy.** The salt sits committed next to the
 * hashes, so a short term is recoverable by anyone willing to run a dictionary
 * against it. That is a deliberate, accepted trade: the guard exists to stop
 * *accidental* leaks — a paste, a stray comment, a generated bundle — not to
 * withstand a motivated attacker who already suspects the word.
 *
 * ## Matching
 *
 * Text is normalised to `[a-z0-9]` only (lowercased, everything else deleted),
 * then a window of each denied length slides across every position. A denied
 * term is therefore caught however it is punctuated or embedded: `Foo-Bar`,
 * `foo_bar`, `Foo Bar`, `kerem@foobar.com`, `https://x.com/foobar/tree/main`,
 * `"foobar"` in JSON, or `foobar` inside a minified identifier.
 *
 * The cost is the occasional false positive, when two adjacent words happen to
 * concatenate into a denied term. That is the correct failure direction: a red
 * build a human clears in a minute beats a leak that is public forever.
 */

/* -------------------------------------------------------------------------- */
/* SHA-256 — a dependency-free implementation                                  */
/*                                                                            */
/* Written out rather than imported from `node:crypto` because this module is  */
/* type-checked by the app program too (no node types there), and because the  */
/* guard must not depend on anything that could be missing when it runs.       */
/* -------------------------------------------------------------------------- */

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
])

const INITIAL = new Uint32Array([
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
])

/** Scratch buffers, reused across the millions of window hashes a scan performs. */
const schedule = new Uint32Array(64)
const state = new Uint32Array(8)
const padScratch = new Uint8Array(256)
const messageScratch = new Uint8Array(512)

const encoder = new TextEncoder()

function compress(block: Uint8Array, offset: number): void {
  for (let i = 0; i < 16; i++) {
    const j = offset + i * 4
    schedule[i] =
      ((block[j] << 24) | (block[j + 1] << 16) | (block[j + 2] << 8) | block[j + 3]) >>> 0
  }
  for (let i = 16; i < 64; i++) {
    const x = schedule[i - 15]
    const y = schedule[i - 2]
    const s0 = ((x >>> 7) | (x << 25)) ^ ((x >>> 18) | (x << 14)) ^ (x >>> 3)
    const s1 = ((y >>> 17) | (y << 15)) ^ ((y >>> 19) | (y << 13)) ^ (y >>> 10)
    schedule[i] = (schedule[i - 16] + s0 + schedule[i - 7] + s1) >>> 0
  }

  let a = state[0]
  let b = state[1]
  let c = state[2]
  let d = state[3]
  let e = state[4]
  let f = state[5]
  let g = state[6]
  let h = state[7]

  for (let i = 0; i < 64; i++) {
    const s1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7))
    const ch = (e & f) ^ (~e & g)
    const t1 = (h + s1 + ch + K[i] + schedule[i]) >>> 0
    const s0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10))
    const maj = (a & b) ^ (a & c) ^ (b & c)
    const t2 = (s0 + maj) >>> 0
    h = g
    g = f
    f = e
    e = (d + t1) >>> 0
    d = c
    c = b
    b = a
    a = (t1 + t2) >>> 0
  }

  state[0] = (state[0] + a) >>> 0
  state[1] = (state[1] + b) >>> 0
  state[2] = (state[2] + c) >>> 0
  state[3] = (state[3] + d) >>> 0
  state[4] = (state[4] + e) >>> 0
  state[5] = (state[5] + f) >>> 0
  state[6] = (state[6] + g) >>> 0
  state[7] = (state[7] + h) >>> 0
}

function sha256HexBytes(bytes: Uint8Array): string {
  const padded = ((bytes.length + 9 + 63) >> 6) << 6
  const block = padded <= padScratch.length ? padScratch : new Uint8Array(padded)
  block.fill(0, 0, padded)
  block.set(bytes, 0)
  block[bytes.length] = 0x80

  // Message length in bits, big-endian. Inputs here are terms and windows, so
  // the high 32 bits are always zero.
  const bits = bytes.length * 8
  block[padded - 4] = (bits >>> 24) & 0xff
  block[padded - 3] = (bits >>> 16) & 0xff
  block[padded - 2] = (bits >>> 8) & 0xff
  block[padded - 1] = bits & 0xff

  state.set(INITIAL)
  for (let offset = 0; offset < padded; offset += 64) compress(block, offset)

  let hex = ''
  for (let i = 0; i < 8; i++) hex += state[i].toString(16).padStart(8, '0')
  return hex
}

/** SHA-256 of a UTF-8 string, lowercase hex. Exported so tests can pin it to the standard vectors. */
export function sha256Hex(input: string): string {
  return sha256HexBytes(encoder.encode(input))
}

/* -------------------------------------------------------------------------- */
/* Normalisation                                                              */
/* -------------------------------------------------------------------------- */

/** Characters of a hash kept in the denylist. 128 bits — collisions are not a practical concern. */
export const HASH_LENGTH = 32

/** Shortest term the guard will accept. Anything shorter matches half the repo. */
export const MIN_TERM_LENGTH = 4

/** The only denylist schema version this build understands. */
export const DENYLIST_VERSION = 1

type IndexedText = {
  /** Normalised characters, one ASCII byte each. */
  codes: Uint8Array
  /** `map[i]` is the index in the original text that produced normalised character `i`. */
  map: Int32Array
  length: number
}

function normalizeIndexed(text: string): IndexedText {
  const codes: number[] = []
  const map: number[] = []
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    if ((code >= 97 && code <= 122) || (code >= 48 && code <= 57)) {
      codes.push(code) // a-z, 0-9
      map.push(i)
      continue
    }
    if (code >= 65 && code <= 90) {
      codes.push(code + 32) // A-Z
      map.push(i)
      continue
    }
    if (code < 128) continue // ASCII punctuation, whitespace, control — deleted
    // Non-ASCII: fold through toLowerCase() so 'İ' still normalises to 'i'
    // rather than vanishing and splicing its neighbours together.
    const lowered = text.charAt(i).toLowerCase()
    for (let j = 0; j < lowered.length; j++) {
      const c = lowered.charCodeAt(j)
      if ((c >= 97 && c <= 122) || (c >= 48 && c <= 57)) {
        codes.push(c)
        map.push(i)
      }
    }
  }
  return { codes: Uint8Array.from(codes), map: Int32Array.from(map), length: codes.length }
}

/**
 * Lowercase, then delete every character that is not `[a-z0-9]`.
 *
 * This is what makes the guard immune to separators: `Foo-Bar`, `foo_bar`,
 * `foo.bar`, `kerem@foobar.com` and `x.com/foobar/tree/main` all normalise to
 * text containing `foobar`.
 */
export function normalize(text: string): string {
  const { codes, length } = normalizeIndexed(text)
  let out = ''
  for (let i = 0; i < length; i += 8192) out += String.fromCharCode(...codes.subarray(i, i + 8192))
  return out
}

function hashWindow(saltBytes: Uint8Array, codes: Uint8Array, start: number, len: number): string {
  const total = saltBytes.length + len
  const message = total <= messageScratch.length ? messageScratch : new Uint8Array(total)
  message.set(saltBytes, 0)
  message.set(codes.subarray(start, start + len), saltBytes.length)
  return sha256HexBytes(message.subarray(0, total)).slice(0, HASH_LENGTH)
}

/* -------------------------------------------------------------------------- */
/* Compiled denylist — the hot path                                           */
/*                                                                            */
/* A scan hashes one window per position per denied length: millions of        */
/* hashes over a repo plus its bundle. So the inner loop allocates nothing and */
/* builds no strings. Each length gets a pre-padded message block with the     */
/* salt, the 0x80 terminator and the bit-length already written; a window only */
/* overwrites its own bytes. The resulting digest is compared as four 32-bit   */
/* words against a map keyed by the first word.                               */
/* -------------------------------------------------------------------------- */

type CompiledLength = {
  len: number
  /** Padded message: salt ++ window ++ padding. Only the window bytes change. */
  block: Uint8Array
  /** Byte offset of the window inside {@link block}. */
  offset: number
  /** First digest word → the remaining three words of every term with that prefix. */
  buckets: Map<number, number[][]>
}

function compile(denylist: Denylist): CompiledLength[] {
  const saltBytes = encoder.encode(denylist.salt)
  const byLength = new Map<number, CompiledLength>()
  for (const term of denylist.terms) {
    let entry = byLength.get(term.len)
    if (!entry) {
      const total = saltBytes.length + term.len
      const padded = ((total + 9 + 63) >> 6) << 6
      const block = new Uint8Array(padded)
      block.set(saltBytes, 0)
      block[total] = 0x80
      const bits = total * 8
      block[padded - 4] = (bits >>> 24) & 0xff
      block[padded - 3] = (bits >>> 16) & 0xff
      block[padded - 2] = (bits >>> 8) & 0xff
      block[padded - 1] = bits & 0xff
      entry = { len: term.len, block, offset: saltBytes.length, buckets: new Map() }
      byLength.set(term.len, entry)
    }
    const words = [
      Number.parseInt(term.hash.slice(0, 8), 16),
      Number.parseInt(term.hash.slice(8, 16), 16),
      Number.parseInt(term.hash.slice(16, 24), 16),
      Number.parseInt(term.hash.slice(24, 32), 16),
    ]
    const bucket = entry.buckets.get(words[0])
    if (bucket) bucket.push([words[1], words[2], words[3]])
    else entry.buckets.set(words[0], [[words[1], words[2], words[3]]])
  }
  return [...byLength.values()]
}

/**
 * The denylist entry for a term: the first {@link HASH_LENGTH} hex characters of
 * `sha256(salt + normalize(term))`. The term itself is never derivable from
 * this file, which is the whole point.
 */
export function hashTerm(salt: string, term: string): string {
  const normalized = normalizeIndexed(term)
  return hashWindow(encoder.encode(salt), normalized.codes, 0, normalized.length)
}

/* -------------------------------------------------------------------------- */
/* Denylist                                                                   */
/* -------------------------------------------------------------------------- */

export type DenyTerm = {
  /** Length of the normalised term — the window size to slide. */
  len: number
  hash: string
}

export type Denylist = {
  version: number
  salt: string
  terms: DenyTerm[]
}

/*
 * The canary is deliberately public: it is the guard's liveness proof, not a
 * secret. It therefore gets its OWN salt.
 *
 * The first version of this file kept the canary next to the real terms, under
 * the same salt, in a committed file. That was the whole scheme handed over:
 * a known plaintext plus its hash confirms the construction is
 * `sha256(salt + normalizedTerm)`, and from there each term's `len` narrows the
 * search to something a laptop finishes in seconds. (Proven, not theorised —
 * a 4-character term in that file was recovered by brute force during this
 * session.) Separating the salts means knowing the canary tells you nothing
 * about the real terms, and the real salt now lives outside the repository
 * entirely.
 */
export const CANARY_TOKEN = 'leakcanaryxyzzy'
const CANARY_SALT = 'leak-guard-self-test-v1'

function parseTerm(entry: unknown, index: number): DenyTerm {
  const where = `denylist term #${index}`
  if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
    throw new Error(`${where} must be an object`)
  }
  const value = entry as Record<string, unknown>
  const len = value.len
  if (typeof len !== 'number' || !Number.isInteger(len) || len < MIN_TERM_LENGTH) {
    throw new Error(`${where} needs an integer "len" of at least ${MIN_TERM_LENGTH}`)
  }
  const hash = value.hash
  if (typeof hash !== 'string' || !/^[0-9a-f]+$/.test(hash) || hash.length !== HASH_LENGTH) {
    throw new Error(`${where} needs a "hash" of exactly ${HASH_LENGTH} lowercase hex characters`)
  }
  // No labels. A note saying what a term is for ("nda-project") tells a reader
  // what to guess, and confirms the category exists at all. Rejected rather
  // than ignored, so the old shape cannot quietly come back.
  if ('note' in value) {
    throw new Error(`${where} carries a "note" — labels describe what to guess for; remove it`)
  }
  return { len, hash }
}

/**
 * Validate a parsed `leak-denylist.json`. Throws — loudly and specifically — on
 * anything that would make the guard scan for nothing while still exiting 0.
 */
export function parseDenylist(raw: unknown): Denylist {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error('denylist must be a JSON object')
  }
  const value = raw as Record<string, unknown>
  if (value.version !== DENYLIST_VERSION) {
    throw new Error(`denylist "version" must be ${DENYLIST_VERSION}, got ${String(value.version)}`)
  }
  const salt = value.salt
  if (typeof salt !== 'string' || salt.length === 0) {
    throw new Error('denylist is missing a non-empty "salt"')
  }
  // A known plaintext stored beside the real hashes, under the same salt, is
  // what turned the old committed file into a confirmation oracle. The canary
  // now lives in code with its own salt, and this shape is refused outright.
  if ('canary' in value) {
    throw new Error(
      'denylist carries a "canary" — a known plaintext next to the real terms reveals the ' +
        'hash construction. The canary belongs in leakScan.ts, under its own salt.',
    )
  }
  const terms = value.terms
  if (!Array.isArray(terms)) throw new Error('denylist "terms" must be an array')
  if (terms.length === 0) {
    throw new Error('denylist "terms" is empty — a guard with nothing to look for is not a guard')
  }
  return { version: DENYLIST_VERSION, salt, terms: terms.map(parseTerm) }
}

function sortTerms(terms: readonly DenyTerm[]): DenyTerm[] {
  // Sorted by (len, hash) so the committed file is stable and its order says
  // nothing about when a term was added.
  return [...terms].sort((a, b) => a.len - b.len || a.hash.localeCompare(b.hash))
}

/**
 * Add a term to a denylist, returning a new one. Never returns or embeds the
 * term itself — only its length, which is all the CLI is allowed to print.
 */
export function addTerm(
  denylist: Denylist,
  rawTerm: string,
): { denylist: Denylist; added: boolean; len: number } {
  const len = normalize(rawTerm).length
  if (len < MIN_TERM_LENGTH) {
    throw new Error(
      `a term must normalise to at least ${MIN_TERM_LENGTH} characters, this one normalises to ${len}`,
    )
  }
  const hash = hashTerm(denylist.salt, rawTerm)
  const exists = denylist.terms.some((term) => term.hash === hash && term.len === len)
  const terms = exists ? denylist.terms : sortTerms([...denylist.terms, { len, hash }])
  return { denylist: { ...denylist, terms }, added: !exists, len }
}

/* -------------------------------------------------------------------------- */
/* Scanning                                                                   */
/* -------------------------------------------------------------------------- */

export type TextFinding = {
  /** 1-based line in the original text. */
  line: number
  /** Length of the normalised term that matched. */
  termLen: number
  /** Context around the hit with the hit itself replaced by `[REDACTED len=N]`. */
  excerpt: string
}

export type ScanFile = { path: string; text: string }

export type Finding = TextFinding & { file: string }

export type ScanFn = (text: string, denylist: Denylist) => TextFinding[]

type Span = { start: number; end: number; len: number }
type MaskedSpan = { start: number; end: number; lens: number[] }

/** Characters of context shown either side of a hit. */
const CONTEXT = 36

function mergeSpans(sorted: readonly Span[]): MaskedSpan[] {
  const merged: MaskedSpan[] = []
  for (const span of sorted) {
    const last = merged[merged.length - 1]
    if (last && span.start <= last.end) {
      last.end = Math.max(last.end, span.end)
      if (!last.lens.includes(span.len)) last.lens.push(span.len)
    } else {
      merged.push({ start: span.start, end: span.end, lens: [span.len] })
    }
  }
  return merged
}

function lineOf(text: string, index: number): number {
  let line = 1
  for (let i = 0; i < index; i++) if (text.charCodeAt(i) === 10) line++
  return line
}

/**
 * Build the reported excerpt. Every matched span overlapping the window is
 * replaced — not just the one being reported — because a neighbouring hit
 * inside the context would otherwise print the forbidden word into CI logs,
 * which on a public repo are public.
 */
function buildExcerpt(text: string, masked: readonly MaskedSpan[], target: Span): string {
  const lineStart = target.start === 0 ? 0 : text.lastIndexOf('\n', target.start - 1) + 1
  const newline = text.indexOf('\n', target.end)
  const lineEnd = newline === -1 ? text.length : newline
  const from = Math.max(lineStart, target.start - CONTEXT)
  const to = Math.min(lineEnd, target.end + CONTEXT)

  let out = ''
  let cursor = from
  for (const span of masked) {
    if (span.end <= from || span.start >= to) continue
    const start = Math.max(span.start, from)
    const end = Math.min(span.end, to)
    if (start > cursor) out += text.slice(cursor, start)
    if (end > cursor) out += `[REDACTED len=${span.lens.join('+')}]`
    cursor = Math.max(cursor, end)
  }
  if (cursor < to) out += text.slice(cursor, to)

  const body = out.replace(/\s+/g, ' ').trim()
  return `${from > lineStart ? '…' : ''}${body}${to < lineEnd ? '…' : ''}`
}

/**
 * Scan one blob of text. Returns one finding per match, each already redacted.
 */
export function scanText(text: string, denylist: Denylist): TextFinding[] {
  const compiled = compile(denylist)
  const { codes, map, length } = normalizeIndexed(text)

  const spans: Span[] = []
  for (const { len, block, offset, buckets } of compiled) {
    const padded = block.length
    for (let i = 0; i + len <= length; i++) {
      for (let k = 0; k < len; k++) block[offset + k] = codes[i + k]
      state.set(INITIAL)
      for (let at = 0; at < padded; at += 64) compress(block, at)
      const bucket = buckets.get(state[0])
      if (bucket === undefined) continue
      for (const [w1, w2, w3] of bucket) {
        if (state[1] === w1 && state[2] === w2 && state[3] === w3) {
          spans.push({ start: map[i], end: map[i + len - 1] + 1, len })
          break
        }
      }
    }
  }
  if (spans.length === 0) return []

  spans.sort((a, b) => a.start - b.start || a.end - b.end)
  const masked = mergeSpans(spans)
  return spans.map((span) => ({
    line: lineOf(text, span.start),
    termLen: span.len,
    excerpt: buildExcerpt(text, masked, span),
  }))
}

/**
 * Scan a set of already-read files.
 *
 * Throws when handed nothing. A guard that scanned zero files has not proved
 * the tree is clean — it has proved only that its own file discovery broke, and
 * that must be a red build, never a green one.
 */
export function scanFiles(files: readonly ScanFile[], denylist: Denylist): Finding[] {
  if (files.length === 0) {
    throw new Error('nothing to scan: 0 files matched — a guard that cannot look must fail, not pass')
  }
  const findings: Finding[] = []
  for (const file of files) {
    for (const hit of scanText(file.text, denylist)) findings.push({ file: file.path, ...hit })
  }
  return findings
}

/**
 * Prove the scanner is alive before trusting a clean result.
 *
 * Runs three checks through the real scan path:
 *  1. a synthetic string containing the plaintext canary **must** be flagged
 *     (the canary's own hash is a denylist term), so a scanner that matches
 *     nothing cannot pass;
 *  2. ordinary control text **must not** be flagged, so a scanner that matches
 *     everything cannot pass either;
 *  3. the reported excerpt **must not** contain the matched token, so a
 *     regression in redaction is caught before it prints a secret into CI logs.
 *
 * Returns `null` when healthy, or a human-readable reason to fail the run.
 */
export function runSelfTest(denylist: Denylist, scan: ScanFn = scanText): string | null {
  // Run against the canary's own list, under its own salt: the real denylist is
  // never exercised with a known plaintext, and the real salt is never used to
  // hash anything an outsider can see.
  const canaryList: Denylist = {
    version: DENYLIST_VERSION,
    salt: CANARY_SALT,
    terms: [{ len: normalize(CANARY_TOKEN).length, hash: hashTerm(CANARY_SALT, CANARY_TOKEN) }],
  }

  const probe = `guard self test ${CANARY_TOKEN} end of probe`
  const hits = scan(probe, canaryList)
  if (hits.length === 0) {
    return 'the canary token was not flagged — the scanner is not matching anything'
  }
  if (scan('the quick brown fox jumps over the lazy dog', canaryList).length > 0) {
    return 'ordinary control text was flagged — the scanner is matching everything'
  }
  const normalizedCanary = normalize(CANARY_TOKEN)
  if (hits.some((hit) => normalize(hit.excerpt).includes(normalizedCanary))) {
    return 'the report echoed the matched token instead of redacting it'
  }
  // The real list still has to be usable: compiling it is what would catch a
  // structurally valid but unscannable term set.
  if (scan('nothing to see here', denylist).length > 0) {
    return 'the real denylist flagged neutral text — it is not usable'
  }
  return null
}
