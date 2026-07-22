import { describe, expect, it } from 'vitest'
import type { Denylist, TextFinding } from './leakScan.ts'
import {
  CANARY_TOKEN,
  DENYLIST_VERSION,
  HASH_LENGTH,
  MIN_TERM_LENGTH,
  addTerm,
  hashTerm,
  normalize,
  parseDenylist,
  runSelfTest,
  scanFiles,
  scanText,
  sha256Hex,
} from './leakScan.ts'

/**
 * Every term here is invented. The real denied words never appear in this repo
 * — not in the denylist, not in a fixture, not in a comment — which is the
 * whole reason the denylist stores hashes.
 */
const SALT = 'test-salt-v1'
const TERM_A = 'zzqxwidget' // 10
const TERM_B = 'qwibbler' // 8

function makeDenylist(...extra: string[]): Denylist {
  return parseDenylist({
    version: DENYLIST_VERSION,
    salt: SALT,
    terms: extra.map((term) => ({
      len: normalize(term).length,
      hash: hashTerm(SALT, term),
    })),
  })
}

const denylistA = makeDenylist(TERM_A)
const denylistAB = makeDenylist(TERM_A, TERM_B)

/** Nothing the guard reports may contain the word it found. */
function expectRedacted(findings: readonly TextFinding[], term: string): void {
  expect(findings.length).toBeGreaterThan(0)
  for (const finding of findings) {
    expect(normalize(finding.excerpt)).not.toContain(normalize(term))
    expect(finding.excerpt).toContain('[REDACTED len=')
  }
}

describe('normalize', () => {
  it('lowercases and deletes everything outside [a-z0-9]', () => {
    expect(normalize('Foo-Bar_1')).toBe('foobar1')
    expect(normalize('  A.B  ')).toBe('ab')
    expect(normalize('')).toBe('')
  })

  it('makes separators irrelevant, so punctuation cannot hide a term', () => {
    const forms = ['FooBar', 'foo-bar', 'foo_bar', 'Foo Bar', 'foo.bar', 'f/o/o/b/a/r', 'foo\nbar']
    for (const form of forms) expect(normalize(form)).toBe('foobar')
  })

  it('folds non-ASCII letters rather than letting them split a term', () => {
    // 'İ' lowercases to 'i' + a combining dot; the dot is dropped, the 'i' is not.
    expect(normalize('İSTANBUL')).toBe('istanbul')
    expect(normalize('Türkçe')).toBe('trke')
  })
})

describe('sha256Hex', () => {
  // The first two are the published SHA-256 test vectors; the rest sit on the
  // 55/56/64-byte padding boundaries and were cross-checked against node:crypto.
  it.each([
    ['', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'],
    ['abc', 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'],
    ['a'.repeat(55), '9f4390f8d30c2dd92ec9f095b65e2b9ae9b0a925a5258e241c9f1e910f734318'],
    ['a'.repeat(56), 'b35439a4ac6f0948b6d6f9e3c6af0f5f590ce20f1bde7090ef7970686ec6738a'],
    ['a'.repeat(64), 'ffe054fe7ae0cb6dc65c3af9b61d5209f439851db43d0ba5997337df154668eb'],
  ])('hashes a %s-character input to the known digest', (input, digest) => {
    expect(sha256Hex(input)).toBe(digest)
  })
})

describe('hashTerm', () => {
  it('is the truncated salted digest of the normalised term', () => {
    expect(hashTerm(SALT, TERM_A)).toBe(sha256Hex(SALT + normalize(TERM_A)).slice(0, HASH_LENGTH))
    expect(hashTerm(SALT, TERM_A)).toMatch(/^[0-9a-f]{32}$/)
  })

  it('ignores case and separators, exactly as the scanner does', () => {
    expect(hashTerm(SALT, 'Foo Bar')).toBe(hashTerm(SALT, 'foo-bar'))
    expect(hashTerm(SALT, 'foo.bar')).toBe(hashTerm(SALT, 'FOOBAR'))
  })

  it('depends on the salt', () => {
    expect(hashTerm('salt-one', TERM_A)).not.toBe(hashTerm('salt-two', TERM_A))
  })
})

describe('scanText: what a denied term cannot hide behind', () => {
  it.each([
    ['plain prose', `the ${TERM_A} ships on tuesday`],
    ['camel case', `import { ZzqxWidget } from './x'`],
    ['a hyphen', 'run the zzqx-widget build'],
    ['an underscore', 'const zzqx_widget = 1'],
    ['a space', 'we call it Zzqx Widget internally'],
    ['a dot', 'see zzqx.widget for the details'],
    ['an email address', `kerem@${TERM_A}.com`],
    ['a URL path', `https://x.com/${TERM_A}/tree/main`],
    ['a JSON string', `{"name":"${TERM_A}","version":1}`],
    ['a minified identifier', `const e=${TERM_A}9,t=2;e(t)`],
    ['an HTML meta tag', `<meta name="description" content="${TERM_A}, quietly" />`],
    ['a line break', 'the zzqx\nwidget lands'],
    ['a code comment', `// TODO: rename ${TERM_A} before launch`],
  ])('catches it behind %s', (_label, text) => {
    const findings = scanText(text, denylistA)
    expect(findings).toHaveLength(1)
    expect(findings[0].termLen).toBe(normalize(TERM_A).length)
    expectRedacted(findings, TERM_A)
  })
})

describe('scanText: what it leaves alone', () => {
  it('does not flag ordinary copy', () => {
    const copy = [
      '$0 → $100k by Dec 31, 2026. Built in public, with the real numbers.',
      'Week ending Jul 19, 2026 — revenue $0, spend $0, 0 email subscribers.',
      'Haftanın tek cümlelik Türkçe özeti: henüz satış yok.',
    ].join('\n')
    expect(scanText(copy, denylistAB)).toHaveLength(0)
  })

  it('does not flag a near miss', () => {
    expect(scanText('zzqxwidge is one character short', denylistA)).toHaveLength(0)
    expect(scanText('zzqxwidxet is one character off', denylistA)).toHaveLength(0)
  })

  it('does not flag empty or term-free text', () => {
    expect(scanText('', denylistA)).toHaveLength(0)
    expect(scanText('nothing to see here', denylistA)).toHaveLength(0)
  })
})

describe('scanText: the report', () => {
  it('gives the 1-based line of the hit', () => {
    const text = ['first line', 'second line', `third line mentions ${TERM_A}`].join('\n')
    const findings = scanText(text, denylistA)
    expect(findings).toHaveLength(1)
    expect(findings[0].line).toBe(3)
  })

  it('shows surrounding context so the hit is findable', () => {
    const findings = scanText(`the tool called ${TERM_A} is not public yet`, denylistA)
    expect(findings[0].excerpt).toBe('the tool called [REDACTED len=10] is not public yet')
  })

  it('redacts neighbouring hits too, so context never prints the word', () => {
    const findings = scanText(`${TERM_A} and ${TERM_A} again`, denylistA)
    expect(findings).toHaveLength(2)
    expectRedacted(findings, TERM_A)
  })

  it('finds terms of different lengths in the same text', () => {
    const findings = scanText(`${TERM_A} sits next to ${TERM_B} here`, denylistAB)
    expect(findings.map((finding) => finding.termLen).sort((a, b) => a - b)).toEqual([8, 10])
    expectRedacted(findings, TERM_A)
    expectRedacted(findings, TERM_B)
  })

  it('reports every occurrence, not just the first', () => {
    const text = `${TERM_A}\nand later ${TERM_A}\nand once more ${TERM_A}`
    expect(scanText(text, denylistA)).toHaveLength(3)
  })
})

describe('scanFiles', () => {
  it('labels each finding with its file', () => {
    const findings = scanFiles(
      [
        { path: 'index.html', text: `<meta content="${TERM_A}">` },
        { path: 'src/config.ts', text: 'export const X = 1' },
      ],
      denylistA,
    )
    expect(findings).toHaveLength(1)
    expect(findings[0].file).toBe('index.html')
  })

  it('throws rather than passing when it was handed nothing to scan', () => {
    // The silent-green rule: 0 files scanned is a broken guard, not a clean tree.
    expect(() => scanFiles([], denylistA)).toThrow(/0 files matched/)
  })
})

describe('parseDenylist', () => {
  it('accepts a well-formed denylist', () => {
    const denylist = parseDenylist({
      version: 1,
      salt: SALT,
      terms: [{ len: 10, hash: hashTerm(SALT, TERM_A) }],
    })
    expect(denylist.terms).toHaveLength(1)
    expect(denylist.salt).toBe(SALT)
  })

  const valid = { version: 1, salt: SALT, terms: [{ len: 10, hash: 'a'.repeat(32) }] }

  it.each([
    ['is not an object', null],
    ['is an array', []],
    ['is a bare string', 'terms'],
    ['has an unknown version', { ...valid, version: 2 }],
    ['has no salt', { ...valid, salt: undefined }],
    ['has an empty salt', { ...valid, salt: '' }],
    // Metadata that made the old committed file an oracle: a known plaintext
    // pins the hash construction, a label says what to guess for.
    ['carries a canary next to the real terms', { ...valid, canary: 'nnbbcanary42' }],
    ['has no terms key', { ...valid, terms: undefined }],
    ['has terms that are not an array', { ...valid, terms: {} }],
    ['has an empty terms array', { ...valid, terms: [] }],
    ['has a term that is not an object', { ...valid, terms: ['a'.repeat(32)] }],
    ['has a term with no len', { ...valid, terms: [{ hash: 'a'.repeat(32) }] }],
    ['has a term whose len is below the minimum', { ...valid, terms: [{ len: 2, hash: 'a'.repeat(32) }] }],
    ['has a term whose len is fractional', { ...valid, terms: [{ len: 8.5, hash: 'a'.repeat(32) }] }],
    ['has a term with no hash', { ...valid, terms: [{ len: 10 }] }],
    ['has a truncated hash', { ...valid, terms: [{ len: 10, hash: 'abc' }] }],
    ['has a non-hex hash', { ...valid, terms: [{ len: 10, hash: 'z'.repeat(32) }] }],
    ['has an uppercase hash', { ...valid, terms: [{ len: 10, hash: 'A'.repeat(32) }] }],
    ['carries a note on a term', { ...valid, terms: [{ len: 10, hash: 'a'.repeat(32), note: 'product' }] }],
  ])('refuses a denylist that %s', (_label, raw) => {
    // Every one of these would otherwise leave the guard scanning for nothing
    // while still exiting 0.
    expect(() => parseDenylist(raw)).toThrow()
  })
})

describe('runSelfTest', () => {
  it('passes with a healthy scanner, without the real denylist knowing the canary', () => {
    expect(runSelfTest(denylistA)).toBeNull()
    // The canary is not one of the real terms, and is not hashed with their salt.
    expect(denylistA.terms.map((term) => term.hash)).not.toContain(hashTerm(SALT, CANARY_TOKEN))
  })

  it('fails when the scanner has stopped matching', () => {
    expect(runSelfTest(denylistA, () => [])).toMatch(/canary/i)
  })

  it('fails when the scanner matches everything', () => {
    const alwaysHit = (): TextFinding[] => [{ line: 1, termLen: 12, excerpt: '[REDACTED len=12]' }]
    expect(runSelfTest(denylistA, alwaysHit)).toMatch(/everything/i)
  })

  it('fails when the scanner echoes what it found instead of redacting it', () => {
    // Matches the right things, but prints the word it found — which on a
    // public repo would publish the term into the CI log.
    const echoes = (text: string): TextFinding[] =>
      normalize(text).includes(normalize(CANARY_TOKEN))
        ? [{ line: 1, termLen: normalize(CANARY_TOKEN).length, excerpt: text }]
        : []
    expect(runSelfTest(denylistA, echoes)).toMatch(/redact/i)
  })

  it('fails when the real denylist would flag neutral text', () => {
    // A term set that matches everything is unusable even if the canary passes.
    const overBroad = (text: string, list: Denylist): TextFinding[] =>
      list.salt === SALT && text.includes('nothing to see')
        ? [{ line: 1, termLen: 8, excerpt: '[REDACTED len=8]' }]
        : normalize(text).includes(normalize(CANARY_TOKEN))
          ? [{ line: 1, termLen: normalize(CANARY_TOKEN).length, excerpt: '[REDACTED]' }]
          : []
    expect(runSelfTest(denylistA, overBroad)).toMatch(/not usable/i)
  })
})

describe('addTerm', () => {
  it('adds a term and reports only its length', () => {
    const result = addTerm(denylistA, TERM_B)
    expect(result.added).toBe(true)
    expect(result.len).toBe(8)
    expect(result.denylist.terms).toHaveLength(denylistA.terms.length + 1)
  })

  it('never writes the term itself into the denylist', () => {
    const result = addTerm(denylistA, TERM_B)
    expect(JSON.stringify(result.denylist)).not.toContain(TERM_B)
    expect(JSON.stringify(result.denylist)).not.toContain(normalize(TERM_B))
  })

  it('makes the term findable by a scan', () => {
    const result = addTerm(denylistA, TERM_B)
    expect(scanText(`a ${TERM_B} appears`, denylistA)).toHaveLength(0)
    expectRedacted(scanText(`a ${TERM_B} appears`, result.denylist), TERM_B)
  })

  it('is idempotent, and normalises before comparing', () => {
    const once = addTerm(denylistA, TERM_B)
    expect(addTerm(once.denylist, TERM_B).added).toBe(false)
    expect(addTerm(once.denylist, 'QWIB-BLER').added).toBe(false)
    expect(addTerm(once.denylist, 'QWIB-BLER').denylist.terms).toHaveLength(once.denylist.terms.length)
  })

  it('never writes metadata back into the file', () => {
    // The stored shape is exactly {len, hash}: no labels, no known plaintext.
    const result = addTerm(denylistA, TERM_B)
    for (const term of result.denylist.terms) {
      expect(Object.keys(term).sort()).toEqual(['hash', 'len'])
    }
    expect(Object.keys(result.denylist).sort()).toEqual(['salt', 'terms', 'version'])
  })

  it('keeps the committed file ordered by (len, hash), not by when a term was added', () => {
    const terms = addTerm(addTerm(denylistA, TERM_B).denylist, 'lateraddition').denylist.terms
    const keys = terms.map((term) => `${String(term.len).padStart(4, '0')}${term.hash}`)
    expect(keys).toEqual([...keys].sort())
  })

  it('refuses a term too short to be anything but a false-positive machine', () => {
    expect(() => addTerm(denylistA, 'ab')).toThrow(new RegExp(String(MIN_TERM_LENGTH)))
    expect(() => addTerm(denylistA, '   ')).toThrow()
  })

  it('does not echo the term in its error message', () => {
    expect(() => addTerm(denylistA, 'xy')).toThrow(/normalises to 2/)
    try {
      addTerm(denylistA, 'xy')
      expect.unreachable('addTerm should have thrown')
    } catch (error) {
      expect((error as Error).message).not.toContain('xy')
    }
  })
})
