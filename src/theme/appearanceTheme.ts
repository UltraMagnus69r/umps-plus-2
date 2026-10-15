/** User-selectable studio chrome theme (not card art). Persisted separately from design JSON. */

export type AppearanceTheme = 'dark' | 'light'

export const APPEARANCE_THEME_STORAGE_KEY = 'pipmint-appearance-theme'

const THEME_COLOR_DARK = '#0a0c0e'
const THEME_COLOR_LIGHT = '#f2f5f3'

export function isAppearanceTheme(value: string): value is AppearanceTheme {
  return value === 'dark' || value === 'light'
}

export function readStoredAppearanceTheme(): AppearanceTheme {
  try {
    const raw = window.localStorage.getItem(APPEARANCE_THEME_STORAGE_KEY)
    if (raw != null && isAppearanceTheme(raw)) return raw
  } catch {
    /* private mode / SSR */
  }
  return 'light'
}

export function persistAppearanceTheme(theme: AppearanceTheme): void {
  try {
    window.localStorage.setItem(APPEARANCE_THEME_STORAGE_KEY, theme)
  } catch {
    /* private mode */
  }
}

/** Apply theme to <html> so studio, inspector, popovers, sheets, and print flip together. */
export function applyAppearanceTheme(theme: AppearanceTheme): void {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme

  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute('content', theme === 'light' ? THEME_COLOR_LIGHT : THEME_COLOR_DARK)
  }
}

export function setAppearanceTheme(theme: AppearanceTheme): void {
  persistAppearanceTheme(theme)
  applyAppearanceTheme(theme)
}
