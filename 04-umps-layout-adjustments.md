# 04 — UMPS Layout Adjustments to Re-Apply on Clean UMP4

These are the proxy-layout/styling tweaks made in the old fork that the user wants to
keep. Clean UMP4 will NOT have them, so re-apply each one. All values are
code-verified. File names in parentheses are where the logic lived in the old fork —
use them as a guide; the new project may organize differently.

## A. Canonical geometry (must match exactly) — `geometryAuthority.ts`

- Stage `1650 x 2250` at 600 DPI; bleed `75` px/side; trim `1500 x 2100`; safe zone
  `1350 x 1950`.
- `TRIM_CORNER_RADIUS_PX = 72`.
- Bevel: `BEVEL_OUTER_STROKE = 2`, `BEVEL_WIDTH = 6`, `BEVEL_INSET = 8`.
- Proxy holo oval radii: `PROXY_HOLO_RADIUS_X = 60`, `PROXY_HOLO_RADIUS_Y = 35`
  (Hologram Seal slot = bounding rect of this oval = 120 x 70, centered on stage X,
  straddling rules-box bottom edge).
- `METADATA_FONT_SIZE = round(52 * 0.8) = 42`, `FOOTER_MARGIN_Y = 12`.
- `LAYOUT_MM`: innerW 59, nameW/typeW 57, nameH/typeH 6, artH 40, rulesH 25,
  nameTopOffset 1.75, ptWidthRatio 65.6/367. (These derive the slot rects in
  `03-m15-layout-map.json → standardSlotsPx`.)

## B. P/T Box adjustments — `geometryAuthority.ts` + `PowerToughnessOverlayLayer.tsx`

- `PROXY_PT_BOX_SCALE_MULTIPLIER = 0.7` — the GENERATED proxy P/T capsule is drawn
  30% smaller, anchored at the canonical `ptBox` slot center
  (`getProxyPtBoxDisplayRect`). The canonical full-size `ptBox` slot is unchanged
  (the M15 painted P/T PNG still uses the full slot).
- `PROXY_PT_BOX_OFFSET_X_PX = 5` — applied to the generated proxy capsule **only when
  M15 preview is OFF**.
- When M15 preview is **ON**: proxy P/T capsule body + pinline are **suppressed**,
  text kept; the painted P/T PNG fills the full slot.

## C. Frame inset / border alignment (M15-ON only) — `geometryAuthority.ts` + `TextureBorderLayer.tsx`

- `PROXY_FRAME_INSET_X_PX = 5` — visible trim+inner frame narrowed 5 px per side.
- `PROXY_FRAME_OFFSET_Y_PX = 0`.
- `M15_INNER_OUTER_BORDER_OFFSET_Y_PX = -10` — Outer + Inner Border shifted up 10 px
  in lockstep (`getProxyFrameDisplayRects` applies `offsetY = 0 + (-10)`).
- Net visible rects (M15 ON): trim `80,65,1490,2100`, inner `133,112,1384,1840`.
- `TextureBorderLayer` uses `TRIM_CORNER_RADIUS_PX = 72` for the trim + top inner
  corners on the M15 path.

## D. "Surface FX" controls (renamed sidebar group) — `SidebarRight.tsx`

Section title: **"Surface FX"**. Controls and exact labels:

- **Outer Border Color** (options from `OUTER_BORDER_COLORS`).
- **Inner Border** (toggle/selector).
- **Inner Border Opacity** — slider, min 0, max 1, step 0.01.
- **Bleed Fill** — includes option "Auto (match Outer Border)".
- **Text Box Texture**.
- **Text Box Texture Opacity** — slider, min 0, max 1, step 0.01.

> NOTE: the user has flagged that "Inner Border" may be in the wrong group. Re-apply
> the control + behavior, but treat its UI placement as an open question (see `07`).

## E. Outer Border color values — `colorAuthority.ts`

- black `#000000`, white `#f5f5dc`, blue `#0e68ab`, red `#d3202a`, green `#00733d`,
  colorless `#b0b7c2`, plus dual-color gradients. These feed the Outer Border Color
  control and the M15 outer-border runtime tint.

## F. Panel colors UI — `boxColorUiAuthority.ts`

- `DEFAULT_PANEL_BOX_HEX = '#f7f7f0'`.
- Labels: "Name plate color", "Type line box color", "Rules text box color",
  "P/T box color".

## G. M15-style panel shadow/bevel (Proxy panels) — `m15ProxyPanelStyleAuthority.ts`

Applied to the generated Name Plate / Type Line Bar panels. When M15 preview is OFF,
the proxy panels get this M15-style treatment (`proxyModeM15Style = !kentuSmokeTestEnabled`):

- Outer shadow: color `#000000`, blur `7`, offset `{ x: -2, y: 3 }`, opacity `0.42`.
- Inner bevel: stroke `2`, inset `3`, dark `rgba(0,0,0,0.28)`,
  highlight `rgba(255,255,255,0.35)`.

## H. Plate contour / stroke constants

- `plateBezierContourAuthority.ts`: `PLATE_BEZIER_DEPTH_RATIO = 0.085`,
  bezier handles `0.3`, reverse multiplier `3.6`.
- `frameBoxPath.ts`: `FRAME_BOX_OUTER_STROKE_PX = 2`.

## Re-application checklist

- [ ] Geometry constants (A) match exactly.
- [ ] P/T scale 0.7 + offset 5 (B).
- [ ] Frame inset 5 + border Y -10 on M15-ON path (C).
- [ ] "Surface FX" group with all 6 controls + exact labels (D).
- [ ] Outer Border palette (E) + panel colors (F).
- [ ] M15-style panel shadow/bevel (G) + plate/stroke constants (H).
