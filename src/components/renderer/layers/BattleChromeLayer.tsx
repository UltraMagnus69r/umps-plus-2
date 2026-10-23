/**
 * Battle / Siege portrait side-column chrome —
 * left name plate (vertical glyphs, mana top, transform bottom), center art aperture,
 * mid-right type plate, far-right rules column, defense + 4/4 at TR of rules,
 * bottom horizontal collector. MotM landscape stack is not the Studio default.
 */
import { Fragment, memo, useCallback, useMemo, useRef, useState } from 'react'
import { Ellipse, Group, Image, Layer, Shape, Text } from 'react-konva'
import { shallow } from 'zustand/shallow'
import {
  BATTLE_SIEGE_DEFAULT_REMINDER,
  formatBattleBackFacePT,
  getBattleArtRect,
  getBattleBackFacePTRect,
  getBattleCollectorRect,
  getBattleDefenseRect,
  getBattleHologramRect,
  getBattleInnerBorderCornerRadii,
  getBattleManaRect,
  getBattleNameRect,
  getBattleRulesRect,
  getBattleStageSize,
  getBattleTransformRect,
  getBattleTrimCornerRadii,
  getBattleTrimRect,
  getBattleTypeRect,
  layoutUsesBattleChrome,
  normalizeBattleDefense,
} from '../../../authority/battleLayoutAuthority'
import { createBoxPanelInnerFillStyle } from '../../../authority/boxPanelFillAuthority'
import { DEFAULT_PANEL_BOX_HEX } from '../../../authority/boxColorUiAuthority'
import {
  effectivePanelBackground,
  isPanelTextureBackground,
  resolvePanelBackgroundContrastHex,
} from '../../../authority/panelBackgroundAuthority'
import { usePanelBackgroundImage } from '../../../hooks/usePanelBackgroundImage'
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

/** sizePt 12 ≈ prior hardcoded sizes on the MotM face; reused as pt→px refs. */
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

/**
 * Default cream hex → outline plate.
 * Classic texture/solid PNG keys and any other hex are opt-in fills.
 */
function isBattleOutlinePlate(stored: string): boolean {
  const t = typeof stored === 'string' ? stored.trim() : ''
  if (!t) return true
  if (isPanelTextureBackground(t)) return false
  return t.toLowerCase() === DEFAULT_PANEL_BOX_HEX.toLowerCase()
}

/** Name/type plate — rounded ends (works for tall vertical pillars). */
const BATTLE_PLATE_END_RADIUS_PX = 25

function addPlatePath(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const r = Math.min(BATTLE_PLATE_END_RADIUS_PX, w / 2, h / 2)
  ctx.moveTo(r, 0)
  ctx.arcTo(w, 0, w, h, r)
  ctx.arcTo(w, h, 0, h, r)
  ctx.arcTo(0, h, 0, 0, r)
  ctx.arcTo(0, 0, w, 0, r)
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
    power,
    toughness,
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
    panelFrostEnabled,
    panelFrostOpacity,
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
      power: s.cardData.power,
      toughness: s.cardData.toughness,
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
      panelFrostEnabled: s.cardData.panelFrostEnabled,
      panelFrostOpacity: s.cardData.panelFrostOpacity,
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
  const nameBoxBgImage = usePanelBackgroundImage(effectiveNameBox)
  const typeBoxBgImage = usePanelBackgroundImage(effectiveTypeBox)
  const rulesBoxBgImage = usePanelBackgroundImage(effectiveRulesBox)
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
  const backFacePTR = getBattleBackFacePTRect()
  const collectorR = getBattleCollectorRect()
  const artR = getBattleArtRect()
  const holoR = getBattleHologramRect()
  const trimRadii = getBattleTrimCornerRadii()
  const artRadii = getBattleInnerBorderCornerRadii()

  const defense = normalizeBattleDefense(battleDefense) || '0'
  const backFacePT = formatBattleBackFacePT(power, toughness)
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

  const nameManaIconSize = Math.max(28, Math.min(56, Math.round(Math.min(manaR.width, manaR.height) * 0.72)))
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

  /**
   * Rules laid out in rotated space (−90°): local +x runs bottom→top along the column.
   * Clear defense / 4/4 at the top of the column (end of local +x).
   */
  const rulesPadAcross = 28
  const rulesPadBottom = 36
  const rulesPadTop = Math.max(
    48,
    Math.round(defenseR.y + defenseR.height - rulesR.y + 16),
  )
  const rulesLayoutW = Math.max(8, rulesR.height - rulesPadBottom - rulesPadTop)
  const rulesLayoutH = Math.max(8, rulesR.width - rulesPadAcross * 2)
  const rulesLineHeight = Math.round(rulesFontSize * 1.2)
  const rulesItems = useMemo(
    () =>
      layoutRichTextItems({
        chunks: resolveChunks(rulesBody),
        originX: 0,
        originY: 0,
        maxWidth: rulesLayoutW,
        maxHeight: rulesLayoutH,
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
      rulesLayoutW,
      rulesLayoutH,
      rulesFontSize,
      rulesLineHeight,
      rulesFace.fontStack,
      rulesFace.fontStyle,
      measureTextWidth,
    ],
  )

  if (!enabled) return null

  /**
   * Vertical name run: first letters just above transform (bottom), extending
   * upward (−90°) to just below mana.
   */
  const nameTextBottom = transformR.y + transformR.height + 12
  const nameTextTop = manaR.y + manaR.height + 10
  const nameTextRun = Math.max(40, nameTextBottom - nameTextTop)
  const nameTextCross = Math.max(24, nameR.width - 16)
  /** Vertical type run below set-symbol band, upward along the pillar. */
  const typeTextBottom = typeR.y + typeR.height - 36
  const typeTextTop = typeR.y + 110
  const typeTextRun = Math.max(40, typeTextBottom - typeTextTop)
  const typeTextCross = Math.max(24, typeR.width - 16)

  const showStamp = showHologram !== false

  const paintPlate = (
    c: CanvasRenderingContext2D,
    w: number,
    h: number,
    outline: boolean,
    boxKey: string,
    fillHex: string,
    bgImage: HTMLImageElement | null,
  ) => {
    c.beginPath()
    addPlatePath(c, w, h)
    if (outline) {
      c.fillStyle = hexToRgba(fill, 0.38)
      c.fill()
      c.strokeStyle = plateBorder
      c.lineWidth = 2.5
      c.stroke()
    } else if (bgImage && isPanelTextureBackground(boxKey)) {
      c.fillStyle = createBoxPanelInnerFillStyle(
        c,
        w,
        h,
        boxKey,
        false,
        'vertical',
        100,
        false,
        bgImage,
        panelFrostEnabled,
        panelFrostOpacity,
      )
      c.fill()
      c.strokeStyle = darkenHex(fillHex, 0.35)
      c.lineWidth = 2
      c.stroke()
    } else {
      const frosted = createBoxPanelInnerFillStyle(
        c,
        w,
        h,
        boxKey,
        false,
        'vertical',
        100,
        false,
        null,
        panelFrostEnabled,
        panelFrostOpacity,
      )
      if (typeof frosted === 'string' && panelFrostEnabled && panelFrostOpacity > 0) {
        c.fillStyle = frosted
      } else {
        const g = c.createLinearGradient(0, 0, w, 0)
        g.addColorStop(0, lightenHex(fillHex, 0.22))
        g.addColorStop(0.45, fillHex)
        g.addColorStop(1, darkenHex(fillHex, 0.28))
        c.fillStyle = g
      }
      c.fill()
      c.strokeStyle = darkenHex(fillHex, 0.35)
      c.lineWidth = 2
      c.stroke()
    }
  }

  return (
    <Layer listening={false}>
      {/*
        Bleed + outer border. Art = center column only; black fills name/type/rules/collector
        zones under chrome plates.
      */}
      <Shape
        listening={false}
        sceneFunc={(ctx) => {
          const c = ctx as unknown as CanvasRenderingContext2D
          c.beginPath()
          c.rect(0, 0, stage.width, stage.height)
          addBattleRoundRectPath(c, trim.x, trim.y, trim.width, trim.height, trimRadii, 0)
          c.fillStyle = '#0a0a0a'
          c.fill('evenodd')
          // Trim minus art aperture → black mat (collector bottom + column beds).
          c.beginPath()
          addBattleRoundRectPath(c, trim.x, trim.y, trim.width, trim.height, trimRadii, 0)
          addBattleArtInnerClipPathForRect(c, artR.x, artR.y, artR.width, artR.height)
          c.fillStyle = '#0a0a0a'
          c.fill('evenodd')
        }}
      />

      {/* Left name pillar */}
      <Shape
        x={nameR.x}
        y={nameR.y}
        listening={false}
        sceneFunc={(ctx) => {
          paintPlate(
            ctx as unknown as CanvasRenderingContext2D,
            nameR.width,
            nameR.height,
            nameOutline,
            effectiveNameBox,
            nameFillHex,
            nameBoxBgImage,
          )
        }}
      />

      {/* Mana — upright at top of name strip */}
      {manaCostRender.chunks.length > 0 ? (
        <Group
          listening={false}
          x={Math.round(manaR.x + (manaR.width - manaCostRender.totalWidth) / 2)}
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

      {/* Name glyphs — 90° CCW, read bottom→top along strip */}
      <Group
        x={nameR.x + (nameR.width - nameTextCross) / 2}
        y={nameTextBottom}
        rotation={-90}
        listening={false}
      >
        <Text
          listening={false}
          x={0}
          y={0}
          width={nameTextRun}
          height={nameTextCross}
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
      </Group>

      {/* Transform mark — bottom of name strip */}
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

      {/* Type pillar */}
      <Shape
        x={typeR.x}
        y={typeR.y}
        listening={false}
        sceneFunc={(ctx) => {
          paintPlate(
            ctx as unknown as CanvasRenderingContext2D,
            typeR.width,
            typeR.height,
            typeOutline,
            effectiveTypeBox,
            typeFillHex,
            typeBoxBgImage,
          )
        }}
      />
      <Group
        x={typeR.x + (typeR.width - typeTextCross) / 2}
        y={typeTextBottom}
        rotation={-90}
        listening={false}
      >
        <Text
          listening={false}
          x={0}
          y={0}
          width={typeTextRun}
          height={typeTextCross}
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
      </Group>

      {/* Rules column */}
      <Shape
        listening={false}
        sceneFunc={(ctx) => {
          const c = ctx as unknown as CanvasRenderingContext2D
          c.beginPath()
          addBattleRoundRectPath(c, rulesR.x, rulesR.y, rulesR.width, rulesR.height, artRadii, 0)
          if (rulesOutline) {
            c.fillStyle = 'rgba(244, 235, 224, 0.52)'
            c.fill()
            c.strokeStyle = plateBorder
            c.lineWidth = 2.5
            c.stroke()
          } else {
            const fillStyle = createBoxPanelInnerFillStyle(
              c,
              rulesR.width,
              rulesR.height,
              effectiveRulesBox,
              false,
              'vertical',
              100,
              false,
              rulesBoxBgImage,
              panelFrostEnabled,
              panelFrostOpacity,
            )
            if (
              typeof fillStyle !== 'string' &&
              typeof (fillStyle as CanvasPattern).setTransform === 'function'
            ) {
              try {
                ;(fillStyle as CanvasPattern).setTransform(
                  new DOMMatrix().translateSelf(rulesR.x, rulesR.y),
                )
              } catch {
                /* older engines */
              }
            }
            c.fillStyle = fillStyle
            c.fill()
            c.strokeStyle = darkenHex(rulesFillHex, 0.35)
            c.lineWidth = 2
            c.stroke()
          }
        }}
      />

      {/* Rules text — vertical (bottom→top), MotM-play cousin of upright landscape rules */}
      <Group
        x={rulesR.x + rulesPadAcross}
        y={rulesR.y + rulesR.height - rulesPadBottom}
        rotation={-90}
        listening={false}
      >
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
      </Group>

      {/* Back-face P/T — upright near TR of rules */}
      {backFacePT ? (
        <Text
          listening={false}
          x={backFacePTR.x}
          y={backFacePTR.y}
          width={backFacePTR.width}
          height={backFacePTR.height}
          text={backFacePT}
          fontFamily="Beleren, Georgia, serif"
          fontStyle="bold"
          fontSize={Math.max(18, Math.min(36, Math.round(backFacePTR.width * 0.55)))}
          fill={rulesInk}
          align="center"
          verticalAlign="middle"
        />
      ) : null}

      {/* Defense shield — top-right of rules */}
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
        y={defenseR.y + 4}
        width={defenseR.width}
        height={defenseR.height - 10}
        text={defense}
        fontFamily="Beleren, Georgia, serif"
        fontStyle="bold"
        fontSize={Math.max(28, Math.min(48, Math.round(defenseR.height * 0.42)))}
        fill="#ffffff"
        align="center"
        verticalAlign="middle"
      />

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

      {/* Collector — bottom horizontal */}
      <Text
        listening={false}
        x={collectorR.x + 8}
        y={collectorR.y}
        width={collectorR.width - 16}
        height={collectorR.height}
        text={collectorLine}
        fontFamily="Gill Sans, Arial, sans-serif"
        fontSize={Math.max(16, Math.min(22, Math.round(collectorR.height * 0.28)))}
        fill="#f0ebe3"
        align="left"
        verticalAlign="middle"
        wrap="none"
        ellipsis
      />
    </Layer>
  )
}

export default memo(BattleChromeLayer)
