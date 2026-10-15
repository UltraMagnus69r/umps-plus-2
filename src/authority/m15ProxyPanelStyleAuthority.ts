/**
 * M15 Proxy Panel Style Authority — UMPS layout adjustments, doc 04 group G.
 *
 * When the M15 painted frame is OFF (the default proxy look), the generated
 * Name Plate / Type Line Bar panels get an M15-style treatment: a soft offset
 * drop shadow plus an inner bevel. This authority is the single source for those
 * values so FrameLayer (and any future panel renderer) stays consistent.
 *
 * Mirrors the old fork's `m15ProxyPanelStyleAuthority` /
 * `proxyModeM15Style = !kentuSmokeTestEnabled` behavior, code-verified per doc 04.
 */

/** Outer drop shadow for the M15-style proxy panels (Konva Shape shadow props). */
export const M15_PROXY_PANEL_SHADOW = {
  color: '#000000',
  blur: 7,
  offset: { x: -2, y: 3 },
  opacity: 0.42,
} as const

/** Inner bevel for the M15-style proxy panels. */
export const M15_PROXY_PANEL_INNER_BEVEL = {
  stroke: 2,
  inset: 3,
  dark: 'rgba(0,0,0,0.28)',
  highlight: 'rgba(255,255,255,0.35)',
} as const

/**
 * Whether the generated proxy panels should use the M15-style treatment.
 * True when the M15 painted frame is NOT active (i.e. the proxy frame is the
 * one being shown). Pass `M15_PAINTED_FRAME_ACTIVE` from geometryAuthority.
 */
export function proxyPanelsUseM15Style(m15PaintedFrameActive: boolean): boolean {
  return !m15PaintedFrameActive
}

/** Konva Shape shadow props for an M15-style proxy panel. */
export function getM15ProxyPanelShadowProps(): {
  shadowColor: string
  shadowBlur: number
  shadowOffset: { x: number; y: number }
  shadowOpacity: number
} {
  return {
    shadowColor: M15_PROXY_PANEL_SHADOW.color,
    shadowBlur: M15_PROXY_PANEL_SHADOW.blur,
    shadowOffset: { ...M15_PROXY_PANEL_SHADOW.offset },
    shadowOpacity: M15_PROXY_PANEL_SHADOW.opacity,
  }
}
