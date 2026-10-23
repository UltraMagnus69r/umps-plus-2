/**
 * Space Gothic frame family — ornate gold/cyan chrome PNGs with cream plate holes.
 * Variants are alternate completeness builds (not color). Served from `public/frames/space-gothic/`.
 */

export type SpaceGothicFrameVariantId =
  | 'with-pt'
  | 'with-sides'
  | 'nameplate-footer'
  | 'name-type-rules'

export type SpaceGothicFrameOption = {
  id: SpaceGothicFrameVariantId
  label: string
  file: string
  /** Native pixel size of the PNG (drawn into trim 1500×2100). */
  nativeWidth: number
  nativeHeight: number
  /** Creature P/T pocket present in chrome. */
  hasPtPocket: boolean
  /** Side pillars present (narrower art aperture). */
  hasSidePillars: boolean
  /** Only nameplate + footer flourish — no type/rules chrome boxes. */
  nameplateFooterOnly?: boolean
}

export const SPACE_GOTHIC_FRAME_OPTIONS: readonly SpaceGothicFrameOption[] = [
  {
    id: 'with-pt',
    label: 'With P/T',
    file: 'space-gothic-with-pt.png',
    nativeWidth: 1060,
    nativeHeight: 1484,
    hasPtPocket: true,
    hasSidePillars: false,
  },
  {
    id: 'with-sides',
    label: 'With Sides',
    file: 'space-gothic-with-sides.png',
    nativeWidth: 1060,
    nativeHeight: 1484,
    hasPtPocket: false,
    hasSidePillars: true,
  },
  {
    id: 'name-type-rules',
    label: 'Name / Type / Rules',
    file: 'space-gothic-name-type-rules.png',
    nativeWidth: 1060,
    nativeHeight: 1484,
    hasPtPocket: false,
    hasSidePillars: false,
  },
  {
    id: 'nameplate-footer',
    label: 'Nameplate + Footer',
    file: 'space-gothic-nameplate-footer.png',
    nativeWidth: 1500,
    nativeHeight: 2100,
    hasPtPocket: false,
    hasSidePillars: false,
    nameplateFooterOnly: true,
  },
] as const

export const DEFAULT_SPACE_GOTHIC_FRAME_VARIANT: SpaceGothicFrameVariantId = 'with-pt'

export function isSpaceGothicFrameVariantId(value: unknown): value is SpaceGothicFrameVariantId {
  return SPACE_GOTHIC_FRAME_OPTIONS.some((o) => o.id === value)
}

export function normalizeSpaceGothicFrameVariantId(value: unknown): SpaceGothicFrameVariantId {
  return isSpaceGothicFrameVariantId(value) ? value : DEFAULT_SPACE_GOTHIC_FRAME_VARIANT
}

export function getSpaceGothicFrameOption(variantId: unknown): SpaceGothicFrameOption {
  const id = normalizeSpaceGothicFrameVariantId(variantId)
  return SPACE_GOTHIC_FRAME_OPTIONS.find((o) => o.id === id)!
}

/** Public URL for a Space Gothic frame PNG. */
export function resolveSpaceGothicFramePublicUrl(variantId: unknown): string {
  const opt = getSpaceGothicFrameOption(variantId)
  return `/frames/space-gothic/${encodeURIComponent(opt.file)}`
}
