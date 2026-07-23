import { jsPDF } from 'jspdf'
import { createPrintCutMarks, printFeatureAuthority } from '../authority/printFeatureAuthority'
import type { PrintPlacement, PrintSheetLayout, PrintSheetSide, PrintUploadedFrontCard } from '../types/printFeature'

export interface PrintExportContext {
  frontCards: PrintUploadedFrontCard[]
  backAssetUrl: string
  sheets: PrintSheetLayout[]
  /** When false, each card is clipped to trim (no bleed margin); cut marks are omitted. Default true. */
  includeBleedInExport?: boolean
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Failed to load image: ${url}`))
    image.src = url
  })
}

async function buildImageMap(frontCards: PrintUploadedFrontCard[], backAssetUrl: string) {
  const map = new Map<string, HTMLImageElement>()
  const entries = await Promise.all(
    frontCards.map(async (card) => [card.id, await loadImage(card.url)] as const),
  )
  entries.forEach(([id, image]) => map.set(id, image))
  const backImage = await loadImage(backAssetUrl)
  return { frontImageMap: map, backImage }
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const scale = Math.max(width / image.width, height / image.height)
  const drawWidth = image.width * scale
  const drawHeight = image.height * scale
  const offsetX = x + (width - drawWidth) / 2
  const offsetY = y + (height - drawHeight) / 2
  ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight)
}

function drawPlacementImage(
  ctx: CanvasRenderingContext2D,
  placement: PrintPlacement,
  image: HTMLImageElement,
  includeBleed: boolean,
) {
  const { xPx, yPx, widthPx, heightPx } = placement
  const rotationDeg = placement.rotationDeg ?? 0
  const b = printFeatureAuthority.card.bleedPx

  ctx.save()
  ctx.beginPath()
  if (includeBleed) {
    ctx.rect(xPx, yPx, widthPx, heightPx)
  } else {
    ctx.rect(xPx + b, yPx + b, widthPx - b * 2, heightPx - b * 2)
  }
  ctx.clip()

  if (rotationDeg === 0) {
    drawImageCover(ctx, image, xPx, yPx, widthPx, heightPx)
    ctx.restore()
    return
  }

  const cx = xPx + widthPx / 2
  const cy = yPx + heightPx / 2
  const drawAreaWidth = heightPx
  const drawAreaHeight = widthPx

  ctx.translate(cx, cy)
  ctx.rotate((rotationDeg * Math.PI) / 180)
  drawImageCover(ctx, image, -drawAreaWidth / 2, -drawAreaHeight / 2, drawAreaWidth, drawAreaHeight)
  ctx.restore()
}

async function renderSheetCanvas(
  side: PrintSheetSide,
  sheet: PrintSheetLayout,
  frontImageMap: Map<string, HTMLImageElement>,
  backImage: HTMLImageElement,
  includeBleedInExport: boolean,
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas')
  canvas.width = printFeatureAuthority.page.widthPx
  canvas.height = printFeatureAuthority.page.heightPx

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to create canvas context.')
  }

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const placements = side === 'front' ? sheet.frontPlacements : sheet.backPlacements
  placements.forEach((placement) => {
    const image = side === 'front' ? frontImageMap.get(placement.cardId) : backImage
    if (!image) {
      return
    }
    drawPlacementImage(ctx, placement, image, includeBleedInExport)
  })

  if (includeBleedInExport) {
    ctx.fillStyle = '#0e0c12'
    placements.forEach((placement) => {
      const marks = createPrintCutMarks(placement)
      marks.forEach((mark) => {
        ctx.fillRect(mark.xPx, mark.yPx, mark.widthPx, mark.heightPx)
      })
    })
  }

  return canvas
}

function pageSizePt() {
  const dpi = printFeatureAuthority.page.dpi
  return {
    wPt: (printFeatureAuthority.page.widthPx / dpi) * 72,
    hPt: (printFeatureAuthority.page.heightPx / dpi) * 72,
  }
}

export async function exportPrintFullSetPdf(context: PrintExportContext) {
  const includeBleedInExport = context.includeBleedInExport !== false
  const { frontImageMap, backImage } = await buildImageMap(context.frontCards, context.backAssetUrl)
  const { sheets } = context
  const { wPt, hPt } = pageSizePt()
  const orientation = wPt > hPt ? 'landscape' : 'portrait'

  const pdf = new jsPDF({
    unit: 'pt',
    format: [wPt, hPt],
    orientation,
    compress: true,
  })

  let first = true
  const addCanvasPage = (canvas: HTMLCanvasElement) => {
    if (!first) {
      pdf.addPage([wPt, hPt], orientation === 'landscape' ? 'l' : 'p')
    }
    first = false
    pdf.addImage(canvas, 'PNG', 0, 0, wPt, hPt, undefined, 'SLOW')
  }

  for (let index = 0; index < sheets.length; index += 1) {
    const canvas = await renderSheetCanvas('front', sheets[index], frontImageMap, backImage, includeBleedInExport)
    addCanvasPage(canvas)
  }
  for (let index = 0; index < sheets.length; index += 1) {
    const canvas = await renderSheetCanvas('back', sheets[index], frontImageMap, backImage, includeBleedInExport)
    addCanvasPage(canvas)
  }

  const baseName = includeBleedInExport ? 'proxy-printer_sheets.pdf' : 'proxy-printer_sheets_trim.pdf'
  pdf.save(baseName)
}
