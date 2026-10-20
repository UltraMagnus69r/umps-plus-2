import { memo, useEffect, useMemo, useState } from 'react'
import { Image, Layer } from 'react-konva'
import { shallow } from 'zustand/shallow'
import {
  resolveCrownDrawRect,
  resolveCrownNamePlateOuter,
  shouldRenderNameplateCrown,
} from '../../../authority/crownLayoutAuthority'
import type { LayoutId } from '../../../authority/layoutTaxonomy'
import type { NameplateBoxShape } from '../../../authority/nameplateShapeAuthority'
import {
  normalizeHexColor,
  resolveCrownPublicUrl,
  resolveCrownShadowPublicUrl,
} from '../../../data/crownOptions'
import { useCardStore } from '../../../store/useCardStore'

function parseHexRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  const v = parseInt(m[1], 16)
  return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 }
}

/**
 * Multiply-tint a near-white crown fill toward `tintHex`.
 * Gold-base assets made multiply a no-op vs default `#efc263` — white luminance fixes that.
 */
function tintCrownFill(source: HTMLImageElement, tintHex: string): HTMLCanvasElement {
  const w = Math.max(1, source.naturalWidth || source.width)
  const h = Math.max(1, source.naturalHeight || source.height)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return canvas
  ctx.drawImage(source, 0, 0, w, h)
  const rgb = parseHexRgb(tintHex)
  if (!rgb) return canvas
  const imageData = ctx.getImageData(0, 0, w, h)
  const { data } = imageData
  const { r: tr, g: tg, b: tb } = rgb
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]
    if (!a) continue
    data[i] = (data[i] * tr) / 255
    data[i + 1] = (data[i + 1] * tg) / 255
    data[i + 2] = (data[i + 2] * tb) / 255
  }
  ctx.putImageData(imageData, 0, 0)
  return canvas
}

/**
 * Recolor shadow overlay: bright pixels stay light (stroke); dark pixels → shadow color.
 * Soft low-alpha body pixels are boosted so the toggle is visibly different.
 */
function tintCrownShadowOverlay(source: HTMLImageElement, shadowHex: string): HTMLCanvasElement {
  const w = Math.max(1, source.naturalWidth || source.width)
  const h = Math.max(1, source.naturalHeight || source.height)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return canvas
  ctx.drawImage(source, 0, 0, w, h)
  const rgb = parseHexRgb(shadowHex)
  if (!rgb) return canvas
  const imageData = ctx.getImageData(0, 0, w, h)
  const { data } = imageData
  const { r: sr, g: sg, b: sb } = rgb
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]
    if (!a) continue
    const lum = (data[i] + data[i + 1] + data[i + 2]) / 3
    if (lum >= 160) {
      data[i] = 255
      data[i + 1] = 255
      data[i + 2] = 255
      data[i + 3] = Math.min(255, Math.max(a, 160))
    } else {
      data[i] = sr
      data[i + 1] = sg
      data[i + 2] = sb
      // Ensure soft authored alphas still read as a shadow on tinted fill.
      data[i + 3] = Math.min(255, Math.max(a, Math.round(a * 1.35 + 24)))
    }
  }
  ctx.putImageData(imageData, 0, 0)
  return canvas
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`failed to load ${url}`))
    img.src = url
  })
}

/**
 * Showcase-style nameplate crown — above art / inner border / FrameLayer art bevel,
 * below NamePlateLayer.
 * Modern layout variant only (gated with crownAssetId).
 */
function CrownLayer() {
  const {
    crownAssetId,
    crownColor,
    crownShadowEnabled,
    crownShadowColor,
    currentLayout,
    activeLayout,
    bezierPlateEnabled,
    nameBarShape,
  } = useCardStore(
    (s) => ({
      crownAssetId: s.cardData.crownAssetId,
      crownColor: s.cardData.crownColor,
      crownShadowEnabled: s.cardData.crownShadowEnabled,
      crownShadowColor: s.cardData.crownShadowColor,
      currentLayout: s.currentLayout,
      activeLayout: s.cardData.layout as LayoutId,
      bezierPlateEnabled: s.cardData.bezierPlateEnabled,
      nameBarShape: s.cardData.nameBarShape as NameplateBoxShape,
    }),
    shallow,
  )

  const enabled = shouldRenderNameplateCrown({
    layout: activeLayout,
    currentLayout,
    crownAssetId,
  })
  const assetUrl = enabled ? resolveCrownPublicUrl(crownAssetId) : null
  const shadowUrl =
    enabled && crownShadowEnabled ? resolveCrownShadowPublicUrl(crownAssetId) : null

  const tintHex = normalizeHexColor(crownColor, '#efc263')
  const shadowHex = normalizeHexColor(crownShadowColor, '#14100c')

  const [fillSrc, setFillSrc] = useState<HTMLImageElement | null>(null)
  const [shadowSrc, setShadowSrc] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    if (!assetUrl) {
      setFillSrc(null)
      return
    }
    let cancelled = false
    loadImage(assetUrl)
      .then((img) => {
        if (!cancelled) setFillSrc(img)
      })
      .catch(() => {
        if (!cancelled) setFillSrc(null)
      })
    return () => {
      cancelled = true
    }
  }, [assetUrl])

  useEffect(() => {
    if (!shadowUrl) {
      setShadowSrc(null)
      return
    }
    let cancelled = false
    loadImage(shadowUrl)
      .then((img) => {
        if (!cancelled) setShadowSrc(img)
      })
      .catch(() => {
        if (!cancelled) setShadowSrc(null)
      })
    return () => {
      cancelled = true
    }
  }, [shadowUrl])

  const tintedFill = useMemo(() => {
    if (!fillSrc) return null
    return tintCrownFill(fillSrc, tintHex)
  }, [fillSrc, tintHex])

  const tintedShadow = useMemo(() => {
    if (!shadowSrc || !crownShadowEnabled) return null
    return tintCrownShadowOverlay(shadowSrc, shadowHex)
  }, [shadowSrc, crownShadowEnabled, shadowHex])

  const plate = useMemo(
    () =>
      enabled
        ? resolveCrownNamePlateOuter({
            layout: activeLayout,
            currentLayout,
            bezierPlateEnabled: !!bezierPlateEnabled,
            nameBarShape,
          })
        : null,
    [enabled, activeLayout, currentLayout, bezierPlateEnabled, nameBarShape],
  )

  const draw = useMemo(() => {
    if (!plate || !fillSrc) return null
    return resolveCrownDrawRect(plate, fillSrc.naturalWidth || 1, fillSrc.naturalHeight || 1)
  }, [plate, fillSrc])

  if (!assetUrl || !tintedFill || !draw) return null

  // Soft drop offset in stage px — keeps shadow readable under/around the fill.
  const dropY = crownShadowEnabled ? Math.max(2, Math.round(draw.h * 0.012)) : 0
  const dropX = crownShadowEnabled ? Math.max(1, Math.round(draw.w * 0.002)) : 0

  return (
    <Layer listening={false}>
      {tintedShadow ? (
        <Image
          key={`crown-shadow-${crownAssetId}-${shadowHex}`}
          image={tintedShadow}
          x={draw.x + dropX}
          y={draw.y + dropY}
          width={draw.w}
          height={draw.h}
          listening={false}
          imageSmoothingEnabled={true}
          opacity={0.92}
        />
      ) : null}
      <Image
        key={`crown-fill-${crownAssetId}-${tintHex}`}
        image={tintedFill}
        x={draw.x}
        y={draw.y}
        width={draw.w}
        height={draw.h}
        listening={false}
        imageSmoothingEnabled={true}
      />
      {tintedShadow ? (
        <Image
          key={`crown-stroke-${crownAssetId}-${shadowHex}`}
          image={tintedShadow}
          x={draw.x}
          y={draw.y}
          width={draw.w}
          height={draw.h}
          listening={false}
          imageSmoothingEnabled={true}
          opacity={0.55}
        />
      ) : null}
    </Layer>
  )
}

export default memo(CrownLayer)
