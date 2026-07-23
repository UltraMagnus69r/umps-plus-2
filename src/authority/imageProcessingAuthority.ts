const ACCEPTED_INPUT_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp'])
const OUTPUT_MIME_TYPE = 'image/png'
const MAX_WORKING_DIMENSION_PX = 8192

export enum ProcessingStage {
  NORMALIZE_FORMAT = 'NORMALIZE_FORMAT',
  NORMALIZE_SIZE = 'NORMALIZE_SIZE',
  PRE_PROCESS = 'PRE_PROCESS',
  POST_PROCESS = 'POST_PROCESS',
}

export type ProcessedImageResult = {
  normalizedDataUrl: string
  intrinsicWidth: number
  intrinsicHeight: number
  mimeType: string
}

export type ImageProcessingHook = (input: ProcessedImageResult) => Promise<ProcessedImageResult>

type NormalizedImage = {
  image: HTMLImageElement
  intrinsicWidth: number
  intrinsicHeight: number
}

const preProcessHooks: ImageProcessingHook[] = []
const postProcessHooks: ImageProcessingHook[] = []

function isSupportedMimeType(mimeType: string): boolean {
  return ACCEPTED_INPUT_MIME_TYPES.has(mimeType.toLowerCase())
}

function validateHookResult(
  value: ProcessedImageResult,
  stage: ProcessingStage,
  hookIndex: number,
): ProcessedImageResult {
  if (!value || typeof value !== 'object') {
    throw new Error(`Image hook failed at ${stage}[${hookIndex}]: invalid result object`)
  }
  const normalizedDataUrl = String(value.normalizedDataUrl ?? '').trim()
  if (!normalizedDataUrl) {
    throw new Error(`Image hook failed at ${stage}[${hookIndex}]: empty normalizedDataUrl`)
  }
  const intrinsicWidth = Math.floor(Number(value.intrinsicWidth))
  const intrinsicHeight = Math.floor(Number(value.intrinsicHeight))
  if (!Number.isFinite(intrinsicWidth) || !Number.isFinite(intrinsicHeight) || intrinsicWidth <= 0 || intrinsicHeight <= 0) {
    throw new Error(`Image hook failed at ${stage}[${hookIndex}]: invalid intrinsic dimensions`)
  }
  const mimeType = String(value.mimeType || '').trim().toLowerCase() || OUTPUT_MIME_TYPE
  return {
    normalizedDataUrl,
    intrinsicWidth,
    intrinsicHeight,
    mimeType,
  }
}

async function runHooks(
  hooks: ImageProcessingHook[],
  stage: ProcessingStage,
  input: ProcessedImageResult,
): Promise<ProcessedImageResult> {
  let current = input
  for (let i = 0; i < hooks.length; i += 1) {
    const hook = hooks[i]
    const next = await hook({ ...current })
    current = validateHookResult(next, stage, i)
  }
  return current
}

export function registerPreProcessHook(hook: ImageProcessingHook): void {
  if (preProcessHooks.includes(hook)) return
  preProcessHooks.push(hook)
}

export function registerPostProcessHook(hook: ImageProcessingHook): void {
  if (postProcessHooks.includes(hook)) return
  postProcessHooks.push(hook)
}

export function getRegisteredImageHookCounts(): { pre: number; post: number } {
  return { pre: preProcessHooks.length, post: postProcessHooks.length }
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read image file'))
    reader.onload = () => {
      const value = typeof reader.result === 'string' ? reader.result : ''
      if (!value) {
        reject(new Error('Invalid image payload'))
        return
      }
      resolve(value)
    }
    reader.readAsDataURL(file)
  })
}

async function decodeImage(dataUrl: string): Promise<NormalizedImage> {
  return await new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => {
      const intrinsicWidth = Number(img.naturalWidth || img.width)
      const intrinsicHeight = Number(img.naturalHeight || img.height)
      if (intrinsicWidth <= 0 || intrinsicHeight <= 0) {
        reject(new Error('Decoded image has invalid dimensions'))
        return
      }
      resolve({
        image: img,
        intrinsicWidth,
        intrinsicHeight,
      })
    }
    img.onerror = () => reject(new Error('Failed to decode image'))
    img.src = dataUrl
  })
}

function normalizeSize(width: number, height: number): { width: number; height: number } {
  const longest = Math.max(width, height)
  if (longest <= MAX_WORKING_DIMENSION_PX) return { width, height }
  const scale = MAX_WORKING_DIMENSION_PX / longest
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

function normalizeFormat(image: HTMLImageElement, width: number, height: number): string {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas context unavailable')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.clearRect(0, 0, width, height)
  ctx.drawImage(image, 0, 0, width, height)
  return canvas.toDataURL(OUTPUT_MIME_TYPE)
}

export async function processUploadedImage(file: File): Promise<ProcessedImageResult> {
  if (!(file instanceof File)) throw new Error('No file provided')
  const mimeType = String(file.type || '').toLowerCase()
  if (!isSupportedMimeType(mimeType)) {
    throw new Error('Unsupported image format. Use PNG, JPG, or WEBP.')
  }
  const sourceDataUrl = await readFileAsDataUrl(file)
  const decoded = await decodeImage(sourceDataUrl)
  const targetSize = normalizeSize(decoded.intrinsicWidth, decoded.intrinsicHeight)
  const normalizedDataUrl = normalizeFormat(decoded.image, targetSize.width, targetSize.height)
  const baseResult: ProcessedImageResult = {
    normalizedDataUrl,
    intrinsicWidth: targetSize.width,
    intrinsicHeight: targetSize.height,
    mimeType: OUTPUT_MIME_TYPE,
  }
  const afterPre = await runHooks(preProcessHooks, ProcessingStage.PRE_PROCESS, baseResult)
  const afterPost = await runHooks(postProcessHooks, ProcessingStage.POST_PROCESS, afterPre)
  return afterPost
}

export const imageProcessingLimits = {
  maxWorkingDimensionPx: MAX_WORKING_DIMENSION_PX,
  outputMimeType: OUTPUT_MIME_TYPE,
}
