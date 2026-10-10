import { useId } from 'react'
import { CONSTRAINT_COPY } from '../../authority/constraintFeedbackAuthority'
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
  /** Compact footer labels: Bleed / Trim instead of PNG bleed. */
  compactLabels?: boolean
}

/**
 * Shared export output controls — preset + PNG bleed/trim.
 * Footer toolbar and Quick View both use this so state stays in sync via the store.
 */
export default function ExportOptionsControls({
  disabled = false,
  bleedCheckboxId: bleedIdProp,
  presetClassName = '',
  showPreset = true,
  compactLabels = false,
}: Props) {
  const generatedBleedId = useId()
  const bleedCheckboxId = bleedIdProp ?? generatedBleedId
  const exportPresetId = useCardStore((s) => s.exportPresetId)
  const setExportPresetId = useCardStore((s) => s.setExportPresetId)
  const exportPngIncludeBleed = useCardStore((s) => s.exportPngIncludeBleed)
  const setExportPngIncludeBleed = useCardStore((s) => s.setExportPngIncludeBleed)

  const tip = exportPngIncludeBleed ? CONSTRAINT_COPY.exportBleedOn : CONSTRAINT_COPY.exportBleedOff

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
      <div
        className="export-options-bleed-toggle flex shrink-0 items-center gap-1 rounded-[var(--ui-radius-md)] border border-[color-mix(in_srgb,var(--ui-color-border)_70%,transparent)] bg-[color-mix(in_srgb,var(--ui-color-surface-elevated)_88%,transparent)] p-0.5 text-[length:clamp(0.6875rem,0.4rem+0.65vw,0.8125rem)] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]"
        role="group"
        aria-label="PNG export margin"
        title={tip}
      >
        <button
          type="button"
          disabled={disabled}
          aria-pressed={exportPngIncludeBleed}
          title={CONSTRAINT_COPY.exportBleedOn}
          onClick={() => setExportPngIncludeBleed(true)}
          className={[
            'ui-focus-ring rounded-[calc(var(--ui-radius-md)-2px)] px-2 py-1 font-semibold transition-colors',
            exportPngIncludeBleed
              ? 'bg-[color-mix(in_srgb,var(--ui-color-primary)_18%,transparent)] text-[var(--ui-color-text-strong)]'
              : 'text-[var(--ui-color-muted)] hover:text-[var(--ui-color-text)]',
          ].join(' ')}
        >
          <span className="export-options-bleed-toggle__label whitespace-nowrap">
            {compactLabels ? 'Bleed' : 'With bleed'}
          </span>
        </button>
        <button
          type="button"
          disabled={disabled}
          aria-pressed={!exportPngIncludeBleed}
          title={CONSTRAINT_COPY.exportBleedOff}
          onClick={() => setExportPngIncludeBleed(false)}
          className={[
            'ui-focus-ring rounded-[calc(var(--ui-radius-md)-2px)] px-2 py-1 font-semibold transition-colors',
            !exportPngIncludeBleed
              ? 'bg-[color-mix(in_srgb,var(--ui-color-primary)_18%,transparent)] text-[var(--ui-color-text-strong)]'
              : 'text-[var(--ui-color-muted)] hover:text-[var(--ui-color-text)]',
          ].join(' ')}
        >
          <span className="export-options-bleed-toggle__label whitespace-nowrap">
            {compactLabels ? 'Trim' : 'Trim only'}
          </span>
        </button>
        <input
          id={bleedCheckboxId}
          type="checkbox"
          className="sr-only"
          checked={exportPngIncludeBleed}
          onChange={(e) => setExportPngIncludeBleed(e.target.checked)}
          disabled={disabled}
          aria-label="Include bleed margin in PNG export"
          tabIndex={-1}
        />
      </div>
    </>
  )
}
