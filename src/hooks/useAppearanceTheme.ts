import { useCallback, useEffect, useState } from 'react'
import {
  applyAppearanceTheme,
  isAppearanceTheme,
  persistAppearanceTheme,
  readStoredAppearanceTheme,
  type AppearanceTheme,
} from '../theme/appearanceTheme'

export type { AppearanceTheme }

/**
 * Appearance: Dark | Light — localStorage-backed, applied on <html data-theme>.
 * Survives reload (web + Capacitor WebView).
 */
export function useAppearanceTheme(): [AppearanceTheme, (next: AppearanceTheme) => void] {
  const [theme, setThemeState] = useState<AppearanceTheme>(() => readStoredAppearanceTheme())

  useEffect(() => {
    applyAppearanceTheme(theme)
  }, [theme])

  const setTheme = useCallback((next: AppearanceTheme) => {
    if (!isAppearanceTheme(next)) return
    persistAppearanceTheme(next)
    applyAppearanceTheme(next)
    setThemeState(next)
  }, [])

  return [theme, setTheme]
}
