import { memo, useMemo } from 'react'
import { Layer, Line, Rect, Shape } from 'react-konva'
import { shallow } from 'zustand/shallow'
import {
  buildAscendantStageRects,
  getAscendantArtWindowStrokeWidth,
  getAscendantFlavorRibbonPolygonsStage,
  getAscendantNamePlatePolygonStage,
  getAscendantRulesBoxGeometryStage,
  getAscendantTypeLineGeometryStage,
} from '../../../authority/ascendantLayoutAuthority'
import {
  getActiveLayoutCapabilitiesFromState,
} from '../../../authority/layoutRegistry'
import { resolveProceduralIdentity, useCardStore } from '../../../store/useCardStore'
import type { LayoutId } from '../../../authority/layoutTaxonomy'
import { createBoxPanelInnerFillStyle } from '../../../authority/boxPanelFillAuthority'
import { usePanelBackgroundImage } from '../../../hooks/usePanelBackgroundImage'
import { effectivePanelBackground } from '../../../authority/panelBackgroundAuthority'

const FRAME_SHADOW_BLUR_FEATHER = 4
const FRAME_SHADOW_OPACITY = 0.4
const FRAME_SHADOW_OFFSET = { x: 1, y: 1 }

function darkenHex(hex: string, amount: number): string {
  const n = hex.replace(/^#/, '')
  if (n.length !== 6) return hex
  const r = Math.max(0, Math.min(255, Math.round(parseInt(n.slice(0, 2), 16) * (1 - amount))))
  const g = Math.max(0, Math.min(255, Math.round(parseInt(n.slice(2, 4), 16) * (1 - amount))))
  const b = Math.max(0, Math.min(255, Math.round(parseInt(n.slice(4, 6), 16) * (1 - amount))))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

function lightenHex(hex: string, amount: number): string {
  const n = hex.replace(/^#/, '')
  if (n.length !== 6) return hex
  const r = Math.max(0, Math.min(255, Math.round(parseInt(n.slice(0, 2), 16) + (255 - parseInt(n.slice(0, 2), 16)) * amount)))
  const g = Math.max(0, Math.min(255, Math.round(parseInt(n.slice(2, 4), 16) + (255 - parseInt(n.slice(2, 4), 16)) * amount)))
  const b = Math.max(0, Math.min(255, Math.round(parseInt(n.slice(4, 6), 16) + (255 - parseInt(n.slice(4, 6), 16)) * amount)))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

function fillPolygonPath(ctx: CanvasRenderingContext2D, flatPoints: number[]) {
  if (flatPoints.length < 6) return
  ctx.beginPath()
  ctx.moveTo(flatPoints[0]!, flatPoints[1]!)
  for (let i = 2; i < flatPoints.length; i += 2) {
    ctx.lineTo(flatPoints[i]!, flatPoints[i + 1]!)
  }
  ctx.closePath()
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2))
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

/**
 * Special / Ascendant decorative chrome — name plate, flavor ribbon, rules box, type capsule, art stroke.
 * Only mounts when `useAscendantLayout` is active.
 */
function AscendantChromeLayer() {
  const {
    currentLayout,
    activeLayout,
    cardTypeLine,
    colorIdentity,
    cardName,
    manaCost,
    autoColorEnabled,
    manualColorKey,
    manualColorHex1,
    manualColorHex2,
    manualColorHex3,
    manualColorHex4,
    manualColorHex5,
    manualColorCount,
    nameBoxColor,
    typeLineBoxColor,
    rulesTextBoxColor,
    nameBoxGradientEnabled,
    nameBoxGradientDirection,
    nameBoxGradientSaturation,
    nameBoxGradientReversed,
    typeLineBoxGradientEnabled,
    typeLineBoxGradientDirection,
    typeLineBoxGradientSaturation,
    typeLineBoxGradientReversed,
    rulesTextBoxGradientEnabled,
    rulesTextBoxGradientDirection,
    rulesTextBoxGradientSaturation,
    rulesTextBoxGradientReversed,
  } = useCardStore(
    (s) => ({
      currentLayout: s.currentLayout,
      activeLayout: s.cardData.layout as LayoutId,
      cardTypeLine: s.cardData.typeLine,
      colorIdentity: s.cardData.colorIdentity,
      cardName: s.cardData.name,
      manaCost: s.cardData.manaCost,
      autoColorEnabled: s.autoColorEnabled,
      manualColorKey: s.manualColorKey,
      manualColorHex1: s.manualColorHex1,
      manualColorHex2: s.manualColorHex2,
      manualColorHex3: s.manualColorHex3,
      manualColorHex4: s.manualColorHex4,
      manualColorHex5: s.manualColorHex5,
      manualColorCount: s.manualColorCount,
      nameBoxColor: s.cardData.nameBoxColor,
      typeLineBoxColor: s.cardData.typeLineBoxColor,
      rulesTextBoxColor: s.cardData.rulesTextBoxColor,
      nameBoxGradientEnabled: s.cardData.nameBoxGradientEnabled,
      nameBoxGradientDirection: s.cardData.nameBoxGradientDirection,
      nameBoxGradientSaturation: s.cardData.nameBoxGradientSaturation,
      nameBoxGradientReversed: s.cardData.nameBoxGradientReversed,
      typeLineBoxGradientEnabled: s.cardData.typeLineBoxGradientEnabled,
      typeLineBoxGradientDirection: s.cardData.typeLineBoxGradientDirection,
      typeLineBoxGradientSaturation: s.cardData.typeLineBoxGradientSaturation,
      typeLineBoxGradientReversed: s.cardData.typeLineBoxGradientReversed,
      rulesTextBoxGradientEnabled: s.cardData.rulesTextBoxGradientEnabled,
      rulesTextBoxGradientDirection: s.cardData.rulesTextBoxGradientDirection,
      rulesTextBoxGradientSaturation: s.cardData.rulesTextBoxGradientSaturation,
      rulesTextBoxGradientReversed: s.cardData.rulesTextBoxGradientReversed,
    }),
    shallow,
  )

  const caps = getActiveLayoutCapabilitiesFromState({
    currentLayout,
    cardData: { layout: activeLayout },
  })
  const active = caps.useAscendantLayout

  const panelBackgroundPreview = useCardStore((s) => s.panelBackgroundPreview)
  const effectiveNameBoxColor = useMemo(
    () => effectivePanelBackground('nameBoxColor', nameBoxColor, panelBackgroundPreview),
    [nameBoxColor, panelBackgroundPreview],
  )
  const effectiveTypeLineBoxColor = useMemo(
    () => effectivePanelBackground('typeLineBoxColor', typeLineBoxColor, panelBackgroundPreview),
    [typeLineBoxColor, panelBackgroundPreview],
  )
  const effectiveRulesTextBoxColor = useMemo(
    () => effectivePanelBackground('rulesTextBoxColor', rulesTextBoxColor, panelBackgroundPreview),
    [rulesTextBoxColor, panelBackgroundPreview],
  )
  const nameBoxBgImage = usePanelBackgroundImage(effectiveNameBoxColor)
  const typeLineBoxBgImage = usePanelBackgroundImage(effectiveTypeLineBoxColor)
  const rulesBoxBgImage = usePanelBackgroundImage(effectiveRulesTextBoxColor)

  const resolvedIdentity = useMemo(
    () =>
      resolveProceduralIdentity(
        cardTypeLine,
        colorIdentity,
        cardName,
        manaCost ?? '',
        autoColorEnabled,
        manualColorKey,
        manualColorHex1,
        manualColorHex2,
        manualColorHex3,
        manualColorHex4,
        manualColorHex5,
        manualColorCount,
      ),
    [
      cardTypeLine,
      colorIdentity,
      cardName,
      manaCost,
      autoColorEnabled,
      manualColorKey,
      manualColorHex1,
      manualColorHex2,
      manualColorHex3,
      manualColorHex4,
      manualColorHex5,
      manualColorCount,
    ],
  )

  const stroke = useMemo(() => darkenHex(resolvedIdentity.stroke, 0.35), [resolvedIdentity.stroke])
  const fillFallback = useMemo(() => lightenHex(resolvedIdentity.stroke, 0.08), [resolvedIdentity.stroke])
  const artStrokeW = getAscendantArtWindowStrokeWidth()

  const rects = useMemo(() => (active ? buildAscendantStageRects() : null), [active])
  const namePlate = useMemo(() => (active ? getAscendantNamePlatePolygonStage() : null), [active])
  const flavorRibbon = useMemo(() => (active ? getAscendantFlavorRibbonPolygonsStage() : null), [active])
  const rulesBox = useMemo(() => (active ? getAscendantRulesBoxGeometryStage() : null), [active])
  const typeLine = useMemo(() => (active ? getAscendantTypeLineGeometryStage() : null), [active])

  if (!active || !rects || !namePlate || !flavorRibbon || !rulesBox || !typeLine) {
    return <Layer listening={false} />
  }

  const shadow = {
    shadowColor: '#000',
    shadowBlur: FRAME_SHADOW_BLUR_FEATHER,
    shadowOffset: FRAME_SHADOW_OFFSET,
    shadowOpacity: FRAME_SHADOW_OPACITY,
  }

  return (
    <Layer listening={false}>
      {/* Art window stroke (art image itself is clipped in ArtLayer). */}
      <Rect
        x={rects.art.x}
        y={rects.art.y}
        width={rects.art.width}
        height={rects.art.height}
        fillEnabled={false}
        stroke={stroke}
        strokeWidth={artStrokeW}
        listening={false}
      />

      {/* Name plate — chamfered capsule polygon. */}
      <Shape
        listening={false}
        {...shadow}
        sceneFunc={(ctx) => {
          const c = ctx as unknown as CanvasRenderingContext2D
          fillPolygonPath(c, namePlate)
          const bounds = namePlate.reduce(
            (acc, v, i) => {
              if (i % 2 === 0) {
                acc.minX = Math.min(acc.minX, v)
                acc.maxX = Math.max(acc.maxX, v)
              } else {
                acc.minY = Math.min(acc.minY, v)
                acc.maxY = Math.max(acc.maxY, v)
              }
              return acc
            },
            { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
          )
          const w = Math.max(1, bounds.maxX - bounds.minX)
          const h = Math.max(1, bounds.maxY - bounds.minY)
          c.save()
          c.clip()
          c.translate(bounds.minX, bounds.minY)
          const fill = createBoxPanelInnerFillStyle(
            c,
            w,
            h,
            effectiveNameBoxColor,
            nameBoxGradientEnabled,
            nameBoxGradientDirection,
            nameBoxGradientSaturation,
            nameBoxGradientReversed,
            nameBoxBgImage,
          )
          c.fillStyle = typeof fill === 'string' ? fill : fill
          c.fillRect(0, 0, w, h)
          c.restore()
          fillPolygonPath(c, namePlate)
          c.strokeStyle = stroke
          c.lineWidth = artStrokeW
          c.stroke()
        }}
      />

      {/* Flavor ribbon body + tails */}
      <Line points={flavorRibbon.leftTail} closed fill={fillFallback} stroke={stroke} strokeWidth={artStrokeW} listening={false} {...shadow} />
      <Line points={flavorRibbon.rightTail} closed fill={fillFallback} stroke={stroke} strokeWidth={artStrokeW} listening={false} {...shadow} />
      <Shape
        listening={false}
        {...shadow}
        sceneFunc={(ctx) => {
          const c = ctx as unknown as CanvasRenderingContext2D
          fillPolygonPath(c, flavorRibbon.body)
          c.fillStyle = fillFallback
          c.fill()
          fillPolygonPath(c, flavorRibbon.body)
          c.strokeStyle = stroke
          c.lineWidth = artStrokeW
          c.stroke()
        }}
      />

      {/* Expansion symbol circle on flavor ribbon */}
      <Shape
        listening={false}
        {...shadow}
        sceneFunc={(ctx) => {
          const c = ctx as unknown as CanvasRenderingContext2D
          const { expansionSymbol } = rects
          const cx = expansionSymbol.x + expansionSymbol.width / 2
          const cy = expansionSymbol.y + expansionSymbol.height / 2
          const r = expansionSymbol.width / 2
          c.beginPath()
          c.arc(cx, cy, r, 0, Math.PI * 2)
          c.fillStyle = fillFallback
          c.fill()
          c.strokeStyle = stroke
          c.lineWidth = artStrokeW
          c.stroke()
        }}
      />

      {/* Rules box + side notches */}
      <Shape
        listening={false}
        {...shadow}
        sceneFunc={(ctx) => {
          const c = ctx as unknown as CanvasRenderingContext2D
          const { rect, cornerRadius, leftNotch, rightNotch } = rulesBox
          const fill = createBoxPanelInnerFillStyle(
            c,
            rect.width,
            rect.height,
            effectiveRulesTextBoxColor,
            rulesTextBoxGradientEnabled,
            rulesTextBoxGradientDirection,
            rulesTextBoxGradientSaturation,
            rulesTextBoxGradientReversed,
            rulesBoxBgImage,
          )
          roundRectPath(c, rect.x, rect.y, rect.width, rect.height, cornerRadius)
          c.fillStyle = typeof fill === 'string' ? fill : fill
          c.fill()
          c.strokeStyle = stroke
          c.lineWidth = artStrokeW
          c.stroke()
          fillPolygonPath(c, leftNotch)
          c.fillStyle = fillFallback
          c.fill()
          c.strokeStyle = stroke
          c.stroke()
          fillPolygonPath(c, rightNotch)
          c.fillStyle = fillFallback
          c.fill()
          c.strokeStyle = stroke
          c.stroke()
        }}
      />

      {/* Type line capsule + pointed ornaments */}
      <Line points={typeLine.leftPoint} closed fill={fillFallback} stroke={stroke} strokeWidth={artStrokeW} listening={false} {...shadow} />
      <Line points={typeLine.rightPoint} closed fill={fillFallback} stroke={stroke} strokeWidth={artStrokeW} listening={false} {...shadow} />
      <Shape
        listening={false}
        {...shadow}
        sceneFunc={(ctx) => {
          const c = ctx as unknown as CanvasRenderingContext2D
          const { capsule, cornerRadius } = typeLine
          const fill = createBoxPanelInnerFillStyle(
            c,
            capsule.width,
            capsule.height,
            effectiveTypeLineBoxColor,
            typeLineBoxGradientEnabled,
            typeLineBoxGradientDirection,
            typeLineBoxGradientSaturation,
            typeLineBoxGradientReversed,
            typeLineBoxBgImage,
          )
          roundRectPath(c, capsule.x, capsule.y, capsule.width, capsule.height, cornerRadius)
          c.fillStyle = typeof fill === 'string' ? fill : fill
          c.fill()
          c.strokeStyle = stroke
          c.lineWidth = artStrokeW
          c.stroke()
        }}
      />
    </Layer>
  )
}

export default memo(AscendantChromeLayer)
