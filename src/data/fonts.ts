/**
 * Font loading specs aligned with typographyAuthority.ts registry + full fontCatalog.
 * document.fonts.load() and document.fonts.check() use these names.
 */
import { FONT_CATALOG } from './fontCatalog'
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

const EXTENDED_FONT_SPECS = FONT_CATALOG.flatMap(({ family }) => {
  const caps = FONT_FACE_CAPABILITIES[family]
  if (!caps) return [fontLoadSpec(family, 400, 'normal')]
  const specs: string[] = []
  for (const weight of caps.weights) {
    for (const style of caps.styles) {
      specs.push(fontLoadSpec(family, weight, style))
    }
  }
  return specs
})

/** All catalog families (deduped) — loaded at startup so every picker choice works on canvas. */
export const REQUIRED_FONT_SPECS = [
  ...new Set([...CORE_FONT_SPECS, ...EXTENDED_FONT_SPECS]),
]
