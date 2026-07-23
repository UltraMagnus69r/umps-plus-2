# 01 — Handoff State (Where We Ended)

## TL;DR

The old fork worked on a **Standard Compositor** (mask-based frame compositing) that
turned into a dead end — it needed per-layer PSD bounding-box placement data that was
never available in the asset manifests. Meanwhile, the **M15 W Creature Preview**
(a debug smoke test) became the actual proven direction: real PNG assets placed into
geometry slots + generated structural geometry. Decision: **keep the M15 approach,
delete the compositor, start fresh on clean UMP4.**

## What we are KEEPING (carried in this folder)

- **M15 Creature Preview render recipe** → `03-m15-layout-map.json`
  - Canonical stage/trim/slot geometry (1650×2250 stage).
  - Which PNG fills which card part, and which parts are drawn by generated geometry.
  - Render order (z-order) of every layer.
  - All M15-specific offsets/scales (border material, P/T, holo).
- **UMPS proxy layout adjustments** → `04-umps-layout-adjustments.md`
  - P/T box 70% scale + offset, frame inset, border Y alignment, "Surface FX"
    control renames, M15-style panel shadow/bevel, panel colors, etc.
- **Card-part vocabulary** → `02-card-part-glossary.md` + `cardmap.png`.

## What we are LEAVING BEHIND (do not port)

- **The Standard Compositor**, in full:
  - `KentuCompositedFrameLayer.tsx`, `kentuCompositorAuthority.ts`,
    `kentuCompositeCanvas.ts`.
  - Store fields: `kentuStandardWCompositorTestEnabled` (+ setter),
    `kentuStandardCompositorTarget` (+ setter).
  - Sidebar "Standard … diagnostic" toggle + target selector.
  - Scripts: `kentu:preview:compositor`, `kentu:copy-compositor-smoke-assets`,
    `kentu:validate-standard-reexport`, and `scripts/kentu/lib/compositorPreviewBuilder.mjs`.
  - Re-export / placement-intake docs + templates (Phase 3D.6 / 3D.7 artifacts).
  - Compositor preview outputs + `kentuCompositor*` registry JSON.
- **The old messy asset intake** (PSD-path / filename-based role guessing). The new
  project classifies assets by **folder = card part**, which is simpler and robust.

## Why the compositor died (so we don't repeat it)

The compositor composited a tinted texture against an alpha mask per layer. To place
each mask correctly it needed the original PSD's per-layer x/y/width/height. Those
fields were empty in every manifest (`asset_manifest.csv`/`.json`), and the PNGs were
alpha-tight cropped (no offset info), and no source PSD was in the project. Multiple
phases (3D.5/3D.6/3D.7) ended BLOCKED on this missing data. The M15 hybrid path never
needed it because it places assets into **known geometry slots**, not PSD coordinates.

## Important truth note

A few older phase docs list superseded numbers. The **code-verified** current values
are what's in `03`/`04`. Notable corrections vs old docs:
- `M15_INNER_OUTER_BORDER_OFFSET_Y_PX = -10` (not -5)
- `M15_BORDER_MATERIAL_OFFSET_Y_PX = -10`
- `M15_FRAME_OFFSET_Y_PX = 10`

## Open design questions to resolve during integration (see `07`)

- Where should the **Inner Border** control live? It's currently under "Surface FX";
  that grouping may be wrong.
- How should the user pick **M15 frame vs plain Proxy frame** in the final UI
  (frame-style selector vs M15 default)? Deferred — decide while wiring.
