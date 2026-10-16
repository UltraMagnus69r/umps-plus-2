/**
 * Procedural Saga / Class chrome: parchment column, vertical chapter/level banner
 * with top bezier + chevron tip, roman badges, and chapter dividers.
 */
import { memo, useMemo } from 'react'
import { Layer, Shape, Text } from 'react-konva'
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
  SAGA_DEFAULT_REMINDER,
} from '../../../authority/sagaClassLayoutAuthority'
import { isClassLayout, isSagaLayout, type LayoutId } from '../../../authority/layoutTaxonomy'
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

function parseChapterBodies(raw: string, isClass: boolean): { reminder: string; chapters: string[] } {
  const text = String(raw ?? '').trim()
  const defaultReminder = isClass ? CLASS_DEFAULT_REMINDER : SAGA_DEFAULT_REMINDER
  if (!text) {
    return {
      reminder: defaultReminder,
      chapters: isClass
        ? ['Level 1 abilities.', 'Level 2 abilities.', 'Level 3 abilities.']
        : ['Chapter ability.', 'Chapter ability.', 'Chapter ability.'],
    }
  }
  const blocks = text.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean)
  if (blocks.length === 1) {
    const lines = text.split('\n').map((s) => s.trim()).filter(Boolean)
    if (lines.length >= 2 && /^\(.*\)$/.test(lines[0])) {
      return { reminder: lines[0], chapters: lines.slice(1) }
    }
    return { reminder: defaultReminder, chapters: lines.length ? lines : [text] }
  }
  if (/^\(.*\)$/.test(blocks[0]) || blocks[0].startsWith('(')) {
    return { reminder: blocks[0], chapters: blocks.slice(1) }
  }
  return { reminder: defaultReminder, chapters: blocks }
}

function SagaClassChromeLayer() {
  const {
    currentLayout,
    activeLayout,
    cardText,
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
      cardText: s.cardData.cardText,
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
  // Class badges read metallic/gold on the level ribbon; Saga badges stay parchment.
  const badgeFill = classLayout ? lightenHex(bannerFill, 0.62) : '#e8dcc8'
  const badgeInk = classLayout ? darkenHex(bannerFill, 0.55) : '#1a1210'

  const parchment = getSagaClassParchmentRect()
  const banner = getSagaClassBannerRect()
  const reminderRect = getSagaClassReminderRect()
  const abilityCol = getSagaClassAbilityColumnRect()
  const badgeMetrics = getSagaClassBadgeMetrics()
  const parsed = useMemo(() => parseChapterBodies(cardText, classLayout), [cardText, classLayout])
  const bands = useMemo(
    () => getSagaClassChapterBandRects(Math.max(3, parsed.chapters.length)),
    [parsed.chapters.length],
  )

  if (!enabled || (!sagaLayout && !classLayout)) return null

  return (
    <Layer listening={false}>
      {/* Parchment text column */}
      <Shape
        listening={false}
        sceneFunc={(ctx) => {
          const c = ctx as unknown as CanvasRenderingContext2D
          c.beginPath()
          c.rect(parchment.x, parchment.y, parchment.width, parchment.height)
          c.fillStyle = '#f4ebe0'
          c.fill()
          // subtle inner edge toward art
          c.strokeStyle = 'rgba(80,60,40,0.22)'
          c.lineWidth = 2
          c.beginPath()
          c.moveTo(parchment.x + parchment.width - 1, parchment.y)
          c.lineTo(parchment.x + parchment.width - 1, parchment.y + parchment.height)
          c.stroke()
        }}
      />

      {/* Vertical banner */}
      <Shape
        x={banner.x}
        y={banner.y}
        listening={false}
        sceneFunc={(ctx) => {
          const c = ctx as unknown as CanvasRenderingContext2D
          c.beginPath()
          addSagaBannerPath(c, banner.width, banner.height)
          const grad = c.createLinearGradient(0, 0, banner.width, 0)
          grad.addColorStop(0, bannerHighlight)
          grad.addColorStop(0.45, bannerFill)
          grad.addColorStop(1, bannerStroke)
          c.fillStyle = grad
          c.fill()
          c.strokeStyle = bannerStroke
          c.lineWidth = 2
          c.stroke()
          // center spine
          c.beginPath()
          c.moveTo(banner.width * 0.5, banner.height * 0.2)
          c.lineTo(banner.width * 0.5, banner.height * 0.88)
          c.strokeStyle = 'rgba(0,0,0,0.28)'
          c.lineWidth = 2
          c.stroke()
        }}
      />

      {/* Chapter dividers */}
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

      {/* Roman badges */}
      {bands.slice(0, 3).map((band, i) => {
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
      {bands.slice(0, 3).map((band, i) => {
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

      {/* Reminder */}
      <Text
        listening={false}
        x={reminderRect.x + 8}
        y={reminderRect.y + 8}
        width={reminderRect.width - 16}
        height={reminderRect.height - 16}
        text={parsed.reminder}
        fontFamily="Georgia, 'Times New Roman', serif"
        fontStyle="italic"
        fontSize={28}
        fill="#2a2218"
        wrap="word"
        verticalAlign="top"
      />

      {/* Chapter / level bodies */}
      {bands.map((band, i) => {
        const body = parsed.chapters[i] ?? ''
        if (!body) return null
        return (
          <Text
            key={`ch-${i}`}
            listening={false}
            x={band.x + 6}
            y={band.y + 10}
            width={band.width - 12}
            height={band.height - 16}
            text={body}
            fontFamily="Georgia, 'Times New Roman', serif"
            fontSize={30}
            fill="#1c1612"
            wrap="word"
            verticalAlign="top"
          />
        )
      })}
    </Layer>
  )
}

export default memo(SagaClassChromeLayer)
