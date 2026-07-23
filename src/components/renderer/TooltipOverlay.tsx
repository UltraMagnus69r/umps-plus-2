import { useCardStore } from '../../store/useCardStore'

const labels = [
  'Card Name',
  'Mana Cost',
  'Border',
  'Card Art',
  'Type Line',
  'Set Icon',
  'Text Box',
  'P/T Box',
  'Card Edge',
  'Rarity Indicator',
  'Set Code',
  'Copyright',
]

export default function TooltipOverlay() {
  const show = useCardStore((s) => s.showTooltips)
  if (!show) return null

  return (
    <div className="absolute inset-0 pointer-events-none">
      {labels.map((label, i) => (
        <div
          key={label}
          className="absolute top-2 left-2 text-xs bg-black/70 text-white px-1 rounded"
          style={{ top: 20 + i * 18 }}
        >
          {i + 1}. {label}
        </div>
      ))}
    </div>
  )
}
