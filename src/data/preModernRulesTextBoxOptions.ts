/**
 * Bundled Standard / Land Pre-Modern rules text box backgrounds — served from `public/premodern-rules-textbox/`.
 * Inner fill region: 1272 × 556 stage px @ 600 DPI.
 */
export type PreModernRulesTextBoxOption = { id: string; label: string; file: string }

export const DEFAULT_PRE_MODERN_RULES_TEXT_BOX_ID = 'white'

export const PRE_MODERN_RULES_TEXT_BOX_OPTIONS: readonly PreModernRulesTextBoxOption[] = [
  { id: 'white', label: 'White', file: 'white.png' },
  { id: 'blue', label: 'Blue', file: 'blue.png' },
  { id: 'black', label: 'Black', file: 'black.png' },
  { id: 'red', label: 'Red', file: 'red.png' },
  { id: 'green', label: 'Green', file: 'green.png' },
  { id: 'colorless', label: 'Colorless', file: 'colorless.png' },
  { id: 'gold', label: 'Gold', file: 'gold.png' },
  { id: 'land', label: 'Land', file: 'land.png' },
  { id: 'artifact', label: 'Artifact', file: 'artifact_brown.png' },
  { id: 'leather', label: 'Leather', file: 'leather.png' },
] as const

/** Representative mid-tone for rules text ink contrast on bundled backgrounds. */
export const PRE_MODERN_RULES_TEXT_BOX_CONTRAST_HEX: Record<string, string> = {
  white: '#f2ebe0',
  blue: '#4a6a9a',
  black: '#2a2a2a',
  red: '#9a4a4a',
  green: '#4a7a4a',
  colorless: '#c8c0b8',
  gold: '#c9a227',
  land: '#e8dcc8',
  artifact: '#d4c4a8',
  leather: '#c4a882',
}

export function normalizePreModernRulesTextBoxId(value: unknown): string {
  const id = String(value ?? '').trim()
  if (!id) return DEFAULT_PRE_MODERN_RULES_TEXT_BOX_ID
  return PRE_MODERN_RULES_TEXT_BOX_OPTIONS.some((o) => o.id === id) ? id : DEFAULT_PRE_MODERN_RULES_TEXT_BOX_ID
}

export function resolvePreModernRulesTextBoxPublicUrl(panelId: string): string | null {
  const id = normalizePreModernRulesTextBoxId(panelId)
  const opt = PRE_MODERN_RULES_TEXT_BOX_OPTIONS.find((o) => o.id === id)
  if (!opt?.file) return null
  return `/premodern-rules-textbox/${encodeURIComponent(opt.file)}`
}

export function resolvePreModernRulesTextBoxContrastReferenceHex(panelId: string): string {
  const id = normalizePreModernRulesTextBoxId(panelId)
  return PRE_MODERN_RULES_TEXT_BOX_CONTRAST_HEX[id] ?? PRE_MODERN_RULES_TEXT_BOX_CONTRAST_HEX.white
}
