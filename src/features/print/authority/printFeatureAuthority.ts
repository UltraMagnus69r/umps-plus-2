import type {
  PrintBackImageFit,
  PrintCutMark,
  PrintLayoutTemplate,
  PrintPageLayoutResult,
  PrintPlacement,
  PrintUploadedFrontCard,
} from '../types/printFeature'

const INCHES_TO_PX = 600
const CARD_WIDTH_PX = 1650
const CARD_HEIGHT_PX = 2250
const BLEED_PX = 75
const TRIM_WIDTH_PX = CARD_WIDTH_PX - BLEED_PX * 2
const TRIM_HEIGHT_PX = CARD_HEIGHT_PX - BLEED_PX * 2

/** Namespaced print layout authority (integrated from Proxy Print). */
export const printFeatureAuthority = {
  assets: {
    canonicalBackAssetPath: '/features/print/card-back.png',
  },
  page: {
    name: 'US Letter Portrait',
    widthIn: 8.5,
    heightIn: 11,
    dpi: INCHES_TO_PX,
    get widthPx() {
      return Math.round(this.widthIn * this.dpi)
    },
    get heightPx() {
      return Math.round(this.heightIn * this.dpi)
    },
  },
  margins: {
    topIn: 0.1,
    rightIn: 0.1,
    bottomIn: 0.1,
    leftIn: 0.1,
  },
  card: {
    widthPx: CARD_WIDTH_PX,
    heightPx: CARD_HEIGHT_PX,
    bleedPx: BLEED_PX,
    trimWidthPx: TRIM_WIDTH_PX,
    trimHeightPx: TRIM_HEIGHT_PX,
    trimInsetLeftPx: BLEED_PX,
    trimInsetTopPx: BLEED_PX,
    trimInsetRightPx: CARD_WIDTH_PX - BLEED_PX,
    trimInsetBottomPx: CARD_HEIGHT_PX - BLEED_PX,
  },
  spacing: {
    gapIn: 0.025,
    get gapPx() {
      return Math.round(this.gapIn * INCHES_TO_PX)
    },
  },
  cutGuides: {
    outsideBleedGapPx: 20,
    tickLengthPx: 40,
    tickThicknessPx: 2,
    previewMinTickLengthPx: 6,
    previewMinThicknessPx: 2,
  },
}

function getTrimBounds(placement: PrintPlacement) {
  return {
    trimLeftX: placement.xPx + printFeatureAuthority.card.bleedPx,
    trimRightX: placement.xPx + placement.widthPx - printFeatureAuthority.card.bleedPx,
    trimTopY: placement.yPx + printFeatureAuthority.card.bleedPx,
    trimBottomY: placement.yPx + placement.heightPx - printFeatureAuthority.card.bleedPx,
  }
}

type TemplateSlot = { xPx: number; yPx: number; widthPx: number; heightPx: number; rotationDeg: number }
function createCanonical8UpTemplate(): PrintLayoutTemplate {
  const frontSlots: TemplateSlot[] = [
    { xPx: 60, yPx: 60, widthPx: 1650, heightPx: 2250, rotationDeg: 0 },
    { xPx: 1725, yPx: 60, widthPx: 1650, heightPx: 2250, rotationDeg: 0 },
    { xPx: 3390, yPx: 60, widthPx: 1650, heightPx: 2250, rotationDeg: 0 },

    { xPx: 60, yPx: 2325, widthPx: 1650, heightPx: 2250, rotationDeg: 0 },
    { xPx: 1725, yPx: 2325, widthPx: 1650, heightPx: 2250, rotationDeg: 0 },
    { xPx: 3390, yPx: 2325, widthPx: 1650, heightPx: 2250, rotationDeg: 0 },

    { xPx: 300, yPx: 4733, widthPx: 2250, heightPx: 1650, rotationDeg: 90 },
    { xPx: 2550, yPx: 4733, widthPx: 2250, heightPx: 1650, rotationDeg: 90 },
  ]

  const backSlots: TemplateSlot[] = [
    { xPx: 3390, yPx: 60, widthPx: 1650, heightPx: 2250, rotationDeg: 0 },
    { xPx: 1725, yPx: 60, widthPx: 1650, heightPx: 2250, rotationDeg: 0 },
    { xPx: 60, yPx: 60, widthPx: 1650, heightPx: 2250, rotationDeg: 0 },

    { xPx: 3390, yPx: 2325, widthPx: 1650, heightPx: 2250, rotationDeg: 0 },
    { xPx: 1725, yPx: 2325, widthPx: 1650, heightPx: 2250, rotationDeg: 0 },
    { xPx: 60, yPx: 2325, widthPx: 1650, heightPx: 2250, rotationDeg: 0 },

    { xPx: 2550, yPx: 4733, widthPx: 2250, heightPx: 1650, rotationDeg: 90 },
    { xPx: 300, yPx: 4733, widthPx: 2250, heightPx: 1650, rotationDeg: 90 },
  ]

  return {
    id: 'canonical-8-up',
    label: 'Canonical 8-Up Layout',
    orientation: 'hybrid',
    columns: 3,
    rows: 3,
    gridLabel: 'Canonical 8-Up Layout',
    layoutDescription: 'Six portrait slots in a 3 x 2 block; two 90-degree rotated slots centered beneath.',
    capacity: frontSlots.length,
    frontSlots,
    backSlots,
  }
}

export function createPrintPagePlacements(frontCards: PrintUploadedFrontCard[]): PrintPageLayoutResult {
  const template = createCanonical8UpTemplate()
  const capacity = template.capacity
  const columns = template.columns
  const rows = template.rows
  const uploadedCount = frontCards.length
  const totalSheets = capacity > 0 ? Math.max(1, Math.ceil(uploadedCount / capacity)) : 1

  const sheets = Array.from({ length: totalSheets }, (_, sheetIndex) => {
    const sliceStart = sheetIndex * capacity
    const cards = frontCards.slice(sliceStart, sliceStart + capacity)

    const frontPlacements: PrintPlacement[] = cards.map((card, slotIndex) => ({
      id: `front-${sheetIndex}-${card.id}`,
      cardId: card.id,
      index: slotIndex,
      xPx: template.frontSlots[slotIndex].xPx,
      yPx: template.frontSlots[slotIndex].yPx,
      widthPx: template.frontSlots[slotIndex].widthPx,
      heightPx: template.frontSlots[slotIndex].heightPx,
      rotationDeg: template.frontSlots[slotIndex].rotationDeg,
    }))

    const backPlacements: PrintPlacement[] = cards.map((card, slotIndex) => ({
      id: `back-${sheetIndex}-${card.id}`,
      cardId: card.id,
      index: slotIndex,
      xPx: template.backSlots[slotIndex].xPx,
      yPx: template.backSlots[slotIndex].yPx,
      widthPx: template.backSlots[slotIndex].widthPx,
      heightPx: template.backSlots[slotIndex].heightPx,
      rotationDeg: template.backSlots[slotIndex].rotationDeg,
    }))

    return {
      sheetIndex,
      frontPlacements,
      backPlacements,
    }
  })
  const placedCount = sheets.reduce((acc, sheet) => acc + sheet.frontPlacements.length, 0)

  return {
    capacity,
    columns,
    rows,
    template,
    templateEvaluations: [],
    totalSheets,
    uploadedCount,
    placedCount,
    overflowCount: Math.max(0, uploadedCount - placedCount),
    spilloverCount: Math.max(0, uploadedCount - capacity),
    sheets,
  }
}

export function getPrintBackImageFit(sourceWidthPx: number, sourceHeightPx: number): PrintBackImageFit {
  const targetWidth = printFeatureAuthority.card.widthPx
  const targetHeight = printFeatureAuthority.card.heightPx

  if (sourceWidthPx <= 0 || sourceHeightPx <= 0) {
    return {
      drawWidthPx: targetWidth,
      drawHeightPx: targetHeight,
      offsetXPx: 0,
      offsetYPx: 0,
    }
  }

  const targetRatio = targetWidth / targetHeight
  const sourceRatio = sourceWidthPx / sourceHeightPx

  if (sourceRatio > targetRatio) {
    const drawHeightPx = targetHeight
    const drawWidthPx = Math.round(drawHeightPx * sourceRatio)
    return {
      drawWidthPx,
      drawHeightPx,
      offsetXPx: Math.round((targetWidth - drawWidthPx) / 2),
      offsetYPx: 0,
    }
  }

  const drawWidthPx = targetWidth
  const drawHeightPx = Math.round(drawWidthPx / sourceRatio)
  return {
    drawWidthPx,
    drawHeightPx,
    offsetXPx: 0,
    offsetYPx: Math.round((targetHeight - drawHeightPx) / 2),
  }
}

export function createPrintCutMarks(placement: PrintPlacement): PrintCutMark[] {
  const outsideBleedGapPx = printFeatureAuthority.cutGuides.outsideBleedGapPx
  const tickLength = printFeatureAuthority.cutGuides.tickLengthPx
  const tickThickness = printFeatureAuthority.cutGuides.tickThicknessPx
  const halfTickThickness = tickThickness / 2

  const { trimLeftX, trimRightX, trimTopY, trimBottomY } = getTrimBounds(placement)
  const tileLeftX = placement.xPx
  const tileRightX = placement.xPx + placement.widthPx
  const tileTopY = placement.yPx
  const tileBottomY = placement.yPx + placement.heightPx

  const topStartY = tileTopY - outsideBleedGapPx - tickLength
  const bottomStartY = tileBottomY + outsideBleedGapPx

  const leftStartX = tileLeftX - outsideBleedGapPx - tickLength
  const rightStartX = tileRightX + outsideBleedGapPx

  return [
    { xPx: trimLeftX - halfTickThickness, yPx: topStartY, widthPx: tickThickness, heightPx: tickLength },
    { xPx: trimRightX - halfTickThickness, yPx: topStartY, widthPx: tickThickness, heightPx: tickLength },
    { xPx: trimLeftX - halfTickThickness, yPx: bottomStartY, widthPx: tickThickness, heightPx: tickLength },
    { xPx: trimRightX - halfTickThickness, yPx: bottomStartY, widthPx: tickThickness, heightPx: tickLength },
    { xPx: leftStartX, yPx: trimTopY - halfTickThickness, widthPx: tickLength, heightPx: tickThickness },
    { xPx: leftStartX, yPx: trimBottomY - halfTickThickness, widthPx: tickLength, heightPx: tickThickness },
    { xPx: rightStartX, yPx: trimTopY - halfTickThickness, widthPx: tickLength, heightPx: tickThickness },
    { xPx: rightStartX, yPx: trimBottomY - halfTickThickness, widthPx: tickLength, heightPx: tickThickness },
  ]
}
