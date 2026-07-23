/**
 * Phase 17.1 — Performance perception (lazy loading).
 *
 * - Modal shells (`BaseModal`) stay eager so open/close, Escape, and backdrop transitions stay correct.
 * - Heavy modal interiors load via `React.lazy` + `Suspense` only when `open` (Quick View, Mana picker).
 * - Secondary `<img>` uses native `loading="lazy"` where off-screen / list context (not Konva/card art).
 *
 * Do not lazy-load the primary `KonvaStage` working preview or export registration path.
 *
 * Implementations: `QuickViewModal.tsx` + `QuickViewModalBody.tsx`, `ManaSymbolPopup.tsx` +
 * `ManaSymbolPopupPanel.tsx`; list thumbnails: `loading="lazy"` on Scryfall print rows in `SidebarLeft.tsx`.
 *
 * Phase 17.2 — Interaction responsiveness (perceived speed, no preview/export changes):
 * - `useDeferredValue` for context header title echo (`ContextHeader.tsx`) and workflow validation hints
 *   (`SidebarLeft.tsx`) so Konva/sidebars stay higher priority during rapid typing.
 * - `startTransition` for sidebar accordion/collapse local state (`SidebarLeft.tsx`, `SidebarRight.tsx`).
 *
 * Phase 17.3 — Render optimization hooks:
 * - Split `ContextHeader` into memoized slices with narrow Zustand selectors (`ContextHeader.tsx`).
 * - Split `BottomBar` filename vs toolbar; Save uses `getState()` so toolbar skips filename/slug churn (`BottomBar.tsx`).
 * - `memo` on `CenterRail`, modal entrypoints (`QuickViewModal`, `ManaSymbolPopup`), `StatusTriIndicator`.
 */
