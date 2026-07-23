# 02 — Card-Part Glossary

Canonical names come from `cardmap.png`. Use these everywhere (UI labels, folder
names, code identifiers, conversation). The right column maps each name to the
internal slot identifier used by the geometry/render code being carried over, so the
new project can wire old logic to new names without ambiguity.

| # | Card-map name (canonical) | Internal slot id | Geometry slot | Notes |
|---|---|---|---|---|
| 1 | **Outer Border** | `outer-border` | `card.outerBorder` | Colored trim border. M15: real PNG, runtime-tinted. |
| 2 | **Inner Border** | `inner-border` | `card.innerBorder` | Ivory/textured inner border. Drawn generated in M15 path. |
| 3 | **Name Plate** | `nameplate` | `card.nameplate` | Title bar. M15 asset exists but is currently skipped (generated geometry used). |
| 4 | **Art Box** | `art-frame` | `card.artFrame` | Art window. M15 asset skipped (generated geometry used). |
| 5 | **Type Line Bar** | `typebar` | `card.typebar` | Type line. M15 asset skipped (generated geometry used). |
| 6 | **Rules Text Box** | `textbox` | `card.textbox` | Rules text panel. M15 asset skipped (generated geometry + texture). |
| 7 | **Hologram Seal** | `holo-stamp` | `card.holoStamp` | M15: real PNG, contain-fit into proxy oval slot, scaled 1.35. |
| 8 | **P/T Box** | `pt-box` | `card.powerToughnessBox` | M15: real PNG fills slot; generated proxy capsule suppressed. |
| 9 | **Collector / Language Text** | `credit` (collector line) | `footer` region | Text only; no asset. |
| 10 | **Artist / Copyright Text** | `credit` (copyright) | `footer` region | Text only; no asset. |
| — | **Background Texture** | `background-texture` | `card.background` | Colored fill behind the whole frame. Not numbered on cardmap. M15: real PNG, clipped trim-top→rules-bottom. |

## How to read "skipped" vs "real PNG"

In the M15 preview, some card parts are painted with a **real Kentu PNG** placed into
their geometry slot; others have a PNG in the registry but are **skipped at runtime**
and instead drawn by **generated geometry** (vector plates/beziers). Current split:

- **Real PNG, drawn:** Background Texture, Outer Border, P/T Box, Hologram Seal.
- **Skipped (generated geometry instead):** Name Plate, Art Box, Type Line Bar,
  Rules Text Box.

This split is intentional and is part of what `03-m15-layout-map.json` captures. When
the user's re-sorted assets arrive, we decide per-part whether to switch a "skipped"
part over to its real PNG (that's the one-part-at-a-time wiring in `07`).
