import { memo, useCallback, useEffect, useRef } from 'react'
import { Group, Image, Layer, Text } from 'react-konva'
import type Konva from 'konva'
import { shallow } from 'zustand/shallow'
import { clampArtPlacementOffsets } from '../../../authority/artPlacementAuthority'
import {
  getActiveLayoutCapabilitiesFromState,
  getActiveLayoutArtRectFromState,
  getActiveLayoutRegionsFromState,
  layoutRegionToStageRect,
} from '../../../authority/layoutRegistry'
import { isBorderlessArtTreatmentLayout } from '../../../authority/layoutTaxonomy'
import { getPlaneswalkerModernV2ArtInnerRect } from '../../../authority/planeswalkerModernV2LayoutAuthority'
import { getFontStack } from '../../../authority/typographyAuthority'
import { useKonvaPublicImage } from '../../../hooks/useKonvaPublicImage'
import { useCardStore } from '../../../store/useCardStore'
import type { LayoutId } from '../../../authority/layoutTaxonomy'
import { addPlaneswalkerModernV2ArtInnerClipPath } from './planeswalkerModernV2ArtPath'

const TEXT_SHADOW_OFFSET = { x: 1, y: 1 }

/**
 * Art layer — image (drag/zoom) and optional secondary name.
 * Renders above TextureBorderLayer so artwork is visible in the art window; frame and text stack above.
 */
function ArtLayer() {
  const {
    currentLayout,
    activeLayout,
    artImage,
    artZoom,
    artOffsetX,
    artOffsetY,
    secondaryName,
    showSecondaryName,
    secondaryNameFontSize,
    secondaryNameLightText,
  } = useCardStore(
    (s) => ({
      currentLayout: s.currentLayout,
      activeLayout: s.cardData.layout as LayoutId,
      artImage: s.cardData.artImage,
      artZoom: s.cardData.artZoom,
      artOffsetX: s.cardData.artOffsetX,
      artOffsetY: s.cardData.artOffsetY,
      secondaryName: s.cardData.secondaryName,
      showSecondaryName: s.cardData.showSecondaryName,
      secondaryNameFontSize: s.cardData.secondaryNameFontSize,
      secondaryNameLightText: s.cardData.secondaryNameLightText,
    }),
    shallow,
  )
  const capabilities = getActiveLayoutCapabilitiesFromState({
    currentLayout,
    cardData: { layout: activeLayout },
  })
  const modernV2Layout = capabilities.supportsPlaneswalkerModernV2Layout
  const artR = modernV2Layout
    ? getPlaneswalkerModernV2ArtInnerRect()
    : getActiveLayoutArtRectFromState({
        currentLayout,
        cardData: { layout: activeLayout },
      })
  const artInnerX = artR.x
  const artInnerY = artR.y
  const artInnerW = artR.width
  const artInnerH = artR.height
  const nameBarRect = layoutRegionToStageRect(
    getActiveLayoutRegionsFromState({
      currentLayout,
      cardData: { layout: activeLayout },
    }).nameBar,
  )
  const borderlessLike = isBorderlessArtTreatmentLayout(activeLayout)
  const supportsPreModernFaceLayout = capabilities.supportsPreModernFaceLayout

  const artImg = useKonvaPublicImage(artImage)
  const layerRef = useRef<Konva.Layer>(null)
  const setAsyncStatus = useCardStore((s) => s.setAsyncStatus)

  useEffect(() => {
    if (!artImage) return
    if (artImg) {
      setAsyncStatus('artUpload', 'success')
      const timer = window.setTimeout(() => setAsyncStatus('artUpload', 'idle'), 2000)
      requestAnimationFrame(() => {
        layerRef.current?.batchDraw()
      })
      return () => window.clearTimeout(timer)
    }
    return undefined
  }, [artImage, artImg, setAsyncStatus])

  const secondaryFontSize = (() => {
    const v = typeof secondaryNameFontSize === 'number' && Number.isFinite(secondaryNameFontSize)
      ? secondaryNameFontSize
      : 55
    return Math.max(20, Math.min(90, Math.floor(v * 2) / 2))
  })()

  const pinchRef = useRef<{ distance: number; zoom: number } | null>(null)

  const applyArtZoom = useCallback(
    (nextZoom: number, commit: boolean) => {
      const state = useCardStore.getState()
      const zoom = Math.min(4, Math.max(1, nextZoom))
      if (!artImg) {
        state.setManualArtPlacement({ artZoom: zoom })
        if (commit) state.commitState()
        return
      }
      const clamped = clampArtPlacementOffsets({
        imageWidth: artImg.width,
        imageHeight: artImg.height,
        bounds: { x: artInnerX, y: artInnerY, width: artInnerW, height: artInnerH },
        artZoom: zoom,
        artOffsetX: state.cardData.artOffsetX ?? 0,
        artOffsetY: state.cardData.artOffsetY ?? 0,
      })
      state.setManualArtPlacement({
        artZoom: zoom,
        artOffsetX: clamped.artOffsetX,
        artOffsetY: clamped.artOffsetY,
      })
      if (commit) state.commitState()
    },
    [artImg, artInnerH, artInnerW, artInnerX, artInnerY],
  )

  useEffect(() => {
    const onStep = (event: Event) => {
      const direction = (event as CustomEvent<number>).detail
      const current = useCardStore.getState().cardData.artZoom ?? 1
      applyArtZoom(current + direction * 0.12, true)
    }
    window.addEventListener('umps-art-zoom-step', onStep)
    return () => window.removeEventListener('umps-art-zoom-step', onStep)
  }, [applyArtZoom])

  const baseScale = artInnerW / (artImg?.width ?? 1)
  const zoom = Math.max(1, artZoom ?? 1)
  const scale = baseScale * zoom
  const dispW = (artImg?.width ?? 0) * scale
  const dispH = (artImg?.height ?? 0) * scale
  const artInnerCx = artInnerX + artInnerW / 2
  const artInnerCy = artInnerY + artInnerH / 2
  const minX = artInnerX + Math.min(0, artInnerW - dispW)
  const maxX = artInnerX
  const minY = artInnerY + Math.min(0, artInnerH - dispH)
  const maxY = artInnerY

  return (
    <Layer ref={layerRef} listening={true}>
      {artImg && (
        <Group
          {...(modernV2Layout
            ? {
                clipFunc: (ctx) => {
                  const c = ctx as unknown as CanvasRenderingContext2D
                  addPlaneswalkerModernV2ArtInnerClipPath(c, artInnerX, artInnerY, artInnerW, artInnerH)
                  c.clip()
                },
              }
            : {
                clipX: artInnerX,
                clipY: artInnerY,
                clipWidth: artInnerW,
                clipHeight: artInnerH,
              })}
          listening={true}
          onWheel={(e) => {
            e.evt.preventDefault()
            const current = useCardStore.getState().cardData.artZoom ?? 1
            const step = e.evt.deltaY > 0 ? -0.08 : 0.08
            applyArtZoom(current + step, false)
            const win = window as unknown as { __artZoomCommit?: ReturnType<typeof setTimeout> }
            if (win.__artZoomCommit) clearTimeout(win.__artZoomCommit)
            win.__artZoomCommit = setTimeout(() => {
              useCardStore.getState().commitState()
            }, 250)
          }}
          onTouchStart={(e) => {
            const dist = touchSpan(e.evt.touches)
            if (dist <= 0) return
            pinchRef.current = { distance: dist, zoom: useCardStore.getState().cardData.artZoom ?? 1 }
            e.target.stopDrag()
          }}
          onTouchMove={(e) => {
            const pinch = pinchRef.current
            const dist = touchSpan(e.evt.touches)
            if (!pinch || dist <= 0) return
            e.evt.preventDefault()
            e.target.stopDrag()
            applyArtZoom(pinch.zoom * (dist / pinch.distance), false)
          }}
          onTouchEnd={(e) => {
            if (!pinchRef.current || e.evt.touches.length >= 2) return
            pinchRef.current = null
            useCardStore.getState().commitState()
          }}
        >
          <Image
            image={artImg}
            imageSmoothingEnabled={true}
            scaleX={scale}
            scaleY={scale}
            x={artInnerCx + (artOffsetX ?? 0) - dispW / 2}
            y={artInnerCy + (artOffsetY ?? 0) - dispH / 2}
            draggable
            dragBoundFunc={(pos) => ({
              x: Math.min(maxX, Math.max(minX, pos.x)),
              y: Math.min(maxY, Math.max(minY, pos.y)),
            })}
            onDragEnd={(e) => {
              const node = e.target
              const state = useCardStore.getState()
              const scaleSnap = (artInnerW / artImg.width) * Math.max(1, state.cardData.artZoom ?? 1)
              const dw = artImg.width * scaleSnap
              const dh = artImg.height * scaleSnap
              state.setManualArtPlacement({
                artOffsetX: node.x() - artInnerCx + dw / 2,
                artOffsetY: node.y() - artInnerCy + dh / 2,
              })
              state.commitState()
            }}
          />
        </Group>
      )}

      {showSecondaryName && secondaryName && !supportsPreModernFaceLayout && (
        <Text
          text={secondaryName}
          x={borderlessLike ? nameBarRect.x + 10 : artInnerX + 10}
          y={borderlessLike ? nameBarRect.y + nameBarRect.height + 6 : artInnerY + 8}
          width={borderlessLike ? nameBarRect.width - 20 : artInnerW - 20}
          height={Math.max(54, Math.min(Math.ceil(secondaryFontSize * 1.25), artInnerH - 16))}
          fontFamily={getFontStack('NAME')}
          fontStyle="bold"
          fontSize={secondaryFontSize}
          fill={secondaryNameLightText ? '#fff' : '#111'}
          stroke={secondaryNameLightText ? '#111' : '#fff'}
          strokeWidth={2}
          shadowColor={secondaryNameLightText ? '#000' : '#fff'}
          shadowBlur={4}
          shadowOffset={TEXT_SHADOW_OFFSET}
          listening={false}
          verticalAlign="top"
        />
      )}
    </Layer>
  )
}

function touchSpan(touches: TouchList): number {
  if (touches.length < 2) return 0
  const a = touches[0]
  const b = touches[1]
  if (!a || !b) return 0
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
}

/** Phone art-zoom buttons. The stage stays mounted and applies the same clamp as the mouse wheel. */
export function requestArtZoomStep(direction: 1 | -1) {
  window.dispatchEvent(new CustomEvent('umps-art-zoom-step', { detail: direction }))
}

export default memo(ArtLayer)
