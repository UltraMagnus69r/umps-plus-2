import { memo, useEffect, useMemo, useState } from 'react'
import { Image, Layer } from 'react-konva'
import { shallow } from 'zustand/shallow'
import { DIMENSIONS } from '../../../authority/geometryAuthority'
import { useCardStore } from '../../../store/useCardStore'

/**
 * Module 5.4 — Ghost Overlay Engine.
 * Editor-only reference overlay (click-through), fit-to-stage contain, top visual aid.
 */
function ReferenceLayer() {
  const { referenceImage, referenceOpacity, referenceOffsetX, referenceOffsetY } = useCardStore(
    (s) => ({
      referenceImage: s.cardData.referenceImage,
      referenceOpacity: s.cardData.referenceOpacity,
      referenceOffsetX: s.cardData.referenceOffsetX,
      referenceOffsetY: s.cardData.referenceOffsetY,
    }),
    shallow,
  )

  const [img, setImg] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    const src = String(referenceImage ?? '').trim()
    if (!src) {
      setImg(null)
      return
    }
    const im = new window.Image()
    if (!src.startsWith('data:')) im.crossOrigin = 'anonymous'
    im.onload = () => setImg(im)
    im.onerror = () => setImg(null)
    im.src = src
  }, [referenceImage])

  const fit = useMemo(() => {
    if (!img) return null
    const stageW = DIMENSIONS.FULL_BLEED.width
    const stageH = DIMENSIONS.FULL_BLEED.height
    const nw = img.naturalWidth || 1
    const nh = img.naturalHeight || 1
    const scale = Math.min(stageW / nw, stageH / nh)
    const w = nw * scale
    const h = nh * scale
    return {
      x: (stageW - w) / 2 + referenceOffsetX,
      y: (stageH - h) / 2 + referenceOffsetY,
      width: w,
      height: h,
    }
  }, [img, referenceOffsetX, referenceOffsetY])

  if (!img || !fit) return null

  return (
    <Layer name="reference-overlay" listening={false}>
      <Image
        image={img}
        x={fit.x}
        y={fit.y}
        width={fit.width}
        height={fit.height}
        opacity={referenceOpacity}
        listening={false}
        imageSmoothingEnabled={true}
      />
    </Layer>
  )
}

export default memo(ReferenceLayer)
