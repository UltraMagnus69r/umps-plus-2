/**
 * Font loading specs aligned with typographyAuthority.ts registry + full fontCatalog.
 * document.fonts.load() and document.fonts.check() use these names.
 */
import { FONT_CATALOG, getCreativeFontFamily, type CreativeFontKey } from './fontCatalog'
import { FONT_FACE_CAPABILITIES } from './fontFaceCapabilities'
import { FONT_REGISTRY } from '../authority/typographyAuthority'

/** Default card-field faces — app stays blocked until these are available. */
export const CORE_FONT_SPECS = [
  `bold 1em "${FONT_REGISTRY.NAME}"`,
  `bold 1em "${FONT_REGISTRY.TYPE}"`,
  `normal 400 1em "${FONT_REGISTRY.RULES}"`,
  `italic 400 1em "${FONT_REGISTRY.FLAVOR}"`,
  `bold 1em "${FONT_REGISTRY.METADATA}"`,
] as const

function fontLoadSpec(family: string, weight: number, style: 'normal' | 'italic'): string {
  const stylePrefix = style === 'italic' ? 'italic ' : ''
  if (weight === 400) return `${stylePrefix}normal 400 1em "${family}"`
  if (weight === 700) return `${stylePrefix}bold 1em "${family}"`
  return `${stylePrefix}${weight} 1em "${family}"`
}

function specsForFamily(family: string): string[] {
  const caps = FONT_FACE_CAPABILITIES[family]
  if (!caps) return [fontLoadSpec(family, 400, 'normal')]
  const specs: string[] = []
  for (const weight of caps.weights) {
    for (const style of caps.styles) {
      specs.push(fontLoadSpec(family, weight, style))
    }
  }
  return specs
}

const EXTENDED_FONT_SPECS = FONT_CATALOG.flatMap(({ family }) => specsForFamily(family))

/**
 * Full catalog specs — kept for tooling/tests. Do not boot-load these;
 * use ensureCreativeFontLoaded / ensureFontFamilyLoaded on demand.
 */
export const REQUIRED_FONT_SPECS = [
  ...new Set([...CORE_FONT_SPECS, ...EXTENDED_FONT_SPECS]),
]

const loadedFamilies = new Set<string>()
const inflight = new Map<string, Promise<void>>()

/** Load one catalog family (all declared weights/styles) when the picker or a saved card needs it. */
export function ensureFontFamilyLoaded(family: string): Promise<void> {
  const key = String(family ?? '').trim()
  if (!key || loadedFamilies.has(key)) return Promise.resolve()
  const existing = inflight.get(key)
  if (existing) return existing

  const run = (async () => {
    const fontsApi = (document as Document & { fonts?: FontFaceSet }).fonts
    if (!fontsApi?.load) {
      loadedFamilies.add(key)
      return
    }
    await Promise.allSettled(specsForFamily(key).map((spec) => fontsApi.load(spec)))
    loadedFamilies.add(key)
  })().finally(() => {
    inflight.delete(key)
  })

  inflight.set(key, run)
  return run
}

export function ensureCreativeFontLoaded(fontKey: string | null | undefined): Promise<void> {
  const family = fontKey ? getCreativeFontFamily(fontKey) : null
  if (!family) return Promise.resolve()
  return ensureFontFamilyLoaded(family)
}

export function ensureCreativeFontsLoaded(fontKeys: readonly (string | null | undefined)[]): Promise<void> {
  return Promise.all(fontKeys.map((k) => ensureCreativeFontLoaded(k))).then(() => undefined)
}

export type { CreativeFontKey }
