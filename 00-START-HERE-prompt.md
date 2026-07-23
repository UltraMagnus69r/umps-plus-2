# 00 — START HERE (Seed Prompt for the New Project)

> Paste this whole file as your first message in the new project, with the other
> files in this `NEW PROJECT/` folder attached. It tells the assistant what we are
> building, in what order, and what the hard rules are.

---

## Who you are / what this is

We are building **UMPS** (UltraMagnus Proxy Showcase) — an MTG-style card "proxy
maker." It is a **fresh start** built on top of a **clean UMP4** codebase. We are
deliberately leaving behind an older fork that accumulated cruft (a "Standard
Compositor" experiment) that we have decided is not needed.

We have two proven things we are carrying forward, captured in this folder:

1. **The M15 Creature Preview** — a card frame built from real PNG assets placed
   into known geometry slots + generated structural geometry. This is the visual
   direction we want. `03-m15-layout-map.json` is the faithful reproduction kit.
2. **The UMPS proxy layout adjustments** — a set of geometry/styling tweaks to the
   base proxy frame. `04-umps-layout-adjustments.md` lists every one with exact
   values.

## The card-part vocabulary (USE THESE NAMES)

See `cardmap.png` and `02-card-part-glossary.md`. From now on, every card region is
named by the card map:

1. Outer Border · 2. Inner Border · 3. Name Plate · 4. Art Box · 5. Type Line Bar ·
6. Rules Text Box · 7. Hologram Seal · 8. P/T Box · 9. Collector / Language Text ·
10. Artist / Copyright Text · (+ "Background Texture" = the colored fill behind the
frame, not numbered on the map).

## Hard rules

- **NO COMPOSITOR.** Do not build, port, or reintroduce any "Standard Compositor,"
  mask-pairing, `destination-in`/`source-in` mask compositing pipeline, or
  re-export/placement-intake machinery. The M15 path is hybrid (real PNGs placed
  into slots + generated geometry); that is all we need.
- **UMP4 is now the base.** The old "never touch UMP4" rule is retired — we are
  intentionally starting from a clean UMP4 copy. But do NOT pull anything from the
  old fork except what is documented in this folder.
- **Faithful reproduction.** When reproducing the M15 preview, use the exact numeric
  constants in `03-m15-layout-map.json` / `04-umps-layout-adjustments.md`. Where a
  doc and code ever disagreed, the values in these files are the code-verified truth.
- **Backups, not Git.** This project uses a local rotating 3-2-1 backup procedure
  (no Git) unless the user says otherwise. Make a backup before large edits.

## The order of operations (do these in sequence, confirm at each gate)

**Stage 1 — Bring-up & clean base**
1. Read every file in this folder. Confirm back to the user your understanding of
   the M15 layout map, the UMPS adjustments, and the no-compositor rule.
2. User loads in **clean UMP4**. Do a **deep UMP4 audit + slimming** using
   `05-ump4-cleanup-guide.md` — produce a concrete delete list, get user approval,
   then clean.

**Stage 2 — Assets**
3. User drops in their **re-sorted asset folders** (organized by card part) + an
   image showing what asset goes where. Run the audit in
   `06-asset-folder-audit-plan.md`: map each folder → card part, flag gaps.

**Stage 3 — Reproduce + integrate**
4. Restore the **UMPS layout adjustments** (`04`) on top of clean UMP4.
5. Reproduce the **M15 Creature Preview** (`03`) — geometry slots, z-order, asset
   placement, offsets — verified against the expected placements in that file.
6. Wire assets in **one card part at a time** (`07-wiring-plan.md`), deciding each
   part's UI home as you go (e.g. where the Inner Border control should live).

## What success looks like at the end of Stage 3

A clean UMP4-based proxy maker whose default look reflects the UMPS adjustments, with
an M15 creature frame that matches the old "M15 W Creature Preview" pixel-for-pixel,
driven by the user's newly-sorted asset folders — and no compositor anywhere.
