/**
 * Phase 14.3 — State feedback (loading / success micro-indicators).
 * CSS counterparts: `.ui-async-spinner`, `.ui-inline-status-*`, `.ui-action-success-surface` in `index.css`.
 * Uses `--ui-motion-*` and `prefers-reduced-motion` handling in global styles.
 *
 * Phase 16.1 — complements `.ui-status-tri*` (Ready / Invalid / Processing); keep spinners on buttons
 * for in-control feedback; tri-status is summary-level only.
 *
 * Phase 16.2 — field validation uses `ValidationInline` + `.ui-validation-inline` + `UI_TEXT_METADATA_DANGER`;
 * keep using spinners / success surfaces for async ops, not for missing required fields.
 *
 * Phase 16.3 — disabled / layout-gated explanations use `ConstraintHint` + `.ui-constraint-hint` + help typography;
 * do not use danger styling for constraints.
 */
export const UI_ASYNC_SPINNER = 'ui-async-spinner'
/** Matches footer / compact action control icon size (~3.5). */
export const UI_ASYNC_SPINNER_SM = 'ui-async-spinner ui-async-spinner--sm'
/** Sidebar-scale spinner (~12px). */
export const UI_ASYNC_SPINNER_XS = 'ui-async-spinner ui-async-spinner--xs'

export const UI_INLINE_STATUS_LOADING = 'ui-inline-status-loading'
export const UI_INLINE_STATUS_SUCCESS = 'ui-inline-status-success'

/** Subtle success emphasis on a button or compact control (short-lived while store status is success). */
export const UI_ACTION_SUCCESS_SURFACE = 'ui-action-success-surface'
