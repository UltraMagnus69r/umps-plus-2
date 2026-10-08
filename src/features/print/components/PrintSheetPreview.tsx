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

const PREVIEW_WIDTH = 520
const SCALE = PREVIEW_WIDTH / printFeatureAuthority.page.widthPx
const PREVIEW_HEIGHT = Math.round(printFeatureAuthority.page.heightPx * SCALE)
const BLEED_PREVIEW = printFeatureAuthority.card.bleedPx * SCALE

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

function renderCutGuides(placement: PrintPlacement) {
  const guides = createPrintCutMarks(placement)
  const minTickLength = printFeatureAuthority.cutGuides.previewMinTickLengthPx
  const minThickness = printFeatureAuthority.cutGuides.previewMinThicknessPx

  return guides.map((guide, index) => {
    const isHorizontal = guide.widthPx > guide.heightPx
    const scaledWidth = Math.round(guide.widthPx * SCALE)
    const scaledHeight = Math.round(guide.heightPx * SCALE)

    return (
      <span
        key={`${placement.id}-guide-${index}`}
        className="cut-guide"
        style={{
          left: guide.xPx * SCALE,
          top: guide.yPx * SCALE,
          width: isHorizontal ? Math.max(minTickLength, scaledWidth) : Math.max(minThickness, scaledWidth),
          height: isHorizontal ? Math.max(minThickness, scaledHeight) : Math.max(minTickLength, scaledHeight),
        }}
      />
    )
  })
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
  return (
    <section className="panel">
      <h2 className="sheet-title">{title}</h2>
      <p className="panel-subtitle">
        {side === 'front' ? 'The face of each proxy on this sheet.' : 'The shared back for each slot on this sheet.'}
      </p>
      <p className="sheet-instruction">{instruction}</p>
      <div className="sheet-frame">
        <div className="sheet-preview" style={{ width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT }}>
          {placements.map((placement) => {
            const front = getFrontCard(placement.cardId, frontCards)
            const src = side === 'front' ? (front?.url ?? '') : backAssetUrl
            const image = imageBox(side, placement, frontCards, backSourceSize, backFillsBleedBox)
            const rotation = placement.rotationDeg ?? 0
            const fullLeft = placement.xPx * SCALE
            const fullTop = placement.yPx * SCALE
            const fullW = placement.widthPx * SCALE
            const fullH = placement.heightPx * SCALE
            const unrotW = rotation ? fullH : fullW
            const unrotH = rotation ? fullW : fullH

            return (
              <div
                key={placement.id}
                className="card-tile"
                style={{
                  left: Math.round(includeBleed ? fullLeft : fullLeft + BLEED_PREVIEW),
                  top: Math.round(includeBleed ? fullTop : fullTop + BLEED_PREVIEW),
                  width: Math.round(includeBleed ? fullW : fullW - BLEED_PREVIEW * 2),
                  height: Math.round(includeBleed ? fullH : fullH - BLEED_PREVIEW * 2),
                }}
              >
                <div
                  className="card-slot"
                  style={{
                    left: includeBleed ? 0 : -BLEED_PREVIEW,
                    top: includeBleed ? 0 : -BLEED_PREVIEW,
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
                                left: (unrotW - image.widthPx * SCALE) / 2,
                                top: (unrotH - image.heightPx * SCALE) / 2,
                                width: image.widthPx * SCALE,
                                height: image.heightPx * SCALE,
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
              {placements.map((placement) => renderCutGuides(placement))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
