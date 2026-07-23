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

type ColorBlendDirection = 'vertical' | 'horizontal' | 'diagonal' | 'swirl'

export function shouldRestoreEditorSession(settings: { restoreSession?: boolean } | undefined): boolean {
  return settings?.restoreSession !== false
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
