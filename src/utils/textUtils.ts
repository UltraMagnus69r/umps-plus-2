/**
 * Module 3.6 — Derived Metadata Authority (file naming).
 * Remove all non-alphanumeric characters; preserve capitalization.
 */
export function slugifyCardName(name: string): string {
  if (typeof name !== 'string') return ''
  return name.replace(/[^A-Za-z0-9]/g, '')
}
