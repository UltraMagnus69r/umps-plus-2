import { useId } from 'react'
import { useCardStore } from '../../store/useCardStore'
import ExportPresetSelect from './ExportPresetSelect'

type Props = {
  /** Disables preset + bleed controls (e.g. while export is running). */
  disabled?: boolean
  /** Optional stable id for the bleed checkbox (a11y when multiple instances). */
  bleedCheckboxId?: string
  presetClassName?: string
  /** Hide export preset dropdown (footer uses default preset only). */
  showPreset?: boolean
}

/**
 * Shared export output controls — preset + PNG bleed.
 * Footer toolbar and Quick View both use this so state stays in sync via the store.
 */
export default function ExportOptionsControls({
  disabled = false,
  bleedCheckboxId: bleedIdProp,
  presetClassName = '',
  showPreset = true,
}: Props) {
  const generatedBleedId = useId()
  const bleedCheckboxId = bleedIdProp ?? generatedBleedId
  const exportPresetId = useCardStore((s) => s.exportPresetId)
  const setExportPresetId = useCardStore((s) => s.setExportPresetId)
  const exportPngIncludeBleed = useCardStore((s) => s.exportPngIncludeBleed)
  const setExportPngIncludeBleed = useCardStore((s) => s.setExportPngIncludeBleed)

  return (
    <>
      {showPreset ? (
        <ExportPresetSelect
          value={exportPresetId}
          onChange={setExportPresetId}
          disabled={disabled}
          className={presetClassName || 'max-w-[11rem]'}
        />
      ) : null}
      <label
        className="export-options-bleed-toggle ui-focus-ring flex shrink-0 cursor-pointer select-none items-center gap-1.5 rounded-[var(--ui-radius-md)] border border-[color-mix(in_srgb,var(--ui-color-border)_70%,transparent)] bg-[color-mix(in_srgb,var(--ui-color-surface-elevated)_88%,transparent)] px-2 py-1 text-[length:clamp(0.6875rem,0.4rem+0.65vw,0.8125rem)] text-[var(--ui-color-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]"
        title="Checked: 1650×2250 full bleed. Unchecked: 1500×2100 trim only; adds -trim to the filename."
      >
        <input
          id={bleedCheckboxId}
          type="checkbox"
          className="h-3.5 w-3.5 shrink-0 accent-rose-600"
          checked={exportPngIncludeBleed}
          onChange={(e) => setExportPngIncludeBleed(e.target.checked)}
          disabled={disabled}
          aria-label="Include bleed margin in PNG export"
        />
        <span className="export-options-bleed-toggle__label whitespace-nowrap">PNG bleed</span>
      </label>
    </>
  )
}
