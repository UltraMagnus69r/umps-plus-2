import { memo } from 'react'
import { Group, Layer, Text } from 'react-konva'
import { shallow } from 'zustand/shallow'
import {
  getActiveLayoutArtRectFromState,
  getActiveLayoutCapabilitiesFromState,
  getActiveLayoutRegionsFromState,
  layoutRegionToStageRect,
} from '../../../authority/layoutRegistry'
import { getPlaneswalkerModernV2ArtInnerRect } from '../../../authority/planeswalkerModernV2LayoutAuthority'
import {
  getSecondaryNameSeatRect,
  normalizeSecondaryNameAlign,
  normalizeSecondaryNameFontSize,
} from '../../../authority/secondaryNameAuthority'
import type { LayoutId } from '../../../authority/layoutTaxonomy'
import { getFontStack } from '../../../authority/typographyAuthority'
import { useCardStore } from '../../../store/useCardStore'

const TEXT_SHADOW_OFFSET = { x: 1, y: 1 }

/**
 * Secondary name — over the art window, under the nameplate, clipped to the art region.
 * Mounted for every layout (including PKMN); chrome structure is unchanged.
 */
function SecondaryNameLayer() {
  const {
    currentLayout,
    activeLayout,
    secondaryName,
    showSecondaryName,
    secondaryNameFontSize,
    secondaryNameAlign,
    secondaryNameLightText,
  } = useCardStore(
    (s) => ({
      currentLayout: s.currentLayout,
      activeLayout: s.cardData.layout as LayoutId,
      secondaryName: s.cardData.secondaryName,
      showSecondaryName: s.cardData.showSecondaryName,
      secondaryNameFontSize: s.cardData.secondaryNameFontSize,
      secondaryNameAlign: s.cardData.secondaryNameAlign,
      secondaryNameLightText: s.cardData.secondaryNameLightText,
    }),
    shallow,
  )

  if (!showSecondaryName || !String(secondaryName ?? '').trim()) {
    return null
  }

  const caps = getActiveLayoutCapabilitiesFromState({
    currentLayout,
    cardData: { layout: activeLayout },
  })
  const artR = caps.supportsPlaneswalkerModernV2Layout
    ? getPlaneswalkerModernV2ArtInnerRect()
    : getActiveLayoutArtRectFromState({
        currentLayout,
        cardData: { layout: activeLayout },
      })
  const nameBarRect = layoutRegionToStageRect(
    getActiveLayoutRegionsFromState({
      currentLayout,
      cardData: { layout: activeLayout },
    }).nameBar,
  )

  const fontSize = normalizeSecondaryNameFontSize(secondaryNameFontSize)
  const align = normalizeSecondaryNameAlign(secondaryNameAlign)
  const seat = getSecondaryNameSeatRect(artR, nameBarRect, fontSize)

  return (
    <Layer listening={false}>
      <Group
        listening={false}
        clipX={artR.x}
        clipY={artR.y}
        clipWidth={artR.width}
        clipHeight={artR.height}
      >
        <Text
          text={secondaryName}
          x={seat.x}
          y={seat.y}
          width={seat.width}
          height={seat.height}
          fontFamily={getFontStack('NAME')}
          fontStyle="bold"
          fontSize={fontSize}
          align={align}
          fill={secondaryNameLightText ? '#fff' : '#111'}
          stroke={secondaryNameLightText ? '#111' : '#fff'}
          strokeWidth={2}
          shadowColor={secondaryNameLightText ? '#000' : '#fff'}
          shadowBlur={4}
          shadowOffset={TEXT_SHADOW_OFFSET}
          listening={false}
          verticalAlign="top"
        />
      </Group>
    </Layer>
  )
}

export default memo(SecondaryNameLayer)
