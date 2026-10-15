/**
 * Module 5.2 — tint fetched Scryfall set SVG for Konva `Image` (data URL / blob URL).
 */

const SKIP_TAGS = new Set(['defs', 'style', 'title', 'desc', 'clippath', 'mask', 'metadata', 'lineargradient', 'radialgradient', 'stop'])

function applyFill(el: Element, fillHex: string) {
  const n = el.tagName.toLowerCase()
  if (SKIP_TAGS.has(n)) return
  if (n === 'g') {
    for (const c of Array.from(el.children)) applyFill(c, fillHex)
    return
  }
  if (
    ['path', 'circle', 'rect', 'polygon', 'polyline', 'ellipse', 'line', 'text', 'use'].includes(
      n,
    )
  ) {
    const f = el.getAttribute('fill')
    if (f === 'none' || f === 'transparent') return
    el.setAttribute('fill', fillHex)
  }
}

export function tintSvgXmlForSetSymbol(svgXml: string, fillHex: string): string {
  try {
    const doc = new DOMParser().parseFromString(svgXml, 'image/svg+xml')
    if (doc.querySelector('parsererror')) return svgXml
    const svg = doc.documentElement
    if (!svg || svg.tagName.toLowerCase() !== 'svg') return svgXml
    applyFill(svg, fillHex)
    return new XMLSerializer().serializeToString(svg)
  } catch {
    return svgXml
  }
}
