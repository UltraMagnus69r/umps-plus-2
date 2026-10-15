/**
 * Phase 12.3 — Modal system authority.
 * Backdrop + layering tokens; use with `BaseModal` for consistent overlays.
 */

/** Unified dim + blur layer (z-index set inline via `ModalZIndexVarName`). */
export const UI_MODAL_BACKDROP = 'ui-modal-backdrop'

/** Applied while overlay is visible; pairs with opacity transition in `index.css` (Phase 14.2). */
export const UI_MODAL_BACKDROP_OPEN = 'ui-modal-backdrop--open'

/** Flex centering + stage padding for single centered panel (e.g. quick view). */
export const UI_MODAL_BACKDROP_CENTERED = 'ui-modal-backdrop--centered'

/** No blur/dim — page stays sharp (e.g. mana picker over live preview). */
export const UI_MODAL_BACKDROP_CLEAR = 'ui-modal-backdrop--clear'

/** CSS custom property names (root tokens in `index.css`). */
export type ModalZIndexVarName = '--ui-z-modal-quick-view' | '--ui-z-mana-popup'
