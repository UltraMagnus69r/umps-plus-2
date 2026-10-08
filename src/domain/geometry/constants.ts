/** Print geometry — ported KEEP numbers from legacy Dimension Authority (not files). */

export const DPI = 600

/** Full-bleed stage @ 600 DPI */
export const STAGE_WIDTH = 1650
export const STAGE_HEIGHT = 2250

/** Bleed per side: 0.125 in @ 600 DPI */
export const BLEED_PX = 75

export const TRIM_WIDTH = STAGE_WIDTH - 2 * BLEED_PX // 1500
export const TRIM_HEIGHT = STAGE_HEIGHT - 2 * BLEED_PX // 2100

export const SAFE_ZONE_WIDTH = TRIM_WIDTH - 2 * BLEED_PX // 1350
export const SAFE_ZONE_HEIGHT = TRIM_HEIGHT - 2 * BLEED_PX // 1950

export const TRIM_CORNER_RADIUS_PX = 72

/** PNG pHYs pixels-per-meter for 600 DPI (rounded). */
export const PHYS_PPM_600DPI = 23622

export const DIMENSIONS = {
  dpi: DPI,
  bleed: BLEED_PX,
  fullBleed: { width: STAGE_WIDTH, height: STAGE_HEIGHT },
  trim: { width: TRIM_WIDTH, height: TRIM_HEIGHT, x: BLEED_PX, y: BLEED_PX },
  safeZone: {
    width: SAFE_ZONE_WIDTH,
    height: SAFE_ZONE_HEIGHT,
    x: BLEED_PX * 2,
    y: BLEED_PX * 2,
  },
} as const
