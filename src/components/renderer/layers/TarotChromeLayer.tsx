import { memo } from 'react'
import { Circle, Group, Layer, Line, Shape } from 'react-konva'
import { shallow } from 'zustand/shallow'
import {
  buildTarotStageRects,
  getTarotManaSlots,
  TAROT_GEOMETRY,
  TAROT_PALETTE,
} from '../../../authority/tarotLayoutAuthority'
import { getActiveLayoutCapabilitiesFromState } from '../../../authority/layoutRegistry'
import { useCardStore } from '../../../store/useCardStore'
import type { LayoutId } from '../../../authority/layoutTaxonomy'

const P = TAROT_PALETTE

function strokeLayered(
  ctx: CanvasRenderingContext2D,
  drawPath: () => void,
  opts?: { fill?: string },
) {
  if (opts?.fill) {
    drawPath()
    ctx.fillStyle = opts.fill
    ctx.fill()
  }
  drawPath()
  ctx.strokeStyle = P.deepShadow
  ctx.lineWidth = 8
  ctx.lineJoin = 'round'
  ctx.stroke()
  drawPath()
  ctx.strokeStyle = P.midMetal
  ctx.lineWidth = 5
  ctx.stroke()
  drawPath()
  ctx.strokeStyle = P.ivoryHighlight
  ctx.lineWidth = 2.2
  ctx.stroke()
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

function namePlatePath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const tip = 48
  const step = 18
  ctx.beginPath()
  ctx.moveTo(x + tip, y)
  ctx.lineTo(x + w - tip, y)
  ctx.lineTo(x + w - step, y + h * 0.28)
  ctx.lineTo(x + w, y + h * 0.5)
  ctx.lineTo(x + w - step, y + h * 0.72)
  ctx.lineTo(x + w - tip, y + h)
  ctx.lineTo(x + tip, y + h)
  ctx.lineTo(x + step, y + h * 0.72)
  ctx.lineTo(x, y + h * 0.5)
  ctx.lineTo(x + step, y + h * 0.28)
  ctx.closePath()
}

function typeLinePath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const tip = 36
  ctx.beginPath()
  ctx.moveTo(x + tip, y)
  ctx.lineTo(x + w - 70, y)
  ctx.quadraticCurveTo(x + w - 20, y, x + w, y + h * 0.45)
  ctx.lineTo(x + w - 28, y + h)
  ctx.lineTo(x + tip, y + h)
  ctx.lineTo(x, y + h * 0.5)
  ctx.closePath()
}

function ptCartouchePath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const flare = 40
  ctx.beginPath()
  ctx.moveTo(x + flare, y)
  ctx.lineTo(x + w - flare, y)
  ctx.lineTo(x + w, y + h * 0.5)
  ctx.lineTo(x + w - flare, y + h)
  ctx.lineTo(x + flare, y + h)
  ctx.lineTo(x, y + h * 0.5)
  ctx.closePath()
}

function artArchPath(ctx: CanvasRenderingContext2D) {
  const { left, right, bottom, springY, cx, cy, rx, ry } = TAROT_GEOMETRY.artClip
  ctx.beginPath()
  ctx.moveTo(left, bottom)
  ctx.lineTo(left, springY)
  ctx.ellipse(cx, cy, rx, ry, 0, Math.PI, Math.PI * 2, false)
  ctx.lineTo(right, bottom)
  ctx.closePath()
}

function lowerScrollPath(ctx: CanvasRenderingContext2D, mirror: boolean) {
  const frame = TAROT_GEOMETRY.outerFrame
  const baseX = mirror ? frame.x + frame.width - 120 : frame.x + 120
  const baseY = frame.y + frame.height - 160
  const s = mirror ? -1 : 1
  ctx.beginPath()
  ctx.moveTo(baseX, baseY + 120)
  ctx.bezierCurveTo(baseX + s * 20, baseY + 40, baseX + s * 90, baseY + 10, baseX + s * 70, baseY - 30)
  ctx.bezierCurveTo(baseX + s * 40, baseY - 70, baseX + s * 10, baseY - 40, baseX + s * 30, baseY)
  ctx.bezierCurveTo(baseX + s * 80, baseY + 20, baseX + s * 110, baseY + 70, baseX + s * 40, baseY + 110)
  ctx.closePath()
}

/**
 * Special / Tarot ornamental chrome — engraved plates, arched art frame, medallions.
 */
function TarotChromeLayer() {
  const { currentLayout, activeLayout, showPowerToughness } = useCardStore(
    (s) => ({
      currentLayout: s.currentLayout,
      activeLayout: s.cardData.layout as LayoutId,
      showPowerToughness: s.cardData.showPowerToughness,
    }),
    shallow,
  )
  const caps = getActiveLayoutCapabilitiesFromState({
    currentLayout,
    cardData: { layout: activeLayout },
  })
  if (!caps.useTarotLayout) return <Layer listening={false} />

  const rects = buildTarotStageRects()
  const g = TAROT_GEOMETRY
  const manaSlots = getTarotManaSlots()
  const integrated = manaSlots[manaSlots.length - 1]!
  const showPtPlate = Boolean(showPowerToughness && caps.supportsPowerToughnessBox)

  return (
    <Layer listening={false}>
      {/* Card ground inside outer frame */}
      <Shape
        listening={false}
        sceneFunc={(ctx) => {
          const c = ctx as unknown as CanvasRenderingContext2D
          roundRectPath(c, g.outerFrame.x, g.outerFrame.y, g.outerFrame.width, g.outerFrame.height, 54)
          c.fillStyle = P.cardGround
          c.fill()
        }}
      />

      {/* Outer frame perimeter + lower scrolls */}
      <Shape
        listening={false}
        sceneFunc={(ctx) => {
          const c = ctx as unknown as CanvasRenderingContext2D
          strokeLayered(c, () =>
            roundRectPath(c, g.outerFrame.x, g.outerFrame.y, g.outerFrame.width, g.outerFrame.height, 54),
          )
          // Nested inset contour
          strokeLayered(c, () =>
            roundRectPath(
              c,
              g.outerFrame.x + 18,
              g.outerFrame.y + 18,
              g.outerFrame.width - 36,
              g.outerFrame.height - 36,
              42,
            ),
          )
          strokeLayered(c, () => lowerScrollPath(c, false), { fill: P.plateFill })
          strokeLayered(c, () => lowerScrollPath(c, true), { fill: P.plateFill })
          // Upper corner notches (mirrored)
          for (const mirror of [false, true]) {
            const s = mirror ? -1 : 1
            const ox = mirror ? g.outerFrame.x + g.outerFrame.width - 80 : g.outerFrame.x + 80
            const oy = g.outerFrame.y + 70
            strokeLayered(c, () => {
              c.beginPath()
              c.moveTo(ox, oy)
              c.bezierCurveTo(ox + s * 40, oy - 30, ox + s * 70, oy + 10, ox + s * 30, oy + 40)
              c.bezierCurveTo(ox + s * 10, oy + 20, ox + s * 5, oy + 5, ox, oy)
              c.closePath()
            }, { fill: P.plateFill })
          }
        }}
      />

      {/* Integrated mana socket (empty ring — symbol drawn in mana layer when occupied) */}
      <Group listening={false}>
        <Circle x={integrated.cx} y={integrated.cy} radius={integrated.r + 6} stroke={P.deepShadow} strokeWidth={8} listening={false} />
        <Circle x={integrated.cx} y={integrated.cy} radius={integrated.r + 3} stroke={P.midMetal} strokeWidth={5} listening={false} />
        <Circle x={integrated.cx} y={integrated.cy} radius={integrated.r} fill={P.plateFill} stroke={P.ivoryHighlight} strokeWidth={2.5} listening={false} />
        <Circle x={integrated.cx} y={integrated.cy} radius={integrated.r - 10} stroke={P.midMetal} strokeWidth={2} listening={false} />
      </Group>

      {/* Arched art box frame */}
      <Shape
        listening={false}
        sceneFunc={(ctx) => {
          const c = ctx as unknown as CanvasRenderingContext2D
          strokeLayered(c, () => artArchPath(c), { fill: 'rgba(0,0,0,0)' })
          // Inset contour
          c.save()
          c.translate(825, 770)
          c.scale(0.94, 0.94)
          c.translate(-825, -770)
          strokeLayered(c, () => artArchPath(c))
          c.restore()
        }}
      />

      {/* Name plate */}
      <Shape
        listening={false}
        sceneFunc={(ctx) => {
          const c = ctx as unknown as CanvasRenderingContext2D
          const { x, y, width, height } = rects.namePlate
          strokeLayered(c, () => namePlatePath(c, x, y, width, height), { fill: P.plateFill })
          strokeLayered(c, () => namePlatePath(c, x + 14, y + 12, width - 28, height - 24))
        }}
      />

      {/* Type line */}
      <Shape
        listening={false}
        sceneFunc={(ctx) => {
          const c = ctx as unknown as CanvasRenderingContext2D
          const { x, y, width, height } = rects.typePlate
          strokeLayered(c, () => typeLinePath(c, x, y, width, height), { fill: P.plateFill })
        }}
      />

      {/* Text box panel */}
      <Shape
        listening={false}
        sceneFunc={(ctx) => {
          const c = ctx as unknown as CanvasRenderingContext2D
          const p = rects.textBoxPanel
          strokeLayered(c, () => roundRectPath(c, p.x, p.y, p.width, p.height, 28), { fill: P.plateFill })
          strokeLayered(c, () => roundRectPath(c, p.x + 14, p.y + 14, p.width - 28, p.height - 28, 18))
          // Lower-right hologram shoulder notch cue
          strokeLayered(c, () => {
            c.beginPath()
            c.arc(g.hologramCenter.x, g.hologramCenter.y, 92, -0.4, Math.PI * 0.7, false)
          })
        }}
      />

      {/* Expansion medallion */}
      <Group listening={false}>
        <Circle x={g.expansionCenter.x} y={g.expansionCenter.y} radius={60} fill={P.plateFill} stroke={P.deepShadow} strokeWidth={8} />
        <Circle x={g.expansionCenter.x} y={g.expansionCenter.y} radius={56} stroke={P.midMetal} strokeWidth={4} />
        <Circle x={g.expansionCenter.x} y={g.expansionCenter.y} radius={48} stroke={P.ivoryHighlight} strokeWidth={2} />
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2
          return (
            <Line
              key={`star-${i}`}
              points={[
                g.expansionCenter.x + Math.cos(a) * 18,
                g.expansionCenter.y + Math.sin(a) * 18,
                g.expansionCenter.x + Math.cos(a) * 44,
                g.expansionCenter.y + Math.sin(a) * 44,
              ]}
              stroke={P.midMetal}
              strokeWidth={1.5}
              listening={false}
            />
          )
        })}
        <Circle x={g.expansionCenter.x} y={g.expansionCenter.y} radius={22} stroke={P.lightMetal} strokeWidth={2} listening={false} />
      </Group>

      {/* Hologram medallion */}
      <Group listening={false}>
        <Circle x={g.hologramCenter.x} y={g.hologramCenter.y} radius={85} fill={P.plateFill} stroke={P.deepShadow} strokeWidth={9} />
        <Circle x={g.hologramCenter.x} y={g.hologramCenter.y} radius={78} stroke={P.midMetal} strokeWidth={5} />
        <Circle x={g.hologramCenter.x} y={g.hologramCenter.y} radius={68} stroke={P.ivoryHighlight} strokeWidth={2} />
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (i / 24) * Math.PI * 2
          return (
            <Line
              key={`holo-ray-${i}`}
              points={[
                g.hologramCenter.x + Math.cos(a) * 20,
                g.hologramCenter.y + Math.sin(a) * 20,
                g.hologramCenter.x + Math.cos(a) * 62,
                g.hologramCenter.y + Math.sin(a) * 62,
              ]}
              stroke={P.midMetal}
              strokeWidth={1}
              opacity={0.7}
              listening={false}
            />
          )
        })}
        <Circle x={g.hologramCenter.x} y={g.hologramCenter.y} radius={28} stroke={P.lightMetal} strokeWidth={2} listening={false} />
      </Group>

      {/* P/T cartouche */}
      {showPtPlate && (
        <Shape
          listening={false}
          sceneFunc={(ctx) => {
            const c = ctx as unknown as CanvasRenderingContext2D
            const p = rects.ptArea
            strokeLayered(c, () => ptCartouchePath(c, p.x, p.y, p.width, p.height), { fill: P.plateFill })
            strokeLayered(c, () => ptCartouchePath(c, p.x + 16, p.y + 14, p.width - 32, p.height - 28))
          }}
        />
      )}
    </Layer>
  )
}

export default memo(TarotChromeLayer)
