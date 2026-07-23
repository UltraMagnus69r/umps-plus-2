# Local file history (last 3 snapshots)

Rollback support without Git: the project keeps the **last 3 saved states** in `.local-history/` (slot 1 = oldest, slot 3 = newest).

## Save current state (standard)

```bash
npm run "3-2-1 backup"
```

This is the standard backup command (also called **LOCAL BACKUP**). It rotates fixed slots by copying:

- slot `2` -> slot `1` (overwrite)
- slot `3` -> slot `2` (overwrite)
- current working project -> slot `3` (overwrite)

No new folders are created. It uses only `.local-history/1`, `.local-history/2`, and `.local-history/3`.

Equivalent alias:

```bash
npm run "local backup"
```

## Legacy save command

```bash
npm run history:save
```

The legacy command remains available for compatibility, but `npm run "3-2-1 backup"` is the default workflow.

## Restore from a snapshot

```bash
node scripts/local-history-restore.mjs 1
```

Use **1**, **2**, or **3** (1 = oldest of the 3, 3 = newest). Restore overwrites current files; `.git` and `.local-history` are left unchanged.

## Notes

- `.local-history/` is in `.gitignore` (local only).
- Run `npm run "3-2-1 backup"` before important changes so you can roll back later.
- Close any open project files (e.g. Word documents) before running restore, or Windows may report "resource busy" for those files.
