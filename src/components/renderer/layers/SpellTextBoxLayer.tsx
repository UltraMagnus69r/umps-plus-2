import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { Image, Layer } from 'react-konva'
import { shallow } from 'zustand/shallow'
import { BEVEL_INSET, getStandardLayoutGeometry, SPELL_PRE_MODERN_SET_SYMBOL_SCALE } from '../../../authority/geometryAuthority'
import {
  getActiveLayoutCapabilitiesFromState,
  getActiveLayoutRegionsFromState,
  layoutRegionToStageRect,
} from '../../../authority/layoutRegistry'
import type { LayoutId } from '../../../authority/layoutTaxonomy'
import {
  resolveSpellPreModernParchmentOuterRect,
  resolveSpellPreModernRulesInnerRect,
} from '../../../authority/spellPreModernLayoutAuthority'
import { resolveSpellPreModernTypeFontSizePx } from '../../../authority/spellPreModernTypography'
import { resolveSetSymbolBoxPx } from '../../../authority/symbolAuthority'
import { resolveSpellPanelPublicUrl } from '../../../data/spellPanelOptions'
import { useCardStore } from '../../../store/useCardStore'
import { TYPE_MIN_FONT } from './textIconsShared'

/**
 * Spell / Pre-Modern — parchment panel anchored 22 px below rendered type-line text.
 * Rules and flavor text render above this layer in TextIconsLayer.
 */
function SpellTextBoxLayer() {
  const { currentLayout, activeLayout, panelId, typeLine, typeTypography, set, setIconImage, iconScale } =
    useCardStore(
      (s) => ({
        currentLayout: s.currentLayout,
        activeLayout: s.cardData.layout as LayoutId,
        panelId: s.cardData.spellTextBoxId,
        typeLine: s.cardData.typeLine,
        typeTypography: s.cardData.typeTypography,
        set: s.cardData.set,
        setIconImage: s.cardData.setIconImage,
        iconScale: s.cardData.iconScale,
      }),
      shallow,
    )

  const caps = getActiveLayoutCapabilitiesFromState({
    currentLayout,
    cardData: { layout: activeLayout },
  })

  const url = caps.supportsSpellTextBoxPanel ? resolveSpellPanelPublicUrl(panelId) : null
  const layout = getStandardLayoutGeometry()
  const measureCtxRef = useRef<CanvasRenderingContext2D | null>(null)

  const parchmentOuter = useMemo(() => {
    const regions = getActiveLayoutRegionsFromState({
      currentLayout,
      cardData: { layout: activeLayout },
    })
    const artRect = layoutRegionToStageRect(regions.art)
    const artBottom = artRect.y + artRect.height + BEVEL_INSET

    const iconBoxS =
      resolveSetSymbolBoxPx(iconScale) * SPELL_PRE_MODERN_SET_SYMBOL_SCALE
    const hasCustomSetIcon = Boolean(String(setIconImage ?? '').trim())
    const hasScryfallSetSlot = !hasCustomSetIcon && Boolean(String(set ?? '').trim())
    const typeLineMaxWidth = Math.max(
      TYPE_MIN_FONT * 3,
      artRect.width - (hasCustomSetIcon || hasScryfallSetSlot ? iconBoxS + layout.setIconPad + 8 : 0),
    )

    if (!measureCtxRef.current) {
      const c = document.createElement('canvas')
      measureCtxRef.current = c.getContext('2d')
    }

    const typeFontSize = resolveSpellPreModernTypeFontSizePx(measureCtxRef.current, {
      typeLine,
      typeLineMaxWidth,
      typeH: layout.typeH,
      typography: typeTypography,
    })

    const rulesInner = resolveSpellPreModernRulesInnerRect(layout, artBottom, typeFontSize)
    return resolveSpellPreModernParchmentOuterRect(rulesInner)
  }, [
    activeLayout,
    typeLine,
    currentLayout,
    iconScale,
    layout,
    set,
    setIconImage,
    typeTypography,
  ])

  const [img, setImg] = useState<HTMLImageElement | null>(null)
  useEffect(() => {
    if (!url) {
      setImg(null)
      return
    }
    const im = new window.Image()
    im.crossOrigin = 'anonymous'
    im.onload = () => setImg(im)
    im.onerror = () => setImg(null)
    im.src = url
    return () => {
      setImg(null)
    }
  }, [url])

  if (!caps.supportsSpellTextBoxPanel || !url || !img) return null

  return (
    <Layer listening={false}>
      <Image
        image={img}
        x={parchmentOuter.x}
        y={parchmentOuter.y}
        width={parchmentOuter.width}
        height={parchmentOuter.height}
        listening={false}
      />
    </Layer>
  )
}

export default memo(SpellTextBoxLayer)
