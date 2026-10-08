import {
  BLEED_PX,
  DPI,
  STAGE_HEIGHT,
  STAGE_WIDTH,
  TRIM_HEIGHT,
  TRIM_WIDTH,
} from '../../../domain/geometry/constants'
import type {
  PrintBackImageFit,
  PrintCutMark,
  PrintLayoutTemplate,
  PrintPageLayoutResult,
  PrintPlacement,
  PrintSourceFit,
  PrintUploadedFrontCard,
} from '../types/printFeature'

const PAGE_WIDTH_IN = 8.5
const PAGE_HEIGHT_IN = 11
const PAGE_WIDTH_PX = Math.round(PAGE_WIDTH_IN * DPI)
const PAGE_HEIGHT_PX = Math.round(PAGE_HEIGHT_IN * DPI)

/**
 * Crop marks sit just outside the bleed and extend this far past the card tile.
 * Must stay ≤ bleed so a zero-gap neighbor still keeps the mark out of its trim.
 */
const MARK_OUTSIDE_GAP_PX = 20
const MARK_LENGTH_PX = 40
const MARK_REACH_PX = MARK_OUTSIDE_GAP_PX + MARK_LENGTH_PX

/** Namespaced print layout authority. Card pixels match the PLUS-1 600 DPI exporter. */
export const printFeatureAuthority = {
  assets: {
    canonicalBackAssetPath: '/assets/print/card-back.png',
  },
  page: {
    name: 'US Letter Portrait',
    widthIn: PAGE_WIDTH_IN,
    heightIn: PAGE_HEIGHT_IN,
    dpi: DPI,
    widthPx: PAGE_WIDTH_PX,
    heightPx: PAGE_HEIGHT_PX,
  },
  margins: {
    /** Equal side margin of the 3-across block. Three full-bleed cards leave only this much. */
    portraitSidePx: Math.floor((PAGE_WIDTH_PX - 3 * STAGE_WIDTH) / 2),
    topPx: 75,
    bottomPx: 75,
  },
  card: {
    widthPx: STAGE_WIDTH,
    heightPx: STAGE_HEIGHT,
    bleedPx: BLEED_PX,
    trimWidthPx: TRIM_WIDTH,
    trimHeightPx: TRIM_HEIGHT,
    trimInsetLeftPx: BLEED_PX,
    trimInsetTopPx: BLEED_PX,
    trimInsetRightPx: STAGE_WIDTH - BLEED_PX,
    trimInsetBottomPx: STAGE_HEIGHT - BLEED_PX,
  },
  spacing: {
    /** Portrait columns touch at the bleed edge. Any gap would push the outer marks off the page. */
    portraitGapPx: 0,
    /** White gutter between the two portrait rows. Wide enough for both rows' crop marks. */
    portraitRowGapPx: MARK_REACH_PX * 2,
    /** White gutter between the two sideways cards. */
    rotatedGapPx: MARK_REACH_PX * 2,
  },
  cutGuides: {
    outsideBleedGapPx: MARK_OUTSIDE_GAP_PX,
    tickLengthPx: MARK_LENGTH_PX,
    tickThicknessPx: 2,
    reachPx: MARK_REACH_PX,
    previewMinTickLengthPx: 6,
    previewMinThicknessPx: 2,
  },
}

export const letterSheetLayoutFacts = {
  cardsPerSheet: 8,
  gridLabel: '8-up',
  summary: 'Six portrait cards in a 3×2 block, plus two sideways cards on the bottom row.',
  geometry:
    'Each card is the PLUS-1 size: 2.75×3.75 in full bleed (1650×2250 at 600 DPI), trim 2.5×3.5 in, bleed 0.125 in per side.',
  whyNotNine:
    'A 3×3 nine-up is 3 × 3.75 in = 11.25 in tall. US Letter is 11 in, so nine cards fit only by shrinking the card or cutting into the bleed. Eight is the densest sheet that keeps true size, the full bleed, and cut marks outside the trim. The three columns touch at the bleed edge — letter is only 0.25 in wider than 3 × 2.75 in — so the marks between columns land in the bleed, not on the finished card. The rows have a white gutter so those marks sit on paper.',
} as const

type TemplateSlot = { xPx: number; yPx: number; widthPx: number; heightPx: number; rotationDeg: number }

type Rect = { x: number; y: number; w: number; h: number }

function assertFit(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Print sheet layout: ${message}`)
  }
}

function rectsIntersect(a: Rect, b: Rect) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

function trimRect(slot: TemplateSlot): Rect {
  return {
    x: slot.xPx + BLEED_PX,
    y: slot.yPx + BLEED_PX,
    w: slot.widthPx - BLEED_PX * 2,
    h: slot.heightPx - BLEED_PX * 2,
  }
}

function markReachRect(slot: TemplateSlot): Rect {
  const reach = printFeatureAuthority.cutGuides.reachPx
  return {
    x: slot.xPx - reach,
    y: slot.yPx - reach,
    w: slot.widthPx + reach * 2,
    h: slot.heightPx + reach * 2,
  }
}

function assertSlotsFit(slots: TemplateSlot[], label: string) {
  const pageW = printFeatureAuthority.page.widthPx
  const pageH = printFeatureAuthority.page.heightPx
  slots.forEach((slot, index) => {
    const reach = markReachRect(slot)
    assertFit(reach.x >= 0 && reach.y >= 0, `${label} slot ${index} crop marks start off the page`)
    assertFit(
      reach.x + reach.w <= pageW && reach.y + reach.h <= pageH,
      `${label} slot ${index} crop marks run off the page`,
    )
    assertFit(slot.widthPx > BLEED_PX * 2 && slot.heightPx > BLEED_PX * 2, `${label} slot ${index} is smaller than its bleed`)
  })

  for (let i = 0; i < slots.length; i += 1) {
    for (let j = i + 1; j < slots.length; j += 1) {
      const a = slots[i]
      const b = slots[j]
      assertFit(
        !rectsIntersect(
          { x: a.xPx, y: a.yPx, w: a.widthPx, h: a.heightPx },
          { x: b.xPx, y: b.yPx, w: b.widthPx, h: b.heightPx },
        ),
        `${label} slots ${i} and ${j} overlap`,
      )
      assertFit(
        !rectsIntersect(markReachRect(a), trimRect(b)) && !rectsIntersect(markReachRect(b), trimRect(a)),
        `${label} crop marks of slots ${i} and ${j} cross a trim box`,
      )
    }
  }
}

function mirrorSlot(slot: TemplateSlot): TemplateSlot {
  return {
    ...slot,
    xPx: printFeatureAuthority.page.widthPx - slot.xPx - slot.widthPx,
  }
}

/**
 * Densest safe US Letter imposition at PLUS-1 full bleed.
 * Nine-up is rejected by the height check below; do not "make it fit" by scaling.
 */
function createLetter8UpTemplate(): PrintLayoutTemplate {
  const cardW = STAGE_WIDTH
  const cardH = STAGE_HEIGHT
  const pageW = PAGE_WIDTH_PX
  const pageH = PAGE_HEIGHT_PX
  const { portraitGapPx, portraitRowGapPx, rotatedGapPx } = printFeatureAuthority.spacing
  const { topPx, bottomPx } = printFeatureAuthority.margins

  const nineUpHeight = 3 * cardH
  assertFit(
    nineUpHeight > pageH,
    '9-up unexpectedly fits; re-check before keeping the 8-up cap',
  )

  const cols = 3
  const portraitSpan = cols * cardW + (cols - 1) * portraitGapPx
  const marginX = Math.floor((pageW - portraitSpan) / 2)
  assertFit(marginX * 2 + portraitSpan === pageW, 'portrait block is not centered on the page')

  const portraitYs = [0, 1].map((row) => topPx + row * (cardH + portraitRowGapPx))
  const frontSlots: TemplateSlot[] = []
  portraitYs.forEach((yPx) => {
    for (let col = 0; col < cols; col += 1) {
      frontSlots.push({
        xPx: marginX + col * (cardW + portraitGapPx),
        yPx,
        widthPx: cardW,
        heightPx: cardH,
        rotationDeg: 0,
      })
    }
  })

  const rotatedWidth = cardH
  const rotatedHeight = cardW
  const rotatedY = pageH - bottomPx - rotatedHeight
  const portraitBottom = portraitYs[portraitYs.length - 1] + cardH
  assertFit(rotatedY >= portraitBottom, 'sideways row overlaps the portrait block')

  const rotatedSpan = rotatedWidth * 2 + rotatedGapPx
  const rotatedX = Math.floor((pageW - rotatedSpan) / 2)
  frontSlots.push(
    { xPx: rotatedX, yPx: rotatedY, widthPx: rotatedWidth, heightPx: rotatedHeight, rotationDeg: 90 },
    {
      xPx: rotatedX + rotatedWidth + rotatedGapPx,
      yPx: rotatedY,
      widthPx: rotatedWidth,
      heightPx: rotatedHeight,
      rotationDeg: 90,
    },
  )

  const backSlots = frontSlots.map(mirrorSlot)
  assertSlotsFit(frontSlots, 'front')
  assertSlotsFit(backSlots, 'back')

  return {
    id: 'letter-8-up',
    label: 'Letter 8-up',
    orientation: 'hybrid',
    columns: 3,
    rows: 3,
    gridLabel: letterSheetLayoutFacts.gridLabel,
    layoutDescription: `${letterSheetLayoutFacts.summary} ${letterSheetLayoutFacts.whyNotNine}`,
    capacity: frontSlots.length,
    frontSlots,
    backSlots,
  }
}

const letterTemplate = createLetter8UpTemplate()

function getTrimBounds(placement: PrintPlacement) {
  const bleed = printFeatureAuthority.card.bleedPx
  return {
    trimLeftX: placement.xPx + bleed,
    trimRightX: placement.xPx + placement.widthPx - bleed,
    trimTopY: placement.yPx + bleed,
    trimBottomY: placement.yPx + placement.heightPx - bleed,
  }
}

export function createPrintPagePlacements(frontCards: PrintUploadedFrontCard[]): PrintPageLayoutResult {
  const template = letterTemplate
  const capacity = template.capacity
  const uploadedCount = frontCards.length
  const totalSheets = capacity > 0 ? Math.max(1, Math.ceil(uploadedCount / capacity)) : 1

  const sheets = Array.from({ length: totalSheets }, (_, sheetIndex) => {
    const sliceStart = sheetIndex * capacity
    const cards = frontCards.slice(sliceStart, sliceStart + capacity)

    const frontPlacements: PrintPlacement[] = cards.map((card, slotIndex) => ({
      id: `front-${sheetIndex}-${card.id}`,
      cardId: card.id,
      index: slotIndex,
      ...template.frontSlots[slotIndex],
    }))

    const backPlacements: PrintPlacement[] = cards.map((card, slotIndex) => ({
      id: `back-${sheetIndex}-${card.id}`,
      cardId: card.id,
      index: slotIndex,
      ...template.backSlots[slotIndex],
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
    columns: template.columns,
    rows: template.rows,
    template,
    templateEvaluations: [
      {
        templateId: template.id,
        label: template.label,
        columns: template.columns,
        rows: template.rows,
        capacity,
        valid: true,
      },
    ],
    totalSheets,
    uploadedCount,
    placedCount,
    overflowCount: Math.max(0, uploadedCount - placedCount),
    spilloverCount: Math.max(0, uploadedCount - capacity),
    sheets,
  }
}

export function classifyPrintSource(sourceWidthPx: number, sourceHeightPx: number): PrintSourceFit {
  if (sourceWidthPx === STAGE_WIDTH && sourceHeightPx === STAGE_HEIGHT) return 'full-bleed'
  if (sourceWidthPx === TRIM_WIDTH && sourceHeightPx === TRIM_HEIGHT) return 'trim'
  return 'cover'
}

export function coverFit(
  sourceWidthPx: number,
  sourceHeightPx: number,
  targetWidthPx: number,
  targetHeightPx: number,
): PrintBackImageFit {
  if (sourceWidthPx <= 0 || sourceHeightPx <= 0) {
    return {
      drawWidthPx: targetWidthPx,
      drawHeightPx: targetHeightPx,
      offsetXPx: 0,
      offsetYPx: 0,
    }
  }

  const targetRatio = targetWidthPx / targetHeightPx
  const sourceRatio = sourceWidthPx / sourceHeightPx

  if (sourceRatio > targetRatio) {
    const drawHeightPx = targetHeightPx
    const drawWidthPx = Math.round(drawHeightPx * sourceRatio)
    return {
      drawWidthPx,
      drawHeightPx,
      offsetXPx: Math.round((targetWidthPx - drawWidthPx) / 2),
      offsetYPx: 0,
    }
  }

  const drawWidthPx = targetWidthPx
  const drawHeightPx = Math.round(drawWidthPx / sourceRatio)
  return {
    drawWidthPx,
    drawHeightPx,
    offsetXPx: 0,
    offsetYPx: Math.round((targetHeightPx - drawHeightPx) / 2),
  }
}

export function getPrintBackImageFit(sourceWidthPx: number, sourceHeightPx: number): PrintBackImageFit {
  return coverFit(
    sourceWidthPx,
    sourceHeightPx,
    printFeatureAuthority.card.widthPx,
    printFeatureAuthority.card.heightPx,
  )
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
