/**
 * Battle / Siege landscape stack chrome —
 * top nameplate (name + mana), art aperture, type line, upright tan rules,
 * defense shield, left-edge collector strip, hologram stamp.
 */
import { memo, useMemo } from 'react'
import { Ellipse, Group, Layer, Shape, Text } from 'react-konva'
import { shallow } from 'zustand/shallow'
import {
  BATTLE_SIEGE_DEFAULT_REMINDER,
  getBattleArtRect,
  getBattleCollectorRect,
  getBattleDefenseRect,
  getBattleHologramRect,
  getBattleInnerBorderCornerRadii,
  getBattleLeftCornerHorizontalRadius,
  getBattleManaRect,
  getBattleNameRect,
  getBattleRulesRect,
  getBattleStageSize,
  getBattleTransformRect,
  getBattleTrimRect,
  getBattleTypeRect,
  layoutUsesBattleChrome,
  normalizeBattleDefense,
} from '../../../authority/battleLayoutAuthority'
import { getActiveLayoutCapabilitiesFromState } from '../../../authority/layoutRegistry'
import type { LayoutId } from '../../../authority/layoutTaxonomy'
import {
  resolveTypographyFontFace,
  resolveTypographyInkColor,
  typographyPtToStagePx,
  type CardFieldTypography,
} from '../../../authority/typographyAuthority'
import { useEffectiveTypographyFontKey } from '../../../hooks/useEffectiveTypographyFontKey'
import { resolveProceduralIdentity, useCardStore } from '../../../store/useCardStore'

/** sizePt 12 ≈ prior hardcoded ~34 px in the landscape tan rules pill. */
const BATTLE_RULES_PT_REF_PX = 34
/** Auto ink on parchment when rules typography color is not manual. */
const BATTLE_RULES_AUTO_INK = '#1c1612'

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

function addPillPath(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const r = Math.min(w, h) * 0.45
  ctx.moveTo(r, 0)
  ctx.lineTo(w - r, 0)
  ctx.quadraticCurveTo(w, 0, w, r)
  ctx.lineTo(w, h - r)
  ctx.quadraticCurveTo(w, h, w - r, h)
  ctx.lineTo(r, h)
  ctx.quadraticCurveTo(0, h, 0, h - r)
  ctx.lineTo(0, r)
  ctx.quadraticCurveTo(0, 0, r, 0)
  ctx.closePath()
}

/**
 * Rounded rect with per-corner radii (TL, TR, BR, BL).
 * Left corners keep vertical anchors at `tl`/`bl` but push the top/bottom
 * tangent points further right by `leftTangentExtra` so the arc starts later.
 */
function addRoundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radii: readonly [number, number, number, number],
  leftTangentExtra = 0,
): void {
  const [tl, tr, br, bl] = radii.map((r) => Math.max(0, Math.min(r, Math.min(w, h) / 2))) as [
    number,
    number,
    number,
    number,
  ]
  const tlH = Math.min(w / 2, tl + Math.max(0, leftTangentExtra))
  const blH = Math.min(w / 2, bl + Math.max(0, leftTangentExtra))
  ctx.moveTo(x + tlH, y)
  ctx.lineTo(x + w - tr, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + tr)
  ctx.lineTo(x + w, y + h - br)
  ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h)
  ctx.lineTo(x + blH, y + h)
  // BL: vertical anchor at y+h-bl stays; bottom tangent at x+blH
  ctx.quadraticCurveTo(x, y + h, x, y + h - bl)
  ctx.lineTo(x, y + tl)
  // TL: vertical anchor at y+tl stays; top tangent at x+tlH
  ctx.quadraticCurveTo(x, y, x + tlH, y)
  ctx.closePath()
}

/** Spiky defense shield matching Battle rarity defense badge. */
function addSpikyShieldPath(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const cx = w / 2
  const cy = h * 0.46
  const spikes = 12
  const outerR = Math.min(w, h) * 0.48
  const innerR = outerR * 0.72
  for (let i = 0; i < spikes * 2; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / spikes
    const r = i % 2 === 0 ? outerR : innerR
    const px = cx + Math.cos(ang) * r
    const py = cy + Math.sin(ang) * r * 1.05
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
}

function BattleChromeLayer() {
  const {
    currentLayout,
    activeLayout,
    name,
    manaCost,
    typeLine,
    cardText,
    rulesTypography,
    battleDefense,
    collectorNumber,
    setCode,
    language,
    rarity,
    artist,
    copyright,
    colorIdentity,
    autoColorEnabled,
    manualColorKey,
    manualColorHex1,
    manualColorHex2,
    manualColorHex3,
    manualColorHex4,
    manualColorHex5,
    manualColorCount,
    showHologram,
  } = useCardStore(
    (s) => ({
      currentLayout: s.currentLayout,
      activeLayout: s.cardData.layout as LayoutId,
      name: s.cardData.name,
      manaCost: s.cardData.manaCost,
      typeLine: s.cardData.typeLine,
      cardText: s.cardData.cardText,
      rulesTypography: s.cardData.rulesTypography as CardFieldTypography,
      battleDefense: s.cardData.battleDefense,
      collectorNumber: s.cardData.collector_number,
      setCode: s.cardData.set,
      language: s.cardData.language,
      rarity: s.cardData.rarity,
      artist: s.cardData.artist,
      copyright: s.cardData.copyright,
      colorIdentity: s.cardData.colorIdentity,
      autoColorEnabled: s.autoColorEnabled,
      manualColorKey: s.manualColorKey,
      manualColorHex1: s.manualColorHex1,
      manualColorHex2: s.manualColorHex2,
      manualColorHex3: s.manualColorHex3,
      manualColorHex4: s.manualColorHex4,
      manualColorHex5: s.manualColorHex5,
      manualColorCount: s.manualColorCount,
      showHologram: s.showHologram,
    }),
    shallow,
  )

  const caps = getActiveLayoutCapabilitiesFromState({
    currentLayout,
    cardData: { layout: activeLayout },
  })
  const enabled = caps.supportsBattleChrome === true && layoutUsesBattleChrome(activeLayout)

  const effectiveRulesFontKey = useEffectiveTypographyFontKey(
    'rulesTypography',
    rulesTypography.fontKey,
  )
  const rulesFace = useMemo(
    () => resolveTypographyFontFace(effectiveRulesFontKey, rulesTypography.weight),
    [effectiveRulesFontKey, rulesTypography.weight],
  )
  const rulesInk = useMemo(
    () => resolveTypographyInkColor(rulesTypography, BATTLE_RULES_AUTO_INK),
    [rulesTypography],
  )
  const rulesFontSize = useMemo(() => {
    const fromPt = typographyPtToStagePx(rulesTypography.sizePt, BATTLE_RULES_PT_REF_PX)
    return Math.max(16, Math.min(56, Math.round(fromPt * 2) / 2))
  }, [rulesTypography.sizePt])

  const identity = useMemo(
    () =>
      resolveProceduralIdentity(
        typeLine,
        colorIdentity,
        name,
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
      typeLine,
      colorIdentity,
      name,
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

  const fill = identity.stroke
  const stroke = useMemo(() => darkenHex(fill, 0.35), [fill])
  const highlight = useMemo(() => lightenHex(fill, 0.28), [fill])
  const stage = getBattleStageSize()
  const trim = getBattleTrimRect()
  const nameR = getBattleNameRect()
  const manaR = getBattleManaRect()
  const transformR = getBattleTransformRect()
  const typeR = getBattleTypeRect()
  const rulesR = getBattleRulesRect()
  const defenseR = getBattleDefenseRect()
  const collectorR = getBattleCollectorRect()
  const artR = getBattleArtRect()
  const holoR = getBattleHologramRect()
  const cornerRadii = getBattleInnerBorderCornerRadii()
  const leftTangentExtra =
    getBattleLeftCornerHorizontalRadius() - cornerRadii[0]

  const defense = normalizeBattleDefense(battleDefense) || '0'
  const rulesBody = String(cardText ?? '').trim() || BATTLE_SIEGE_DEFAULT_REMINDER
  const typeLabel = String(typeLine ?? '').trim() || 'Battle — Siege'
  const manaLabel = String(manaCost ?? '').trim()
  const rarityLetter = String(rarity ?? 'C').slice(0, 1).toUpperCase()
  const collectorLine = [
    String(collectorNumber ?? '').trim() || '000',
    rarityLetter,
    `${String(setCode ?? 'SET').toUpperCase()} · ${String(language ?? 'EN').toUpperCase()}`,
    String(artist ?? '').trim().toUpperCase(),
    String(copyright ?? '').trim() || '™ & © Wizards of the Coast',
  ]
    .filter(Boolean)
    .join('  ·  ')

  if (!enabled) return null

  const nameTextLeft = transformR.x + transformR.width + 16
  const nameTextWidth = Math.max(40, manaR.x - nameTextLeft - 12)
  /** Battle chrome owns the left-frame stamp; TextIcons seal is disabled for battle. */
  const showStamp = showHologram !== false

  return (
    <Layer listening={false}>
      {/* Bleed + trim mat — left arcs start ~50 px later on top/bottom */}
      <Shape
        listening={false}
        sceneFunc={(ctx) => {
          const c = ctx as unknown as CanvasRenderingContext2D
          c.fillStyle = '#0a0a0a'
          c.fillRect(0, 0, stage.width, stage.height)
          c.beginPath()
          addRoundRectPath(c, trim.x, trim.y, trim.width, trim.height, cornerRadii, leftTangentExtra)
          c.fillStyle = fill
          c.fill()
          c.strokeStyle = stroke
          c.lineWidth = 4
          c.stroke()
          c.clearRect(artR.x, artR.y, artR.width, artR.height)
        }}
      />

      {/* Top nameplate pill */}
      <Shape
        x={nameR.x}
        y={nameR.y}
        listening={false}
        sceneFunc={(ctx) => {
          const c = ctx as unknown as CanvasRenderingContext2D
          c.beginPath()
          addPillPath(c, nameR.width, nameR.height)
          const g = c.createLinearGradient(0, 0, 0, nameR.height)
          g.addColorStop(0, highlight)
          g.addColorStop(0.45, fill)
          g.addColorStop(1, stroke)
          c.fillStyle = g
          c.fill()
          c.strokeStyle = stroke
          c.lineWidth = 2
          c.stroke()
        }}
      />

      {/* Transform mark — soft-grey disc, triangle vertices on the circle edge */}
      <Shape
        x={transformR.x}
        y={transformR.y}
        listening={false}
        sceneFunc={(ctx) => {
          const c = ctx as unknown as CanvasRenderingContext2D
          const w = transformR.width
          const h = transformR.height
          const cx = w / 2
          const cy = h / 2
          const r = Math.min(w, h) * 0.48
          c.beginPath()
          c.arc(cx, cy, r, 0, Math.PI * 2)
          c.fillStyle = '#1a1a1a'
          c.fill()
          c.strokeStyle = 'rgba(200,200,200,0.45)'
          c.lineWidth = 2
          c.stroke()
          // Soft grey disc (replaces prior near-white fill)
          c.beginPath()
          c.arc(cx, cy, r * 0.9, 0, Math.PI * 2)
          c.fillStyle = '#c4c4c4'
          c.fill()
          // Downward triangle — corners touch the circle edge
          const triR = r * 0.9
          c.beginPath()
          c.moveTo(cx, cy + triR)
          c.lineTo(cx - triR * (Math.sqrt(3) / 2), cy - triR * 0.5)
          c.lineTo(cx + triR * (Math.sqrt(3) / 2), cy - triR * 0.5)
          c.closePath()
          c.fillStyle = '#1a1a1a'
          c.fill()
        }}
      />

      <Text
        listening={false}
        x={nameTextLeft}
        y={nameR.y}
        width={nameTextWidth}
        height={nameR.height}
        text={String(name ?? '').trim() || 'Battle'}
        fontFamily="Beleren, Georgia, serif"
        fontStyle="bold"
        fontSize={44}
        fill="#f7f2e8"
        align="left"
        verticalAlign="middle"
        wrap="none"
        ellipsis
      />

      <Text
        listening={false}
        x={manaR.x}
        y={manaR.y}
        width={manaR.width}
        height={manaR.height}
        text={manaLabel || '{0}'}
        fontFamily="Plantin, Georgia, serif"
        fontSize={32}
        fill="#f7f2e8"
        align="right"
        verticalAlign="middle"
      />

      <Shape
        x={typeR.x}
        y={typeR.y}
        listening={false}
        sceneFunc={(ctx) => {
          const c = ctx as unknown as CanvasRenderingContext2D
          c.beginPath()
          addPillPath(c, typeR.width, typeR.height)
          const g = c.createLinearGradient(0, 0, 0, typeR.height)
          g.addColorStop(0, highlight)
          g.addColorStop(0.5, fill)
          g.addColorStop(1, stroke)
          c.fillStyle = g
          c.fill()
          c.strokeStyle = stroke
          c.lineWidth = 2
          c.stroke()
        }}
      />
      <Text
        listening={false}
        x={typeR.x + 28}
        y={typeR.y}
        width={typeR.width - 140}
        height={typeR.height}
        text={typeLabel}
        fontFamily="Beleren, Georgia, serif"
        fontStyle="bold"
        fontSize={34}
        fill="#f7f2e8"
        align="left"
        verticalAlign="middle"
        wrap="none"
        ellipsis
      />

      <Shape
        listening={false}
        sceneFunc={(ctx) => {
          const c = ctx as unknown as CanvasRenderingContext2D
          c.beginPath()
          const r = 18
          c.moveTo(rulesR.x + r, rulesR.y)
          c.arcTo(rulesR.x + rulesR.width, rulesR.y, rulesR.x + rulesR.width, rulesR.y + rulesR.height, r)
          c.arcTo(rulesR.x + rulesR.width, rulesR.y + rulesR.height, rulesR.x, rulesR.y + rulesR.height, r)
          c.arcTo(rulesR.x, rulesR.y + rulesR.height, rulesR.x, rulesR.y, r)
          c.arcTo(rulesR.x, rulesR.y, rulesR.x + rulesR.width, rulesR.y, r)
          c.closePath()
          c.fillStyle = '#f4ebe0'
          c.fill()
          c.strokeStyle = 'rgba(80,60,40,0.28)'
          c.lineWidth = 2
          c.stroke()
        }}
      />
      <Text
        listening={false}
        x={rulesR.x + 28}
        y={rulesR.y + 22}
        width={rulesR.width - 170}
        height={rulesR.height - 44}
        text={rulesBody}
        fontFamily={rulesFace.fontStack}
        fontStyle={rulesFace.fontStyle}
        fontSize={rulesFontSize}
        fill={rulesInk}
        align="left"
        verticalAlign="top"
        wrap="word"
      />

      {/* Spiky defense shield */}
      <Shape
        x={defenseR.x}
        y={defenseR.y}
        listening={false}
        sceneFunc={(ctx) => {
          const c = ctx as unknown as CanvasRenderingContext2D
          c.beginPath()
          addSpikyShieldPath(c, defenseR.width, defenseR.height)
          c.fillStyle = '#121212'
          c.fill()
          c.strokeStyle = '#f5f0e8'
          c.lineWidth = 2.5
          c.stroke()
        }}
      />
      <Text
        listening={false}
        x={defenseR.x}
        y={defenseR.y + 6}
        width={defenseR.width}
        height={defenseR.height - 12}
        text={defense}
        fontFamily="Beleren, Georgia, serif"
        fontStyle="bold"
        fontSize={46}
        fill="#ffffff"
        align="center"
        verticalAlign="middle"
      />

      {/* Hologram / security stamp — left end of inner border */}
      {showStamp ? (
        <Group listening={false}>
          <Ellipse
            x={holoR.x + holoR.width / 2}
            y={holoR.y + holoR.height / 2}
            radiusX={holoR.width / 2}
            radiusY={holoR.height / 2}
            fillLinearGradientStartPoint={{ x: -holoR.width / 2, y: -holoR.height / 2 }}
            fillLinearGradientEndPoint={{ x: holoR.width / 2, y: holoR.height / 2 }}
            fillLinearGradientColorStops={[0, '#F3F3F3', 0.45, '#C8C8C8', 1, '#9A9A9A']}
            stroke="#2a2a2a"
            strokeWidth={2}
            listening={false}
          />
          <Ellipse
            x={holoR.x + holoR.width / 2}
            y={holoR.y + holoR.height / 2}
            radiusX={holoR.width / 2 - 5}
            radiusY={holoR.height / 2 - 5}
            fillLinearGradientStartPoint={{ x: -holoR.width / 2, y: holoR.height / 2 }}
            fillLinearGradientEndPoint={{ x: holoR.width / 2, y: -holoR.height / 2 }}
            fillLinearGradientColorStops={[0, '#E8E8E8', 0.5, '#B0B0B0', 1, '#D8D8D8']}
            listening={false}
          />
        </Group>
      ) : null}

      <Group x={collectorR.x + collectorR.width} y={collectorR.y} rotation={90} listening={false}>
        <Text
          listening={false}
          x={0}
          y={0}
          width={collectorR.height}
          height={collectorR.width}
          text={collectorLine}
          fontFamily="Gill Sans, Arial, sans-serif"
          fontSize={20}
          fill="#f0ebe3"
          align="left"
          verticalAlign="middle"
          wrap="none"
          ellipsis
        />
      </Group>

      <Shape
        listening={false}
        sceneFunc={(ctx) => {
          const c = ctx as unknown as CanvasRenderingContext2D
          c.strokeStyle = 'rgba(0,0,0,0.55)'
          c.lineWidth = 3
          c.strokeRect(artR.x, artR.y, artR.width, artR.height)
        }}
      />
    </Layer>
  )
}

export default memo(BattleChromeLayer)
