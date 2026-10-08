import {
  BLEED_PX,
  PHYS_PPM_600DPI,
  STAGE_HEIGHT,
  STAGE_WIDTH,
  TRIM_HEIGHT,
  TRIM_WIDTH,
} from '../domain/geometry/constants'
import {
  canvasToPngBlob,
  downloadBlob,
  exportCanvasPng600Dpi,
  patchPngPhysDpi,
} from '../domain/export/png'

export type ExportCanvasProvider = () => Promise<HTMLCanvasElement>

export { canvasToPngBlob, downloadBlob, exportCanvasPng600Dpi, patchPngPhysDpi }

function readU32be(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0
  )
}

type PngPhys = { xPpm: number; yPpm: number; unit: number }

function readPhysChunk(png: Uint8Array): PngPhys | null {
  let off = 8
  while (off + 8 <= png.length) {
    const len = readU32be(png, off)
    const type = String.fromCharCode(png[off + 4], png[off + 5], png[off + 6], png[off + 7])
    const dataOff = off + 8
    const next = dataOff + len + 4
    if (next > png.length) break
    if (type === 'pHYs') {
      if (len !== 9) return null
      const xPpm = readU32be(png, dataOff)
      const yPpm = readU32be(png, dataOff + 4)
      const unit = png[dataOff + 8]
      return { xPpm, yPpm, unit }
    }
    off = next
  }
  return null
}

export type HighResExportOptions = {
  /** When false, output is cropped to trim (1500×2100 at 600 DPI). Default true. */
  includeBleed?: boolean
}

/**
 * Module 5.3 — Print-ready 600 DPI PNG export.
 * Full-bleed output uses the UMPS-PLUS-1 `exportCanvasPng600Dpi` path (pHYs 23622).
 * Trim crop stays available; the same pHYs patch is applied after the crop.
 */
export async function generateHighResExport(
  getCanvas: ExportCanvasProvider,
  opts?: HighResExportOptions,
): Promise<Blob> {
  const includeBleed = opts?.includeBleed !== false
  const canvas = await getCanvas()
  if (canvas.width !== STAGE_WIDTH || canvas.height !== STAGE_HEIGHT) {
    throw new Error(`Unexpected export canvas size: ${canvas.width}×${canvas.height}`)
  }

  let patched: Blob
  if (includeBleed) {
    patched = await exportCanvasPng600Dpi(canvas)
  } else {
    const trimCanvas = document.createElement('canvas')
    trimCanvas.width = TRIM_WIDTH
    trimCanvas.height = TRIM_HEIGHT
    const tctx = trimCanvas.getContext('2d')
    if (!tctx) throw new Error('Failed to create canvas context for trim export.')
    tctx.drawImage(
      canvas,
      BLEED_PX,
      BLEED_PX,
      TRIM_WIDTH,
      TRIM_HEIGHT,
      0,
      0,
      TRIM_WIDTH,
      TRIM_HEIGHT,
    )
    const raw = await canvasToPngBlob(trimCanvas)
    patched = await patchPngPhysDpi(raw)
  }

  const phys = readPhysChunk(new Uint8Array(await patched.arrayBuffer()))
  if (!phys) throw new Error('PNG pHYs chunk missing after patch')
  if (phys.xPpm !== PHYS_PPM_600DPI || phys.yPpm !== PHYS_PPM_600DPI || phys.unit !== 1) {
    throw new Error(`PNG pHYs mismatch: x=${phys.xPpm} y=${phys.yPpm} unit=${phys.unit}`)
  }

  return patched
}
