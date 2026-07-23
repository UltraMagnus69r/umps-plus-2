/**
 * Phase 9.1 — Design Token Authority (TypeScript mirror).
 * Canonical values live in `src/index.css` as `--ui-*` custom properties.
 * Use for programmatic access where CSS variables are unavailable.
 */

/** 4px base grid (same as `--ui-space-*` in CSS). */
export const UI_SPACE_PX = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const

/** Typography steps aligned with `--ui-font-size-*` (rem at 16px root). */
export const UI_FONT_SIZE_REM = {
  xs: 0.6875,
  sm: 0.75,
  md: 0.875,
  base: 1,
  lg: 1.125,
  xl: 1.25,
  '2xl': 1.5,
  '3xl': 1.875,
  '4xl': 2.25,
  display: 3,
} as const

/**
 * Motion: 160–200ms band; ease-out family (matches `--ui-motion-*` in `index.css`).
 * Phase 14.1 barrel + CSS var names: `motionAuthority.ts`.
 */
export const UI_MOTION_MS = {
  enter: 160,
  standard: 180,
  emphasis: 200,
} as const

export const UI_MOTION_EASING_CSS = {
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeOutSoft: 'cubic-bezier(0.16, 1, 0.3, 1)',
} as const

/** Maps to `--ui-color-*` in `index.css` (semantic roles, not raw hex in components). */
export const uiColorVar = (role: string) => `var(--ui-color-${role})`

/**
 * Phase 11.1 — interaction tokens (canonical definitions in `src/index.css`).
 * Use in JS only when CSS variables cannot be applied directly.
 */
export const UI_INTERACTION_CSS_VARS = {
  liftY: 'var(--ui-interaction-lift-y)',
  pressY: 'var(--ui-interaction-press-y)',
  glowOuter: 'var(--ui-interaction-glow-outer)',
  focusRingShadow: 'var(--ui-focus-ring-shadow)',
  raisedHoverShadow: 'var(--ui-interaction-shadow-raised-hover)',
  glowDanger: 'var(--ui-interaction-glow-danger)',
} as const
