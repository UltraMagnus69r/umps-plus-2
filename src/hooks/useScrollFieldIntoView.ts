import type { FocusEventHandler } from 'react'
import { useCallback } from 'react'

/** Scroll a focused sidebar control above the fixed footer / virtual keyboard. */
export function useScrollFieldIntoView(): FocusEventHandler<HTMLElement> {
  return useCallback((e) => {
    const el = e.currentTarget
    requestAnimationFrame(() => {
      try {
        el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
      } catch {
        el.scrollIntoView(false)
      }
    })
  }, [])
}
