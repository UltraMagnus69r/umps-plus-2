/**
 * Shared layout constants for sidebars and panels.
 */

import { UI_PANEL_ELEVATED } from '../authority/panelSurfaceAuthority'

export const SIDEBAR_COLLAPSED_W = 56
export const SIDEBAR_EXPANDED_W = 304

/** Phase 17.1 — mana picker width (shell fallback + panel; keep out of lazy chunk boundary). */
export const MANA_POPUP_PANEL_WIDTH = 280

/** Phase 12.2 — return focus from Quick View “Edit” to the main working preview column. */
export const WORKING_PREVIEW_FOCUS_ID = 'ums-working-preview-root'

/** Accordion section: keeps `sidebar-panel` for form-control scoping; adds elevated tier marker (Phase 9.2). */
export const PANEL_CLASS = `sidebar-panel ${UI_PANEL_ELEVATED}`
