import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { Group, Image, Layer, Rect } from 'react-konva'
import { shallow } from 'zustand/shallow'
import { DIMENSIONS, getTrimLineRect, TRIM_CORNER_RADIUS_PX } from '../../../authority/geometryAuthority'
import { getOuterBorderFill } from '../../../authority/colorAuthority'
import { useCardStore } from '../../../store/useCardStore'

const CLONE_EDGE_CHOKE_PX = 3
const CLONE_EDGE_MATTE_INSET_PX = 1
const CLONE_EDGE_MATTE_STROKE_PX = 2

/**
 * Module 5.4 completion — printable cloned card image.
 * Fits to trim area (contain), centered, and included in export.
 */
function ClonedCardLayer() {
  const { x: trimX, y: trimY, width: trimW, height: trimH } = getTrimLineRect()
  const { clonedCardImage, bleedFillColor, outerBorderColor } = useCardStore(
    (s) => ({
      clonedCardImage: s.cardData.clonedCardImage,
      bleedFillColor: s.cardData.bleedFillColor,
      outerBorderColor: s.cardData.outerBorderColor ?? 'black',
    }),
    shallow,
  )
  const stageW = DIMENSIONS.FULL_BLEED.width
  const stageH = DIMENSIONS.FULL_BLEED.height
  const [img, setImg] = useState<HTMLImageElement | null>(null)

  const bleedFillProps = useMemo(() => {
    if (typeof bleedFillColor === 'string' && /^#([0-9a-f]{6})$/i.test(bleedFillColor.trim())) {
      return { fill: bleedFillColor.trim() as string }
    }
    const outer = getOuterBorderFill(outerBorderColor)
    return outer.type === 'solid'
      ? { fill: outer.hex as string }
      : ({
          fillLinearGradientStartPoint: { x: 0, y: 0 },
          fillLinearGradientEndPoint: { x: stageW, y: 0 },
          fillLinearGradientColorStops: [0, outer.hex1, 1, outer.hex2],
        } as any)
  }, [bleedFillColor, outerBorderColor, stageW])

  const matteStroke = useMemo(() => {
    if (typeof bleedFillColor === 'string' && /^#([0-9a-f]{6})$/i.test(bleedFillColor.trim())) {
      return bleedFillColor.trim()
    }
    const outer = getOuterBorderFill(outerBorderColor)
    return outer.type === 'solid' ? outer.hex : outer.hex1
  }, [bleedFillColor, outerBorderColor])

  useEffect(() => {
    const src = String(clonedCardImage ?? '').trim()
    if (!src) {
      setImg(null)
      return
    }
    const im = new window.Image()
    if (!src.startsWith('data:')) im.crossOrigin = 'anonymous'
    im.onload = () => setImg(im)
    im.onerror = () => setImg(null)
    im.src = src
  }, [clonedCardImage])

  const fit = useMemo(() => {
    if (!img) return null
    const nw = img.naturalWidth || 1
    const nh = img.naturalHeight || 1
    const scale = Math.min(trimW / nw, trimH / nh)
    const drawW = nw * scale + CLONE_EDGE_CHOKE_PX * 2
    const drawH = nh * scale + CLONE_EDGE_CHOKE_PX * 2
    return {
      x: trimX + (trimW - drawW) / 2,
      y: trimY + (trimH - drawH) / 2,
      width: drawW,
      height: drawH,
    }
  }, [img, trimX, trimY, trimW, trimH])

  const clipRoundedTrim = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const r = Math.min(TRIM_CORNER_RADIUS_PX, trimW / 2, trimH / 2)
      const x = trimX
      const y = trimY
      const w = trimW
      const h = trimH
      ctx.beginPath()
      ctx.moveTo(x + r, y)
      ctx.lineTo(x + w - r, y)
      ctx.quadraticCurveTo(x + w, y, x + w, y + r)
      ctx.lineTo(x + w, y + h - r)
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
      ctx.lineTo(x + r, y + h)
      ctx.quadraticCurveTo(x, y + h, x, y + h - r)
      ctx.lineTo(x, y + r)
      ctx.quadraticCurveTo(x, y, x + r, y)
      ctx.closePath()
    },
    [trimX, trimY, trimW, trimH],
  )

  if (!img || !fit) return null

  return (
    <Layer name="cloned-card-layer" listening={false}>
      {/* Clone-only underpaint to prevent white corner wedges from transparent rounded source corners. */}
      <Rect x={0} y={0} width={stageW} height={stageH} listening={false} {...bleedFillProps} />
      <Group clipFunc={clipRoundedTrim as (ctx: unknown) => void} listening={false}>
        <Image
          image={img}
          x={fit.x}
          y={fit.y}
          width={fit.width}
          height={fit.height}
          listening={false}
          imageSmoothingEnabled={true}
        />
      </Group>
      {/* Final clone-only inner-edge matte cleanup to suppress residual baked light fringe. */}
      <Rect
        x={trimX + CLONE_EDGE_MATTE_INSET_PX}
        y={trimY + CLONE_EDGE_MATTE_INSET_PX}
        width={Math.max(0, trimW - CLONE_EDGE_MATTE_INSET_PX * 2)}
        height={Math.max(0, trimH - CLONE_EDGE_MATTE_INSET_PX * 2)}
        cornerRadius={Math.max(0, TRIM_CORNER_RADIUS_PX - CLONE_EDGE_MATTE_INSET_PX)}
        stroke={matteStroke}
        strokeWidth={CLONE_EDGE_MATTE_STROKE_PX}
        listening={false}
      />
    </Layer>
  )
}

export default memo(ClonedCardLayer)

