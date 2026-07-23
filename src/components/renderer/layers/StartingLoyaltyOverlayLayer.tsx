import { memo, useMemo } from 'react'
import { Group, Image, Layer, Text } from 'react-konva'
import { shallow } from 'zustand/shallow'
import {
  getActiveLayoutCapabilitiesFromState,
  getActiveLayoutRegionsFromState,
  layoutRegionToStageRect,
} from '../../../authority/layoutRegistry'
import {
  getStartingLoyaltyShieldUrl,
  STARTING_LOYALTY_SHIELD_DISPLAY_SCALE,
  STARTING_LOYALTY_SHIELD_INTRINSIC,
  STARTING_LOYALTY_SHIELD_TOP_OFFSET_PX,
  STARTING_LOYALTY_SHIELD_OFFSET_X_PX,
  STARTING_LOYALTY_SHIELD_OFFSET_Y_PX,
} from '../../../authority/planeswalkerSymbolAuthority'
import {
  PW_MODERN_V2_STARTING_LOYALTY_NUDGE_X_PX,
  PW_MODERN_V2_STARTING_LOYALTY_NUDGE_Y_PX,
} from '../../../authority/planeswalkerModernV2LayoutAuthority'
import { BEVEL_INSET } from '../../../authority/geometryAuthority'
import { getPreModernTextBoxOuterRect } from '../../../authority/preModernTextBoxAuthority'
import { useEffectiveTypographyFontKey } from '../../../hooks/useEffectiveTypographyFontKey'
import {
  resolveTypographyFontFace,
  resolveTypographyInkColor,
  typographyPtToStagePx,
  TYPO_PT_BOX_REF_PX,
} from '../../../authority/typographyAuthority'
import type { LayoutId } from '../../../authority/layoutTaxonomy'
import { useCardStore } from '../../../store/useCardStore'
import { useKonvaPublicImage } from '../../../hooks/useKonvaPublicImage'

function StartingLoyaltyOverlayLayer() {
  const { startingLoyalty, ptTypography, currentLayout, activeLayout } = useCardStore(
    (s) => ({
      startingLoyalty: s.cardData.startingLoyalty,
      ptTypography: s.cardData.ptTypography,
      currentLayout: s.currentLayout,
      activeLayout: s.cardData.layout as LayoutId,
    }),
    shallow,
  )

  const capabilities = getActiveLayoutCapabilitiesFromState({
    currentLayout,
    cardData: { layout: activeLayout },
  })
  const activeRegions = getActiveLayoutRegionsFromState({
    currentLayout,
    cardData: { layout: activeLayout },
  })
  const lowerRightRect = activeRegions.lowerRight
    ? layoutRegionToStageRect(activeRegions.lowerRight.rect)
    : null
  const rulesRect = layoutRegionToStageRect(activeRegions.rulesText)

  const shieldImg = useKonvaPublicImage(getStartingLoyaltyShieldUrl())
  const loyaltyText = String(startingLoyalty ?? '').trim()

  const effectivePtFontKey = useEffectiveTypographyFontKey('ptTypography', ptTypography.fontKey)

  const ptFace = useMemo(
    () => resolveTypographyFontFace(effectivePtFontKey, ptTypography.weight),
    [effectivePtFontKey, ptTypography.weight],
  )
  const ptStack = ptFace.fontStack
  const ptFontStyle = ptFace.fontStyle
  const ptFill = useMemo(
    () => resolveTypographyInkColor(ptTypography, '#ffffff'),
    [ptTypography],
  )

  const layout = useMemo(() => {
    const slot = lowerRightRect
    if (!slot) return null
    let rulesBottom = rulesRect.y + rulesRect.height
    if (capabilities.supportsPreModernTextBoxFrame) {
      const outer = getPreModernTextBoxOuterRect()
      rulesBottom = outer.y + outer.height + BEVEL_INSET
    }
    const baseScale =
      Math.min(
        slot.width / STARTING_LOYALTY_SHIELD_INTRINSIC.width,
        slot.height / STARTING_LOYALTY_SHIELD_INTRINSIC.height,
      ) * STARTING_LOYALTY_SHIELD_DISPLAY_SCALE
    const shieldW = STARTING_LOYALTY_SHIELD_INTRINSIC.width * baseScale
    const shieldH = STARTING_LOYALTY_SHIELD_INTRINSIC.height * baseScale
    const v2NudgeX = capabilities.supportsPlaneswalkerModernV2Layout ? PW_MODERN_V2_STARTING_LOYALTY_NUDGE_X_PX : 0
    const v2NudgeY = capabilities.supportsPlaneswalkerModernV2Layout ? PW_MODERN_V2_STARTING_LOYALTY_NUDGE_Y_PX : 0
    const shieldX = slot.x + (slot.width - shieldW) / 2 + STARTING_LOYALTY_SHIELD_OFFSET_X_PX + v2NudgeX
    const shieldY =
      rulesBottom +
      STARTING_LOYALTY_SHIELD_TOP_OFFSET_PX +
      STARTING_LOYALTY_SHIELD_OFFSET_Y_PX +
      v2NudgeY
    const fontSize = Math.min(
      typographyPtToStagePx(ptTypography.sizePt, TYPO_PT_BOX_REF_PX) * STARTING_LOYALTY_SHIELD_DISPLAY_SCALE,
      Math.max(16, shieldH * 0.44),
    )
    return { shieldX, shieldY, shieldW, shieldH, fontSize }
  }, [
    lowerRightRect,
    rulesRect.y,
    rulesRect.height,
    ptTypography.sizePt,
    capabilities.supportsPreModernTextBoxFrame,
    capabilities.supportsPlaneswalkerModernV2Layout,
  ])

  if (!capabilities.supportsStartingLoyaltyBox || !layout) return null

  return (
    <Layer listening={false}>
      <Group listening={false}>
        {shieldImg ? (
          <Image
            image={shieldImg}
            x={layout.shieldX}
            y={layout.shieldY}
            width={layout.shieldW}
            height={layout.shieldH}
            listening={false}
          />
        ) : null}
        {loyaltyText ? (
          <Text
            text={loyaltyText}
            x={layout.shieldX}
            y={layout.shieldY}
            width={layout.shieldW}
            height={layout.shieldH}
            fontFamily={ptStack}
            fontStyle={ptFontStyle}
            fontSize={layout.fontSize}
            fill={ptFill}
            align="center"
            verticalAlign="middle"
            listening={false}
          />
        ) : null}
      </Group>
    </Layer>
  )
}

export default memo(StartingLoyaltyOverlayLayer)
