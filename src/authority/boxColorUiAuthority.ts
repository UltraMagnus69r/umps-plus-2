/**
 * Phase 13.1 — Box coloring UI authority (labels, picker fallback, a11y prefixes).
 * Fill math and Canvas consumption remain in `boxPanelFillAuthority` + `cardData.*`.
 */

/** Default `#RRGGBB` for name / type / rules / P/T panel boxes (matches store defaults). */
export const DEFAULT_PANEL_BOX_HEX = '#f7f7f0' as const

/** Value for `<input type="color">` when stored hex is incomplete or invalid. */
export function panelBoxColorPickerValue(hex: string): string {
  const t = typeof hex === 'string' ? hex.trim() : ''
  return /^#[0-9a-f]{6}$/i.test(t) ? t : DEFAULT_PANEL_BOX_HEX
}

export type BoxPanelColorUiKind = 'name' | 'typeLine' | 'rulesText' | 'powerToughness'

export const BOX_PANEL_COLOR_UI: Record<
  BoxPanelColorUiKind,
  { rowLabel: string; gradientAriaPrefix: string; colorAriaLabel: string; hexAriaLabel: string }
> = {
  name: {
    rowLabel: 'Name Plate Color',
    gradientAriaPrefix: 'Name Plate',
    colorAriaLabel: 'Name Plate color',
    hexAriaLabel: 'Name Plate color hex',
  },
  typeLine: {
    rowLabel: 'Type Line Color',
    gradientAriaPrefix: 'Type Line',
    colorAriaLabel: 'Type Line color',
    hexAriaLabel: 'Type Line color hex',
  },
  rulesText: {
    rowLabel: 'Rules Text Color',
    gradientAriaPrefix: 'Rules Text',
    colorAriaLabel: 'Rules Text color',
    hexAriaLabel: 'Rules Text color hex',
  },
  powerToughness: {
    rowLabel: 'P/T Color',
    gradientAriaPrefix: 'P/T',
    colorAriaLabel: 'P/T color',
    hexAriaLabel: 'P/T color hex',
  },
}
