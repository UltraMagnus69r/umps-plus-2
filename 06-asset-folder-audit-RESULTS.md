# 06 — Asset Folder Audit RESULTS

> Working results of the `06-asset-folder-audit-plan.md` audit. This file is meant
> to be opened, reviewed, and **updated** as assets/decisions change. A live
> read-only view also exists as a Cursor canvas (`umps-asset-audit.canvas.tsx`).
>
> Source: `New Assets/` audited against `02-card-part-glossary.md` and
> `03-m15-layout-map.json`. Last updated: 2026-06-06.

## Summary

- Folders audited: **10**
- Files found: **118**
- M15 "drawn" parts mapped: **4 / 4** (Background Texture, Outer Border, P/T Box, Hologram Seal)
- Blocking gaps: **2** (Expansion Symbol folder empty, no reference image)

**Status: proposed mapping — NOT wired. Approval gate before `07` wiring.**

## Folder mapping

| Folder | Detected card part | Files | Sample files | Intrinsic sizes | Audit note |
|---|---|---:|---|---|---|
| holo stamps | Hologram Seal | 12 | `1165_Real Holofoil Stamp.png`, `1158_Holofoil Stamp 6.png` | 65x31; 89x55–57; 101x37 | M15 drawn; contain-fit into holo slot; pick one default stamp for W creature |
| Inner Border | Inner Border | 17 | `1001_White Night Texture.png`, `1011_White Texture.png` | mostly ~695x995 | Maps cleanly; per-color + "Night" variants; generated in M15 path today |
| Mana and Symbols | Mana/symbol support | 7 | `0017_Plains.png`, `0063_Symbols_-_Casting.png` | 116x186 → 430x210 | Not a numbered card part; symbol support, not an M15 frame asset |
| Outer Border Solid Colors | Outer Border | 12 | `0926_White.png`, `0940_Blue.png` | 744x1039 | Maps cleanly; M15 drawn; full-card fill + runtime tint/selection |
| Planeswalker Symbols | Planeswalker loyalty symbols | 24 | `0526_Down.png`, `0527_Neutral.png` | 85x51 → 90x64 | Outside M15 W creature scope |
| PT Box by color | P/T Box | 15 | `0040_White.png`, `1178_White.png` | 169x139 | Maps cleanly; M15 drawn; slot-fill into full P/T slot |
| rarity indicator | Collector/rarity support | 11 | `1306_Common.png`, `1310_Rare.png` | 45–98 x 41–46 | Rarity icon support, not a full cardmap region |
| Expansion Symbol | Expansion Symbol (was `Set`) | 0 | none | none | Renamed from `Set`; feeds Art Assets → Expansion Symbol upload; **not on cardmap (oversight)**; empty for now |
| Text box art | Rules Text Box | 10 | `0867_White _ Green.png`, `0874_Blue _ White.png` | ~614–617 x 279–287 | Maps to Rules Text Box if switched generated→asset; **dual-color variants only** |
| Typal | Watermark / typal support | 10 | `0043_GU_-_Simic.png`, `0052_WU_-_Azorius.png` | 206–304 x 267 | Not a numbered card part; watermark/guild support |

## Proposed wiring manifest

Mirrors `03.assetStack` but pointed at the new folders. Fit modes carry over from `03`.

| Card part | Folder / source | Fit mode | Geometry slot | Runtime | Decision needed |
|---|---|---|---|---|---|
| Background Texture | `Inner Border/1011_White Texture.png` copied to `public/card-parts/background-texture/` | full-card fill | `card.background` | drawn | **Resolved** for M15 W target; wired as isolated part-1 layer |
| Outer Border | Outer Border Solid Colors | full-card fill | `card.outerBorder` | drawn | Per-color files; runtime tint/selection resolver needed |
| Inner Border | Inner Border | generated today; folder available | `card.innerBorder` | generated | Folder maps cleanly but `03` keeps it generated in M15 path |
| Name Plate | no dedicated folder | generated geometry | `card.nameplate` | skipped/generated | No folder needed unless switching to PNG |
| Art Box | no dedicated folder | generated geometry | `card.artFrame` | skipped/generated | No folder needed unless switching to PNG |
| Type Line Bar | no dedicated folder | generated geometry | `card.typebar` | skipped/generated | No folder needed unless switching to PNG |
| Rules Text Box | Text box art | generated today; optional slot asset later | `card.textbox` | skipped/generated | Dual-color variants only; no mono-white asset found |
| P/T Box | PT Box by color | slot fill | `card.powerToughnessBox` | drawn | Use White variant for M15 W target; suppress proxy capsule body when M15 active |
| Hologram Seal | holo stamps | contain | `card.holoStamp` | drawn | Pick stamp file; `1165` matches old recipe name most closely |
| Expansion Symbol | Expansion Symbol | (existing set-symbol slot) | type-line set-symbol slot | upload | Not on cardmap; wires via existing `setIconImage` upload path |
| Collector / Language Text | none | text only | footer region | text | No asset expected |
| Artist / Copyright Text | none | text only | footer region | text | No asset expected |

## Gaps & mismatches (require confirmation)

| Issue | Why it matters | Recommended handling |
|---|---|---|
| Expansion Symbol folder is empty | Renamed from `Set`; feeds Art Assets → Expansion Symbol upload, but has no files yet | Drop expansion-symbol art in; wiring uses existing `setIconImage` upload path |
| No "what goes where" reference image | `06` asks for cross-check against the user's image | Mapping is based on folder names + dimensions only |
| No dedicated Name Plate / Art Box / Type Line Bar folders | `03` says these are skipped/generated, so acceptable | No action for initial M15 reproduction |
| Text box art is dual-color only | M15 W creature target needs a White/default if Rules Text Box switches to an asset | Keep generated for now per `03` |

## Recommended White-creature defaults

- **Outer Border:** `0926_White.png` (from Outer Border Solid Colors).
- **P/T Box:** prefer `1178_White.png` if matching the old recipe filename lineage; otherwise compare `0040_White.png`.
- **Hologram Seal:** `1165_Real Holofoil Stamp.png` (closest to the old recipe name).
- **Background Texture:** `1011_White Texture.png` from `New Assets/Inner Border`, copied to `public/card-parts/background-texture/1011_White Texture.png`.

## Change log

- 2026-06-06 — Initial audit. Renamed `Set` folder → `Expansion Symbol`; updated Art Assets label.
- 2026-06-07 — Resolved Background Texture source to `Inner Border/1011_White Texture.png`; wired as isolated part-1 layer with Surface FX toggle.
