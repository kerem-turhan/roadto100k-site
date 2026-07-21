import { describe, expect, it } from 'vitest'
import { isLiveProofUrl, liveProofItems } from './proof.ts'

const item = (url: string) => ({ title: 't', description: 'd', stats: [], url })

describe('isLiveProofUrl', () => {
  it('accepts only real https URLs', () => {
    expect(isLiveProofUrl('https://github.com/kerem-turhan/example')).toBe(true)
    expect(isLiveProofUrl('  https://example.com/x  ')).toBe(true)
  })

  it('rejects empty and placeholder values', () => {
    expect(isLiveProofUrl('')).toBe(false)
    expect(isLiveProofUrl('   ')).toBe(false)
    expect(isLiveProofUrl('TBD')).toBe(false)
    expect(isLiveProofUrl('PLACEHOLDER')).toBe(false)
    expect(isLiveProofUrl('coming soon')).toBe(false)
  })

  it('rejects non-https schemes', () => {
    expect(isLiveProofUrl('http://example.com')).toBe(false)
    expect(isLiveProofUrl('ftp://example.com')).toBe(false)
    expect(isLiveProofUrl('github.com/x')).toBe(false)
  })
})

describe('liveProofItems', () => {
  it('filters out every non-live item', () => {
    const live = item('https://example.com/teardown')
    expect(liveProofItems([item(''), live, item('TBD')])).toEqual([live])
  })

  it('returns an empty list when nothing is live — the section must vanish', () => {
    expect(liveProofItems([item(''), item('WIP')])).toEqual([])
  })
})
