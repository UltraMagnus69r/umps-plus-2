# 05 — Clean UMP4 Audit & Slimming Guide

Goal: after the user loads a clean UMP4 copy into the new project, slim the folder so
it's small and easy to reason about — WITHOUT deleting anything the proxy renderer or
build needs. This is a **methodology + proposal** doc; the final delete list must be
produced against the actual UMP4 tree and approved by the user before deleting.

## Process (assistant runs this in the new project)

1. **Backup first.** Make a local copy of the UMP4 folder before any deletion.
2. **Inventory size.** Report the largest folders/files so we target the big wins:
   - PowerShell: list top-level dirs by size; list the biggest files.
3. **Classify** each top-level item as: KEEP (needed), SAFE-DELETE (regenerable or
   unused), or ASK (unsure). Present as a table; get approval before deleting.
4. **Delete in batches** with a backup between batches; after each batch run the
   build/typecheck to confirm nothing broke.

## Almost-always SAFE-DELETE (regenerable / not source)

- `node_modules/` (reinstall via package manager — never back up or hand-port this).
- Build output: `dist/`, `build/`, `.vite/`, `.next/`, coverage reports.
- Editor/local history caches: `.local-history/`, `.cache/`, OS files
  (`Thumbs.db`, `.DS_Store`).
- Large generated preview/diagnostic image dumps that aren't shipped assets.
- Stale logs and temp exports.

## KEEP (do not delete)

- `src/` application code (renderer, authorities, store, components).
- `public/` shipped assets actually referenced by the app.
- Dependency manifests: `package.json`, lockfile, `tsconfig*.json`, `vite.config.*`.
- Any `.env`/config the app needs (do not commit secrets, but don't delete them).

## DELETE specifically because we're dropping the compositor

If the clean UMP4 happens to contain any of these (it shouldn't, but check), remove
them — and never recreate them:

- `src/components/renderer/layers/KentuCompositedFrameLayer.tsx`
- `src/authority/kentuCompositorAuthority.ts`
- `src/utils/kentuCompositeCanvas.ts`
- Store fields `kentuStandardWCompositorTestEnabled`, `kentuStandardCompositorTarget`
  (+ their setters) and the Sidebar "Standard … diagnostic" toggle + target selector.
- Scripts: `kentu:preview:compositor`, `kentu:copy-compositor-smoke-assets`,
  `kentu:validate-standard-reexport`, `scripts/kentu/lib/compositorPreviewBuilder.mjs`.
- Re-export / placement-intake docs + templates and any Phase 3D.6 / 3D.7 docs.
- `kentuCompositor*` registry JSON + compositor preview output folders.

## ASK before deleting (judgment calls)

- Old `New Assets/` style messy asset trees + their manifests — the new project uses
  the user's re-sorted folders instead, so the old messy tree is likely deletable,
  but confirm nothing in `src/` still imports from it before removing.
- Any "kentu pipeline" scripts that only existed to copy/resolve the messy assets.
  Keep only what the new folder-based intake (see `06`) actually needs.
- Historical `docs/audits/**` — keep if the user wants the trail; otherwise archive.

## Definition of done

- `node_modules` reinstalls cleanly; app builds and typechecks.
- No compositor code/scripts/docs remain.
- Folder size meaningfully reduced; user has approved the delete list.
