import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { CloudDownload, Plus, RotateCcw } from 'lucide-react'
import { WORKING_PREVIEW_FOCUS_ID } from '../../data/layoutConstants'
import {
  isCardEffectivelyEmptyForGuidance,
} from '../../authority/guidanceAuthority'
import { useCardStore } from '../../store/useCardStore'
import type { InspectorSegment } from '../../hooks/useInspectorSegment'
import CardPreviewSelectionShell from './CardPreviewSelectionShell'

const TIP_KEY = 'umps-studio-onboarding-tip-v1'
/** Same Magic card back used by print feature (bleed-aware illustration). */
const CARD_BACK_SRC = '/assets/print/magic-card-back-bleed.png'

type Props = {
  onRequestSegment: (segment: InspectorSegment) => void
  onRequestImport: () => void
}

type PanState = { x: number; y: number }

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
  const [flipped, setFlipped] = useState(false)
  const panSurfaceRef = useRef<HTMLDivElement | null>(null)
  const panDragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    originX: number
    originY: number
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

  return (
    <main className="studio-canvas-stage flex min-h-0 min-w-0 flex-1 flex-col" data-phone-surface="card">
      {showTip ? (
        <div className="studio-onboarding-tip" role="status" data-no-canvas-pan>
          <div className="font-semibold text-[var(--text-primary)]">Studio flow</div>
          <p className="mt-0.5">
            Write in <strong>Content</strong>, style in <strong>Look</strong>, then{' '}
            <strong>Download</strong>. Details holds collector &amp; fine controls.
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
          style={{ cursor: 'grab' }}
        >
          <div
            className="relative h-full w-full min-h-0 will-change-transform"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}
          >
            <div key={settleKey} className="studio-card-settle relative h-full w-full min-h-0">
              <div className={['studio-card-flip', flipped ? 'is-flipped' : ''].filter(Boolean).join(' ')}>
                <div className="studio-card-flip__inner">
                  <div className="studio-card-flip__face studio-card-flip__face--front">
                    <CardPreviewSelectionShell hideInlineGuidance />
                  </div>
                  <div className="studio-card-flip__face studio-card-flip__face--back" aria-hidden={!flipped}>
                    <img
                      src={CARD_BACK_SRC}
                      alt=""
                      className="studio-card-back-img"
                      draggable={false}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="studio-canvas-chrome shrink-0 border-t border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--surface-raised)_88%,transparent)] px-4 py-3"
          data-no-canvas-pan
        >
          <div className="mx-auto flex w-full max-w-[40rem] flex-wrap items-center justify-center gap-2 sm:justify-between">
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
                  <button
                    type="button"
                    className="studio-empty-cta"
                    onClick={() => {
                      resetCard()
                      onRequestSegment('look')
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Blank card
                  </button>
                </>
              ) : (
                <span className="text-[0.75rem] text-[var(--text-tertiary)]">
                  Drag empty canvas to pan · drag art to reposition
                </span>
              )}
            </div>
            <button
              type="button"
              className="studio-empty-cta"
              onClick={() => setFlipped((v) => !v)}
              aria-pressed={flipped}
              aria-label={flipped ? 'Show card front' : 'Show card back'}
              title={flipped ? 'Show front' : 'Flip to back'}
            >
              <RotateCcw className="h-4 w-4" />
              {flipped ? 'Show front' : 'Flip card'}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}

export default memo(StudioCanvas)
