import { useMemo } from 'react'
import { Group, Rect, Text } from 'react-konva'
import { DIMENSIONS, getStandardLayoutGeometry } from '../../authority/geometryAuthority'
import { useCardStore } from '../../store/useCardStore'

type Marker = {
  id: number
  label: string
  x: number
  y: number
}

/** Derive debug marker positions from geometry authority. No hardcoded layout pixels. */
function getDebugMarkers(): Marker[] {
  const layout = getStandardLayoutGeometry()
  const cx = (x: number, w: number) => Math.round(x + w / 2)
  const cy = (y: number, h: number) => Math.round(y + h / 2)
  return [
    { id: 1, label: 'Name', x: cx(layout.nameX, layout.nameW), y: cy(layout.nameY, layout.nameH) },
    { id: 2, label: 'Mana', x: layout.nameX + layout.nameW - 80, y: cy(layout.nameY, layout.nameH) },
    { id: 3, label: 'Border', x: layout.innerX, y: cy(layout.innerY, layout.innerH) },
    { id: 4, label: 'Art', x: cx(layout.artX, layout.artW), y: cy(layout.artY, layout.artH) },
    { id: 5, label: 'Type', x: layout.typeX + 60, y: cy(layout.typeY, layout.typeH) },
    { id: 6, label: 'Set Icon', x: layout.typeX + layout.typeW - 80, y: cy(layout.typeY, layout.typeH) },
    { id: 7, label: 'Text Box', x: cx(layout.rulesX, layout.rulesW), y: cy(layout.rulesY, layout.rulesH) },
    { id: 8, label: 'P/T', x: cx(layout.ptX, layout.ptW), y: cy(layout.ptY, layout.ptH) },
    { id: 9, label: 'Edge', x: DIMENSIONS.BLEED, y: DIMENSIONS.BLEED },
    { id: 10, label: 'Rarity', x: layout.rarityX + 20, y: cy(layout.bottomInfoY, layout.bottomInfoH) },
    { id: 11, label: 'Set Code', x: layout.setInfoX + 60, y: cy(layout.bottomInfoY, layout.bottomInfoH) },
    { id: 12, label: 'Copyright', x: layout.copyrightX + Math.round(layout.copyrightW / 2), y: cy(layout.bottomInfoY, layout.bottomInfoH) },
  ]
}

export default function DebugOverlay() {
  const showTooltips = useCardStore((s) => s.showTooltips)
  const artLen = useCardStore((s) => (s.cardData.artImage ?? '').length)
  const setIconLen = useCardStore((s) => (s.cardData.setIconImage ?? '').length)
  const markers = useMemo(() => getDebugMarkers(), [])

  if (!showTooltips) return null

  return (
    <Group listening={false}>
      {/* Optional faint outline showing full-bleed edge */}
      <Rect
        x={0}
        y={0}
        width={DIMENSIONS.FULL_BLEED.width}
        height={DIMENSIONS.FULL_BLEED.height}
        stroke="#000"
        strokeWidth={2}
        opacity={0.08}
      />

      {markers.map((m) => (
        <Group key={m.id} x={m.x} y={m.y} listening={false}>
          <Rect listening={false} width={420} height={96} cornerRadius={14} fill="#169B32" opacity={0.95} stroke="#000" strokeWidth={4} />
          <Text
            listening={false}
            text={`${m.id} - ${m.label}`}
            x={18}
            y={26}
            fontSize={40}
            fill="#fff"
          />
        </Group>
      ))}

      {/* Debug: confirm base64 payloads are present and changing */}
      <Text
        listening={false}
        text={`base64 lengths  •  art: ${artLen}  •  setIcon: ${setIconLen}`}
        x={32}
        y={DIMENSIONS.FULL_BLEED.height - 48}
        fontSize={26}
        fill="#169B32"
      />
    </Group>
  )
}
