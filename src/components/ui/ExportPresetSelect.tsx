import {
  EXPORT_PRESETS,
  type ExportPresetId,
  getExportPreset,
  normalizeExportPresetId,
} from '../../authority/exportPresetAuthority'
import { UI_FOCUS_RING_CONTROL } from '../../authority/panelSurfaceAuthority'
import { UI_TEXT_METADATA } from '../../authority/typographyAuthority'

const SELECT_CLASS =
  `h-8 max-w-[10rem] shrink-0 rounded-[var(--ui-radius-md)] border border-[var(--ui-color-border)] ` +
  `bg-[var(--ui-color-surface-elevated)] px-ui1 py-0 text-[length:clamp(0.625rem,0.35rem+0.6vw,0.75rem)] ` +
  `text-[var(--ui-color-text-strong)] outline-none ${UI_FOCUS_RING_CONTROL} ${UI_TEXT_METADATA}`

type Props = {
  value: ExportPresetId
  onChange: (id: ExportPresetId) => void
  id?: string
  className?: string
  disabled?: boolean
}

/** Phase 18.1 — compact preset picker for footer / quick view. */
export default function ExportPresetSelect({ value, onChange, id, className = '', disabled }: Props) {
  const preset = getExportPreset(value)
  return (
    <select
      id={id}
      className={[SELECT_CLASS, className].filter(Boolean).join(' ')}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(normalizeExportPresetId(e.target.value))}
      aria-label="Export output preset"
      title={preset.description}
    >
      {EXPORT_PRESETS.map((p) => (
        <option key={p.id} value={p.id} title={p.description}>
          {p.label}
        </option>
      ))}
    </select>
  )
}
