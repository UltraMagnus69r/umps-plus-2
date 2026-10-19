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

/** Default frost opacity when the Panels frost toggle is on (0–1). */
export const DEFAULT_PANEL_FROST_OPACITY = 0.32

export function normalizePanelFrostEnabled(raw: unknown): boolean {
  if (raw === false) return false
  if (raw === true) return true
  return true
}

export function normalizePanelFrostOpacity(raw: unknown): number {
  const n = typeof raw === 'number' ? raw : Number(raw)
  if (!Number.isFinite(n)) return DEFAULT_PANEL_FROST_OPACITY
  return Math.max(0, Math.min(1, n))
}

/**
 * Uniform slice/crop for panel textures — never anisotropic stretch.
 *
 * Height-first cover: scale so the box height is filled (`auto 100%`), then if the
 * scaled width is still short of the box, grow to cover width too. Overflow is
 * clipped (centered). Matches CSS `object-fit: cover` with a height-priority bias
 * so short name/type bars show a horizontal band of the texture, not a squashed frame.
 */
export function panelTextureSliceDrawRect(
  imageWidth: number,
  imageHeight: number,
  boxWidth: number,
  boxHeight: number,
): { dx: number; dy: number; dw: number; dh: number } {
  const iw = Math.max(1, imageWidth)
  const ih = Math.max(1, imageHeight)
  const w = Math.max(1, boxWidth)
  const h = Math.max(1, boxHeight)
  // Height-first: at least fill height; also fill width when needed (cover).
  const scale = Math.max(h / ih, w / iw)
  const dw = iw * scale
  const dh = ih * scale
  return { dx: (w - dw) / 2, dy: (h - dh) / 2, dw, dh }
}

/** Draw a panel texture into a box without squashing (height-fit, width clip). */
export function drawPanelTextureSlice(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
): void {
  const w = Math.max(1, Math.ceil(width))
  const h = Math.max(1, Math.ceil(height))
  const iw = image.naturalWidth || image.width || 1
  const ih = image.naturalHeight || image.height || 1
  const { dx, dy, dw, dh } = panelTextureSliceDrawRect(iw, ih, w, h)
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, w, h)
  ctx.clip()
  ctx.imageSmoothingEnabled = true
  ctx.drawImage(image, dx, dy, dw, dh)
  ctx.restore()
}

/** Semi-transparent white scrim for panel legibility. */
export function paintPanelFrostScrim(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  opacity: number,
): void {
  const a = Math.max(0, Math.min(1, opacity))
  if (a <= 0) return
  ctx.fillStyle = `rgba(255,255,255,${a})`
  ctx.fillRect(0, 0, Math.max(1, width), Math.max(1, height))
}

export function createPanelTexturePattern(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  image: HTMLImageElement,
  frostOpacity = 0,
): CanvasPattern | string {
  const w = Math.max(1, Math.ceil(width))
  const h = Math.max(1, Math.ceil(height))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const sctx = canvas.getContext('2d')
  if (!sctx) return DEFAULT_PANEL_BOX_HEX
  drawPanelTextureSlice(sctx, image, w, h)
  paintPanelFrostScrim(sctx, w, h, frostOpacity)
  return ctx.createPattern(canvas, 'no-repeat') ?? DEFAULT_PANEL_BOX_HEX
}
