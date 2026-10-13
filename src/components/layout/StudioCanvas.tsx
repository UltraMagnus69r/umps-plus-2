import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { CloudDownload, Minus, Plus, RotateCcw } from 'lucide-react'
import { WORKING_PREVIEW_FOCUS_ID } from '../../data/layoutConstants'
import {
  isCardEffectivelyEmptyForGuidance,
} from '../../authority/guidanceAuthority'
import { useCardStore } from '../../store/useCardStore'
import type { InspectorSegment } from '../../hooks/useInspectorSegment'
import CardPreviewSelectionShell from './CardPreviewSelectionShell'

const TIP_KEY = 'umps-studio-onboarding-tip-v1'
/** Proxy Printer “Default back” — classic print back (not Magic bleed). */
const CARD_BACK_SRC = '/assets/print/card-back.png'

const PREVIEW_ZOOM_MIN = 0.55
const PREVIEW_ZOOM_MAX = 2.4
const PREVIEW_ZOOM_STEP = 0.12

type Props = {
  onRequestSegment: (segment: InspectorSegment) => void
  onRequestImport: () => void
}

type PanState = { x: number; y: number }

function clampPreviewZoom(z: number) {
  return Math.min(PREVIEW_ZOOM_MAX, Math.max(PREVIEW_ZOOM_MIN, z))
}

function StudioCanvas({ onRequestSegment, onRequestImport }: Props) {
  const showEmpty = useCardStore((s) => {
    const cd = s.cardData
    return isCardEffectivelyEmptyForGuidance({
      name: String(cd.name ?? ''),
      typeLine: String(cd.typeLine ?? ''),
      manaCost: String(cd.manaCost ?? ''),
      cardText: String(cd.cardText ?? ''),
      flavorText: String(cd.flavorText ?? ''),
      power: String(cd.power ?? ''),
      toughness: String(cd.toughness ?? ''),
      artImage: String(cd.artImage ?? ''),
      clonedCardImage: String(cd.clonedCardImage ?? ''),
    })
  })
  const resetCard = useCardStore((s) => s.resetCard)
  const [showTip, setShowTip] = useState(false)
  const [settleKey, setSettleKey] = useState(0)
  const [pan, setPan] = useState<PanState>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [flipped, setFlipped] = useState(false)
  const panSurfaceRef = useRef<HTMLDivElement | null>(null)
  const panDragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    originX: number
    originY: number
  } | null>(null)
  const pinchRef = useRef<{
    startDist: number
    originZoom: number
  } | null>(null)

  useEffect(() => {
    try {
      if (localStorage.getItem(TIP_KEY) !== '1') setShowTip(true)
    } catch {
      setShowTip(true)
    }
  }, [])

  useEffect(() => {
    setSettleKey((k) => k + 1)
    setPan({ x: 0, y: 0 })
    setZoom(1)
    setFlipped(false)
  }, [showEmpty])

  const dismissTip = useCallback(() => {
    setShowTip(false)
    try {
      localStorage.setItem(TIP_KEY, '1')
    } catch {
      /* private mode */
    }
  }, [])

  const bumpZoom = useCallback((delta: number) => {
    setZoom((z) => clampPreviewZoom(z + delta))
  }, [])

  const endPan = useCallback(() => {
    panDragRef.current = null
  }, [])

  const beginPan = useCallback(
    (clientX: number, clientY: number, pointerId: number, target: Element | null) => {
      if (flipped) return
      if (target?.closest?.('[data-no-canvas-pan]')) return
      panDragRef.current = {
        pointerId,
        startX: clientX,
        startY: clientY,
        originX: pan.x,
        originY: pan.y,
      }
    },
    [flipped, pan.x, pan.y],
  )

  const onPanPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return
      const target = e.target as Element
      // Konva art placement uses the canvas; don't steal those drags.
      if (target instanceof HTMLCanvasElement) return
      beginPan(e.clientX, e.clientY, e.pointerId, target)
    },
    [beginPan],
  )

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const drag = panDragRef.current
      if (!drag || drag.pointerId !== e.pointerId) return
      setPan({
        x: drag.originX + (e.clientX - drag.startX),
        y: drag.originY + (e.clientY - drag.startY),
      })
    }
    const onUp = (e: PointerEvent) => {
      const drag = panDragRef.current
      if (!drag || drag.pointerId !== e.pointerId) return
      endPan()
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [endPan])

  useEffect(() => {
    const onCanvasPanStart = (ev: Event) => {
      const detail = (ev as CustomEvent<{ clientX: number; clientY: number; pointerId: number }>).detail
      if (!detail) return
      beginPan(detail.clientX, detail.clientY, detail.pointerId, panSurfaceRef.current)
    }
    window.addEventListener('umps-canvas-pan-start', onCanvasPanStart)
    return () => window.removeEventListener('umps-canvas-pan-start', onCanvasPanStart)
  }, [beginPan])

  useEffect(() => {
    const el = panSurfaceRef.current
    if (!el) return

    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return
      e.preventDefault()
      const delta = e.deltaY > 0 ? -PREVIEW_ZOOM_STEP : PREVIEW_ZOOM_STEP
      setZoom((z) => clampPreviewZoom(z + delta))
    }

    const touchDist = (a: Touch, b: Touch) => {
      const dx = a.clientX - b.clientX
      const dy = a.clientY - b.clientY
      return Math.hypot(dx, dy)
    }

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) {
        pinchRef.current = null
        return
      }
      pinchRef.current = {
        startDist: touchDist(e.touches[0], e.touches[1]),
        originZoom: zoom,
      }
    }
    const onTouchMove = (e: TouchEvent) => {
      const pinch = pinchRef.current
      if (!pinch || e.touches.length !== 2) return
      e.preventDefault()
      const dist = touchDist(e.touches[0], e.touches[1])
      if (pinch.startDist < 8) return
      setZoom(clampPreviewZoom(pinch.originZoom * (dist / pinch.startDist)))
    }
    const onTouchEnd = () => {
      pinchRef.current = null
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)
    el.addEventListener('touchcancel', onTouchEnd)
    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [zoom])

  const startBlank = useCallback(() => {
    resetCard()
    try {
      window.localStorage.setItem('umps-right-open-section', 'layout')
      window.localStorage.setItem('umps-left-open-section', 'none')
    } catch {
      /* private mode */
    }
    window.dispatchEvent(new CustomEvent('umps-open-look-frame'))
    onRequestSegment('look')
  }, [onRequestSegment, resetCard])

  return (
    <main className="studio-canvas-stage flex min-h-0 min-w-0 flex-1 flex-col" data-phone-surface="card">
      {showTip ? (
        <div className="studio-onboarding-tip" role="status" data-no-canvas-pan>
          <div className="font-semibold text-[var(--text-primary)]">Studio flow</div>
          <p className="mt-0.5">
            Start with <strong>Look → Frame</strong>, then fill <strong>Content</strong>, finish in{' '}
            <strong>Details</strong>, and <strong>Download</strong>.
          </p>
          <button
            type="button"
            className="mt-2 text-[0.75rem] font-semibold text-[var(--accent-ink)] underline-offset-2 hover:underline"
            onClick={dismissTip}
          >
            Got it
          </button>
        </div>
      ) : null}

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div
          id={WORKING_PREVIEW_FOCUS_ID}
          tabIndex={-1}
          ref={panSurfaceRef}
          className="studio-canvas-pan-surface flex min-h-0 flex-1 items-center justify-center overflow-hidden p-ui4 outline-none sm:p-ui6"
          onPointerDown={onPanPointerDown}
          style={{ cursor: flipped ? 'default' : 'grab' }}
        >
          {/*
            Keep Konva OUT of preserve-3d / backface-visibility — those collapse the canvas
            into a blank gray pane after flip in Chromium. Front stays in normal flow; back overlays.
          */}
          <div
            key={settleKey}
            className="studio-card-settle relative h-full w-full min-h-0 will-change-transform"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
            }}
          >
            <div
              className={[
                'relative h-full w-full min-h-0',
                flipped ? 'studio-card-front--hidden' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-hidden={flipped}
            >
              <CardPreviewSelectionShell hideInlineGuidance />
            </div>
            {flipped ? (
              <div className="studio-card-back-overlay" aria-hidden={false}>
                <img
                  src={CARD_BACK_SRC}
                  alt="Card back"
                  className="studio-card-back-img"
                  draggable={false}
                />
              </div>
            ) : null}
          </div>
        </div>

        <div
          className="studio-canvas-chrome shrink-0 border-t border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--surface-raised)_88%,transparent)] px-4 py-3"
          data-no-canvas-pan
        >
          <div className="mx-auto flex w-full max-w-[44rem] flex-wrap items-center justify-center gap-2 sm:justify-between">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {showEmpty ? (
                <>
                  <p className="w-full text-center text-[0.8125rem] font-medium tracking-[-0.01em] text-[var(--text-secondary)] sm:w-auto sm:text-left">
                    Start a proxy
                  </p>
                  <button
                    type="button"
                    className="studio-empty-cta studio-empty-cta--primary"
                    onClick={() => {
                      onRequestSegment('content')
                      onRequestImport()
                    }}
                  >
                    <CloudDownload className="h-4 w-4" />
                    Import from Scryfall
                  </button>
                  <button type="button" className="studio-empty-cta" onClick={startBlank}>
                    <Plus className="h-4 w-4" />
                    Blank card
                  </button>
                </>
              ) : (
                <span className="text-[0.75rem] text-[var(--text-tertiary)]">
                  Pan · pinch / Ctrl+scroll zoom · drag art to reposition
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div
                className="studio-preview-zoom"
                role="group"
                aria-label="Preview zoom"
              >
                <button
                  type="button"
                  className="studio-preview-zoom__btn"
                  aria-label="Zoom out"
                  title="Zoom out"
                  disabled={zoom <= PREVIEW_ZOOM_MIN + 0.001}
                  onClick={() => bumpZoom(-PREVIEW_ZOOM_STEP)}
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="studio-preview-zoom__value" aria-live="polite">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  className="studio-preview-zoom__btn"
                  aria-label="Zoom in"
                  title="Zoom in"
                  disabled={zoom >= PREVIEW_ZOOM_MAX - 0.001}
                  onClick={() => bumpZoom(PREVIEW_ZOOM_STEP)}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <button
                type="button"
                className="studio-empty-cta"
                onClick={() => setFlipped((v) => !v)}
                aria-pressed={flipped}
                aria-label={flipped ? 'Show card front' : 'Show card back'}
                title={flipped ? 'Show front' : 'Flip to default card back'}
              >
                <RotateCcw className="h-4 w-4" />
                {flipped ? 'Show front' : 'Flip card'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default memo(StudioCanvas)
