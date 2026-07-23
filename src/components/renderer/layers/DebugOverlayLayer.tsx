import { memo, useMemo } from 'react'
import { Layer, Rect, Group, Text } from 'react-konva'
import { shallow } from 'zustand/shallow'
import {
  BEVEL_INSET,
  getStandardLayoutGeometry,
  PROXY_HOLO_RADIUS_X,
  PROXY_HOLO_RADIUS_Y,
  STAGE_WIDTH,
} from '../../../authority/geometryAuthority'
import { getLayoutFamilyExtensionStageRects } from '../../../authority/layoutRegistry'
import type { LayoutId } from '../../../authority/layoutTaxonomy'
import { getInnerBorderStageRect, normalizeLayout } from '../../../authority/layoutTaxonomy'
import { useCardStore } from '../../../store/useCardStore'

/** Stable dash pattern — avoids new array identity each render on guide rects. */
const GUIDE_DASH: number[] = [10, 10]

/** Layout-label styling (stage px). Sized to match definitive cardmap reference (−40% from prior pass). */
const LABEL_FONT_SIZE = 24
const LABEL_PAD_X = 11
const LABEL_PAD_Y = 8
const LABEL_BOX_HEIGHT = LABEL_FONT_SIZE + LABEL_PAD_Y * 2
const LABEL_CORNER_RADIUS = 6
const LABEL_STROKE_WIDTH = 1
/** Approximate label box width from text length (bold sans ~0.56em average advance). */
const labelBoxWidth = (label: string) => Math.ceil(label.length * LABEL_FONT_SIZE * 0.56) + LABEL_PAD_X * 2

/**
 * Layer 5 — Debug / Overlay.
 * Print guides (bleed, trim, safe zone) and optional layout labels.
 */
function DebugOverlayLayer() {
  const layout = getStandardLayoutGeometry()
  const {
    bleedX,
    bleedY,
    bleedW,
    bleedH,
    trimX,
    trimY,
    trimW,
    trimH,
    safeX,
    safeY,
    safeW,
    safeH,
    innerX: canonicalInnerX,
    innerY: canonicalInnerY,
    innerW: canonicalInnerW,
    innerH: canonicalInnerH,
    nameX,
    nameY,
    nameW,
    nameH,
    artX,
    artY,
    typeX,
    typeY,
    typeW,
    typeH,
    rulesX,
    rulesY,
    rulesH,
    ptX,
    ptY,
    ptW,
    ptH,
    bottomInfoY,
    bottomInfoH,
    setInfoX,
  } = layout

  const { showBleed, showTrim, showSafeZone, showLayoutLabels, showPowerToughness, activeLayout } =
    useCardStore(
      (s) => ({
        showBleed: s.cardData.showBleed,
        showTrim: s.cardData.showTrim,
        showSafeZone: s.cardData.showSafeZone,
        showLayoutLabels: s.showTooltips,
        showPowerToughness: s.cardData.showPowerToughness,
        activeLayout: s.cardData.layout as LayoutId,
      }),
      shallow,
    )
  const extensionRects = getLayoutFamilyExtensionStageRects(normalizeLayout(activeLayout))

  const { innerX, innerY, innerW, innerH } = useMemo(
    () =>
      getInnerBorderStageRect(activeLayout, {
        trimY,
        trimH,
        innerX: canonicalInnerX,
        innerY: canonicalInnerY,
        innerW: canonicalInnerW,
        innerH: canonicalInnerH,
      }),
    [activeLayout, trimY, trimH, canonicalInnerX, canonicalInnerY, canonicalInnerW, canonicalInnerH],
  )

  /** Hologram Seal slot — bounding rect of proxy holo oval (03 standardSlotsPx). */
  const holoSlotX = Math.round(STAGE_WIDTH / 2 - PROXY_HOLO_RADIUS_X)
  const holoSlotY = Math.round(rulesY + rulesH - PROXY_HOLO_RADIUS_Y)
  const manaSymbolsX = nameX + nameW - BEVEL_INSET - labelBoxWidth('12. Mana Symbols') - 8
  const manaSymbolsY = nameY + (nameH - LABEL_BOX_HEIGHT) / 2
  /** Vertical middle of the card frame, for the right-edge Inner Border tag. */
  const cardMiddleY = innerY + Math.round((innerH - LABEL_BOX_HEIGHT) / 2)

  const cardmapLabels: { label: string; x: number; y: number }[] = [
    { label: '1. Outer Border', x: Math.round(STAGE_WIDTH / 2 - labelBoxWidth('1. Outer Border') / 2), y: trimY + 8 },
    { label: '2. Inner Border', x: innerX + innerW - labelBoxWidth('2. Inner Border') - 6, y: cardMiddleY },
    { label: '3. Name Plate', x: nameX + 10, y: nameY + Math.round((nameH - LABEL_BOX_HEIGHT) / 2) },
    { label: '4. Art Box', x: artX + 10, y: artY + 10 },
    { label: '5. Type Line Box', x: typeX + 10, y: typeY + Math.round((typeH - LABEL_BOX_HEIGHT) / 2) },
    { label: '6. Rules Text Box', x: rulesX + 10, y: rulesY + 10 },
    {
      label: '7. Hologram Seal',
      x: holoSlotX + Math.round(PROXY_HOLO_RADIUS_X - labelBoxWidth('7. Hologram Seal') / 2),
      y: Math.round(holoSlotY + PROXY_HOLO_RADIUS_Y - LABEL_BOX_HEIGHT / 2),
    },
    ...(showPowerToughness && activeLayout.family !== 'land'
      ? [
          {
            label: '8. P/T Box',
            x: ptX + Math.round((ptW - labelBoxWidth('8. P/T Box')) / 2),
            y: ptY + Math.round((ptH - LABEL_BOX_HEIGHT) / 2),
          },
        ]
      : []),
    { label: '9. Collector / Language Text', x: setInfoX, y: bottomInfoY + Math.round((bottomInfoH - LABEL_BOX_HEIGHT) / 2) },
    {
      label: '10. Artist / Copyright Text',
      x: trimX + trimW - labelBoxWidth('10. Artist / Copyright Text') - 10,
      y: bottomInfoY + Math.round((bottomInfoH - LABEL_BOX_HEIGHT) / 2),
    },
    {
      label: '11. Expansion Symbol',
      x: typeX + typeW - labelBoxWidth('11. Expansion Symbol') - 6,
      y: typeY + Math.round((typeH - LABEL_BOX_HEIGHT) / 2),
    },
    { label: '12. Mana Symbols', x: Math.max(nameX + 10, manaSymbolsX), y: manaSymbolsY },
  ]

  return (
    <>
      <Layer name="debug-overlay" listening={false}>
        {showBleed && (
          <Rect
            listening={false}
            x={bleedX}
            y={bleedY}
            width={bleedW}
            height={bleedH}
            stroke="red"
            strokeWidth={2}
            dash={GUIDE_DASH}
          />
        )}
        {showTrim && (
          <Rect
            listening={false}
            x={trimX}
            y={trimY}
            width={trimW}
            height={trimH}
            stroke="red"
            strokeWidth={2}
            dash={GUIDE_DASH}
          />
        )}
        {showSafeZone && (
          <Rect
            listening={false}
            x={safeX}
            y={safeY}
            width={safeW}
            height={safeH}
            stroke="yellow"
            strokeWidth={2}
            dash={GUIDE_DASH}
          />
        )}
      </Layer>

      {showLayoutLabels && (
        <Layer name="layout-labels" listening={false}>
          {[
            ...cardmapLabels,
            ...Object.entries(extensionRects).flatMap(([key, value]) =>
              Array.isArray(value)
                ? value.map((r, idx) => ({
                    label: `${key} ${idx + 1}`,
                    x: r.x,
                    y: r.y,
                  }))
                : [
                    {
                      label: key,
                      x: value.x,
                      y: value.y,
                    },
                  ],
            ),
          ].map((b) => (
            <Group key={b.label} x={Math.max(0, b.x)} y={Math.max(0, b.y)} listening={false}>
              <Rect
                width={labelBoxWidth(b.label)}
                height={LABEL_BOX_HEIGHT}
                fill="#111"
                opacity={0.82}
                cornerRadius={LABEL_CORNER_RADIUS}
                stroke="#fff"
                strokeWidth={LABEL_STROKE_WIDTH}
                listening={false}
              />
              <Text
                text={b.label}
                x={LABEL_PAD_X}
                y={LABEL_PAD_Y}
                fontSize={LABEL_FONT_SIZE}
                fontStyle="bold"
                fill="#fff"
                listening={false}
              />
            </Group>
          ))}
        </Layer>
      )}
    </>
  )
}

export default memo(DebugOverlayLayer)
