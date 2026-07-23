/**
 * Bundled spell parchment panels — served from `public/spell-panels/`.
 */
export type SpellPanelOption = { id: string; label: string; file: string }

export const DEFAULT_SPELL_TEXT_BOX_ID = 'white'

/** Spell / Pre-Modern: expand parchment panel beyond rules outer frame (per side, stage px). */
export const SPELL_TEXT_BOX_OUTSET_PX = 100
/** Spell / Pre-Modern: narrow parchment panel from left / right (per side, stage px). */
export const SPELL_TEXT_BOX_INSET_LEFT_PX = 42
export const SPELL_TEXT_BOX_INSET_RIGHT_PX = 33

export const SPELL_PANEL_OPTIONS: readonly SpellPanelOption[] = [
  { id: 'white', label: 'White', file: 'white_parchment_panel_transparent_1288x591.png' },
  { id: 'artifact', label: 'Artifact', file: 'artifact_parchment_panel_transparent_1288x591.png' },
  { id: 'black', label: 'Black', file: 'black_parchment_panel_transparent_1288x591.png' },
  { id: 'blue', label: 'Blue', file: 'blue_parchment_panel_transparent_1288x591.png' },
  { id: 'colorless', label: 'Colorless', file: 'colorless_parchment_panel_transparent_1288x591.png' },
  { id: 'gold', label: 'Gold', file: 'gold_parchment_panel_transparent_1288x591.png' },
  { id: 'green', label: 'Green', file: 'green_parchment_panel_transparent_1288x591.png' },
  { id: 'land', label: 'Land', file: 'land_parchment_panel_transparent_1288x591.png' },
  { id: 'red', label: 'Red', file: 'red_parchment_panel_transparent_1288x591.png' },
] as const

export function normalizeSpellTextBoxId(value: unknown): string {
  const id = String(value ?? '').trim()
  if (!id) return DEFAULT_SPELL_TEXT_BOX_ID
  return SPELL_PANEL_OPTIONS.some((o) => o.id === id) ? id : DEFAULT_SPELL_TEXT_BOX_ID
}

/** Resolve public URL for bundled spell panel image. */
export function resolveSpellPanelPublicUrl(panelId: string): string | null {
  const id = normalizeSpellTextBoxId(panelId)
  const opt = SPELL_PANEL_OPTIONS.find((o) => o.id === id)
  if (!opt?.file) return null
  return `/spell-panels/${encodeURIComponent(opt.file)}`
}
