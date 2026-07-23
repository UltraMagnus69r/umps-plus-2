import { getOuterBorderHex } from './colorAuthority'
import { M15_SOLID_VALUE_PREFIX, M15_TEXTURE_VALUE_PREFIX, outerBorderPngUrl } from '../data/outerBorderOptions'
import { DEFAULT_PANEL_BOX_HEX } from './boxColorUiAuthority'
import { resolveRulesPanelColor } from '../utils/rulesPanelColor'

/** Stored panel fill may be a hex color or an M15 Classic texture/solid key (same encoding as outer border). */
export function isPanelTextureBackground(value: string): boolean {
  return outerBorderPngUrl(value) != null
}

export const PANEL_BACKGROUND_FIELDS = [
  'nameBoxColor',
  'typeLineBoxColor',
  'rulesTextBoxColor',
  'ptBoxColor',
] as const

export type PanelBackgroundField = (typeof PANEL_BACKGROUND_FIELDS)[number]

export function isPanelBackgroundField(field: string): field is PanelBackgroundField {
  return (PANEL_BACKGROUND_FIELDS as readonly string[]).includes(field)
}

export type PanelBackgroundPreview = { field: PanelBackgroundField; value: string }

/** Committed cardData value, or transient picker hover when it targets this field. */
export function effectivePanelBackground(
  field: PanelBackgroundField,
  stored: string,
  preview: PanelBackgroundPreview | null,
): string {
  if (preview?.field === field) return preview.value
  return stored
}

export function isPanelBackgroundKey(value: string): boolean {
  const v = value.trim()
  if (/^#[0-9a-f]{6}$/i.test(v)) return true
  if (v.startsWith(M15_TEXTURE_VALUE_PREFIX) || v.startsWith(M15_SOLID_VALUE_PREFIX)) return true
  return false
}

export function sanitizePanelBackground(raw: unknown, fallback: string): string {
  const t = typeof raw === 'string' ? raw.trim() : ''
  if (isPanelBackgroundKey(t)) return t
  return fallback
}

/** Hex used for gradients, ink contrast, and color inputs when the stored value is a texture key. */
export function resolvePanelBackgroundContrastHex(raw: string | undefined): string {
  if (typeof raw !== 'string') return DEFAULT_PANEL_BOX_HEX
  const v = raw.trim()
  if (isPanelTextureBackground(v)) return DEFAULT_PANEL_BOX_HEX
  if (v.startsWith(M15_SOLID_VALUE_PREFIX)) return getOuterBorderHex(v)
  if (/^#[0-9a-f]{6}$/i.test(v)) return resolveRulesPanelColor(v)
  return resolveRulesPanelColor(v)
}

export function createPanelTexturePattern(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  image: HTMLImageElement,
): CanvasPattern | string {
  const w = Math.max(1, Math.ceil(width))
  const h = Math.max(1, Math.ceil(height))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const sctx = canvas.getContext('2d')
  if (!sctx) return DEFAULT_PANEL_BOX_HEX
  sctx.imageSmoothingEnabled = true
  sctx.drawImage(image, 0, 0, w, h)
  return ctx.createPattern(canvas, 'no-repeat') ?? DEFAULT_PANEL_BOX_HEX
}
