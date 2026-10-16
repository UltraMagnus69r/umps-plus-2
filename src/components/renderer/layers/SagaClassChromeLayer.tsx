/**
 * Procedural Saga / Class / Saga Creature chrome:
 * parchment column, vertical chapter/level banner, roman badges, dividers.
 * Saga/Class stage copy comes from CardData.sagaReminderText + sagaStageTexts.
 * Stage bodies support inline mana braces ({W}, Classic/Legacy) like rules text.
 */
import { Fragment, memo, useCallback, useMemo, useRef, useState } from 'react'
import { Image, Layer, Shape, Text } from 'react-konva'
import { shallow } from 'zustand/shallow'
import {
  getActiveLayoutCapabilitiesFromState,
} from '../../../authority/layoutRegistry'
import {
  addSagaBannerPath,
  CLASS_DEFAULT_REMINDER,
  getSagaClassAbilityColumnRect,
  getSagaClassBadgeMetrics,
  getSagaClassBannerRect,
  getSagaClassChapterBandRects,
  getSagaClassParchmentRect,
  getSagaClassReminderRect,
  romanNumeral,
} from '../../../authority/sagaClassLayoutAuthority'
import {
  defaultSagaCreatureReminderForCount,
  defaultSagaReminderForCount,
  normalizeSagaChapterCount,
  normalizeSagaStageTexts,
} from '../../../authority/sagaClassStageAuthority'
import {
  isClassLayout,
  isSagaCreatureLayout,
  isSagaLayout,
  type LayoutId,
} from '../../../authority/layoutTaxonomy'
import { SYMBOL_BASELINE_OFFSET } from '../../../authority/symbolAuthority'
import { resolveProceduralIdentity, useCardStore } from '../../../store/useCardStore'
import {
  layoutRichTextItems,
  measureTextWidth as measureTextWidthFn,
  resolveChunks,
  type RichItem,
} from './textIconsShared'

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

const STAGE_FONT_FAMILY = "Georgia, 'Times New Roman', serif"
const STAGE_FONT_STYLE = 'normal'
const STAGE_INK = '#1c1612'

function SagaClassChromeLayer() {
  const {
    currentLayout,
    activeLayout,
    sagaReminderText,
    sagaChapterCount,
    sagaStageTexts,
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
  } = useCardStore(
    (s) => ({
      currentLayout: s.currentLayout,
      activeLayout: s.cardData.layout as LayoutId,
      sagaReminderText: s.cardData.sagaReminderText,
      sagaChapterCount: s.cardData.sagaChapterCount,
      sagaStageTexts: s.cardData.sagaStageTexts,
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
    }),
    shallow,
  )

  const caps = getActiveLayoutCapabilitiesFromState({
    currentLayout,
    cardData: { layout: activeLayout },
  })
  const enabled = caps.supportsSagaClassChrome === true
  const classLayout = isClassLayout(activeLayout)
  const sagaLayout = isSagaLayout(activeLayout)
  const creatureLayout = isSagaCreatureLayout(activeLayout)

  const identity = useMemo(
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

  const bannerFill = identity.stroke
  const bannerStroke = useMemo(() => darkenHex(bannerFill, 0.35), [bannerFill])
  const bannerHighlight = useMemo(() => lightenHex(bannerFill, 0.25), [bannerFill])
  const badgeFill = classLayout ? lightenHex(bannerFill, 0.62) : '#e8dcc8'
  const badgeInk = classLayout ? darkenHex(bannerFill, 0.55) : '#1a1210'

  const parchment = getSagaClassParchmentRect(activeLayout)
  const banner = getSagaClassBannerRect(activeLayout)
  const reminderRect = getSagaClassReminderRect(activeLayout)
  const abilityCol = getSagaClassAbilityColumnRect(activeLayout)
  const badgeMetrics = getSagaClassBadgeMetrics(activeLayout)

  const chapterCount = normalizeSagaChapterCount(sagaChapterCount)
  const defaultReminder = classLayout
    ? CLASS_DEFAULT_REMINDER
    : creatureLayout
      ? defaultSagaCreatureReminderForCount(chapterCount)
      : defaultSagaReminderForCount(chapterCount)
  const reminderText = String(sagaReminderText ?? '').trim() || defaultReminder

  const stages = useMemo(() => {
    const normalized = normalizeSagaStageTexts(sagaStageTexts, chapterCount)
    return normalized.map((t, i) => {
      const trimmed = t.trim()
      if (trimmed) return trimmed
      return classLayout ? `Level ${i + 1} abilities.` : 'Chapter ability.'
    })
  }, [sagaStageTexts, chapterCount, classLayout])

  const bands = useMemo(
    () => getSagaClassChapterBandRects(chapterCount, activeLayout),
    [chapterCount, activeLayout],
  )
  const badgeCount = chapterCount
  const reminderFontSize = creatureLayout ? 26 : 36
  const stageFontSize = creatureLayout ? 26 : 30
  const stageLineHeight = Math.round(stageFontSize * 1.2)

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

  const stageRenders = useMemo((): RichItem[][] => {
    return bands.map((band, i) => {
      const body = stages[i] ?? ''
      if (!body) return []
      const padX = 6
      const padY = 10
      const chunks = resolveChunks(body)
      return layoutRichTextItems({
        chunks,
        originX: band.x + padX,
        originY: band.y + padY,
        maxWidth: band.width - padX * 2,
        maxHeight: band.height - padY - 8,
        fontSize: stageFontSize,
        lineHeightPx: stageLineHeight,
        iconSize: stageFontSize,
        fontFamily: STAGE_FONT_FAMILY,
        fontStyle: STAGE_FONT_STYLE,
        measure: measureTextWidth,
        iconBaselineOffset: SYMBOL_BASELINE_OFFSET,
      })
    })
  }, [bands, stages, stageFontSize, stageLineHeight, measureTextWidth])

  if (!enabled || (!sagaLayout && !classLayout && !creatureLayout)) return null

  return (
    <Layer listening={false}>
      {creatureLayout ? (
        <Shape
          listening={false}
          sceneFunc={(ctx) => {
            const c = ctx as unknown as CanvasRenderingContext2D
            c.beginPath()
            c.rect(reminderRect.x, reminderRect.y, reminderRect.width, reminderRect.height)
            c.fillStyle = '#f4ebe0'
            c.fill()
            c.strokeStyle = 'rgba(80,60,40,0.28)'
            c.lineWidth = 2
            c.strokeRect(reminderRect.x + 1, reminderRect.y + 1, reminderRect.width - 2, reminderRect.height - 2)
          }}
        />
      ) : null}

      <Shape
        listening={false}
        sceneFunc={(ctx) => {
          const c = ctx as unknown as CanvasRenderingContext2D
          c.beginPath()
          c.rect(parchment.x, parchment.y, parchment.width, parchment.height)
          c.fillStyle = '#f4ebe0'
          c.fill()
          c.strokeStyle = 'rgba(80,60,40,0.22)'
          c.lineWidth = 2
          c.beginPath()
          const edgeX = classLayout ? parchment.x + 1 : parchment.x + parchment.width - 1
          c.moveTo(edgeX, parchment.y)
          c.lineTo(edgeX, parchment.y + parchment.height)
          c.stroke()
        }}
      />

      <Shape
        x={banner.x}
        y={banner.y}
        listening={false}
        sceneFunc={(ctx) => {
          const c = ctx as unknown as CanvasRenderingContext2D
          c.beginPath()
          addSagaBannerPath(c, banner.width, banner.height, {
            flatTop: creatureLayout,
            mirrorX: classLayout,
          })
          const grad = c.createLinearGradient(0, 0, banner.width, 0)
          if (classLayout) {
            grad.addColorStop(0, bannerStroke)
            grad.addColorStop(0.55, bannerFill)
            grad.addColorStop(1, bannerHighlight)
          } else {
            grad.addColorStop(0, bannerHighlight)
            grad.addColorStop(0.45, bannerFill)
            grad.addColorStop(1, bannerStroke)
          }
          c.fillStyle = grad
          c.fill()
          c.strokeStyle = bannerStroke
          c.lineWidth = 2
          c.stroke()
          c.beginPath()
          c.moveTo(banner.width * 0.5, banner.height * 0.12)
          c.lineTo(banner.width * 0.5, banner.height * 0.88)
          c.strokeStyle = 'rgba(0,0,0,0.28)'
          c.lineWidth = 2
          c.stroke()
        }}
      />

      {bands.slice(1).map((band, i) => (
        <Shape
          key={`div-${i}`}
          listening={false}
          sceneFunc={(ctx) => {
            const c = ctx as unknown as CanvasRenderingContext2D
            c.beginPath()
            c.moveTo(abilityCol.x, band.y)
            c.lineTo(abilityCol.x + abilityCol.width, band.y)
            c.strokeStyle = 'rgba(40,30,20,0.35)'
            c.lineWidth = 2
            c.stroke()
          }}
        />
      ))}

      {bands.slice(0, badgeCount).map((band, i) => {
        const bw = badgeMetrics.width
        const bh = badgeMetrics.height
        const bx = badgeMetrics.x
        const by = Math.round(band.y + (band.height - bh) / 2)
        return (
          <Shape
            key={`badge-${i}`}
            x={bx}
            y={by}
            listening={false}
            sceneFunc={(ctx) => {
              const c = ctx as unknown as CanvasRenderingContext2D
              const cx = bw / 2
              const cy = bh / 2
              const rx = bw * 0.46
              const ry = bh * 0.42
              c.beginPath()
              for (let k = 0; k < 6; k++) {
                const a = (Math.PI / 3) * k - Math.PI / 2
                const x = cx + rx * Math.cos(a)
                const y = cy + ry * Math.sin(a)
                if (k === 0) c.moveTo(x, y)
                else c.lineTo(x, y)
              }
              c.closePath()
              c.fillStyle = badgeFill
              c.fill()
              c.strokeStyle = bannerStroke
              c.lineWidth = 2
              c.stroke()
            }}
          />
        )
      })}
      {bands.slice(0, badgeCount).map((band, i) => {
        const bw = badgeMetrics.width
        const bh = badgeMetrics.height
        const bx = badgeMetrics.x
        const by = Math.round(band.y + (band.height - bh) / 2)
        return (
          <Text
            key={`badge-num-${i}`}
            listening={false}
            x={bx}
            y={by}
            width={bw}
            height={bh}
            text={romanNumeral(i + 1)}
            align="center"
            verticalAlign="middle"
            fontFamily="Georgia, 'Times New Roman', serif"
            fontStyle="bold"
            fontSize={Math.round(bh * 0.42)}
            fill={badgeInk}
          />
        )
      })}

      <Text
        listening={false}
        x={reminderRect.x + 10}
        y={reminderRect.y + (creatureLayout ? 10 : 6)}
        width={reminderRect.width - 20}
        height={reminderRect.height - (creatureLayout ? 16 : 12)}
        text={reminderText}
        fontFamily="Georgia, 'Times New Roman', serif"
        fontStyle="italic"
        fontSize={reminderFontSize}
        fill="#2a2218"
        wrap="word"
        verticalAlign="middle"
      />

      {stageRenders.map((items, bandIdx) =>
        items.map((it, idx) =>
          it.kind === 'icon'
            ? (() => {
                const img = getManaImage(it.key, it.dataUrl)
                const useFallback = !img || (img.complete && img.naturalWidth === 0)
                return useFallback ? (
                  <Text
                    key={`ch-${bandIdx}-fb-${idx}-${it.key}`}
                    listening={false}
                    text={it.rawToken}
                    x={it.x}
                    y={it.y}
                    width={it.size}
                    height={it.size}
                    fontFamily={STAGE_FONT_FAMILY}
                    fontStyle={STAGE_FONT_STYLE}
                    fontSize={stageFontSize}
                    fill={STAGE_INK}
                  />
                ) : (
                  <Fragment key={`ch-${bandIdx}-icon-${idx}-${it.key}`}>
                    <Image
                      image={img}
                      x={it.x}
                      y={it.y}
                      width={it.size}
                      height={it.size}
                      listening={false}
                    />
                  </Fragment>
                )
              })()
            : (
              <Text
                key={`ch-${bandIdx}-tx-${idx}`}
                listening={false}
                text={it.text}
                x={it.x}
                y={it.y}
                width={it.width}
                height={stageLineHeight}
                fontFamily={STAGE_FONT_FAMILY}
                fontStyle={STAGE_FONT_STYLE}
                fontSize={stageFontSize}
                fill={STAGE_INK}
              />
            ),
        ),
      )}
    </Layer>
  )
}

export default memo(SagaClassChromeLayer)
