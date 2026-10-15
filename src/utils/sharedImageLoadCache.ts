/** Module-level cache so art refit + Konva layers share one network decode per URL. */

export type LoadedSharedImage = {
  img: HTMLImageElement
  width: number
  height: number
}

const cache = new Map<string, LoadedSharedImage>()
const inflight = new Map<string, Promise<LoadedSharedImage | null>>()

function normalizeSrc(src: string): string | null {
  const trimmed = String(src ?? '').trim()
  return trimmed.length > 0 ? trimmed : null
}

export function peekSharedImage(src: string): LoadedSharedImage | null {
  const url = normalizeSrc(src)
  if (!url) return null
  return cache.get(url) ?? null
}

export function loadSharedImage(src: string): Promise<LoadedSharedImage | null> {
  const url = normalizeSrc(src)
  if (!url) return Promise.resolve(null)

  const hit = cache.get(url)
  if (hit) return Promise.resolve(hit)

  const pending = inflight.get(url)
  if (pending) return pending

  const promise = new Promise<LoadedSharedImage | null>((resolve) => {
    const img = new window.Image()
    if (!url.startsWith('data:')) img.crossOrigin = 'anonymous'
    img.onload = () => {
      inflight.delete(url)
      const width = Number(img.naturalWidth || img.width)
      const height = Number(img.naturalHeight || img.height)
      if (width <= 0 || height <= 0) {
        resolve(null)
        return
      }
      const loaded: LoadedSharedImage = { img, width, height }
      cache.set(url, loaded)
      resolve(loaded)
    }
    img.onerror = () => {
      inflight.delete(url)
      resolve(null)
    }
    img.src = url
  })

  inflight.set(url, promise)
  return promise
}
