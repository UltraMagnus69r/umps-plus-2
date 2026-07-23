/**
 * Phase 18.3 — Local filtering for in-memory Scryfall print rows (no API changes).
 * Extend here for additional fields or list types in later phases.
 */

import type { ScryfallPrintCandidate } from '../services/scryfallService'

function printSearchHaystack(p: ScryfallPrintCandidate): string {
  return [
    p.name,
    p.set,
    p.set_name ?? '',
    p.collector_number,
    p.rarity ?? '',
    p.lang ?? '',
    p.released_at ?? '',
  ]
    .join(' ')
    .toLowerCase()
}

/**
 * Case-insensitive: every whitespace-separated token must appear as a substring in the print’s combined fields.
 */
export function filterScryfallPrintCandidates(
  prints: readonly ScryfallPrintCandidate[],
  rawQuery: string,
): ScryfallPrintCandidate[] {
  const q = String(rawQuery ?? '').trim().toLowerCase()
  if (!q) return [...prints]
  const tokens = q.split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return [...prints]
  return prints.filter((p) => {
    const hay = printSearchHaystack(p)
    return tokens.every((t) => hay.includes(t))
  })
}
