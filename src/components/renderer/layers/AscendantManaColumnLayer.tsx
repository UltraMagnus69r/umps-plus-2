import { memo, useCallback, useMemo, useRef, useState } from 'react'
import { Circle, Group, Image, Layer } from 'react-konva'
import { shallow } from 'zustand/shallow'
import {
  ASCENDANT_MANA_SLOT_COUNT,
  getAscendantManaSlots,
} from '../../../authority/ascendantLayoutAuthority'
import { getActiveLayoutCapabilitiesFromState } from '../../../authority/layoutRegistry'
import { getSymbolDataUrl } from '../../../authority/symbolAuthority'
import { resolveProceduralIdentity, useCardStore } from '../../../store/useCardStore'
import type { LayoutId } from '../../../authority/layoutTaxonomy'
import { normalizeMana } from '../../../utils/manaNormalization'
import { resolveChunks } from './textIconsShared'

function darkenHex(hex: string, amount: number): string {
  const n = hex.replace(/^#/, '')
  if (n.length !== 6) return hex
  const r = Math.max(0, Math.min(255, Math.round(parseInt(n.slice(0, 2), 16) * (1 - amount))))
  const g = Math.max(0, Math.min(255, Math.round(parseInt(n.slice(2, 4), 16) * (1 - amount))))
  const b = Math.max(0, Math.min(255, Math.round(parseInt(n.slice(4, 6), 16) * (1 - amount))))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

/**
 * Special / Ascendant — floating vertical mana column.
 * Circles only appear for selected mana-cost tokens (empty cost = no pips). Caps at 10.
 */
function AscendantManaColumnLayer() {
  const {
    manaCost,
    currentLayout,
    activeLayout,
    cardTypeLine,
    colorIdentity,
    cardName,
    autoColorEnabled,
    manualColorKey,
    manualColorHex1,
    manualColorHex2,
    manualColorHex3,
    manualColorHex4,
    manualColorHex5,
    manualColorCount,
  } = useCardStore(
    (s) => ({
      manaCost: s.cardData.manaCost,
      currentLayout: s.currentLayout,
      activeLayout: s.cardData.layout as LayoutId,
      cardTypeLine: s.cardData.typeLine,
      colorIdentity: s.cardData.colorIdentity,
      cardName: s.cardData.name,
      autoColorEnabled: s.autoColorEnabled,
      manualColorKey: s.manualColorKey,
      manualColorHex1: s.manualColorHex1,
      manualColorHex2: s.manualColorHex2,
      manualColorHex3: s.manualColorHex3,
      manualColorHex4: s.manualColorHex4,
      manualColorHex5: s.manualColorHex5,
      manualColorCount: s.manualColorCount,
    }),
    shallow,
  )

  const caps = getActiveLayoutCapabilitiesFromState({
    currentLayout,
    cardData: { layout: activeLayout },
  })
  const active = caps.useAscendantManaColumn

  const iconChunks = useMemo(() => {
    if (!active) return []
    const chunks = resolveChunks(normalizeMana(manaCost ?? ''))
    return chunks.filter((c): c is Extract<typeof c, { kind: 'icon' }> => c.kind === 'icon').slice(0, ASCENDANT_MANA_SLOT_COUNT)
  }, [active, manaCost])

  const slots = useMemo(() => (active ? getAscendantManaSlots() : []), [active])

  const resolvedIdentity = useMemo(
    () =>
      resolveProceduralIdentity(
        cardTypeLine,
        colorIdentity,
        cardName,
        manaCost ?? '',
        autoColorEnabled,
        manualColorKey,
        manualColorHex1,
        manualColorHex2,
        manualColorHex3,
        manualColorHex4,
        manualColorHex5,
        manualColorCount,
      ),
    [
      cardTypeLine,
      colorIdentity,
      cardName,
      manaCost,
      autoColorEnabled,
      manualColorKey,
      manualColorHex1,
      manualColorHex2,
      manualColorHex3,
      manualColorHex4,
      manualColorHex5,
      manualColorCount,
    ],
  )
  const stroke = useMemo(() => darkenHex(resolvedIdentity.stroke, 0.35), [resolvedIdentity.stroke])

  const manaImageCache = useRef<Map<string, HTMLImageElement>>(new Map())
  const [, setManaImageTick] = useState(0)
  const getManaImage = useCallback((key: string, url: string) => {
    const existing = manaImageCache.current.get(key)
    if (existing) return existing
    const img = new window.Image()
    img.onload = () => setManaImageTick((t) => t + 1)
    img.onerror = () => setManaImageTick((t) => t + 1)
    img.src = url
    manaImageCache.current.set(key, img)
    return img
  }, [])

  if (!active || iconChunks.length === 0) {
    return <Layer listening={false} />
  }

  return (
    <Layer listening={false}>
      {iconChunks.map((chunk, i) => {
        const slot = slots[i]
        if (!slot) return null
        const dataUrl = chunk.dataUrl || getSymbolDataUrl(chunk.key, chunk.symbolSet)
        if (!dataUrl) return null
        const img = getManaImage(`asc-${i}-${chunk.key}-${chunk.symbolSet}`, dataUrl)
        const symSize = slot.diameter * 0.78
        return (
          <Group key={`asc-mana-${i}-${chunk.key}`} listening={false}>
            <Circle
              x={slot.cx}
              y={slot.cy}
              radius={slot.r}
              fill="#0a0a0a"
              stroke={stroke}
              strokeWidth={Math.max(2, Math.round(slot.diameter * 0.04))}
              listening={false}
              shadowColor="#000"
              shadowBlur={4}
              shadowOffset={{ x: 1, y: 1 }}
              shadowOpacity={0.35}
            />
            {img && img.complete && img.naturalWidth > 0 ? (
              <Image
                image={img}
                x={slot.cx - symSize / 2}
                y={slot.cy - symSize / 2}
                width={symSize}
                height={symSize}
                listening={false}
              />
            ) : null}
          </Group>
        )
      })}
    </Layer>
  )
}

export default memo(AscendantManaColumnLayer)
