import {
  BLEED_PX,
  STAGE_EXPORT_HEIGHT,
  STAGE_EXPORT_WIDTH,
  TRIM_HEIGHT,
  TRIM_WIDTH,
} from '../authority/geometryAuthority'

export type ExportCanvasProvider = () => Promise<HTMLCanvasElement>

const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])

// 600 DPI = 23622 pixels per meter (rounded) for PNG pHYs.
const PHYS_PPM_600DPI = 23622

function u32be(n: number): Uint8Array {
  const out = new Uint8Array(4)
  out[0] = (n >>> 24) & 0xff
  out[1] = (n >>> 16) & 0xff
  out[2] = (n >>> 8) & 0xff
  out[3] = n & 0xff
  return out
}

function readU32be(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0
  )
}

function ascii4(s: string): Uint8Array {
  const out = new Uint8Array(4)
  for (let i = 0; i < 4; i++) out[i] = s.charCodeAt(i) & 0xff
  return out
}

// Standard CRC32 (PNG uses IEEE CRC-32 over chunk type + data).
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
    }
    t[n] = c >>> 0
  }
  return t
})()

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i++) {
    c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((s, p) => s + p.length, 0)
  const out = new Uint8Array(total)
  let o = 0
  for (const p of parts) {
    out.set(p, o)
    o += p.length
  }
  return out
}

type PngPhys = { xPpm: number; yPpm: number; unit: number }

function readPhysChunk(png: Uint8Array): PngPhys | null {
  // Signature (8) + chunks...
  let off = 8
  while (off + 8 <= png.length) {
    const len = readU32be(png, off)
    const type = String.fromCharCode(png[off + 4], png[off + 5], png[off + 6], png[off + 7])
    const dataOff = off + 8
    const crcOff = dataOff + len
    const next = crcOff + 4
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

function buildPhysChunk(xPpm: number, yPpm: number, unit: number): Uint8Array {
  const type = ascii4('pHYs')
  const data = concatBytes([u32be(xPpm), u32be(yPpm), new Uint8Array([unit & 0xff])])
  const length = u32be(data.length)
  const crc = u32be(crc32(concatBytes([type, data])))
  return concatBytes([length, type, data, crc])
}

function isPng(bytes: Uint8Array): boolean {
  if (bytes.length < PNG_SIGNATURE.length) return false
  for (let i = 0; i < PNG_SIGNATURE.length; i++) if (bytes[i] !== PNG_SIGNATURE[i]) return false
  return true
}

/**
 * Patch/insert PNG pHYs chunk for print DPI.
 * - If pHYs exists: replaces it.
 * - If missing: inserts immediately after IHDR.
 */
export async function patchPngPhysDpi(
  pngBlob: Blob,
  opts: { xPpm: number; yPpm: number; unit: 0 | 1 },
): Promise<Blob> {
  const src = new Uint8Array(await pngBlob.arrayBuffer())
  if (!isPng(src)) throw new Error('Not a PNG')

  const newPhys = buildPhysChunk(opts.xPpm, opts.yPpm, opts.unit)

  // Walk chunks to find IHDR and/or existing pHYs.
  let off = 8
  let ihdrEnd = -1
  let physStart = -1
  let physEnd = -1

  while (off + 8 <= src.length) {
    const len = readU32be(src, off)
    const type = String.fromCharCode(src[off + 4], src[off + 5], src[off + 6], src[off + 7])
    const dataOff = off + 8
    const crcOff = dataOff + len
    const next = crcOff + 4
    if (next > src.length) break

    if (type === 'IHDR') ihdrEnd = next
    if (type === 'pHYs') {
      physStart = off
      physEnd = next
      break
    }

    off = next
  }

  let outBytes: Uint8Array
  if (physStart >= 0 && physEnd > physStart) {
    outBytes = concatBytes([src.slice(0, physStart), newPhys, src.slice(physEnd)])
  } else {
    if (ihdrEnd < 0) throw new Error('Invalid PNG (missing IHDR)')
    outBytes = concatBytes([src.slice(0, ihdrEnd), newPhys, src.slice(ihdrEnd)])
  }

  const copy = new Uint8Array(outBytes.byteLength)
  copy.set(outBytes)
  return new Blob([copy.buffer], { type: 'image/png' })
}

export async function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/png')
  })
  if (!blob) throw new Error('PNG export failed')
  return blob
}

export type HighResExportOptions = {
  /** When false, output is cropped to trim (1500×2100 at 600 DPI). Default true. */
  includeBleed?: boolean
}

/**
 * Module 5.3 — Print-ready 600 DPI PNG export.
 * - Renders at exact 1650×2250 (full bleed) using the authoritative Konva export surface.
 * - With `includeBleed: false`, crops to trim rectangle; pHYs stays 600 DPI.
 * - Produces a Blob (avoids base64 memory overhead).
 */
export async function generateHighResExport(
  getCanvas: ExportCanvasProvider,
  opts?: HighResExportOptions,
): Promise<Blob> {
  const includeBleed = opts?.includeBleed !== false
  const canvas = await getCanvas()
  if (canvas.width !== STAGE_EXPORT_WIDTH || canvas.height !== STAGE_EXPORT_HEIGHT) {
    throw new Error(`Unexpected export canvas size: ${canvas.width}×${canvas.height}`)
  }

  let outCanvas: HTMLCanvasElement = canvas
  if (!includeBleed) {
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
    outCanvas = trimCanvas
  }

  const raw = await canvasToPngBlob(outCanvas)
  const patched = await patchPngPhysDpi(raw, { xPpm: PHYS_PPM_600DPI, yPpm: PHYS_PPM_600DPI, unit: 1 })

  // Strong validation: inspect bytes after patch.
  const phys = readPhysChunk(new Uint8Array(await patched.arrayBuffer()))
  if (!phys) throw new Error('PNG pHYs chunk missing after patch')
  if (phys.xPpm !== PHYS_PPM_600DPI || phys.yPpm !== PHYS_PPM_600DPI || phys.unit !== 1) {
    throw new Error(`PNG pHYs mismatch: x=${phys.xPpm} y=${phys.yPpm} unit=${phys.unit}`)
  }

  return patched
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

