import { memo } from 'react'
import { Layer, Text } from 'react-konva'
import { shallow } from 'zustand/shallow'
import {
  getActiveLayoutCapabilitiesFromState,
  getActiveLayoutArtRectFromState,
  getActiveLayoutRegionsFromState,
  layoutRegionToStageRect,
} from '../../../authority/layoutRegistry'
import { isBorderlessArtTreatmentLayout } from '../../../authority/layoutTaxonomy'
import type { LayoutId } from '../../../authority/layoutTaxonomy'
import { getFontStack } from '../../../authority/typographyAuthority'
import { useCardStore } from '../../../store/useCardStore'

const TEXT_SHADOW_OFFSET = { x: 1, y: 1 }

/**
 * Pre-Modern face layouts — secondary name renders above all card chrome and text.
 */
function SecondaryNameLayer() {
  const {
    currentLayout,
    activeLayout,
    secondaryName,
    showSecondaryName,
    secondaryNameFontSize,
    secondaryNameLightText,
  } = useCardStore(
    (s) => ({
      currentLayout: s.currentLayout,
      activeLayout: s.cardData.layout as LayoutId,
      secondaryName: s.cardData.secondaryName,
      showSecondaryName: s.cardData.showSecondaryName,
      secondaryNameFontSize: s.cardData.secondaryNameFontSize,
      secondaryNameLightText: s.cardData.secondaryNameLightText,
    }),
    shallow,
  )

  const caps = getActiveLayoutCapabilitiesFromState({
    currentLayout,
    cardData: { layout: activeLayout },
  })

  if (!caps.supportsPreModernFaceLayout || !showSecondaryName || !secondaryName) {
    return null
  }

  const artR = getActiveLayoutArtRectFromState({
    currentLayout,
    cardData: { layout: activeLayout },
  })
  const nameBarRect = layoutRegionToStageRect(
    getActiveLayoutRegionsFromState({
      currentLayout,
      cardData: { layout: activeLayout },
    }).nameBar,
  )
  const borderlessLike = isBorderlessArtTreatmentLayout(activeLayout)

  const secondaryFontSize = (() => {
    const v =
      typeof secondaryNameFontSize === 'number' && Number.isFinite(secondaryNameFontSize)
        ? secondaryNameFontSize
        : 55
    return Math.max(20, Math.min(90, Math.floor(v * 2) / 2))
  })()

  return (
    <Layer listening={false}>
      <Text
        text={secondaryName}
        x={borderlessLike ? nameBarRect.x + 10 : artR.x + 10}
        y={borderlessLike ? nameBarRect.y + nameBarRect.height + 6 : artR.y + 8}
        width={borderlessLike ? nameBarRect.width - 20 : artR.width - 20}
        height={Math.max(54, Math.min(Math.ceil(secondaryFontSize * 1.25), artR.height - 16))}
        fontFamily={getFontStack('NAME')}
        fontStyle="bold"
        fontSize={secondaryFontSize}
        fill={secondaryNameLightText ? '#fff' : '#111'}
        stroke={secondaryNameLightText ? '#111' : '#fff'}
        strokeWidth={2}
        shadowColor={secondaryNameLightText ? '#000' : '#fff'}
        shadowBlur={4}
        shadowOffset={TEXT_SHADOW_OFFSET}
        listening={false}
        verticalAlign="top"
      />
    </Layer>
  )
}

export default memo(SecondaryNameLayer)
