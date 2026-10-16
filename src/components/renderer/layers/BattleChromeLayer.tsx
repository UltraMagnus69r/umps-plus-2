/**
 * Battle / Siege landscape chrome — name strip, art aperture, type pill,
 * tan rules (90° CW), defense shield, bottom collector strip.
 */
import { memo, useMemo } from 'react'
import { Group, Layer, Shape, Text } from 'react-konva'
import { shallow } from 'zustand/shallow'
import {
  BATTLE_SIEGE_DEFAULT_REMINDER,
  getBattleArtRect,
  getBattleCollectorRect,
  getBattleDefenseRect,
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
import { resolveProceduralIdentity, useCardStore } from '../../../store/useCardStore'

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

function addShieldPath(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const cx = w / 2
  ctx.moveTo(cx, 2)
  ctx.lineTo(w - 4, h * 0.22)
  ctx.lineTo(w - 6, h * 0.62)
  ctx.quadraticCurveTo(cx, h - 2, cx, h - 2)
  ctx.quadraticCurveTo(cx, h - 2, 6, h * 0.62)
  ctx.lineTo(4, h * 0.22)
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
  } = useCardStore(
    (s) => ({
      currentLayout: s.currentLayout,
      activeLayout: s.cardData.layout as LayoutId,
      name: s.cardData.name,
      manaCost: s.cardData.manaCost,
      typeLine: s.cardData.typeLine,
      cardText: s.cardData.cardText,
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
    }),
    shallow,
  )

  const caps = getActiveLayoutCapabilitiesFromState({
    currentLayout,
    cardData: { layout: activeLayout },
  })
  const enabled = caps.supportsBattleChrome === true && layoutUsesBattleChrome(activeLayout)

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
  ]
    .filter(Boolean)
    .join('  ')

  if (!enabled) return null

  return (
    <Layer listening={false}>
      {/* Bleed + trim mat */}
      <Shape
        listening={false}
        sceneFunc={(ctx) => {
          const c = ctx as unknown as CanvasRenderingContext2D
          c.fillStyle = '#0a0a0a'
          c.fillRect(0, 0, stage.width, stage.height)
          c.beginPath()
          const rr = 48
          c.moveTo(trim.x + rr, trim.y)
          c.arcTo(trim.x + trim.width, trim.y, trim.x + trim.width, trim.y + trim.height, rr)
          c.arcTo(trim.x + trim.width, trim.y + trim.height, trim.x, trim.y + trim.height, rr)
          c.arcTo(trim.x, trim.y + trim.height, trim.x, trim.y, rr)
          c.arcTo(trim.x, trim.y, trim.x + trim.width, trim.y, rr)
          c.closePath()
          c.fillStyle = fill
          c.fill()
          c.strokeStyle = stroke
          c.lineWidth = 4
          c.stroke()
          // Punch art aperture so ArtLayer shows through above this fill.
          c.clearRect(artR.x, artR.y, artR.width, artR.height)
        }}
      />

      {/* Left name pill */}
      <Shape
        x={nameR.x}
        y={nameR.y}
        listening={false}
        sceneFunc={(ctx) => {
          const c = ctx as unknown as CanvasRenderingContext2D
          c.beginPath()
          addPillPath(c, nameR.width, nameR.height)
          const g = c.createLinearGradient(0, 0, nameR.width, 0)
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

      {/* Name — 90° CCW (bottom → top) */}
      <Text
        listening={false}
        x={nameR.x + nameR.width / 2}
        y={nameR.y + nameR.height - 24}
        width={nameR.height - 48}
        height={nameR.width - 16}
        offsetX={0}
        offsetY={0}
        rotation={-90}
        text={String(name ?? '').trim() || 'Battle'}
        fontFamily="Beleren, Georgia, serif"
        fontStyle="bold"
        fontSize={42}
        fill="#f7f2e8"
        align="left"
        verticalAlign="middle"
        wrap="none"
        ellipsis
      />

      {/* Mana along top of name strip (horizontal chips) */}
      <Text
        listening={false}
        x={manaR.x}
        y={manaR.y + 8}
        width={manaR.width}
        height={manaR.height - 16}
        text={manaLabel || '{0}'}
        fontFamily="Plantin, Georgia, serif"
        fontSize={28}
        fill="#f7f2e8"
        align="center"
        verticalAlign="top"
      />

      {/* Transform / DFC mark */}
      <Shape
        x={transformR.x}
        y={transformR.y}
        listening={false}
        sceneFunc={(ctx) => {
          const c = ctx as unknown as CanvasRenderingContext2D
          const w = transformR.width
          const h = transformR.height
          c.beginPath()
          c.arc(w / 2, h / 2, Math.min(w, h) * 0.42, 0, Math.PI * 2)
          c.fillStyle = '#111'
          c.fill()
          c.strokeStyle = '#f0ebe3'
          c.lineWidth = 3
          c.stroke()
          c.beginPath()
          c.moveTo(w * 0.32, h * 0.28)
          c.lineTo(w * 0.72, h * 0.5)
          c.lineTo(w * 0.32, h * 0.72)
          c.closePath()
          c.fillStyle = '#f0ebe3'
          c.fill()
        }}
      />

      {/* Type pill (right column top) */}
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
        x={typeR.x + 16}
        y={typeR.y}
        width={typeR.width - 32}
        height={typeR.height}
        text={typeLabel}
        fontFamily="Beleren, Georgia, serif"
        fontStyle="bold"
        fontSize={32}
        fill="#f7f2e8"
        align="left"
        verticalAlign="middle"
        wrap="none"
        ellipsis
      />

      {/* Tan parchment rules — text rotated 90° CW so upright when card is turned */}
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
      <Group
        x={rulesR.x + rulesR.width - 14}
        y={rulesR.y + 16}
        rotation={90}
        listening={false}
      >
        <Text
          listening={false}
          x={0}
          y={0}
          width={rulesR.height - 32}
          height={rulesR.width - 28}
          text={rulesBody}
          fontFamily="Plantin, Georgia, serif"
          fontSize={34}
          fill="#1c1612"
          align="left"
          verticalAlign="top"
          wrap="word"
        />
      </Group>

      {/* Defense shield (top-right of landscape face) */}
      <Shape
        x={defenseR.x}
        y={defenseR.y}
        listening={false}
        sceneFunc={(ctx) => {
          const c = ctx as unknown as CanvasRenderingContext2D
          c.beginPath()
          addShieldPath(c, defenseR.width, defenseR.height)
          c.fillStyle = '#141414'
          c.fill()
          c.strokeStyle = '#f5f0e8'
          c.lineWidth = 3
          c.stroke()
        }}
      />
      <Text
        listening={false}
        x={defenseR.x}
        y={defenseR.y + 8}
        width={defenseR.width}
        height={defenseR.height - 16}
        text={defense}
        fontFamily="Beleren, Georgia, serif"
        fontStyle="bold"
        fontSize={48}
        fill="#ffffff"
        align="center"
        verticalAlign="middle"
      />

      {/* Collector along bottom long edge */}
      <Text
        listening={false}
        x={collectorR.x}
        y={collectorR.y}
        width={collectorR.width * 0.62}
        height={collectorR.height}
        text={collectorLine}
        fontFamily="Gill Sans, Arial, sans-serif"
        fontSize={22}
        fill="#f0ebe3"
        align="left"
        verticalAlign="middle"
      />
      <Text
        listening={false}
        x={collectorR.x + collectorR.width * 0.55}
        y={collectorR.y}
        width={collectorR.width * 0.45}
        height={collectorR.height}
        text={String(copyright ?? '').trim() || '™ & © Wizards of the Coast'}
        fontFamily="Gill Sans, Arial, sans-serif"
        fontSize={18}
        fill="#d8d2c8"
        align="right"
        verticalAlign="middle"
      />

{/* Inner black frame line around art aperture (chrome only; art is ArtLayer) */}
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
