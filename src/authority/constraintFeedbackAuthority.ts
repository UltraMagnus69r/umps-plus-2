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
  exportBleedOn:
    'Bleed includes a 0.125 in margin outside the cut line (1650×2250). Use this for print shops that trim after printing.',
  exportBleedOff:
    'Trim only is the finished card size (1500×2100). Filename gets -trim. Use this for sleeves or digital share.',
  printAt100Percent:
    'In your print dialog, choose Actual size / 100% — not Fit to page — so the 600 DPI sheet stays true size.',
  printGuideBleed: 'Bleed outline: full printable area including the margin that gets cut off.',
  printGuideTrim: 'Trim outline: the finished card edge after cutting.',
  printGuideSafe: 'Safe zone: keep important text and art inside this inset so nothing is clipped.',
} as const
