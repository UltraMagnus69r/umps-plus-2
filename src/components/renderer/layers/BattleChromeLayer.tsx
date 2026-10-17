/**
 * Battle / Siege landscape stack chrome —
 * top nameplate (name + Classic/Legacy mana pips), art aperture, type line,
 * upright rules (inline mana), defense shield, left-edge collector, hologram.
 * MotM default: bordered name/type/rules plates (stroke + translucent interior);
 * solid panel fill is opt-in via Advanced → Name/Type/Rules box colors.
 * Name / type / rules typography follow the same studio FontMenu controls as other layouts.
 */
import { Fragment, memo, useCallback, useMemo, useRef, useState } from 'react'
import { Ellipse, Group, Image, Layer, Shape, Text } from 'react-konva'
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
import { DEFAULT_PANEL_BOX_HEX } from '../../../authority/boxColorUiAuthority'
import {
  effectivePanelBackground,
  resolvePanelBackgroundContrastHex,
} from '../../../authority/panelBackgroundAuthority'
import { addBattleArtInnerClipPathForRect, addBattleRoundRectPath } from './battleArtPath'
import { getActiveLayoutCapabilitiesFromState } from '../../../authority/layoutRegistry'
import type { LayoutId } from '../../../authority/layoutTaxonomy'
import { SYMBOL_BASELINE_OFFSET } from '../../../authority/symbolAuthority'
import {
  resolveTypographyFontFace,
  resolveTypographyInkColor,
  typographyPtToStagePx,
  type CardFieldTypography,
} from '../../../authority/typographyAuthority'
import { useEffectiveTypographyFontKey } from '../../../hooks/useEffectiveTypographyFontKey'
import { resolveProceduralIdentity, useCardStore } from '../../../store/useCardStore'
import { normalizeMana } from '../../../utils/manaNormalization'
import {
  layoutRichTextItems,
  MANA_COST_ICON_GAP,
  measureTextWidth as measureTextWidthFn,
  resolveChunks,
  scaleManaPipDisplaySizePx,
} from './textIconsShared'

/** sizePt 12 ≈ prior hardcoded sizes on the landscape face. */
const BATTLE_NAME_PT_REF_PX = 44
const BATTLE_TYPE_PT_REF_PX = 32
const BATTLE_RULES_PT_REF_PX = 34
/** Auto ink on plates / parchment when typography color is not manual. */
const BATTLE_PLATE_AUTO_INK = '#f7f2e8'
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

function hexToRgba(hex: string, alpha: number): string {
  const n = hex.replace(/^#/, '')
  if (n.length !== 6) return `rgba(0,0,0,${alpha})`
  const r = parseInt(n.slice(0, 2), 16)
  const g = parseInt(n.slice(2, 4), 16)
  const b = parseInt(n.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, alpha))})`
}

/** Default cream box color → MotM outline plate; any other Advanced color = opt-in solid fill. */
function isBattleOutlinePlate(stored: string): boolean {
  return resolvePanelBackgroundContrastHex(stored).toLowerCase() === DEFAULT_PANEL_BOX_HEX.toLowerCase()
}

/** MotM-like name/type plate — soft corners, not a full pill. */
function addPlatePath(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const r = Math.min(w, h) * 0.28
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
    nameTypography,
    typeTypography,
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
    nameBoxColor,
    typeLineBoxColor,
    rulesTextBoxColor,
    panelBackgroundPreview,
  } = useCardStore(
    (s) => ({
      currentLayout: s.currentLayout,
      activeLayout: s.cardData.layout as LayoutId,
      name: s.cardData.name,
      manaCost: s.cardData.manaCost,
      typeLine: s.cardData.typeLine,
      cardText: s.cardData.cardText,
      nameTypography: s.cardData.nameTypography as CardFieldTypography,
      typeTypography: s.cardData.typeTypography as CardFieldTypography,
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
      nameBoxColor: s.cardData.nameBoxColor,
      typeLineBoxColor: s.cardData.typeLineBoxColor,
      rulesTextBoxColor: s.cardData.rulesTextBoxColor,
      panelBackgroundPreview: s.panelBackgroundPreview,
    }),
    shallow,
  )

  const caps = getActiveLayoutCapabilitiesFromState({
    currentLayout,
    cardData: { layout: activeLayout },
  })
  const enabled = caps.supportsBattleChrome === true && layoutUsesBattleChrome(activeLayout)

  const effectiveNameFontKey = useEffectiveTypographyFontKey(
    'nameTypography',
    nameTypography.fontKey,
  )
  const effectiveTypeFontKey = useEffectiveTypographyFontKey(
    'typeTypography',
    typeTypography.fontKey,
  )
  const effectiveRulesFontKey = useEffectiveTypographyFontKey(
    'rulesTypography',
    rulesTypography.fontKey,
  )
  const nameFace = useMemo(
    () => resolveTypographyFontFace(effectiveNameFontKey, nameTypography.weight),
    [effectiveNameFontKey, nameTypography.weight],
  )
  const typeFace = useMemo(
    () => resolveTypographyFontFace(effectiveTypeFontKey, typeTypography.weight),
    [effectiveTypeFontKey, typeTypography.weight],
  )
  const rulesFace = useMemo(
    () => resolveTypographyFontFace(effectiveRulesFontKey, rulesTypography.weight),
    [effectiveRulesFontKey, rulesTypography.weight],
  )
  const nameInk = useMemo(
    () => resolveTypographyInkColor(nameTypography, BATTLE_PLATE_AUTO_INK),
    [nameTypography],
  )
  const typeInk = useMemo(
    () => resolveTypographyInkColor(typeTypography, BATTLE_PLATE_AUTO_INK),
    [typeTypography],
  )
  const rulesInk = useMemo(
    () => resolveTypographyInkColor(rulesTypography, BATTLE_RULES_AUTO_INK),
    [rulesTypography],
  )
  const nameFontSize = useMemo(() => {
    const fromPt = typographyPtToStagePx(nameTypography.sizePt, BATTLE_NAME_PT_REF_PX)
    return Math.max(22, Math.min(72, Math.round(fromPt * 2) / 2))
  }, [nameTypography.sizePt])
  const typeFontSize = useMemo(() => {
    const fromPt = typographyPtToStagePx(typeTypography.sizePt, BATTLE_TYPE_PT_REF_PX)
    return Math.max(18, Math.min(56, Math.round(fromPt * 2) / 2))
  }, [typeTypography.sizePt])
  const rulesFontSize = useMemo(() => {
    const fromPt = typographyPtToStagePx(rulesTypography.sizePt, BATTLE_RULES_PT_REF_PX)
    return Math.max(16, Math.min(56, Math.round(fromPt * 2) / 2))
  }, [rulesTypography.sizePt])

  const manaImageCache = useRef<Map<string, HTMLImageElement>>(new Map())
  const [, setManaImageTick] = useState(0)
  const getManaImage = useCallback((key: string, dataUrl: string) => {
    const cacheKey = `${key}::${dataUrl}`
    const existing = manaImageCache.current.get(cacheKey)
    if (existing) return existing
    const img = new window.Image()
    img.onload = () => setManaImageTick((t) => t + 1)
    img.onerror = () => setManaImageTick((t) => t + 1)
    img.src = dataUrl
    manaImageCache.current.set(cacheKey, img)
    return img
  }, [])

  const measureCtxRef = useRef<CanvasRenderingContext2D | null>(null)
  const measureTextWidth = useCallback(
    (text: string, fontFamily: string, fontStyle: string, fontSize: number) => {
      if (!measureCtxRef.current) {
        const c = document.createElement('canvas')
        measureCtxRef.current = c.getContext('2d')
      }
      return measureTextWidthFn(measureCtxRef.current, text, fontFamily, fontStyle, fontSize)
    },
    [],
  )

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
  /** MotM light plate border (thin light/identity stroke around translucent boxes). */
  const plateBorder = useMemo(() => lightenHex(fill, 0.55), [fill])
  const effectiveNameBox = effectivePanelBackground('nameBoxColor', nameBoxColor, panelBackgroundPreview)
  const effectiveTypeBox = effectivePanelBackground(
    'typeLineBoxColor',
    typeLineBoxColor,
    panelBackgroundPreview,
  )
  const effectiveRulesBox = effectivePanelBackground(
    'rulesTextBoxColor',
    rulesTextBoxColor,
    panelBackgroundPreview,
  )
  const nameOutline = isBattleOutlinePlate(effectiveNameBox)
  const typeOutline = isBattleOutlinePlate(effectiveTypeBox)
  const rulesOutline = isBattleOutlinePlate(effectiveRulesBox)
  const nameFillHex = resolvePanelBackgroundContrastHex(effectiveNameBox)
  const typeFillHex = resolvePanelBackgroundContrastHex(effectiveTypeBox)
  const rulesFillHex = resolvePanelBackgroundContrastHex(effectiveRulesBox)
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
  const nameLabel = String(name ?? '').trim() || 'Battle'
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

  const nameManaIconSize = Math.max(28, Math.min(64, Math.round(manaR.height * 0.82)))
  const manaCostRender = useMemo(() => {
    const chunks = resolveChunks(normalizeMana(manaCost ?? '') || '{0}')
    let totalWidth = 0
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i]
      if (c.kind === 'icon') totalWidth += scaleManaPipDisplaySizePx(nameManaIconSize, c.symbolSet)
      else totalWidth += measureTextWidth(c.value, nameFace.fontStack, nameFace.fontStyle, nameManaIconSize)
      if (i < chunks.length - 1) totalWidth += MANA_COST_ICON_GAP
    }
    return { chunks, totalWidth }
  }, [manaCost, nameManaIconSize, measureTextWidth, nameFace.fontStack, nameFace.fontStyle])

  const rulesPadX = 28
  const rulesPadY = 22
  const rulesInnerW = Math.max(8, rulesR.width - rulesPadX - 170)
  const rulesInnerH = Math.max(8, rulesR.height - rulesPadY * 2)
  const rulesLineHeight = Math.round(rulesFontSize * 1.2)
  const rulesItems = useMemo(
    () =>
      layoutRichTextItems({
        chunks: resolveChunks(rulesBody),
        originX: rulesR.x + rulesPadX,
        originY: rulesR.y + rulesPadY,
        maxWidth: rulesInnerW,
        maxHeight: rulesInnerH,
        fontSize: rulesFontSize,
        lineHeightPx: rulesLineHeight,
        iconSize: rulesFontSize,
        fontFamily: rulesFace.fontStack,
        fontStyle: rulesFace.fontStyle,
        measure: measureTextWidth,
        iconBaselineOffset: SYMBOL_BASELINE_OFFSET,
      }),
    [
      rulesBody,
      rulesR.x,
      rulesR.y,
      rulesInnerW,
      rulesInnerH,
      rulesFontSize,
      rulesLineHeight,
      rulesFace.fontStack,
      rulesFace.fontStyle,
      measureTextWidth,
    ],
  )

  if (!enabled) return null

  const nameTextLeft = transformR.x + transformR.width + 16
  const nameTextWidth = Math.max(
    40,
    manaR.x - nameTextLeft - 12 - (manaCostRender.totalWidth > 0 ? manaCostRender.totalWidth + 12 : 0),
  )
  /** Battle chrome owns the left-frame stamp; TextIcons seal is disabled for battle. */
  const showStamp = showHologram !== false

  return (
    <Layer listening={false}>
      {/*
        Bleed + MotM outer border chrome.
        Art cover-fills the shared aperture (left-inset for black collector strip;
        flush top/right/bottom). No identity-green mat on the left. Plates/rules draw on top.
      */}
      <Shape
        listening={false}
        sceneFunc={(ctx) => {
          const c = ctx as unknown as CanvasRenderingContext2D
          // Bleed: stage rect minus trim (black outside the card).
          c.beginPath()
          c.rect(0, 0, stage.width, stage.height)
          addBattleRoundRectPath(c, trim.x, trim.y, trim.width, trim.height, cornerRadii, leftTangentExtra)
          c.fillStyle = '#0a0a0a'
          c.fill('evenodd')
          // Left collector strip (= trim − art aperture): black outer border, not identity green.
          c.beginPath()
          addBattleRoundRectPath(c, trim.x, trim.y, trim.width, trim.height, cornerRadii, leftTangentExtra)
          addBattleArtInnerClipPathForRect(c, artR.x, artR.y, artR.width, artR.height)
          c.fillStyle = '#0a0a0a'
          c.fill('evenodd')
          c.beginPath()
          addBattleRoundRectPath(c, trim.x, trim.y, trim.width, trim.height, cornerRadii, leftTangentExtra)
          c.strokeStyle = stroke
          c.lineWidth = 4
          c.stroke()
        }}
      />

      {/* Top nameplate — MotM bordered box (outline default; solid fill opt-in). */}
      <Shape
        x={nameR.x}
        y={nameR.y}
        listening={false}
        sceneFunc={(ctx) => {
          const c = ctx as unknown as CanvasRenderingContext2D
          c.beginPath()
          addPlatePath(c, nameR.width, nameR.height)
          if (nameOutline) {
            c.fillStyle = hexToRgba(fill, 0.38)
            c.fill()
            c.strokeStyle = plateBorder
            c.lineWidth = 2.5
            c.stroke()
          } else {
            const g = c.createLinearGradient(0, 0, 0, nameR.height)
            g.addColorStop(0, lightenHex(nameFillHex, 0.22))
            g.addColorStop(0.45, nameFillHex)
            g.addColorStop(1, darkenHex(nameFillHex, 0.28))
            c.fillStyle = g
            c.fill()
            c.strokeStyle = darkenHex(nameFillHex, 0.35)
            c.lineWidth = 2
            c.stroke()
          }
        }}
      />

      {/* Transform mark — black circle, white down triangle, 2px grey stroke (MotM) */}
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
          const r = Math.min(w, h) * 0.46
          c.beginPath()
          c.arc(cx, cy, r, 0, Math.PI * 2)
          c.fillStyle = '#111111'
          c.fill()
          c.strokeStyle = '#9a9a9a'
          c.lineWidth = 2
          c.stroke()
          // White downward triangle (stack: points into the card / art)
          const triR = r * 0.72
          c.beginPath()
          c.moveTo(cx, cy + triR)
          c.lineTo(cx - triR * (Math.sqrt(3) / 2), cy - triR * 0.5)
          c.lineTo(cx + triR * (Math.sqrt(3) / 2), cy - triR * 0.5)
          c.closePath()
          c.fillStyle = '#ffffff'
          c.fill()
        }}
      />

      <Text
        listening={false}
        x={nameTextLeft}
        y={nameR.y}
        width={nameTextWidth}
        height={nameR.height}
        text={nameLabel}
        fontFamily={nameFace.fontStack}
        fontStyle={nameFace.fontStyle}
        fontSize={nameFontSize}
        fill={nameInk}
        align="left"
        verticalAlign="middle"
        wrap="none"
        ellipsis
      />

      {manaCostRender.chunks.length > 0 ? (
        <Group
          listening={false}
          x={Math.round(manaR.x + manaR.width - manaCostRender.totalWidth)}
          y={Math.round(manaR.y + (manaR.height - nameManaIconSize) / 2)}
        >
          {(() => {
            let dx = 0
            const lastIdx = manaCostRender.chunks.length - 1
            return manaCostRender.chunks.map((c, i) => {
              if (c.kind === 'icon') {
                const iconSize = scaleManaPipDisplaySizePx(nameManaIconSize, c.symbolSet)
                const yOffset = (nameManaIconSize - iconSize) / 2
                const img = getManaImage(c.key, c.dataUrl)
                const useFallback = !img || (img.complete && img.naturalWidth === 0)
                const node = useFallback ? (
                  <Text
                    key={`battle-mc-fb-${i}-${c.key}`}
                    listening={false}
                    text={c.token}
                    x={dx}
                    y={yOffset}
                    width={iconSize}
                    height={iconSize}
                    fontFamily={nameFace.fontStack}
                    fontStyle={nameFace.fontStyle}
                    fontSize={Math.max(12, iconSize * 0.55)}
                    fill={nameInk}
                    verticalAlign="middle"
                  />
                ) : (
                  <Fragment key={`battle-mc-icon-${i}-${c.key}`}>
                    <Image
                      image={img}
                      x={dx}
                      y={yOffset}
                      width={iconSize}
                      height={iconSize}
                      listening={false}
                    />
                  </Fragment>
                )
                dx += iconSize
                if (i < lastIdx) dx += MANA_COST_ICON_GAP
                return node
              }
              const wText = measureTextWidth(c.value, nameFace.fontStack, nameFace.fontStyle, nameManaIconSize)
              const node = (
                <Text
                  key={`battle-mc-tx-${i}`}
                  listening={false}
                  text={c.value}
                  x={dx}
                  y={0}
                  width={wText}
                  height={nameManaIconSize}
                  fontFamily={nameFace.fontStack}
                  fontStyle={nameFace.fontStyle}
                  fontSize={nameManaIconSize}
                  fill={nameInk}
                  verticalAlign="middle"
                />
              )
              dx += wText
              if (i < lastIdx) dx += MANA_COST_ICON_GAP
              return node
            })
          })()}
        </Group>
      ) : null}

      <Shape
        x={typeR.x}
        y={typeR.y}
        listening={false}
        sceneFunc={(ctx) => {
          const c = ctx as unknown as CanvasRenderingContext2D
          c.beginPath()
          addPlatePath(c, typeR.width, typeR.height)
          if (typeOutline) {
            c.fillStyle = hexToRgba(fill, 0.38)
            c.fill()
            c.strokeStyle = plateBorder
            c.lineWidth = 2.5
            c.stroke()
          } else {
            const g = c.createLinearGradient(0, 0, 0, typeR.height)
            g.addColorStop(0, lightenHex(typeFillHex, 0.22))
            g.addColorStop(0.5, typeFillHex)
            g.addColorStop(1, darkenHex(typeFillHex, 0.28))
            c.fillStyle = g
            c.fill()
            c.strokeStyle = darkenHex(typeFillHex, 0.35)
            c.lineWidth = 2
            c.stroke()
          }
        }}
      />
      <Text
        listening={false}
        x={typeR.x + 28}
        y={typeR.y}
        width={typeR.width - 140}
        height={typeR.height}
        text={typeLabel}
        fontFamily={typeFace.fontStack}
        fontStyle={typeFace.fontStyle}
        fontSize={typeFontSize}
        fill={typeInk}
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
          if (rulesOutline) {
            // MotM parchment: translucent interior + light identity stroke border.
            c.fillStyle = 'rgba(244, 235, 224, 0.52)'
            c.fill()
            c.strokeStyle = plateBorder
            c.lineWidth = 2.5
            c.stroke()
          } else {
            c.fillStyle = rulesFillHex
            c.fill()
            c.strokeStyle = darkenHex(rulesFillHex, 0.35)
            c.lineWidth = 2
            c.stroke()
          }
        }}
      />
      {rulesItems.map((it, idx) =>
        it.kind === 'icon'
          ? (() => {
              const img = getManaImage(it.key, it.dataUrl)
              const useFallback = !img || (img.complete && img.naturalWidth === 0)
              return useFallback ? (
                <Text
                  key={`battle-rules-fb-${idx}-${it.key}`}
                  listening={false}
                  text={it.rawToken}
                  x={it.x}
                  y={it.y}
                  width={it.size}
                  height={it.size}
                  fontFamily={rulesFace.fontStack}
                  fontStyle={rulesFace.fontStyle}
                  fontSize={rulesFontSize}
                  fill={rulesInk}
                />
              ) : (
                <Image
                  key={`battle-rules-icon-${idx}-${it.key}`}
                  image={img}
                  x={it.x}
                  y={it.y}
                  width={it.size}
                  height={it.size}
                  listening={false}
                />
              )
            })()
          : (
            <Text
              key={`battle-rules-tx-${idx}`}
              listening={false}
              text={it.text}
              x={it.x}
              y={it.y}
              width={it.width}
              height={rulesLineHeight}
              fontFamily={rulesFace.fontStack}
              fontStyle={rulesFace.fontStyle}
              fontSize={rulesFontSize}
              fill={rulesInk}
            />
          ),
      )}

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

      {/* Left black border strip holds collector; art fills the aperture under these plates. */}
    </Layer>
  )
}

export default memo(BattleChromeLayer)
