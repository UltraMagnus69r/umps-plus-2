import { jsPDF } from 'jspdf'
import { exportCanvasPng600Dpi } from '../../../domain/export/png'
import {
  classifyPrintSource,
  coverFit,
  createPrintCutMarks,
  printFeatureAuthority,
} from '../authority/printFeatureAuthority'
import type {
  PrintPlacement,
  PrintSheetLayout,
  PrintSheetSide,
  PrintUploadedFrontCard,
} from '../types/printFeature'

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

function drawCardIntoSlot(
  ctx: CanvasRenderingContext2D,
  placement: PrintPlacement,
  image: HTMLImageElement,
  includeBleed: boolean,
) {
  const { xPx, yPx, widthPx, heightPx } = placement
  const rotationDeg = placement.rotationDeg ?? 0
  const bleed = printFeatureAuthority.card.bleedPx
  const sourceW = image.naturalWidth || image.width
  const sourceH = image.naturalHeight || image.height
  const fit = classifyPrintSource(sourceW, sourceH)

  ctx.save()
  ctx.beginPath()
  if (includeBleed) {
    ctx.rect(xPx, yPx, widthPx, heightPx)
  } else {
    ctx.rect(xPx + bleed, yPx + bleed, widthPx - bleed * 2, heightPx - bleed * 2)
  }
  ctx.clip()

  const unrotatedW = rotationDeg ? heightPx : widthPx
  const unrotatedH = rotationDeg ? widthPx : heightPx
  if (rotationDeg) {
    ctx.translate(xPx + widthPx / 2, yPx + heightPx / 2)
    ctx.rotate((rotationDeg * Math.PI) / 180)
  }
  const originX = rotationDeg ? -unrotatedW / 2 : xPx
  const originY = rotationDeg ? -unrotatedH / 2 : yPx

  const exactPixels = !rotationDeg && (fit === 'full-bleed' || fit === 'trim')
  ctx.imageSmoothingEnabled = !exactPixels
  if (!exactPixels) ctx.imageSmoothingQuality = 'high'

  if (fit === 'full-bleed') {
    ctx.drawImage(image, originX, originY, unrotatedW, unrotatedH)
  } else if (fit === 'trim') {
    ctx.drawImage(image, originX + bleed, originY + bleed, unrotatedW - bleed * 2, unrotatedH - bleed * 2)
  } else {
    const covered = coverFit(sourceW, sourceH, unrotatedW, unrotatedH)
    ctx.drawImage(
      image,
      originX + covered.offsetXPx,
      originY + covered.offsetYPx,
      covered.drawWidthPx,
      covered.drawHeightPx,
    )
  }

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
    if (!image) return
    drawCardIntoSlot(ctx, placement, image, includeBleedInExport)
  })

  if (includeBleedInExport) {
    ctx.fillStyle = '#0e0c12'
    placements.forEach((placement) => {
      createPrintCutMarks(placement).forEach((mark) => {
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

function sheetBaseName(includeBleed: boolean) {
  return includeBleed ? 'proxy-printer_sheets' : 'proxy-printer_sheets_trim'
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
  pdf.setProperties({
    title: 'UMPS proxy sheets',
    subject: 'US Letter at actual size. Print at 100% scale. Source is 600 DPI.',
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

  pdf.save(`${sheetBaseName(includeBleedInExport)}.pdf`)
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 15_000)
}

export async function exportPrintFullSetPng(context: PrintExportContext) {
  const includeBleedInExport = context.includeBleedInExport !== false
  const { frontImageMap, backImage } = await buildImageMap(context.frontCards, context.backAssetUrl)
  const suffix = includeBleedInExport ? '' : '-trim'

  for (let index = 0; index < context.sheets.length; index += 1) {
    const sheet = context.sheets[index]
    const sheetNo = String(sheet.sheetIndex + 1).padStart(2, '0')
    for (const side of ['front', 'back'] as const) {
      const canvas = await renderSheetCanvas(side, sheet, frontImageMap, backImage, includeBleedInExport)
      const blob = await exportCanvasPng600Dpi(canvas)
      downloadBlob(blob, `proxy-sheet-${sheetNo}-${side}${suffix}-600dpi.png`)
      await new Promise((resolve) => window.setTimeout(resolve, 300))
    }
  }
}
