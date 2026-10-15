import { useCallback, useState } from 'react'

/**
 * localStorage-backed UI prefs (section collapse, Simple/Advanced).
 * Not part of design JSON / undo history.
 */
export function usePersistedUiState<T extends string>(
  key: string,
  fallback: T,
  isValid: (value: string) => value is T,
): [T, (next: T | ((cur: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key)
      if (raw != null && isValid(raw)) return raw
    } catch {
      /* private mode */
    }
    return fallback
  })

  const setPersisted = useCallback(
    (next: T | ((cur: T) => T)) => {
      setValue((cur) => {
        const resolved = typeof next === 'function' ? (next as (c: T) => T)(cur) : next
        try {
          window.localStorage.setItem(key, resolved)
        } catch {
          /* private mode */
        }
        return resolved
      })
    },
    [key],
  )

  return [value, setPersisted]
}

export type UiComplexityMode = 'simple' | 'advanced'

export function useUiComplexityMode(): [UiComplexityMode, (next: UiComplexityMode) => void] {
  return usePersistedUiState<UiComplexityMode>(
    'umps-ui-complexity',
    'simple',
    (v): v is UiComplexityMode => v === 'simple' || v === 'advanced',
  )
}
