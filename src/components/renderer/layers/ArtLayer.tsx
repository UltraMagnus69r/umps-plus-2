import { memo, useCallback, useEffect, useRef } from 'react'
import { Group, Image, Layer, Shape } from 'react-konva'
import type Konva from 'konva'
import { shallow } from 'zustand/shallow'
import {
  clampArtPlacementOffsets,
  getCoverZoomMultiplier,
} from '../../../authority/artPlacementAuthority'
import { getBattleArtRect } from '../../../authority/battleLayoutAuthority'
import {
  getActiveLayoutCapabilitiesFromState,
  getActiveLayoutArtRectFromState,
} from '../../../authority/layoutRegistry'
import { getPlaneswalkerModernV2ArtInnerRect } from '../../../authority/planeswalkerModernV2LayoutAuthority'
import { useKonvaPublicImage } from '../../../hooks/useKonvaPublicImage'
import { useCardStore } from '../../../store/useCardStore'
import type { LayoutId } from '../../../authority/layoutTaxonomy'
import { addBattleArtInnerClipPath } from './battleArtPath'
import { addPlaneswalkerModernV2ArtInnerClipPath } from './planeswalkerModernV2ArtPath'

type ArtDragSession = {
  pointerId: number
  startClientX: number
  startClientY: number
  originOffsetX: number
  originOffsetY: number
  /** Design-space units per client CSS pixel (accounts for stage scale + CSS zoom). */
  designPerClientX: number
  designPerClientY: number
}

/**
 * Art layer — image (drag/zoom) only.
 * Renders above TextureBorderLayer so artwork is visible in the art window; frame and text stack above.
 * Secondary name is drawn by SecondaryNameLayer (over art, under nameplate).
 *
 * Art reposition uses custom pointer-delta drag (not Konva `draggable`) so CSS preview
 * pan/zoom on StudioCanvas cannot snap the image origin under the cursor.
 */
function ArtLayer() {
  const {
    currentLayout,
    activeLayout,
    artImage,
    artZoom,
    artOffsetX,
    artOffsetY,
  } = useCardStore(
    (s) => ({
      currentLayout: s.currentLayout,
      activeLayout: s.cardData.layout as LayoutId,
      artImage: s.cardData.artImage,
      artZoom: s.cardData.artZoom,
      artOffsetX: s.cardData.artOffsetX,
      artOffsetY: s.cardData.artOffsetY,
    }),
    shallow,
  )
  const capabilities = getActiveLayoutCapabilitiesFromState({
    currentLayout,
    cardData: { layout: activeLayout },
  })
  const modernV2Layout = capabilities.supportsPlaneswalkerModernV2Layout
  const battleLayout = capabilities.supportsBattleChrome === true
  /** Battle: MotM left-inset art aperture (same as chrome ring hole). */
  const artR = modernV2Layout
    ? getPlaneswalkerModernV2ArtInnerRect()
    : battleLayout
      ? getBattleArtRect()
      : getActiveLayoutArtRectFromState({
          currentLayout,
          cardData: { layout: activeLayout },
        })
  const artInnerX = artR.x
  const artInnerY = artR.y
  const artInnerW = artR.width
  const artInnerH = artR.height

  const artImg = useKonvaPublicImage(artImage)
  const layerRef = useRef<Konva.Layer>(null)
  const artNodeRef = useRef<Konva.Image | null>(null)
  const artDragRef = useRef<ArtDragSession | null>(null)
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

  const pinchRef = useRef<{ distance: number; zoom: number } | null>(null)

  const battleCoverMinZoom = useCallback(() => {
    if (!battleLayout || !artImg) return 1
    return getCoverZoomMultiplier({
      imageWidth: artImg.width,
      imageHeight: artImg.height,
      bounds: { x: artInnerX, y: artInnerY, width: artInnerW, height: artInnerH },
    })
  }, [artImg, artInnerH, artInnerW, artInnerX, artInnerY, battleLayout])

  const applyArtZoom = useCallback(
    (nextZoom: number, commit: boolean) => {
      const state = useCardStore.getState()
      const minZ = battleCoverMinZoom()
      const zoom = Math.min(4, Math.max(minZ, nextZoom))
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
        minZoom: minZ,
      })
      state.setManualArtPlacement({
        artZoom: zoom,
        artOffsetX: clamped.artOffsetX,
        artOffsetY: clamped.artOffsetY,
      })
      if (commit) state.commitState()
    },
    [artImg, artInnerH, artInnerW, artInnerX, artInnerY, battleCoverMinZoom],
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
  /** Battle: never letterbox — zoom at least cover so art fills the aperture. */
  const minCoverZoom =
    battleLayout && artImg
      ? getCoverZoomMultiplier({
          imageWidth: artImg.width,
          imageHeight: artImg.height,
          bounds: { x: artInnerX, y: artInnerY, width: artInnerW, height: artInnerH },
        })
      : 1
  const zoom = Math.max(minCoverZoom, artZoom ?? 1)
  const scale = baseScale * zoom
  const dispW = (artImg?.width ?? 0) * scale
  const dispH = (artImg?.height ?? 0) * scale
  const artInnerCx = artInnerX + artInnerW / 2
  const artInnerCy = artInnerY + artInnerH / 2

  const syncNodeFromOffsets = useCallback(
    (ox: number, oy: number, nextZoom?: number) => {
      const node = artNodeRef.current
      if (!node || !artImg) return
      const minZ = battleCoverMinZoom()
      const z = Math.max(minZ, nextZoom ?? useCardStore.getState().cardData.artZoom ?? 1)
      const s = (artInnerW / artImg.width) * z
      const dw = artImg.width * s
      const dh = artImg.height * s
      node.scale({ x: s, y: s })
      node.position({
        x: artInnerCx + ox - dw / 2,
        y: artInnerCy + oy - dh / 2,
      })
      node.getLayer()?.batchDraw()
    },
    [artImg, artInnerCx, artInnerCy, artInnerW, battleCoverMinZoom],
  )

  const beginArtDrag = useCallback(
    (e: Konva.KonvaEventObject<PointerEvent>) => {
      const evt = e.evt
      if (typeof evt.button === 'number' && evt.button !== 0) return
      if (!artImg) return
      const stage = e.target.getStage()
      if (!stage?.content) return

      // Own the gesture — do not bubble into Stage canvas-pan.
      e.cancelBubble = true
      evt.preventDefault?.()
      evt.stopPropagation?.()

      const rect = stage.content.getBoundingClientRect()
      const cssScaleX = rect.width / (stage.content.clientWidth || 1) || 1
      const cssScaleY = rect.height / (stage.content.clientHeight || 1) || 1
      const stageScaleX = stage.scaleX() || 1
      const stageScaleY = stage.scaleY() || 1
      const state = useCardStore.getState().cardData

      artDragRef.current = {
        pointerId: evt.pointerId,
        startClientX: evt.clientX,
        startClientY: evt.clientY,
        originOffsetX: state.artOffsetX ?? 0,
        originOffsetY: state.artOffsetY ?? 0,
        designPerClientX: 1 / (cssScaleX * stageScaleX),
        designPerClientY: 1 / (cssScaleY * stageScaleY),
      }

      try {
        stage.content.setPointerCapture?.(evt.pointerId)
      } catch {
        /* older browsers */
      }
    },
    [artImg],
  )

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const drag = artDragRef.current
      if (!drag || drag.pointerId !== e.pointerId || !artImg) return
      e.preventDefault()

      const nextX = drag.originOffsetX + (e.clientX - drag.startClientX) * drag.designPerClientX
      const nextY = drag.originOffsetY + (e.clientY - drag.startClientY) * drag.designPerClientY
      const minZ = battleCoverMinZoom()
      const clamped = clampArtPlacementOffsets({
        imageWidth: artImg.width,
        imageHeight: artImg.height,
        bounds: { x: artInnerX, y: artInnerY, width: artInnerW, height: artInnerH },
        artZoom: Math.max(minZ, useCardStore.getState().cardData.artZoom ?? 1),
        artOffsetX: nextX,
        artOffsetY: nextY,
        minZoom: minZ,
      })
      syncNodeFromOffsets(clamped.artOffsetX, clamped.artOffsetY)
      useCardStore.getState().setManualArtPlacement({
        artOffsetX: clamped.artOffsetX,
        artOffsetY: clamped.artOffsetY,
      })
    }

    const onUp = (e: PointerEvent) => {
      const drag = artDragRef.current
      if (!drag || drag.pointerId !== e.pointerId) return
      artDragRef.current = null
      useCardStore.getState().commitState()
    }

    window.addEventListener('pointermove', onMove, { passive: false })
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [artImg, artInnerH, artInnerW, artInnerX, artInnerY, battleCoverMinZoom, syncNodeFromOffsets])

  return (
    <Layer ref={layerRef} listening={true}>
      {/* Battle: paint the full chrome aperture so empty/cover edges never read as a mat gap. */}
      {battleLayout ? (
        <Shape
          listening={false}
          sceneFunc={(ctx) => {
            const c = ctx as unknown as CanvasRenderingContext2D
            c.beginPath()
            addBattleArtInnerClipPath(c)
            c.fillStyle = '#bfbfbf'
            c.fill()
          }}
        />
      ) : null}
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
            : battleLayout
              ? {
                  // Art aperture path (same bounds/radii as chrome frame ring hole).
                  // Konva begins the path and calls clip() after clipFunc returns.
                  clipFunc: (ctx) => {
                    const c = ctx as unknown as CanvasRenderingContext2D
                    addBattleArtInnerClipPath(c)
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
            // Ctrl/Meta+wheel belongs to StudioCanvas preview zoom.
            if (e.evt.ctrlKey || e.evt.metaKey) return
            e.evt.preventDefault()
            e.cancelBubble = true
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
            e.cancelBubble = true
          }}
          onTouchMove={(e) => {
            const pinch = pinchRef.current
            const dist = touchSpan(e.evt.touches)
            if (!pinch || dist <= 0) return
            e.evt.preventDefault()
            e.cancelBubble = true
            applyArtZoom(pinch.zoom * (dist / pinch.distance), false)
          }}
          onTouchEnd={(e) => {
            if (!pinchRef.current || e.evt.touches.length >= 2) return
            pinchRef.current = null
            useCardStore.getState().commitState()
          }}
        >
          <Image
            ref={(node) => {
              artNodeRef.current = node
            }}
            name="art-placement"
            image={artImg}
            imageSmoothingEnabled={true}
            scaleX={scale}
            scaleY={scale}
            x={artInnerCx + (artOffsetX ?? 0) - dispW / 2}
            y={artInnerCy + (artOffsetY ?? 0) - dispH / 2}
            draggable={false}
            onPointerDown={beginArtDrag}
          />
        </Group>
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
