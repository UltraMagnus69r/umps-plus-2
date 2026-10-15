/**
 * Module 6.3 — Stamped plate silhouette tuning (Bezier contour, not circular caps).
 * Path construction lives in `frameBoxPath.ts` (`addFrameBoxBezierPlatePath`); this file is the single tuning source.
 */

/** Side scallop depth as a fraction of min(width, height); larger = deeper indent at mid-edge. */
export const PLATE_BEZIER_DEPTH_RATIO = 0.085

/**
 * How far Bezier controls sit from top/bottom (horizontal bar) as a fraction of height.
 * Larger = gentler, more “large implied arc” shoulder near the true top/bottom edges.
 */
export const PLATE_BEZIER_HANDLE_INSET_Y = 0.3

/**
 * For vertical bars (width &lt; height): same idea along the short horizontal dimension.
 */
export const PLATE_BEZIER_HANDLE_INSET_X = 0.3

/** Extra side bulge strength for reverse Bezier plate only (vs `PLATE_BEZIER_DEPTH_RATIO`). */
export const REVERSE_PLATE_DEPTH_MULTIPLIER = 3.6
