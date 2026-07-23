/**
 * Phase 16.3 — Constraint awareness copy (quiet contextual hints).
 * Strings only; visibility is decided in components using existing authority flags.
 */

export const UI_CONSTRAINT_HINT = 'ui-constraint-hint'

export const CONSTRAINT_COPY = {
  colorAutoOn:
    'WUBRG pip controls appear while Auto Color is on. Turn Auto Color off to use the manual hex palette.',
  colorAutoOff:
    'Manual palette is available while Auto Color is off. Turn Auto Color on to pick WUBRG identity pips.',
  colorLandFullArt:
    'Full-art land layouts read color identity from the name-plate mana symbol in Core Inputs (left sidebar).',
  layoutNoPtPlate: 'This layout has no power/toughness box, so P/T plate geometry is not shown.',
  gradientNoPt: 'P/T panel color and gradient are hidden when the layout has no power/toughness panel.',
  sidebarClearClone: 'Add a full-card overlay (Scryfall or image URL) before clear is available.',
  sidebarResetArt: 'Add or import card art before resetting its position.',
  sidebarClearRef: 'Load a reference image before clear is available.',
  quickViewExportDisabled:
    'Export unlocks when the card is export-ready (preview requirements met, preview pipeline active). Hidden layout also needs a full-card overlay.',
} as const
