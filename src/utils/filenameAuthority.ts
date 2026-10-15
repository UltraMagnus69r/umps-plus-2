/**
 * Module UI-E — Filename Authority.
 * Single source for filename resolution, sanitization, and extension enforcement.
 */

/**
 * Resolve the effective base filename (no extension) from store state.
 * When `filenameFieldDirty` (Module 4.1 `isFieldDirty.filename`) is true, use filename; otherwise use filenameSlug.
 */
export function resolveBaseFilename(
  filename: string | undefined,
  filenameSlug: string | undefined,
  filenameFieldDirty: boolean,
  fallback: string
): string {
  const raw = filenameFieldDirty ? (filename ?? '').trim() : (filenameSlug ?? '')
  return raw || fallback
}

const INVALID_CHARS = /[\\/:*?"<>|]+/g

/**
 * Sanitize a base name for use in a filename (replace invalid path characters).
 */
export function sanitizeFilenameBase(base: string): string {
  return base.trim().replace(INVALID_CHARS, '-')
}

/**
 * Resolve and sanitize the base name, then enforce .png extension.
 * Used for Export PNG.
 */
export function resolvePngFilename(
  filename: string | undefined,
  filenameSlug: string | undefined,
  filenameFieldDirty: boolean,
  fallback: string = 'card'
): string {
  const base = resolveBaseFilename(filename, filenameSlug, filenameFieldDirty, fallback)
  const safe = sanitizeFilenameBase(base)
  const lower = safe.toLowerCase()
  return lower.endsWith('.png') ? lower : `${lower}.png`
}

/**
 * Resolve and sanitize the base name, then enforce .json extension.
 * Used for Save Design.
 */
export function resolveDesignFilename(
  filename: string | undefined,
  filenameSlug: string | undefined,
  filenameFieldDirty: boolean,
  fallback: string = 'design'
): string {
  const base = resolveBaseFilename(filename, filenameSlug, filenameFieldDirty, fallback)
  let safe = sanitizeFilenameBase(base)
  if (!safe) safe = fallback
  const lower = safe.toLowerCase()
  return lower.endsWith('.json') ? lower : `${lower}.json`
}
