import { createPrintCutMarks, getPrintBackImageFit, printFeatureAuthority } from '../authority/printFeatureAuthority'
import type { PrintPlacement, PrintSheetSide, PrintUploadedFrontCard } from '../types/printFeature'

interface PrintSheetPreviewProps {
  title: string
  instruction: string
  side: PrintSheetSide
  placements: PrintPlacement[]
  frontCards: PrintUploadedFrontCard[]
  backAssetUrl: string
  backSourceSize: { width: number; height: number }
}

const PREVIEW_WIDTH = 520
const SCALE = PREVIEW_WIDTH / printFeatureAuthority.page.widthPx
const PREVIEW_HEIGHT = Math.round(printFeatureAuthority.page.heightPx * SCALE)

function getFrontCardUrl(cardId: string, frontCards: PrintUploadedFrontCard[]) {
  return frontCards.find((card) => card.id === cardId)?.url ?? ''
}

function getRotatedImageStyle(placement: PrintPlacement) {
  const tileWidth = Math.round(placement.widthPx * SCALE)
  const tileHeight = Math.round(placement.heightPx * SCALE)
  const rotatedImageWidth = Math.round(placement.heightPx * SCALE)
  const rotatedImageHeight = Math.round(placement.widthPx * SCALE)

  return {
    position: 'absolute' as const,
    width: rotatedImageWidth,
    height: rotatedImageHeight,
    left: Math.round((tileWidth - rotatedImageWidth) / 2),
    top: Math.round((tileHeight - rotatedImageHeight) / 2),
    transform: `rotate(${placement.rotationDeg}deg)`,
    transformOrigin: 'center',
  }
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
          width: isHorizontal
            ? Math.max(minTickLength, scaledWidth)
            : Math.max(minThickness, scaledWidth),
          height: isHorizontal
            ? Math.max(minThickness, scaledHeight)
            : Math.max(minTickLength, scaledHeight),
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
}: PrintSheetPreviewProps) {
  const backFit = getPrintBackImageFit(backSourceSize.width, backSourceSize.height)

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
            const frontUrl = getFrontCardUrl(placement.cardId, frontCards)
            return (
              <div
                key={placement.id}
                className="card-tile"
                style={{
                  left: Math.round(placement.xPx * SCALE),
                  top: Math.round(placement.yPx * SCALE),
                  width: Math.round(placement.widthPx * SCALE),
                  height: Math.round(placement.heightPx * SCALE),
                }}
              >
                {side === 'front' ? (
                  <img
                    src={frontUrl}
                    alt=""
                    style={placement.rotationDeg ? getRotatedImageStyle(placement) : undefined}
                  />
                ) : (
                  <img
                    src={backAssetUrl}
                    alt=""
                    style={{
                      width: Math.round(backFit.drawWidthPx * SCALE),
                      height: Math.round(backFit.drawHeightPx * SCALE),
                      left: Math.round(backFit.offsetXPx * SCALE),
                      top: Math.round(backFit.offsetYPx * SCALE),
                      position: 'absolute',
                      ...(placement.rotationDeg ? getRotatedImageStyle(placement) : {}),
                    }}
                  />
                )}
              </div>
            )
          })}
          <div className="cut-guides-layer">
            {placements.map((placement) => renderCutGuides(placement))}
          </div>
        </div>
      </div>
    </section>
  )
}
