/**
 * Space Gothic ornate frame chrome — static PNG drawn in trim (1500×2100).
 * Mounted above ArtLayer so chrome sits over art edges; art shows through alpha=0 voids.
 */
import { memo, useEffect, useState } from 'react'
import { Image, Layer } from 'react-konva'
import { shallow } from 'zustand/shallow'
import { isSpaceGothicLayout } from '../../../authority/layoutTaxonomy'
import { SPACE_GOTHIC_FRAME_TRIM_RECT } from '../../../authority/spaceGothicLayoutAuthority'
import { resolveSpaceGothicFramePublicUrl } from '../../../data/spaceGothicFrameOptions'
import { useCardStore } from '../../../store/useCardStore'
import type { LayoutId } from '../../../authority/layoutTaxonomy'

function SpaceGothicFrameLayer() {
  const activeLayout = useCardStore((s) => s.cardData.layout as LayoutId, shallow)
  const enabled = isSpaceGothicLayout(activeLayout)
  const variant = enabled ? activeLayout.variant : 'with-pt'
  const src = enabled ? resolveSpaceGothicFramePublicUrl(variant) : null

  const [img, setImg] = useState<HTMLImageElement | null>(null)
  useEffect(() => {
    if (!src) {
      setImg(null)
      return
    }
    const el = new window.Image()
    el.crossOrigin = 'anonymous'
    el.onload = () => setImg(el)
    el.onerror = () => setImg(null)
    el.src = src
  }, [src])

  if (!enabled || !img) return null

  const { x, y, width, height } = SPACE_GOTHIC_FRAME_TRIM_RECT

  return (
    <Layer listening={false}>
      <Image image={img} x={x} y={y} width={width} height={height} listening={false} />
    </Layer>
  )
}

export default memo(SpaceGothicFrameLayer)
