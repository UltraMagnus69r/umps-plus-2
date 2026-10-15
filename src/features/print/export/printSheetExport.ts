import { jsPDF } from 'jspdf'
import { exportCanvasPng600Dpi } from '../../../domain/export/png'
import { offerDownload } from '../../../utils/offerDownload'
import {
  createPrintCutMarks,
  frontImageIncludesBleed,
  printFeatureAuthority,
  resolveSlotBack,
  type PrintBuiltinBackId,
} from '../authority/printFeatureAuthority'
import type {
  PrintPlacement,
  PrintSheetLayout,
  PrintSheetSide,
  PrintUploadedFrontCard,
} from '../types/printFeature'

export interface PrintExportContext {
  frontCards: PrintUploadedFrontCard[]
  /** Fallback builtin for slots on `backMode: 'default'`. */
  sheetFallbackBackId?: PrintBuiltinBackId
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

async function buildFrontImageMap(frontCards: PrintUploadedFrontCard[]) {
  const map = new Map<string, HTMLImageElement>()
  const entries = await Promise.all(
    frontCards.map(async (card) => [card.id, await loadImage(card.url)] as const),
  )
  entries.forEach(([id, image]) => map.set(id, image))
  return map
}

/** Unique back URLs → images (default / magic / custom per slot). */
async function buildBackImageMap(
  frontCards: PrintUploadedFrontCard[],
  sheetFallbackBackId: PrintBuiltinBackId,
) {
  const urls = new Set<string>()
  frontCards.forEach((card) => {
    urls.add(resolveSlotBack(card, sheetFallbackBackId).url)
  })
  const map = new Map<string, HTMLImageElement>()
  await Promise.all(
    [...urls].map(async (url) => {
      map.set(url, await loadImage(url))
    }),
  )
  return map
}

function drawCardIntoSlot(
  ctx: CanvasRenderingContext2D,
  placement: PrintPlacement,
  image: HTMLImageElement,
  includeBleed: boolean,
  fillBleedBox: boolean,
) {
  const { xPx, yPx, widthPx, heightPx } = placement
  const rotationDeg = placement.rotationDeg ?? 0
  const bleed = printFeatureAuthority.card.bleedPx
  const sourceW = image.naturalWidth || image.width
  const sourceH = image.naturalHeight || image.height

  ctx.save()
  ctx.beginPath()
  if (includeBleed) {
    ctx.rect(xPx, yPx, widthPx, heightPx)
  } else {
    ctx.rect(xPx + bleed, yPx + bleed, widthPx - bleed * 2, heightPx - bleed * 2)
  }
  ctx.clip()
  ctx.fillStyle = '#000000'
  ctx.fillRect(xPx, yPx, widthPx, heightPx)

  const unrotatedW = rotationDeg ? heightPx : widthPx
  const unrotatedH = rotationDeg ? widthPx : heightPx
  if (rotationDeg) {
    ctx.translate(xPx + widthPx / 2, yPx + heightPx / 2)
    ctx.rotate((rotationDeg * Math.PI) / 180)
  }
  const originX = rotationDeg ? -unrotatedW / 2 : xPx
  const originY = rotationDeg ? -unrotatedH / 2 : yPx

  if (sourceW > 0 && sourceH > 0 && fillBleedBox) {
    const exactPixels = sourceW === unrotatedW && sourceH === unrotatedH && !rotationDeg
    ctx.imageSmoothingEnabled = !exactPixels
    if (!exactPixels) ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(image, originX, originY, unrotatedW, unrotatedH)
  } else if (sourceW > 0 && sourceH > 0) {
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(
      image,
      originX + (unrotatedW - sourceW) / 2,
      originY + (unrotatedH - sourceH) / 2,
      sourceW,
      sourceH,
    )
  }

  ctx.restore()
}

function getFrontCard(cardId: string, frontCards: PrintUploadedFrontCard[]) {
  return frontCards.find((card) => card.id === cardId)
}

async function renderSheetCanvas(
  side: PrintSheetSide,
  sheet: PrintSheetLayout,
  frontImageMap: Map<string, HTMLImageElement>,
  backImageMap: Map<string, HTMLImageElement>,
  frontCards: PrintUploadedFrontCard[],
  sheetFallbackBackId: PrintBuiltinBackId,
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
    if (side === 'front') {
      const image = frontImageMap.get(placement.cardId)
      if (!image) return
      const sourceW = image.naturalWidth || image.width
      const sourceH = image.naturalHeight || image.height
      drawCardIntoSlot(ctx, placement, image, includeBleedInExport, frontImageIncludesBleed(sourceW, sourceH))
      return
    }

    const card = getFrontCard(placement.cardId, frontCards)
    if (!card) return
    const resolved = resolveSlotBack(card, sheetFallbackBackId)
    const image = backImageMap.get(resolved.url)
    if (!image) return
    drawCardIntoSlot(ctx, placement, image, includeBleedInExport, resolved.fillBleedBox)
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

async function prepareMaps(context: PrintExportContext) {
  const sheetFallbackBackId = context.sheetFallbackBackId ?? 'default'
  const frontImageMap = await buildFrontImageMap(context.frontCards)
  const backImageMap = await buildBackImageMap(context.frontCards, sheetFallbackBackId)
  return { sheetFallbackBackId, frontImageMap, backImageMap }
}

export async function exportPrintFullSetPdf(context: PrintExportContext) {
  const includeBleedInExport = context.includeBleedInExport !== false
  const { sheetFallbackBackId, frontImageMap, backImageMap } = await prepareMaps(context)
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
    title: 'PipMint proxy sheets',
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
    const canvas = await renderSheetCanvas(
      'front',
      sheets[index],
      frontImageMap,
      backImageMap,
      context.frontCards,
      sheetFallbackBackId,
      includeBleedInExport,
    )
    addCanvasPage(canvas)
  }
  for (let index = 0; index < sheets.length; index += 1) {
    const canvas = await renderSheetCanvas(
      'back',
      sheets[index],
      frontImageMap,
      backImageMap,
      context.frontCards,
      sheetFallbackBackId,
      includeBleedInExport,
    )
    addCanvasPage(canvas)
  }

  const pdfBlob = pdf.output('blob')
  await offerDownload(pdfBlob, `${sheetBaseName(includeBleedInExport)}.pdf`)
}

export async function exportPrintFullSetPng(context: PrintExportContext) {
  const includeBleedInExport = context.includeBleedInExport !== false
  const { sheetFallbackBackId, frontImageMap, backImageMap } = await prepareMaps(context)
  const suffix = includeBleedInExport ? '' : '-trim'

  for (let index = 0; index < context.sheets.length; index += 1) {
    const sheet = context.sheets[index]
    const sheetNo = String(sheet.sheetIndex + 1).padStart(2, '0')
    for (const side of ['front', 'back'] as const) {
      const canvas = await renderSheetCanvas(
        side,
        sheet,
        frontImageMap,
        backImageMap,
        context.frontCards,
        sheetFallbackBackId,
        includeBleedInExport,
      )
      const blob = await exportCanvasPng600Dpi(canvas)
      await offerDownload(blob, `proxy-sheet-${sheetNo}-${side}${suffix}-600dpi.png`)
      await new Promise((resolve) => window.setTimeout(resolve, 300))
    }
  }
}
