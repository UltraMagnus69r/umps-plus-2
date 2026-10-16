/**
 * LayoutRecipe — measured seating + typography/mana metrics (trim-normalized).
 * Authoring space: 0–1 of trim 1500×2100 (Card Conjurer face space).
 * Runtime: stage = trimNorm * trimSize + BLEED_PX.
 */

export type TrimNormRect = {
  x: number
  y: number
  w: number
  h: number
}

export type TrimNormAlignedRect = TrimNormRect & {
  align?: 'left' | 'center' | 'right'
  anchor?: string
}

export type RecipeTypographyField = {
  font?: string
  /** Fraction of trim height (2100). */
  size: number
  oneLine?: boolean
  minSize?: number
  lineHeight?: number
  vAlign?: 'top' | 'center' | 'bottom'
  align?: 'left' | 'center' | 'right'
}

export type LayoutRecipe = {
  id: string
  family: 'standard' | 'land'
  variant: 'modern'
  space: 'trim-1500x2100'
  chrome: {
    mode: 'procedural' | 'sheet'
    sheet: string | null
    ptOverlay: string | null
  }
  regions: {
    art: TrimNormRect
    name: TrimNormRect
    mana: TrimNormAlignedRect
    type: TrimNormRect
    setSymbol?: TrimNormAlignedRect
    rules: TrimNormRect
    ptFrame?: TrimNormRect
    ptText: TrimNormRect
    collector?: TrimNormRect
  }
  typography: {
    name: RecipeTypographyField
    type: RecipeTypographyField
    rules: RecipeTypographyField
    pt: RecipeTypographyField
  }
  mana: {
    /** Fraction of trim width (1500), or absolute px when `pipSizePx` set. */
    pipSize: number
    /** Absolute stage/trim pip diameter (preferred when set). */
    pipSizePx?: number
    pipGap: number
    shadowX?: number
    shadowY?: number
  }
  acceptancePxAt600?: {
    nameTop?: number
    artEdge?: number
    typeTop?: number
    rulesEdge?: number
    ptCenter?: number
    pipSize?: number
  }
}
