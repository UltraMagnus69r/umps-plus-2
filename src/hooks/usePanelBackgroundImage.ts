import { useEffect, useState } from 'react'
import { outerBorderPngUrl } from '../data/outerBorderOptions'
import { isPanelTextureBackground } from '../authority/panelBackgroundAuthority'

/** Load a Classic / M15 panel background PNG when `value` is an `m15tex:` or `m15solid:` key. */
export function usePanelBackgroundImage(value: string | undefined): HTMLImageElement | null {
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const src =
    typeof value === 'string' && isPanelTextureBackground(value) ? outerBorderPngUrl(value) : null

  useEffect(() => {
    if (!src) {
      setImg(null)
      return
    }
    const image = new window.Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => setImg(image)
    image.onerror = () => setImg(null)
    image.src = src
    return () => {
      setImg(null)
    }
  }, [src])

  return img
}
