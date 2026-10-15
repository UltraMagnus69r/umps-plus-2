import {
  fitSingleLineFontSize,
  TYPE_LINE_BASE_HEIGHT_RATIO,
  TYPE_MIN_FONT,
} from '../components/renderer/layers/textIconsShared'
import {
  getPreModernFaceFontStack,
  PRE_MODERN_FACE_FONT_STYLE,
  typographyPtToStagePx,
  type CardFieldTypography,
} from './typographyAuthority'

export function resolveSpellPreModernTypeFontSizePx(
  ctx: CanvasRenderingContext2D | null,
  input: {
    typeLine: string
    typeLineMaxWidth: number
    typeH: number
    typography: CardFieldTypography
  },
): number {
  const typeBaseFont = Math.max(1, Math.floor(input.typeH * TYPE_LINE_BASE_HEIGHT_RATIO))
  const typeTargetPx = typographyPtToStagePx(input.typography.sizePt, typeBaseFont)
  return fitSingleLineFontSize(ctx, {
    text: String(input.typeLine ?? ''),
    fontFamily: getPreModernFaceFontStack(),
    fontStyle: PRE_MODERN_FACE_FONT_STYLE,
    startSize: Math.max(TYPE_MIN_FONT, typeTargetPx),
    minSize: TYPE_MIN_FONT,
    maxWidth: Math.max(1, input.typeLineMaxWidth),
  })
}
