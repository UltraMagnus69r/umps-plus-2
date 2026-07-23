import { memo, useEffect, useState } from 'react'
import { Group, Image, Layer } from 'react-konva'
import { shallow } from 'zustand/shallow'
import { getStandardLayoutGeometry, SPELL_PRE_MODERN_SET_SYMBOL_SCALE, SPELL_PRE_MODERN_TYPE_LINE_STRIP_PADDING_PX, BEVEL_INSET } from '../../../authority/geometryAuthority'
import { getActiveLayoutCapabilitiesFromState, getActiveLayoutRegionsFromState, layoutRegionToStageRect } from '../../../authority/layoutRegistry'
import { resolveSetSymbolBoxPx } from '../../../authority/symbolAuthority'
import { getSetSymbolUrl } from '../../../services/scryfallService'
import { useCardStore } from '../../../store/useCardStore'
import { tintSvgXmlForSetSymbol } from '../../../utils/setSymbolSvg'
import {
  getSetSymbolRarityFill,
  normalizeRarity,
  SET_SYMBOL_RARITY_FILLS,
} from '../../../../rarityAuthority'
import type { LayoutId } from '../../../authority/layoutTaxonomy'
import { buildAscendantStageRects, ASCENDANT_EXPANSION_SYMBOL_FILL } from '../../../authority/ascendantLayoutAuthority'
import { buildTarotStageRects, TAROT_GEOMETRY } from '../../../authority/tarotLayoutAuthority'
import { TYPE_LINE_BASE_HEIGHT_RATIO } from './textIconsShared'

function setSymbolFillFromRarity(rarity: string | undefined): string {
  const r = normalizeRarity(rarity)
  if (r === 'common' || r === 'uncommon' || r === 'rare' || r === 'mythic') {
    return getSetSymbolRarityFill(r)
  }
  return SET_SYMBOL_RARITY_FILLS.common
}

function buildSolidSilhouette(source: CanvasImageSource, w: number, h: number, fill: string): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  if (!ctx) return c
  ctx.clearRect(0, 0, w, h)
  ctx.drawImage(source, 0, 0, w, h)
  ctx.globalCompositeOperation = 'source-in'
  ctx.fillStyle = fill
  ctx.fillRect(0, 0, w, h)
  ctx.globalCompositeOperation = 'source-over'
  return c
}

function drawDilatedMask(
  ctx: CanvasRenderingContext2D,
  mask: HTMLCanvasElement,
  x: number,
  y: number,
  radius: number,
) {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy > radius * radius) continue
      ctx.drawImage(mask, x + dx, y + dy)
    }
  }
}

async function withScryfallSetSymbolOutline(img: HTMLImageElement, fillHex: string): Promise<HTMLImageElement> {
  const w = Math.max(1, img.naturalWidth || img.width || 1)
  const h = Math.max(1, img.naturalHeight || img.height || 1)
  const whiteStrokePx = 6
  const blackStrokePx = 8 // 6px white + 2px outer black
  const pad = blackStrokePx + 1

  const tintedBase = buildSolidSilhouette(img, w, h, fillHex)

  const canvas = document.createElement('canvas')
  canvas.width = w + pad * 2
  canvas.height = h + pad * 2
  const ctx = canvas.getContext('2d')
  if (!ctx) return img

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  const whiteMask = buildSolidSilhouette(tintedBase, w, h, '#ffffff')
  const blackMask = buildSolidSilhouette(tintedBase, w, h, '#000000')
  const originX = pad
  const originY = pad

  // Draw outside-in so white remains visible between symbol and black ring.
  drawDilatedMask(ctx, blackMask, originX, originY, blackStrokePx)
  drawDilatedMask(ctx, whiteMask, originX, originY, whiteStrokePx)
  ctx.drawImage(tintedBase, originX, originY, w, h)

  const outlined = new window.Image()
  outlined.crossOrigin = 'anonymous'
  await new Promise<void>((resolve, reject) => {
    outlined.onload = () => resolve()
    outlined.onerror = () => reject(new Error('outlined set symbol decode failed'))
    outlined.src = canvas.toDataURL('image/png')
  })
  return outlined
}

/**
 * Module 5.2 — Scryfall CDN set symbol in the type-line slot (rarity-tinted).
 * Skipped when the user has uploaded a custom set icon (`setIconImage`).
 */
function SetSymbolLayer() {
  const { setCode, rarity, setIconImage, iconScale, currentLayout, activeLayout } = useCardStore(
    (s) => ({
      setCode: s.cardData.set,
      rarity: s.cardData.rarity,
      setIconImage: s.cardData.setIconImage,
      iconScale: s.cardData.iconScale,
      currentLayout: s.currentLayout,
      activeLayout: s.cardData.layout as LayoutId,
    }),
    shallow,
  )

  const layoutCaps = getActiveLayoutCapabilitiesFromState({
    currentLayout,
    cardData: { layout: activeLayout },
  })
  const supportsPreModernFaceLayout = layoutCaps.supportsPreModernFaceLayout
  const useAscendantLayout = layoutCaps.useAscendantLayout
  const useTarotLayout = layoutCaps.useTarotLayout

  const iconBoxS =
    resolveSetSymbolBoxPx(iconScale) *
    (supportsPreModernFaceLayout ? SPELL_PRE_MODERN_SET_SYMBOL_SCALE : 1)
  const setIconPad = getStandardLayoutGeometry().setIconPad
  const regions = getActiveLayoutRegionsFromState({
    currentLayout,
    cardData: { layout: activeLayout },
  })
  const preModernFaceText = layoutCaps.supportsPreModernFooterLayout
  const artRect = layoutRegionToStageRect(regions.art)
  const typeRect = layoutRegionToStageRect(regions.typeLine)
  const layout = getStandardLayoutGeometry()
  const typeCapEstimate = Math.max(1, Math.floor(layout.typeH * TYPE_LINE_BASE_HEIGHT_RATIO))
  const spellPreModernTypeTextY = artRect.y + artRect.height + BEVEL_INSET + SPELL_PRE_MODERN_TYPE_LINE_STRIP_PADDING_PX
  const ascendantExpansion = useAscendantLayout ? buildAscendantStageRects().expansionSymbol : null
  const tarotExpansion = useTarotLayout ? buildTarotStageRects().expansionSymbol : null
  const slotRightX = preModernFaceText ? artRect.x + artRect.width : typeRect.x + typeRect.width
  const slot = tarotExpansion
    ? (() => {
        const size = Math.max(8, Math.round(tarotExpansion.width * 0.55))
        return {
          x: TAROT_GEOMETRY.expansionCenter.x - size / 2,
          y: TAROT_GEOMETRY.expansionCenter.y - size / 2,
          size,
        }
      })()
    : ascendantExpansion
      ? (() => {
          const size = Math.max(8, Math.round(ascendantExpansion.width * ASCENDANT_EXPANSION_SYMBOL_FILL))
          return {
            x: ascendantExpansion.x + (ascendantExpansion.width - size) / 2,
            y: ascendantExpansion.y + (ascendantExpansion.height - size) / 2,
            size,
          }
        })()
      : {
          x: slotRightX - iconBoxS - setIconPad,
          y: supportsPreModernFaceLayout
            ? spellPreModernTypeTextY + (typeCapEstimate - iconBoxS) / 2
            : typeRect.y + (typeRect.height - iconBoxS) / 2,
          size: iconBoxS,
        }
  const fill = setSymbolFillFromRarity(rarity)

  const [symImg, setSymImg] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null

    const revoke = () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
        objectUrl = null
      }
    }

    if (setIconImage || !setCode?.trim()) {
      setSymImg(null)
      return () => {
        cancelled = true
        revoke()
      }
    }

    ;(async () => {
      try {
        const res = await fetch(getSetSymbolUrl(setCode))
        if (!res.ok) throw new Error('set symbol fetch failed')
        const xml = await res.text()
        const tinted = tintSvgXmlForSetSymbol(xml, fill)
        const blob = new Blob([tinted], { type: 'image/svg+xml;charset=utf-8' })
        objectUrl = URL.createObjectURL(blob)
        const im = new window.Image()
        im.crossOrigin = 'anonymous'
        await new Promise<void>((resolve, reject) => {
          im.onload = () => resolve()
          im.onerror = () => reject(new Error('set symbol image decode failed'))
          im.src = objectUrl!
        })
        if (cancelled) {
          revoke()
          return
        }
        const outlined = await withScryfallSetSymbolOutline(im, fill)
        if (cancelled) {
          revoke()
          return
        }
        setSymImg(outlined)
      } catch {
        if (!cancelled) setSymImg(null)
        revoke()
      }
    })()

    return () => {
      cancelled = true
      revoke()
      setSymImg(null)
    }
  }, [setCode, setIconImage, fill])

  if (!symImg) return null

  const nw = symImg.naturalWidth || 1
  const nh = symImg.naturalHeight || 1
  const scale = Math.min(slot.size / nw, slot.size / nh)
  const dw = nw * scale
  const dh = nh * scale

  return (
    <Layer listening={false} key={`scryfall-set-${iconBoxS}`}>
      <Group
        x={slot.x + (slot.size - dw) / 2}
        y={slot.y + (slot.size - dh) / 2}
        clipX={0}
        clipY={0}
        clipWidth={slot.size}
        clipHeight={slot.size}
        listening={false}
      >
        <Image
          image={symImg}
          x={0}
          y={0}
          width={dw}
          height={dh}
          listening={false}
          imageSmoothingEnabled={true}
        />
      </Group>
    </Layer>
  )
}

export default memo(SetSymbolLayer)
