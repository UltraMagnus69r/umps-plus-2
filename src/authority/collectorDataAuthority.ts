/** Default copyright line for Collector Data (all layouts / variants). */
export const DEFAULT_CARD_COPYRIGHT = '™ & 1993-2026 Wizards of the Coast Inc. ©'

const LEGACY_COPYRIGHT_DEFAULTS = new Set([
  '™ & ©',
  '™ & © 2026 Wizards of the Coast.',
  '™ & © 2026 Wizards of the Coast',
])

export function normalizeCardCopyright(value: unknown): string {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  if (!trimmed || LEGACY_COPYRIGHT_DEFAULTS.has(trimmed)) {
    return DEFAULT_CARD_COPYRIGHT
  }
  return trimmed
}

export function resolveCardCopyright(value: unknown): string {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  return trimmed.length > 0 ? trimmed : DEFAULT_CARD_COPYRIGHT
}
