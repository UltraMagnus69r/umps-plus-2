import { useEffect, useState } from 'react'
import { loadSharedImage, peekSharedImage } from '../utils/sharedImageLoadCache'

/** Load a PNG/JPG (public path or remote URL) for Konva `Image` nodes — deduped via shared cache. */
export function useKonvaPublicImage(src: string | null | undefined): HTMLImageElement | null {
  const [img, setImg] = useState<HTMLImageElement | null>(() => {
    const url = typeof src === 'string' && src.trim() ? src.trim() : null
    return url ? peekSharedImage(url)?.img ?? null : null
  })

  useEffect(() => {
    const url = typeof src === 'string' && src.trim() ? src.trim() : null
    if (!url) {
      setImg(null)
      return
    }

    const cached = peekSharedImage(url)
    if (cached) {
      setImg(cached.img)
      return
    }

    let cancelled = false
    void loadSharedImage(url).then((loaded) => {
      if (!cancelled) setImg(loaded?.img ?? null)
    })

    return () => {
      cancelled = true
    }
  }, [src])

  return img
}
