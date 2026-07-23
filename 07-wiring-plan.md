# 07 — One-Part-At-A-Time Wiring Plan

Per the user: wire assets in **one card part at a time**, and decide each part's UI
home as we go. Don't try to wire everything at once. After each part: visually verify
against the M15 W reproduction target, then move on.

## Order of wiring (suggested)

Do structural/background parts first (they sit behind everything), then framed parts,
then small overlays. Suggested sequence:

1. **Background Texture** (drawn) — behind everything; full-card fill, clipped
   trim-top → rules-bottom. Easiest to verify first.
2. **Outer Border** (drawn) — full-card fill + runtime tint to Outer Border Color.
3. **Inner Border** (generated today) — **decide its UI home here** (see open
   question below).
4. **Name Plate** — currently generated geometry; decide whether to switch to a real
   PNG from the new assets.
5. **Type Line Bar** — same decision as Name Plate.
6. **Rules Text Box** — generated base + optional texture; decide PNG vs generated.
7. **Art Box** — art window framing.
8. **P/T Box** (drawn) — slot-fill PNG; remember the proxy capsule body is suppressed
   when the M15 frame is active.
9. **Hologram Seal** (drawn) — contain-fit, scale 1.35, offset (-10, -7); must render
   ABOVE the proxy oval ring.
10. **Collector / Artist text** — text only; confirm font/placement, no asset.

## Per-part wiring checklist (repeat for each)

- [ ] Confirm the asset folder → card part mapping from `06`.
- [ ] Point the renderer slot at the new asset (via the small registry/JSON).
- [ ] Apply the correct fit mode + slot geometry from `03-m15-layout-map.json`.
- [ ] Apply any M15 offset/scale/tint rules for that part (`03.m15RenderConstants`).
- [ ] Confirm z-order placement matches `03.renderOrder`.
- [ ] Visually verify against the M15 W target; check the `verificationChecklist`
      items relevant to this part.
- [ ] Decide + implement the part's UI control home (if it has one).

## Open UI-placement questions (decide during wiring, don't pre-build)

- **Inner Border control:** currently under "Surface FX". The user suspects this
  grouping is wrong. When wiring the Inner Border, propose 2–3 placement options and
  let the user pick.
- **Surface FX group overall:** revisit whether the 6 controls (Outer Border Color,
  Inner Border, Inner Border Opacity, Bleed Fill, Text Box Texture, Text Box Texture
  Opacity) belong together or should be regrouped by card part.
- **Frame-style selection (M15 vs plain Proxy):** the old fork used a debug toggle
  (`kentuSmokeTestEnabled`). In the integrated app this should become a real,
  user-facing choice. Decide the model (selector vs M15-default) once a couple parts
  are wired and the look is confirmed.

## Guardrails

- Never reintroduce the compositor.
- Keep placement driven by geometry SLOTS, not by per-asset PSD coordinates.
- Keep the registry deterministic (explicit file per `{cardPart, color}`).
- Make a backup before each part's wiring edits.
