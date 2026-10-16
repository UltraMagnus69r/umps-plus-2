import { memo } from 'react'
import type { CardData } from '../../store/useCardStore'
import FieldRow from '../ui/FieldRow'

const INPUT_CLASS =
  'w-full h-10 rounded-xl border border-neutral-200 bg-white px-3 ui-text-control outline-none ui-focus-ring-control dark:border-[var(--sb-border)] dark:bg-[var(--sb-surface-soft)]'
const TEXTAREA_CLASS =
  'w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 ui-text-control outline-none ui-focus-ring-control dark:border-[var(--sb-border)] dark:bg-[var(--sb-surface-soft)] resize-y min-h-[3.5rem]'
const LABEL_CLASS = 'ui-text-label-compact text-neutral-700 dark:text-neutral-200'

type Props = {
  preparedSpellName: string
  preparedSpellManaCost: string
  preparedSpellType: string
  preparedSpellText: string
  setField: <K extends keyof CardData>(key: K, value: CardData[K]) => void
  commitState: () => void
}

function PreparedCoreInputs({
  preparedSpellName,
  preparedSpellManaCost,
  preparedSpellType,
  preparedSpellText,
  setField,
  commitState,
}: Props) {
  return (
    <div className="space-y-3 py-1">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        Spell ability
      </div>
      <FieldRow label="Spell name" layout="stacked">
        <input
          value={preparedSpellName}
          onChange={(e) => setField('preparedSpellName', e.target.value)}
          onBlur={commitState}
          className={INPUT_CLASS}
          placeholder="e.g., Have a Bite"
          aria-label="Prepared spell name"
        />
      </FieldRow>
      <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
        <FieldRow label="Spell mana" layout="stacked">
          <input
            value={preparedSpellManaCost}
            onChange={(e) => setField('preparedSpellManaCost', e.target.value)}
            onBlur={commitState}
            className={INPUT_CLASS}
            placeholder="e.g., {B}"
            aria-label="Prepared spell mana cost"
          />
        </FieldRow>
        <FieldRow label="Spell type" layout="stacked">
          <input
            value={preparedSpellType}
            onChange={(e) => setField('preparedSpellType', e.target.value)}
            onBlur={commitState}
            className={INPUT_CLASS}
            placeholder="e.g., Sorcery"
            aria-label="Prepared spell type"
          />
        </FieldRow>
      </div>
      <div className="space-y-1">
        <label className={LABEL_CLASS}>Spell text</label>
        <textarea
          value={preparedSpellText}
          onChange={(e) => setField('preparedSpellText', e.target.value)}
          onBlur={commitState}
          className={TEXTAREA_CLASS}
          placeholder="Spell effect text…"
          aria-label="Prepared spell text"
        />
      </div>
    </div>
  )
}

export default memo(PreparedCoreInputs)
