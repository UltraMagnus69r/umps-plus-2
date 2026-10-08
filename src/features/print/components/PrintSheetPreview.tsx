import { useLayoutEffect, useRef, useState } from 'react'
import { createPrintCutMarks, frontImageIncludesBleed, printFeatureAuthority } from '../authority/printFeatureAuthority'
import type { PrintPlacement, PrintSheetSide, PrintUploadedFrontCard } from '../types/printFeature'

interface PrintSheetPreviewProps {
  title: string
  instruction: string
  side: PrintSheetSide
  placements: PrintPlacement[]
  frontCards: PrintUploadedFrontCard[]
  backAssetUrl: string
  backSourceSize: { width: number; height: number }
  backFillsBleedBox: boolean
  includeBleed: boolean
}

const PREVIEW_MAX_WIDTH = 520

function getFrontCard(cardId: string, frontCards: PrintUploadedFrontCard[]) {
  return frontCards.find((card) => card.id === cardId)
}

function imageBox(
  side: PrintSheetSide,
  placement: PrintPlacement,
  frontCards: PrintUploadedFrontCard[],
  backSourceSize: { width: number; height: number },
  backFillsBleedBox: boolean,
) {
  if (side === 'back') {
    return { widthPx: backSourceSize.width, heightPx: backSourceSize.height, fillBleedBox: backFillsBleedBox }
  }
  const card = getFrontCard(placement.cardId, frontCards)
  const widthPx = card?.widthPx ?? 0
  const heightPx = card?.heightPx ?? 0
  return { widthPx, heightPx, fillBleedBox: frontImageIncludesBleed(widthPx, heightPx) }
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

/** Column width, not the preview's own box. A fixed 520px child must not widen the measure. */
function availablePreviewWidth(frame: HTMLElement): number {
  const panel = frame.closest('.panel')
  const basis = panel instanceof HTMLElement ? panel : frame
  const framePad = horizontalPadding(frame)
  const basisPad = basis === frame ? framePad : horizontalPadding(basis)
  const inner = basis.clientWidth - basisPad - (basis === frame ? 0 : framePad)
  return Math.max(1, Math.min(PREVIEW_MAX_WIDTH, inner))
}

export function PrintSheetPreview({
  title,
  instruction,
  side,
  placements,
  frontCards,
  backAssetUrl,
  backSourceSize,
  backFillsBleedBox,
  includeBleed,
}: PrintSheetPreviewProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const [previewWidth, setPreviewWidth] = useState(PREVIEW_MAX_WIDTH)

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
    return () => observer.disconnect()
  }, [])

  const scale = previewWidth / printFeatureAuthority.page.widthPx
  const previewHeight = Math.round(printFeatureAuthority.page.heightPx * scale)
  const bleedPreview = printFeatureAuthority.card.bleedPx * scale

  return (
    <section className="panel">
      <h2 className="sheet-title">{title}</h2>
      <p className="panel-subtitle">
        {side === 'front' ? 'The face of each proxy on this sheet.' : 'The shared back for each slot on this sheet.'}
      </p>
      <p className="sheet-instruction">{instruction}</p>
      <div className="sheet-frame" ref={frameRef}>
        <div className="sheet-preview" style={{ width: previewWidth, height: previewHeight }}>
          {placements.map((placement) => {
            const front = getFrontCard(placement.cardId, frontCards)
            const src = side === 'front' ? (front?.url ?? '') : backAssetUrl
            const image = imageBox(side, placement, frontCards, backSourceSize, backFillsBleedBox)
            const rotation = placement.rotationDeg ?? 0
            const fullLeft = placement.xPx * scale
            const fullTop = placement.yPx * scale
            const fullW = placement.widthPx * scale
            const fullH = placement.heightPx * scale
            const unrotW = rotation ? fullH : fullW
            const unrotH = rotation ? fullW : fullH

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
                    {image.widthPx > 0 && image.heightPx > 0 ? (
                      <img
                        src={src}
                        alt=""
                        style={
                          image.fillBleedBox
                            ? { width: '100%', height: '100%', objectFit: 'fill' }
                            : {
                                position: 'absolute',
                                left: (unrotW - image.widthPx * scale) / 2,
                                top: (unrotH - image.heightPx * scale) / 2,
                                width: image.widthPx * scale,
                                height: image.heightPx * scale,
                                objectFit: 'fill',
                              }
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
