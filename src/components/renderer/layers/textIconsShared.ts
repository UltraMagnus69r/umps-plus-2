/**
 * Shared rich-text and measurement helpers for TextIconsLayer.
 * Keeps layer logic in one place without duplicating in KonvaStage.
 */
import { buildCanvasFont } from '../../../data/fontCatalog'
import { getSymbolDataUrl } from '../../../authority/symbolAuthority'
import { splitPrefixedManaTokenInner, type ManaSymbolSetId } from '../../../authority/manaSymbolSetAuthority'
import { normalizeManaTokenInner } from '../../../utils/manaCanonical'

const TOKEN_RE = /\{([^{}]+)\}/g

export type RichChunk =
  | { kind: 'text'; value: string }
  | { kind: 'icon'; token: string; key: string; dataUrl: string; symbolSet: ManaSymbolSetId }

export type RichItem =
  | { kind: 'text'; text: string; x: number; y: number; width: number }
  | { kind: 'icon'; key: string; dataUrl: string; rawToken: string; x: number; y: number; size: number }

function normalizeManaLookupKeyFromCore(coreInner: string): string {
  const normalizedInner = coreInner.trim().toLowerCase().replace(/[\s/]+/g, '')
  if (!normalizedInner) return ''
  if (normalizedInner === 't' || normalizedInner === 'tap') return 'tap'
  if (normalizedInner === 'q' || normalizedInner === 'untap') return 'q'
  if (normalizedInner === 's' || normalizedInner === 'snow') return 's'
  if (/^\d+$/.test(normalizedInner)) return normalizedInner
  const canonical = normalizeManaTokenInner(normalizedInner)
  if (!canonical) return ''
  const twoSlash = canonical.match(/^2\/([WUBRG])$/i)
  if (twoSlash) return `2${twoSlash[1].toLowerCase()}`
  return canonical.toLowerCase()
}

function resolveManaToken(raw: string): { lookupKey: string; symbolSet: ReturnType<typeof splitPrefixedManaTokenInner>['symbolSet'] } {
  const inner = raw.replace(/\{|\}/g, '').trim()
  const { symbolSet, coreInner } = splitPrefixedManaTokenInner(inner)
  return { lookupKey: normalizeManaLookupKeyFromCore(coreInner), symbolSet }
}

export function parseRichText(
  input: string | undefined | null
): Array<{ kind: 'text'; value: string } | { kind: 'token'; raw: string }> {
  const s = String(input ?? '')
  const out: Array<{ kind: 'text'; value: string } | { kind: 'token'; raw: string }> = []
  let last = 0
  let m: RegExpExecArray | null
  TOKEN_RE.lastIndex = 0
  while ((m = TOKEN_RE.exec(s))) {
    const idx = m.index
    if (idx > last) out.push({ kind: 'text', value: s.slice(last, idx) })
    out.push({ kind: 'token', raw: m[0] })
    last = idx + m[0].length
  }
  if (last < s.length) out.push({ kind: 'text', value: s.slice(last) })
  return out
}

/** Token content trimmed; lookup via symbolAuthority (supports numeric and letter keys). */
export function resolveChunks(input: string | undefined | null): RichChunk[] {
  const parts = parseRichText(input)
  const chunks: RichChunk[] = []
  for (const p of parts) {
    if (p.kind === 'text') {
      if (p.value) chunks.push({ kind: 'text', value: p.value })
      continue
    }
    const rawTrimmed = typeof p.raw === 'string' ? p.raw.trim() : p.raw
    const { lookupKey, symbolSet } = resolveManaToken(rawTrimmed)
    const dataUrl = lookupKey ? getSymbolDataUrl(lookupKey, symbolSet) : undefined
    if (typeof dataUrl === 'string' && dataUrl.length > 0) {
      chunks.push({ kind: 'icon', token: rawTrimmed, key: lookupKey, dataUrl, symbolSet })
    } else {
      chunks.push({ kind: 'text', value: rawTrimmed })
    }
  }
  return chunks
}

export function splitPreserveWhitespaceAndNewlines(s: string): string[] {
  const out: string[] = []
  const parts = s.split(/(\n)/)
  for (const part of parts) {
    if (part === '\n') {
      out.push(part)
      continue
    }
    if (!part) continue
    out.push(...part.split(/(\s+)/))
  }
  return out.filter((t) => t.length > 0)
}

export function measureTextWidth(
  ctx: CanvasRenderingContext2D | null,
  text: string,
  fontFamily: string,
  fontStyle: string,
  fontSize: number
): number {
  if (!ctx) return 0
  ctx.font = buildCanvasFont(fontStyle, fontSize, fontFamily)
  return ctx.measureText(text).width
}

/** Line count for plain text with Konva-style word wrap (`wrap="word"`). */
export function measureWrappedTextLineCount(
  ctx: CanvasRenderingContext2D | null,
  text: string,
  maxWidth: number,
  fontFamily: string,
  fontStyle: string,
  fontSize: number,
): number {
  const content = String(text ?? '')
  if (!content.trim()) return 1

  const width = Math.max(1, maxWidth)
  let lines = 0

  for (const paragraph of content.split('\n')) {
    if (!paragraph.trim()) {
      lines += 1
      continue
    }

    const tokens = splitPreserveWhitespaceAndNewlines(paragraph)
    let lineWidth = 0
    let hasLine = false

    for (const token of tokens) {
      if (token === '\n') continue
      const tokenWidth = measureTextWidth(ctx, token, fontFamily, fontStyle, fontSize)
      const isSpace = /^\s+$/.test(token)
      if (!isSpace && lineWidth + tokenWidth > width && hasLine) {
        lines += 1
        lineWidth = 0
        hasLine = false
      }
      if (isSpace && lineWidth === 0) continue
      lineWidth += tokenWidth
      hasLine = true
    }

    if (hasLine) lines += 1
  }

  return Math.max(1, lines)
}

export function measureWrappedTextHeight(
  ctx: CanvasRenderingContext2D | null,
  text: string,
  maxWidth: number,
  fontFamily: string,
  fontStyle: string,
  fontSize: number,
  lineHeightPx: number,
): number {
  const lines = measureWrappedTextLineCount(ctx, text, maxWidth, fontFamily, fontStyle, fontSize)
  return Math.max(lineHeightPx, lines * lineHeightPx)
}

export function fitSingleLineFontSize(
  ctx: CanvasRenderingContext2D | null,
  opts: {
    text: string
    fontFamily: string
    fontStyle: string
    startSize: number
    minSize: number
    maxWidth: number
  },
): number {
  const text = String(opts.text ?? '')
  const maxW = Math.max(1, opts.maxWidth)
  const minS = Math.max(1, opts.minSize)
  let lo = minS
  let hi = Math.max(minS, opts.startSize)
  const floorToHalfPx = (v: number) => Math.floor(v * 2) / 2
  if (measureTextWidth(ctx, text, opts.fontFamily, opts.fontStyle, hi) <= maxW) return floorToHalfPx(hi)
  for (let i = 0; i < 14; i++) {
    const mid = (lo + hi) / 2
    const w = measureTextWidth(ctx, text, opts.fontFamily, opts.fontStyle, mid)
    if (w <= maxW) lo = mid
    else hi = mid
  }
  return floorToHalfPx(lo)
}

export {
  MANA_COST_ICON_SIZE,
  MANA_COST_ICON_GAP,
  scaleManaPipDisplaySizePx,
} from '../../../authority/symbolAuthority'
export const NAME_MIN_FONT = 40
export const TYPE_MIN_FONT = 35
export {
  NAME_PLATE_BASE_HEIGHT_RATIO,
  TYPE_LINE_BASE_HEIGHT_RATIO,
} from '../../../authority/typographyAuthority'
/** Upward fine-tune (px) after Konva `_fixTextRendering` middle alignment on the type line. */
export const TYPE_LINE_TEXT_Y_NUDGE_PX = -3
export const RULES_MAX_FONT = 65
export const RULES_MIN_FONT = 25
export const RULES_LINE_HEIGHT_RATIO = 1.2
export const RULES_PADDING = 10
export const FLAVOR_FONT_SIZE_RATIO = 0.88
export const FLAVOR_LINE_HEIGHT_RATIO = 1.15
export const FLAVOR_PT_GAP = 6
