/**
 * Phase 18.2 — Session persistence boundary (editor continuity vs ephemeral UI).
 *
 * Persisted via Zustand `partialize` / rehydrate: card fields (sans large images), layout,
 * tooltips/hologram, export preset, procedural color slice, `settings.restoreSession`.
 *
 * Not persisted: undo stacks, field-dirty flags, async spinners, modals, selection mode,
 * mana popup, Scryfall flow state, `fontsLoaded`, `stageExporter`.
 */

import type { ManualColorKey } from './colorAuthority'
import type { StateStorage } from 'zustand/middleware'

type ColorBlendDirection = 'vertical' | 'horizontal' | 'diagonal' | 'swirl'

/** Debounce window for sync localStorage writes during rapid setField typing. */
export const PERSIST_DEBOUNCE_MS = 400

export function shouldRestoreEditorSession(settings: { restoreSession?: boolean } | undefined): boolean {
  return settings?.restoreSession !== false
}

type DebouncedLocalStorage = StateStorage & { flush: () => void }

/**
 * Zustand persist storage that coalesces setItem into one localStorage write after idle,
 * and flushes on visibility hidden / pagehide / beforeunload so a refresh still saves.
 */
export function createDebouncedLocalStorage(debounceMs = PERSIST_DEBOUNCE_MS): DebouncedLocalStorage {
  let timer: ReturnType<typeof setTimeout> | null = null
  let pending: { name: string; value: string } | null = null

  const writeNow = (name: string, value: string) => {
    try {
      window.localStorage.setItem(name, value)
    } catch {
      try {
        window.localStorage.removeItem(name)
      } catch {
        /* ignore */
      }
      try {
        window.localStorage.setItem(name, value)
      } catch {
        /* storage blocked */
      }
    }
  }

  const flush = () => {
    if (timer != null) {
      clearTimeout(timer)
      timer = null
    }
    if (!pending) return
    const { name, value } = pending
    pending = null
    writeNow(name, value)
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', flush)
    window.addEventListener('beforeunload', flush)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush()
    })
  }

  return {
    getItem: (name) => {
      try {
        return window.localStorage.getItem(name)
      } catch {
        return null
      }
    },
    setItem: (name, value) => {
      pending = { name, value }
      if (timer != null) clearTimeout(timer)
      timer = setTimeout(flush, debounceMs)
    },
    removeItem: (name) => {
      if (pending?.name === name) pending = null
      if (timer != null) {
        clearTimeout(timer)
        timer = null
      }
      try {
        window.localStorage.removeItem(name)
      } catch {
        /* ignore */
      }
    },
    flush,
  }
}

const MANUAL_COLOR_KEYS = new Set<string>([
  'none',
  'white',
  'blue',
  'black',
  'red',
  'green',
  'gold',
  'colorless',
])

export function normalizePersistedManualColorKey(raw: unknown, fallback: ManualColorKey): ManualColorKey {
  return typeof raw === 'string' && MANUAL_COLOR_KEYS.has(raw) ? (raw as ManualColorKey) : fallback
}

const BLEND_DIRS = new Set<string>(['vertical', 'horizontal', 'diagonal', 'swirl'])

export function normalizePersistedColorBlendDirection(
  raw: unknown,
  fallback: ColorBlendDirection,
): ColorBlendDirection {
  return typeof raw === 'string' && BLEND_DIRS.has(raw) ? (raw as ColorBlendDirection) : fallback
}

export function normalizePersistedManualColorCount(
  raw: unknown,
  fallback: 1 | 2 | 3 | 4 | 5,
): 1 | 2 | 3 | 4 | 5 {
  if (raw === 1 || raw === 2 || raw === 3 || raw === 4 || raw === 5) return raw
  return fallback
}
