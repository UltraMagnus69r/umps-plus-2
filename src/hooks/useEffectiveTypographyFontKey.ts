import { useMemo } from 'react'
import { effectiveTypographyFontKey } from '../authority/typographyPreviewAuthority'
import type { CreativeFontKey } from '../authority/typographyAuthority'
import type { CardTypographyKey } from '../store/useCardStore'
import { useCardStore } from '../store/useCardStore'

export function useEffectiveTypographyFontKey(
  typographyKey: CardTypographyKey,
  fontKey: CreativeFontKey,
): CreativeFontKey {
  const preview = useCardStore((s) => s.typographyFontPreview)
  return useMemo(
    () => effectiveTypographyFontKey(typographyKey, fontKey, preview),
    [typographyKey, fontKey, preview],
  )
}
