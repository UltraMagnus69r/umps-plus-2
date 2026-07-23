import { DEFAULT_PANEL_BOX_HEX } from '../authority/boxColorUiAuthority'

/**
 * Fallback panel fill when a stored hex is missing/invalid (rules text box and shared ink contrast paths).
 * Canonical default for all frame box fills is `DEFAULT_PANEL_BOX_HEX` in `boxColorUiAuthority`.
 */
export const DEFAULT_RULES_PANEL = DEFAULT_PANEL_BOX_HEX

export function resolveRulesPanelColor(raw: string | undefined): string {
  if (typeof raw !== 'string') return DEFAULT_RULES_PANEL
  const v = raw.trim()
  return /^#([0-9a-f]{6})$/i.test(v) ? v : DEFAULT_RULES_PANEL
}

function parseHex6(hex: string): { r: number; g: number; b: number } | null {
  const n = hex.replace(/^#/, '').trim()
  if (n.length !== 6 || !/^[0-9a-f]+$/i.test(n)) return null
  return { r: parseInt(n.slice(0, 2), 16), g: parseInt(n.slice(2, 4), 16), b: parseInt(n.slice(4, 6), 16) }
}

function channelLinear(c: number): number {
  const x = c / 255
  return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)
}

/** WCAG relative luminance for sRGB #RRGGBB. */
export function relativeLuminance(hex: string): number {
  const p = parseHex6(hex)
  if (!p) return 0.5
  return 0.2126 * channelLinear(p.r) + 0.7152 * channelLinear(p.g) + 0.0722 * channelLinear(p.b)
}

/** Contrast ratio of two #RRGGBB colors (WCAG). */
export function contrastRatio(fgHex: string, bgHex: string): number {
  const L1 = relativeLuminance(fgHex)
  const L2 = relativeLuminance(bgHex)
  const light = Math.max(L1, L2)
  const dark = Math.min(L1, L2)
  return (light + 0.05) / (dark + 0.05)
}

export const AUTO_DARK_INK = '#111111'
export const AUTO_LIGHT_INK = '#f5f5f5'

const FALLBACK_DARK_INK = AUTO_DARK_INK
const FALLBACK_LIGHT_INK = AUTO_LIGHT_INK

/** Pick black ink on light backgrounds and white ink on dark backgrounds. */
export function resolveAutoInkOnBackgroundHex(bgHex: string): string {
  const panel = resolveRulesPanelColor(bgHex)
  const darkScore = contrastRatio(AUTO_DARK_INK, panel)
  const lightScore = contrastRatio(AUTO_LIGHT_INK, panel)
  return darkScore >= lightScore ? AUTO_DARK_INK : AUTO_LIGHT_INK
}

function normalizePreferredInk(preferredInk: string | undefined): string {
  return typeof preferredInk === 'string' && /^#([0-9a-f]{6})$/i.test(preferredInk.trim())
    ? preferredInk.trim()
    : FALLBACK_DARK_INK
}

/**
 * Prefer the user’s typography color when contrast on the panel is sufficient; otherwise pick dark or light ink.
 */
export function resolveReadableInkOnPanel(
  panelRaw: string | undefined,
  preferredInk?: string | undefined,
  minRatio = 4.5,
): string {
  const panel = resolveRulesPanelColor(panelRaw)
  if (preferredInk !== undefined) {
    const pref = normalizePreferredInk(preferredInk)
    if (contrastRatio(pref, panel) >= minRatio) return pref
  }
  return resolveAutoInkOnBackgroundHex(panel)
}

/**
 * Same rules as `resolveReadableInkOnPanel`, but require the preferred ink to pass `minRatio`
 * against every gradient sample.
 */
export function resolveReadableInkOnPanelSamples(
  panelHexes: readonly string[],
  preferredInk?: string | undefined,
  minRatio = 4.5,
): string {
  const panels =
    panelHexes.length > 0
      ? panelHexes.map((h) => resolveRulesPanelColor(h))
      : [DEFAULT_RULES_PANEL]

  const minContrastForInk = (ink: string) => Math.min(...panels.map((p) => contrastRatio(ink, p)))

  if (preferredInk !== undefined) {
    const pref = normalizePreferredInk(preferredInk)
    if (minContrastForInk(pref) >= minRatio) return pref
  }

  const darkS = minContrastForInk(FALLBACK_DARK_INK)
  const lightS = minContrastForInk(FALLBACK_LIGHT_INK)
  return darkS >= lightS ? FALLBACK_DARK_INK : FALLBACK_LIGHT_INK
}
