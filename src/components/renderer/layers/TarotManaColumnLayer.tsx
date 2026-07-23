import { memo, useCallback, useMemo, useRef, useState } from 'react'
import { Circle, Group, Image, Layer } from 'react-konva'
import { shallow } from 'zustand/shallow'
import {
  getTarotManaSlots,
  TAROT_MANA_SLOT_COUNT,
  TAROT_PALETTE,
} from '../../../authority/tarotLayoutAuthority'
import { getActiveLayoutCapabilitiesFromState } from '../../../authority/layoutRegistry'
import { getSymbolDataUrl } from '../../../authority/symbolAuthority'
import { useCardStore } from '../../../store/useCardStore'
import type { LayoutId } from '../../../authority/layoutTaxonomy'
import { normalizeMana } from '../../../utils/manaNormalization'
import { resolveChunks } from './textIconsShared'

/**
 * Special / Tarot — upper-right mana sockets.
 * Circles only appear for selected mana-cost tokens (empty cost = no free pips).
 * Up to 15 pips; rightmost N sockets are used so cost reads left→right into the frame.
 */
function TarotManaColumnLayer() {
  const { manaCost, currentLayout, activeLayout } = useCardStore(
    (s) => ({
      manaCost: s.cardData.manaCost,
      currentLayout: s.currentLayout,
      activeLayout: s.cardData.layout as LayoutId,
    }),
    shallow,
  )

  const caps = getActiveLayoutCapabilitiesFromState({
    currentLayout,
    cardData: { layout: activeLayout },
  })
  const active = caps.useTarotManaColumn

  const iconChunks = useMemo(() => {
    if (!active) return []
    const chunks = resolveChunks(normalizeMana(manaCost ?? ''))
    return chunks
      .filter((c): c is Extract<typeof c, { kind: 'icon' }> => c.kind === 'icon')
      .slice(0, TAROT_MANA_SLOT_COUNT)
  }, [active, manaCost])

  const slots = useMemo(() => (active ? getTarotManaSlots() : []), [active])

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

  const used = slots.slice(slots.length - iconChunks.length)

  return (
    <Layer listening={false}>
      {iconChunks.map((chunk, i) => {
        const slot = used[i]
        if (!slot) return null
        // Integrated socket ring is drawn by TarotChromeLayer; still draw free rings here.
        const dataUrl = chunk.dataUrl || getSymbolDataUrl(chunk.key, chunk.symbolSet)
        if (!dataUrl) return null
        const img = getManaImage(`tarot-${i}-${chunk.key}-${chunk.symbolSet}`, dataUrl)
        const symSize = slot.r * 2 * 0.72
        return (
          <Group key={`tarot-mana-${i}-${chunk.key}`} listening={false}>
            {!slot.integrated && (
              <>
                <Circle
                  x={slot.cx}
                  y={slot.cy}
                  radius={slot.r + 4}
                  stroke={TAROT_PALETTE.deepShadow}
                  strokeWidth={6}
                  listening={false}
                />
                <Circle
                  x={slot.cx}
                  y={slot.cy}
                  radius={slot.r + 1}
                  fill={TAROT_PALETTE.plateFill}
                  stroke={TAROT_PALETTE.midMetal}
                  strokeWidth={4}
                  listening={false}
                />
                <Circle
                  x={slot.cx}
                  y={slot.cy}
                  radius={slot.r - 8}
                  stroke={TAROT_PALETTE.ivoryHighlight}
                  strokeWidth={2}
                  listening={false}
                />
              </>
            )}
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

export default memo(TarotManaColumnLayer)
