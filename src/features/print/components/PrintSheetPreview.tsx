import { useLayoutEffect, useRef, useState } from 'react'
import {
  createPrintCutMarks,
  frontImageIncludesBleed,
  printFeatureAuthority,
  resolveSlotBack,
  type PrintBuiltinBackId,
} from '../authority/printFeatureAuthority'
import type { PrintPlacement, PrintSheetSide, PrintUploadedFrontCard } from '../types/printFeature'

interface PrintSheetPreviewProps {
  title: string
  instruction: string
  side: PrintSheetSide
  placements: PrintPlacement[]
  frontCards: PrintUploadedFrontCard[]
  sheetFallbackBackId?: PrintBuiltinBackId
  includeBleed: boolean
}

function getFrontCard(cardId: string, frontCards: PrintUploadedFrontCard[]) {
  return frontCards.find((card) => card.id === cardId)
}

function renderCutGuides(placement: PrintPlacement, scale: number) {
  const guides = createPrintCutMarks(placement)
  const minTickLength = printFeatureAuthority.cutGuides.previewMinTickLengthPx
  const minThickness = printFeatureAuthority.cutGuides.previewMinThicknessPx

  return guides.map((guide, index) => {
    const isHorizontal = guide.widthPx > guide.heightPx
    const scaledWidth = Math.round(guide.widthPx * scale)
    const scaledHeight = Math.round(guide.heightPx * scale)

    return (
      <span
        key={`${placement.id}-guide-${index}`}
        className="cut-guide"
        style={{
          left: guide.xPx * scale,
          top: guide.yPx * scale,
          width: isHorizontal ? Math.max(minTickLength, scaledWidth) : Math.max(minThickness, scaledWidth),
          height: isHorizontal ? Math.max(minThickness, scaledHeight) : Math.max(minTickLength, scaledHeight),
        }}
      />
    )
  })
}

function horizontalPadding(el: HTMLElement): number {
  const style = getComputedStyle(el)
  return (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0)
}

/**
 * Fit the letter sheet to the frame's content box (never force H-scroll).
 * Measure the frame itself — not an ancestor that may already be widened by a fixed child.
 */
function availablePreviewWidth(frame: HTMLElement): number {
  const pad = horizontalPadding(frame)
  return Math.max(1, Math.floor(frame.clientWidth - pad))
}

export function PrintSheetPreview({
  title,
  instruction,
  side,
  placements,
  frontCards,
  sheetFallbackBackId = 'default',
  includeBleed,
}: PrintSheetPreviewProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const [previewWidth, setPreviewWidth] = useState(1)
  const [backSizeByUrl, setBackSizeByUrl] = useState<Record<string, { width: number; height: number }>>({})

  useLayoutEffect(() => {
    const el = frameRef.current
    if (!el) return
    const apply = () => {
      setPreviewWidth(availablePreviewWidth(el))
    }
    apply()
    const observer = new ResizeObserver(apply)
    observer.observe(el)
    const panel = el.closest('.panel')
    if (panel) observer.observe(panel)
    const grid = el.closest('.previews-grid, .proxy-printer__previews')
    if (grid) observer.observe(grid)
    return () => observer.disconnect()
  }, [])

  const scale = previewWidth / printFeatureAuthority.page.widthPx
  const previewHeight = Math.round(printFeatureAuthority.page.heightPx * scale)
  const bleedPreview = printFeatureAuthority.card.bleedPx * scale

  return (
    <section className="panel sheet-preview-panel">
      <h2 className="sheet-title">{title}</h2>
      <p className="panel-subtitle">
        {side === 'front'
          ? 'The face of each proxy on this sheet.'
          : 'Each slot uses its own back (Default, Magic, or Custom).'}
      </p>
      <p className="sheet-instruction">{instruction}</p>
      <div className="sheet-frame" ref={frameRef}>
        <div className="sheet-preview" style={{ width: previewWidth, height: previewHeight }}>
          {placements.map((placement) => {
            const card = getFrontCard(placement.cardId, frontCards)
            let src = ''
            let widthPx = 0
            let heightPx = 0
            let fillBleedBox = false

            if (side === 'front') {
              src = card?.url ?? ''
              widthPx = card?.widthPx ?? 0
              heightPx = card?.heightPx ?? 0
              fillBleedBox = frontImageIncludesBleed(widthPx, heightPx)
            } else if (card) {
              const resolved = resolveSlotBack(card, sheetFallbackBackId)
              src = resolved.url
              fillBleedBox = resolved.fillBleedBox
              widthPx = resolved.widthPx || backSizeByUrl[src]?.width || 0
              heightPx = resolved.heightPx || backSizeByUrl[src]?.height || 0
            }

            const rotation = placement.rotationDeg ?? 0
            const fullLeft = placement.xPx * scale
            const fullTop = placement.yPx * scale
            const fullW = placement.widthPx * scale
            const fullH = placement.heightPx * scale
            const unrotW = rotation ? fullH : fullW
            const unrotH = rotation ? fullW : fullH
            const showImage = Boolean(src) && (fillBleedBox || (widthPx > 0 && heightPx > 0) || side === 'back')

            return (
              <div
                key={placement.id}
                className="card-tile"
                style={{
                  left: Math.round(includeBleed ? fullLeft : fullLeft + bleedPreview),
                  top: Math.round(includeBleed ? fullTop : fullTop + bleedPreview),
                  width: Math.round(includeBleed ? fullW : fullW - bleedPreview * 2),
                  height: Math.round(includeBleed ? fullH : fullH - bleedPreview * 2),
                }}
              >
                <div
                  className="card-slot"
                  style={{
                    left: includeBleed ? 0 : -bleedPreview,
                    top: includeBleed ? 0 : -bleedPreview,
                    width: fullW,
                    height: fullH,
                  }}
                >
                  <div
                    className="card-rotator"
                    style={{
                      width: unrotW,
                      height: unrotH,
                      left: (fullW - unrotW) / 2,
                      top: (fullH - unrotH) / 2,
                      transform: rotation ? `rotate(${rotation}deg)` : undefined,
                    }}
                  >
                    {showImage ? (
                      <img
                        src={src}
                        alt=""
                        onLoad={(e) => {
                          if (side !== 'back' || fillBleedBox) return
                          const img = e.currentTarget
                          const w = img.naturalWidth
                          const h = img.naturalHeight
                          if (w <= 0 || h <= 0) return
                          setBackSizeByUrl((prev) => {
                            const existing = prev[src]
                            if (existing?.width === w && existing?.height === h) return prev
                            return { ...prev, [src]: { width: w, height: h } }
                          })
                        }}
                        style={
                          fillBleedBox
                            ? { width: '100%', height: '100%', objectFit: 'fill' }
                            : widthPx > 0 && heightPx > 0
                              ? {
                                  position: 'absolute',
                                  left: (unrotW - widthPx * scale) / 2,
                                  top: (unrotH - heightPx * scale) / 2,
                                  width: widthPx * scale,
                                  height: heightPx * scale,
                                  objectFit: 'fill',
                                }
                              : { width: '100%', height: '100%', objectFit: 'contain' }
                        }
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })}
          {includeBleed ? (
            <div className="cut-guides-layer">
              {placements.map((placement) => renderCutGuides(placement, scale))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
