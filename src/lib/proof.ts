/**
 * Proof-of-work visibility rules. An item goes live the moment its `url` in
 * src/config.ts becomes a real https:// link — until then the item (and the
 * whole Work section, when nothing is live) stays completely hidden. No
 * placeholder ever renders.
 */

export interface ProofItem {
  title: string
  description: string
  /** Short ledger-style figures, e.g. "4/6 → 6/6". */
  stats: readonly string[]
  /** Empty or placeholder = hidden. Only a real https URL makes it live. */
  url: string
}

export function isLiveProofUrl(url: string): boolean {
  return url.trim().startsWith('https://')
}

export function liveProofItems<T extends { url: string }>(items: readonly T[]): T[] {
  return items.filter((item) => isLiveProofUrl(item.url))
}
