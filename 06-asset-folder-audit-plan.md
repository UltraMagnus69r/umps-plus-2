# 06 — Asset Folder Audit & Wiring Plan

The user is re-sorting their assets into folders **organized by card part**, and will
provide an image showing what asset goes where. This replaces the old messy
PSD-path/filename role-guessing entirely: **folder name = card part**. This doc tells
the assistant how to audit the dropped-in folders and map them to the renderer.

## Inputs the assistant should expect

- A top-level asset folder containing subfolders named by (or mappable to) the card
  parts in `02-card-part-glossary.md`.
- An image (provided by the user) showing which asset belongs to which card part.
- `03-m15-layout-map.json` (which parts are "drawn" vs "skipped", slot geometry, fit).

## Audit steps

1. **Enumerate** every subfolder and the files inside (name, dimensions, count).
   Output a table: `folder → detected card part → file count → sample files →
   intrinsic sizes`.
2. **Map** each folder to a canonical card part (Outer Border, Inner Border, Name
   Plate, Art Box, Type Line Bar, Rules Text Box, Hologram Seal, P/T Box, Background
   Texture, Collector/Artist text=none). Cross-check against the user's image.
3. **Flag mismatches / gaps**:
   - Folders that don't map to a known card part.
   - Card parts with no folder/asset.
   - Per-color variants (e.g. White/Blue/…): note the color dimension so the
     resolver can pick by card color.
4. **Confirm fit + intrinsic** per part against `03` (e.g. is the Outer Border a
   full-card PNG? Is the P/T Box a small slot PNG?). Note any size class change vs the
   old assets (the new assets may be cropped differently — placement is by SLOT, so
   exact intrinsic size is fine as long as fit mode is right).
5. **Produce a wiring manifest** (proposed): `cardPart → folder → fitMode → slot →
   drawn/skipped`, mirroring `03.assetStack` but pointed at the new folders. Get user
   approval before wiring code to it.

## Mapping rules / conventions to propose

- One folder per card part; per-color assets live as files inside (named or
  subfoldered by color). Resolver selects by `{cardPart, color}`.
- Fit modes carry over from `03`: Background Texture & Outer Border = full-card fill;
  P/T Box = slot fill; Hologram Seal = contain. Generated-geometry parts (Name
  Plate / Art Box / Type Line Bar / Rules Text Box) only need assets if/when we
  switch them from "skipped" to "drawn" during wiring.
- Keep a tiny registry/JSON that records the chosen file per `{cardPart,color}` so the
  renderer stays deterministic (no runtime filename guessing).

## Output of this phase

A clean, approved `cardPart → asset` mapping for at least the White creature set
(the M15 W reproduction target), ready for the one-part-at-a-time wiring in `07`.
