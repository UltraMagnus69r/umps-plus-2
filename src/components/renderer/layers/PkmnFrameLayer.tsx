/**
 * PKMN pre-made full-card frame — static PNG, no recolor / shade.
 * Mounted above ArtLayer so chrome sits over art edges; art shows through alpha=0 window.
 */
import { memo, useEffect, useState } from 'react'
import { Image, Layer } from 'react-konva'
import { shallow } from 'zustand/shallow'
import { isPkmnLayout } from '../../../authority/layoutTaxonomy'
import { PKMN_FRAME_STAGE_SIZE } from '../../../authority/pkmnLayoutAuthority'
import { resolvePkmnFramePublicUrl } from '../../../data/pkmnFrameOptions'
import { useCardStore } from '../../../store/useCardStore'
import type { LayoutId } from '../../../authority/layoutTaxonomy'

function PkmnFrameLayer() {
  const activeLayout = useCardStore((s) => s.cardData.layout as LayoutId, shallow)
  const enabled = isPkmnLayout(activeLayout)
  const variant = enabled ? activeLayout.variant : 'white'
  const src = enabled ? resolvePkmnFramePublicUrl(variant) : null

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

  return (
    <Layer listening={false}>
      <Image
        image={img}
        x={0}
        y={0}
        width={PKMN_FRAME_STAGE_SIZE.width}
        height={PKMN_FRAME_STAGE_SIZE.height}
        listening={false}
      />
    </Layer>
  )
}

export default memo(PkmnFrameLayer)
