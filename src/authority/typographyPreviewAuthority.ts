import type { CreativeFontKey } from '../data/fontCatalog'
import type { CardTypographyKey } from '../store/useCardStore'

export type TypographyFontPreview = {
  typographyKey: CardTypographyKey
  fontKey: CreativeFontKey
}

export function effectiveTypographyFontKey(
  typographyKey: CardTypographyKey,
  committedFontKey: CreativeFontKey,
  preview: TypographyFontPreview | null,
): CreativeFontKey {
  if (preview?.typographyKey === typographyKey) return preview.fontKey
  return committedFontKey
}
