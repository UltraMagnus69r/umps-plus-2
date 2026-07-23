/**
 * @font-face weight/style capabilities per CSS family name (from index.css).
 */
export type FontFaceCapabilities = {
  readonly weights: readonly number[]
  readonly styles: readonly ('normal' | 'italic')[]
  readonly variableWeight: boolean
}

export const FONT_FACE_CAPABILITIES: Record<string, FontFaceCapabilities> = {
  '2012c863631ba71f874aba70590795a1': { weights: [400], styles: ['normal'], variableWeight: false },
  'Acme-Regular': { weights: [400], styles: ['normal'], variableWeight: false },
  'Amanda Std Regular': { weights: [400], styles: ['normal'], variableWeight: false },
  'DIN-Next-Bold': { weights: [700], styles: ['normal'], variableWeight: false },
  'DIN-Next-Medium': { weights: [500], styles: ['normal'], variableWeight: false },
  'DIN-Next-Regular': { weights: [400], styles: ['normal'], variableWeight: false },
  'Davison Americana CG Regular': { weights: [400], styles: ['normal'], variableWeight: false },
  'Gill Sans Bold Italic': { weights: [700], styles: ['italic'], variableWeight: false },
  'Gill Sans Condensed Bold': { weights: [700], styles: ['normal'], variableWeight: false },
  'Gill Sans Medium Italic': { weights: [500], styles: ['italic'], variableWeight: false },
  'Gill Sans Medium': { weights: [500], styles: ['normal'], variableWeight: false },
  Invocation: { weights: [400], styles: ['normal'], variableWeight: false },
  'Magic-Fomalhaut': { weights: [400], styles: ['normal'], variableWeight: false },
  'Matrix Bold': { weights: [700], styles: ['normal'], variableWeight: false },
  'Montserrat-Medium': { weights: [500], styles: ['normal'], variableWeight: false },
  'Montserrat-SemiBold': { weights: [600], styles: ['normal'], variableWeight: false },
  NeoSansProItalic: { weights: [400], styles: ['italic'], variableWeight: false },
  NeoSansProRegular: { weights: [400], styles: ['normal'], variableWeight: false },
  'NotoSans-Regular': { weights: [400], styles: ['normal'], variableWeight: false },
  NudMotoyaExAporo_W6: { weights: [400], styles: ['normal'], variableWeight: false },
  'OCR A Std Regular': { weights: [400], styles: ['normal'], variableWeight: false },
  'Palatino Font': { weights: [400], styles: ['normal'], variableWeight: false },
  Plantin: { weights: [400, 600, 700], styles: ['normal', 'italic'], variableWeight: true },
  'Plantin Italic': { weights: [400], styles: ['italic'], variableWeight: false },
  'Souvenir-Itc-T-OT-Bold': { weights: [700], styles: ['normal'], variableWeight: false },
  'SpecialElite-Regular': { weights: [400], styles: ['normal'], variableWeight: false },
  Thunderman: { weights: [400], styles: ['normal'], variableWeight: false },
  arial_black: { weights: [900], styles: ['normal'], variableWeight: false },
  'Beleren Bold': { weights: [700], styles: ['normal'], variableWeight: false },
  Beleren: { weights: [400], styles: ['normal'], variableWeight: false },
  'decour-cnd-regular-italic': { weights: [400], styles: ['italic'], variableWeight: false },
  'decour-cnd-regular': { weights: [400], styles: ['normal'], variableWeight: false },
  'fritz-quadrata': { weights: [400], styles: ['normal'], variableWeight: false },
  'gotham-medium': { weights: [500], styles: ['normal'], variableWeight: false },
  gothambold: { weights: [700], styles: ['normal'], variableWeight: false },
  'goudy-medieval': { weights: [400], styles: ['normal'], variableWeight: false },
  Matrix: { weights: [400], styles: ['normal'], variableWeight: false },
  'officina-ser-itc-black': { weights: [900], styles: ['normal'], variableWeight: false },
  Phyrexian: { weights: [400], styles: ['normal'], variableWeight: false },
  'saloon-girl': { weights: [400], styles: ['normal'], variableWeight: false },
  'shango-gothic-bold': { weights: [700], styles: ['normal'], variableWeight: false },
  'souvenirstd-medium': { weights: [500], styles: ['normal'], variableWeight: false },
}

export const DEFAULT_FONT_FACE_CAPABILITIES: FontFaceCapabilities = {
  weights: [400],
  styles: ['normal'],
  variableWeight: false,
}
