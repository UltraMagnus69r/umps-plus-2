import { memo, useCallback, useMemo, useRef, useState } from 'react'
import { Group, Image, Layer, Shape } from 'react-konva'
import { shallow } from 'zustand/shallow'
import { BEVEL_INSET } from '../../../authority/geometryAuthority'
import {
  getActiveLayoutCapabilitiesFromState,
  getActiveLayoutRegionsFromState,
  layoutRegionToStageRect,
} from '../../../authority/layoutRegistry'
import { getSymbolDataUrl } from '../../../authority/symbolAuthority'
import { resolveProceduralIdentity, useCardStore } from '../../../store/useCardStore'
import type { LayoutId } from '../../../authority/layoutTaxonomy'
import { landFullArtManaCircleKeyToBracketToken } from '../../../authority/landFullArtManaCircle'
import { drawBeveledRaisedCircleOnContext } from './frameBevelDrawing'

/** Name inner left minus this value = mana circle’s left edge. */
const MANA_CIRCLE_LEFT_GAP_PX = 30

/** Same shadow as FrameLayer name plate (Module 2.2). */
const FRAME_SHADOW_BLUR_FEATHER = 4
const FRAME_SHADOW_OPACITY = 0.4
const FRAME_SHADOW_OFFSET = { x: 1, y: 1 }

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

/**
 * Land / Full Art — left mana circle: name-plate bevel/pinline (color identity) + mana pip filling inner face.
 */
function LandFullArtManaCircleLayer() {
  const {
    landFullArtManaCircleKey,
    currentLayout,
    activeLayout,
    cardTypeLine,
    cardName,
    manualColorKey,
    manualColorHex1,
    manualColorHex2,
    manualColorHex3,
    manualColorHex4,
    manualColorHex5,
    manualColorCount,
  } = useCardStore(
    (s) => ({
      landFullArtManaCircleKey: s.cardData.landFullArtManaCircleKey,
      currentLayout: s.currentLayout,
      activeLayout: s.cardData.layout as LayoutId,
      cardTypeLine: s.cardData.typeLine,
      cardName: s.cardData.name,
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
  const useCircle = caps.useLandFullArtManaCircle

  const nameRect = useMemo(() => {
    if (!useCircle) return null
    const regions = getActiveLayoutRegionsFromState({
      currentLayout,
      cardData: { layout: activeLayout },
    })
    return layoutRegionToStageRect(regions.nameBar)
  }, [useCircle, currentLayout, activeLayout])

  const resolvedIdentity = useMemo(
    () =>
      resolveProceduralIdentity(
        cardTypeLine,
        [],
        cardName,
        landFullArtManaCircleKeyToBracketToken(landFullArtManaCircleKey),
        true,
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
      cardName,
      landFullArtManaCircleKey,
      manualColorKey,
      manualColorHex1,
      manualColorHex2,
      manualColorHex3,
      manualColorHex4,
      manualColorHex5,
      manualColorCount,
    ],
  )

  const identityStroke = resolvedIdentity.stroke
  const outerStrokeColor = useMemo(() => darkenHex(identityStroke, 0.4), [identityStroke])
  const raisedBevelLight = useMemo(() => lightenHex(identityStroke, 0.78), [identityStroke])
  const raisedBevelDark = useMemo(() => darkenHex(identityStroke, 0.18), [identityStroke])
  const recessedBevelLight = useMemo(() => lightenHex(identityStroke, 0.55), [identityStroke])
  const recessedBevelDark = useMemo(() => darkenHex(identityStroke, 0.25), [identityStroke])

  const bevelColors = useMemo(
    () => ({
      raisedBevelLight,
      raisedBevelDark,
      recessedBevelLight,
      recessedBevelDark,
    }),
    [raisedBevelLight, raisedBevelDark, recessedBevelLight, recessedBevelDark],
  )

  const dataUrl = useMemo(
    () => getSymbolDataUrl(landFullArtManaCircleKey),
    [landFullArtManaCircleKey],
  )

  const manaImageCache = useRef<Map<string, HTMLImageElement>>(new Map())
  const [, setManaImageTick] = useState(0)
  const getManaImage = useCallback((key: string, url: string) => {
    const existing = manaImageCache.current.get(key)
    if (existing) return existing
    const img = new window.Image()
    img.onload = () => setManaImageTick((t) => t + 1)
    img.onerror = () => setManaImageTick((t) => t + 1)
    img.src = url
    manaImageCache.current.set(key, img)
    return img
  }, [])

  if (!useCircle || !nameRect || !dataUrl) {
    return <Layer listening={false} />
  }

  const nh = nameRect.height
  const d = nh * 1.5
  const R = d / 2
  const cxStage = nameRect.x - MANA_CIRCLE_LEFT_GAP_PX + R
  const cyStage = nameRect.y + nh / 2
  const originX = cxStage - R
  const originY = cyStage - R

  const innerFaceR = Math.max(1, R - BEVEL_INSET)
  /** Fill the inner flat face; slight overscale + circular clip compensates for transparent padding in symbol PNGs. */
  const symSize = 2 * innerFaceR * 1.12

  const img = getManaImage(`land-fa-${landFullArtManaCircleKey}`, dataUrl)

  return (
    <Layer listening={false}>
      <Group listening={false}>
        <Shape
          x={originX}
          y={originY}
          width={d}
          height={d}
          sceneFunc={(ctx, _shape) =>
            drawBeveledRaisedCircleOnContext(
              ctx as unknown as CanvasRenderingContext2D,
              d,
              outerStrokeColor,
              bevelColors,
            )
          }
          listening={false}
          shadowColor="#000"
          shadowBlur={FRAME_SHADOW_BLUR_FEATHER}
          shadowOffset={FRAME_SHADOW_OFFSET}
          shadowOpacity={FRAME_SHADOW_OPACITY}
        />
        <Group
          x={originX}
          y={originY}
          listening={false}
          clipFunc={(ctx) => {
            ctx.beginPath()
            ctx.arc(R, R, innerFaceR, 0, Math.PI * 2, false)
            ctx.clip()
          }}
        >
          {img && img.complete && img.naturalWidth > 0 ? (
            <Image
              image={img}
              x={R - symSize / 2}
              y={R - symSize / 2}
              width={symSize}
              height={symSize}
              listening={false}
            />
          ) : null}
        </Group>
      </Group>
    </Layer>
  )
}

export default memo(LandFullArtManaCircleLayer)
