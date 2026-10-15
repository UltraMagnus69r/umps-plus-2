import { memo, useEffect, useMemo, useState } from 'react'
import { Image, Layer } from 'react-konva'
import { shallow } from 'zustand/shallow'
import {
  resolveCrownDrawRect,
  resolveCrownNamePlateOuter,
  shouldRenderNameplateCrown,
} from '../../../authority/crownLayoutAuthority'
import type { LayoutId } from '../../../authority/layoutTaxonomy'
import { resolveCrownPublicUrl } from '../../../data/crownOptions'
import { useCardStore } from '../../../store/useCardStore'

/**
 * Showcase-style nameplate crown — above art / inner border / FrameLayer art bevel,
 * below NamePlateLayer.
 * Modern layout variant only (gated with crownAssetId).
 */
function CrownLayer() {
  const { crownAssetId, currentLayout, activeLayout } = useCardStore(
    (s) => ({
      crownAssetId: s.cardData.crownAssetId,
      currentLayout: s.currentLayout,
      activeLayout: s.cardData.layout as LayoutId,
    }),
    shallow,
  )

  const enabled = shouldRenderNameplateCrown({
    layout: activeLayout,
    currentLayout,
    crownAssetId,
  })
  const assetUrl = enabled ? resolveCrownPublicUrl(crownAssetId) : null
  const [crownImg, setCrownImg] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    if (!assetUrl) {
      setCrownImg(null)
      return
    }
    let cancelled = false
    const img = new window.Image()
    img.onload = () => {
      if (!cancelled) setCrownImg(img)
    }
    img.onerror = () => {
      if (!cancelled) setCrownImg(null)
    }
    img.src = assetUrl
    return () => {
      cancelled = true
    }
  }, [assetUrl])

  const plate = useMemo(
    () =>
      enabled
        ? resolveCrownNamePlateOuter({ layout: activeLayout, currentLayout })
        : null,
    [enabled, activeLayout, currentLayout],
  )

  const draw = useMemo(() => {
    if (!plate || !crownImg) return null
    return resolveCrownDrawRect(plate, crownImg.naturalWidth || 1, crownImg.naturalHeight || 1)
  }, [plate, crownImg])

  if (!assetUrl || !crownImg || !draw) return null

  return (
    <Layer listening={false}>
      <Image
        image={crownImg}
        x={draw.x}
        y={draw.y}
        width={draw.w}
        height={draw.h}
        listening={false}
        imageSmoothingEnabled={true}
      />
    </Layer>
  )
}

export default memo(CrownLayer)
