/**
 * Module 5.1 — per-field Creative Suite font controls (single face region).
 * Authority: options and clamps from typographyAuthority only.
 */
import FontFamilyPicker from './FontFamilyPicker'
import { UI_FOCUS_RING_CONTROL, UI_INTERACTIVE_TILE } from '../../authority/panelSurfaceAuthority'
import {
  TYPOGRAPHY_SIZE_PT_MAX,
  TYPOGRAPHY_SIZE_PT_MIN,
  UI_TEXT_CONTROL,
  UI_TEXT_LABEL_COMPACT,
  UI_TEXT_METADATA,
  type CardFieldTypographyWeight,
} from '../../authority/typographyAuthority'
import type { CardTypographyKey } from '../../store/useCardStore'
import { useCardStore } from '../../store/useCardStore'

const WEIGHT_OPTIONS: { value: CardFieldTypographyWeight; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'semibold', label: 'Semi-Bold' },
  { value: 'bold', label: 'Bold' },
  { value: 'italic', label: 'Italic' },
]
const SIZE_PRESETS = [8, 10, 12, 14, 16, 18, 20] as const

const CONTROL_CLASS =
  `h-[var(--ui-control-height-sm)] w-full rounded-[var(--ui-radius-xl)] border border-[var(--ui-color-border)] bg-[var(--ui-color-surface-elevated)] px-ui2 ${UI_TEXT_CONTROL} ${UI_FOCUS_RING_CONTROL} text-[var(--ui-color-text)] outline-none`

type Props = {
  /** Zustand cardData typography slice key */
  typographyKey: CardTypographyKey
  /** Short label for assistive tech / legend */
  legend: string
}

export default function FontMenu({ typographyKey, legend }: Props) {
  const typo = useCardStore((s) => s.cardData[typographyKey])
  const update = useCardStore((s) => s.updateCardTypography)

  const patch = (partial: Partial<typeof typo>) => update(typographyKey, partial)

  return (
    <fieldset className="rounded-[var(--ui-radius-xl)] border border-[var(--ui-color-border)] bg-[color-mix(in_srgb,var(--ui-color-surface-muted)_42%,transparent)] p-ui3">
      <legend className={`px-ui1 ${UI_TEXT_METADATA}`}>{legend}</legend>
      <div className="grid grid-cols-1 gap-ui2 sm:grid-cols-2">
        <div className="space-y-ui1">
          <label className={`block ${UI_TEXT_LABEL_COMPACT}`}>Font</label>
          <FontFamilyPicker
            typographyKey={typographyKey}
            value={typo.fontKey}
            onChange={(fontKey) => patch({ fontKey })}
            ariaLabel={`${legend} font family`}
          />
        </div>
        <div className="space-y-ui1">
          <label className={`block ${UI_TEXT_LABEL_COMPACT}`}>Weight</label>
          <select
            className={CONTROL_CLASS}
            value={typo.weight}
            onChange={(e) => patch({ weight: e.target.value as CardFieldTypographyWeight })}
            aria-label={`${legend} font weight`}
          >
            {WEIGHT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-ui1">
          <label className={`block ${UI_TEXT_LABEL_COMPACT}`}>Color</label>
          <input
            type="color"
            className="h-[var(--ui-control-height-sm)] w-full cursor-pointer rounded-[var(--ui-radius-xl)] border border-[var(--ui-color-border)] bg-[var(--ui-color-surface-elevated)] p-ui1"
            value={/^#([0-9a-f]{6})$/i.test(typo.color) ? typo.color : '#111111'}
            onChange={(e) => patch({ color: e.target.value, colorManual: true })}
            aria-label={`${legend} text color`}
          />
        </div>
        <div className="space-y-ui1 sm:col-span-2">
          <div className={`flex items-center justify-between ${UI_TEXT_METADATA}`}>
            <span>Size</span>
            <span className="tabular-nums">{typo.sizePt} pt</span>
          </div>
          <input
            type="range"
            min={TYPOGRAPHY_SIZE_PT_MIN}
            max={TYPOGRAPHY_SIZE_PT_MAX}
            step={1}
            value={typo.sizePt}
            onChange={(e) => patch({ sizePt: Number(e.target.value) })}
            className="w-full"
            aria-valuemin={TYPOGRAPHY_SIZE_PT_MIN}
            aria-valuemax={TYPOGRAPHY_SIZE_PT_MAX}
            aria-valuenow={typo.sizePt}
            aria-label={`${legend} font size ${TYPOGRAPHY_SIZE_PT_MIN} to ${TYPOGRAPHY_SIZE_PT_MAX} pt`}
          />
          <div className="flex items-center gap-ui2">
            <input
              type="number"
              min={TYPOGRAPHY_SIZE_PT_MIN}
              max={TYPOGRAPHY_SIZE_PT_MAX}
              step={1}
              value={typo.sizePt}
              onChange={(e) => patch({ sizePt: Number(e.target.value) })}
              className={CONTROL_CLASS}
              aria-label={`${legend} font size manual input`}
            />
            <div className={UI_TEXT_METADATA}>pt</div>
          </div>
          <div className="grid grid-cols-4 gap-ui1 sm:grid-cols-7">
            {SIZE_PRESETS.map((pt) => (
              <button
                key={pt}
                type="button"
                className={[
                  `ui-focus-ring h-7 rounded-[var(--ui-radius-sm)] border ${UI_TEXT_METADATA} ${UI_INTERACTIVE_TILE}`,
                  typo.sizePt === pt
                    ? 'border-[color-mix(in_srgb,var(--ui-color-primary)_55%,var(--ui-color-border))] bg-[color-mix(in_srgb,var(--ui-color-primary)_18%,var(--ui-color-surface-elevated))] text-[var(--ui-color-text-strong)]'
                    : 'border-[var(--ui-color-border)] bg-[var(--ui-color-surface-elevated)] text-[var(--ui-color-text)] hover:bg-[var(--ui-color-surface-muted)]',
                ].join(' ')}
                onClick={() => patch({ sizePt: pt })}
                aria-label={`${legend} size preset ${pt} pt`}
              >
                {pt}
              </button>
            ))}
          </div>
        </div>
      </div>
    </fieldset>
  )
}
