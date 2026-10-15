/**
 * Phase 9.2 — Panel & Surface System (UI Authority)
 * Visual grammar is defined in `index.css` (.ui-panel-*). These strings are the
 * single import surface for layout code; do not duplicate panel padding/radius/shadow in Tailwind.
 *
 * Phase 15.2 — Contrast simplification: hairline tokens `--ui-border-hairline`,
 * `--ui-border-panel-elevated`, `--ui-border-panel-inset` in `index.css` soften nested
 * panel stacks; prefer these surfaces over ad-hoc heavy borders on new UI.
 *
 * Phase 15.3 — Rhythm: vertical section/stack spacing is centralized in `:root` as
 * `--ui-rhythm-section` and `--ui-rhythm-stack`; sidebar scroll areas use
 * `--ui-sidebar-content-padding-*` via `.sidebar-content` / `.sidebar-header` in `index.css`.
 */

/** Default inset / grouped-control container (minimal elevation). */
export const UI_PANEL_BASE = 'ui-panel-base'

/** Compact padding variant (uses --ui-panel-pad-sm). */
export const UI_PANEL_BASE_COMPACT = 'ui-panel-base ui-panel--pad-sm'

/** Primary section shells — paired with `sidebar-panel` in CSS for accordion chrome. */
export const UI_PANEL_ELEVATED = 'ui-panel-elevated'

/** Floating modal / picker root surface. */
export const UI_PANEL_OVERLAY = 'ui-panel-overlay'

export const UI_PANEL_OVERLAY_HEADER = 'ui-panel-overlay__header'
export const UI_PANEL_OVERLAY_BODY = 'ui-panel-overlay__body'

/** Live preview & app strip headers (not card panels). */
export const UI_CHROME_REGION_HEADER = 'ui-chrome-region-header'

/**
 * Phase 10.2 — sticky context bar above the center preview column.
 * Uses `--ui-z-chrome-sticky` (Phase 9.1); stays below overlays (e.g. z-50 modals).
 */
export const UI_CHROME_CONTEXT_HEADER = 'ui-chrome-context-header'

/** Phase 10.2 — disabled search field (visual placeholder only). */
export const UI_CONTEXT_SEARCH_PLACEHOLDER = 'ui-context-search-placeholder'

/** Muted inline icon in app chrome (Lucide-sized). */
export const UI_ICON_CHROME_MUTED = 'ui-icon-chrome-muted'

/** Fixed footer chrome bar. */
export const UI_CHROME_FOOTER = 'ui-chrome-footer'

/** Phase 11.1 — tokenized focus ring for text controls (see `.ui-focus-ring-control` in `index.css`). */
export const UI_FOCUS_RING_CONTROL = 'ui-focus-ring-control'

/** Phase 11.1 — card preview shell hover (Konva container only; no stage logic). */
export const UI_PREVIEW_SURFACE = 'ui-preview-surface'

/** Phase 11.1 — compact selectable tiles (presets, chips). */
export const UI_INTERACTIVE_TILE = 'ui-interactive-tile'
