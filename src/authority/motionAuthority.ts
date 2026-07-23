/**
 * Phase 14.1 — Global motion token authority (TypeScript mirror).
 *
 * Canonical source: `src/index.css` `:root` — `--ui-motion-duration-*` (160–200ms) and
 * `--ui-motion-ease-out` / `--ui-motion-ease-out-soft` (ease-out family).
 * Sidebar legacy names `--sb-dur-*` / `--sb-ease*` are CSS aliases to the same vars.
 *
 * Tailwind: `duration-ui-*` / `ease-ui-*` map to those custom properties via `tailwind.config.js`.
 */

export { UI_MOTION_EASING_CSS, UI_MOTION_MS } from './uiDesignTokens'

/** Use when building inline styles or strings that must reference CSS custom properties. */
export const UI_MOTION_CSS_VARS = {
  durationEnter: 'var(--ui-motion-duration-enter)',
  durationStandard: 'var(--ui-motion-duration-standard)',
  durationEmphasis: 'var(--ui-motion-duration-emphasis)',
  easeOut: 'var(--ui-motion-ease-out)',
  easeOutSoft: 'var(--ui-motion-ease-out-soft)',
} as const
