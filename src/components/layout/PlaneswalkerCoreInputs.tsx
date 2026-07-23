import { memo, useCallback } from 'react'
import {
  normalizePlaneswalkerAbilityCount,
  type PlaneswalkerAbility,
} from '../../authority/planeswalkerAbilityAuthority'
import {
  PLANESWALKER_MAX_ABILITY_ROWS,
  type PlaneswalkerCostSign,
} from '../../authority/planeswalkerSymbolAuthority'
import type { CardData } from '../../store/useCardStore'
import FieldRow from '../ui/FieldRow'
import SwitchRow from '../ui/SwitchRow'

const INPUT_CLASS =
  'w-full h-10 rounded-xl border border-neutral-200 bg-white px-3 ui-text-control outline-none ui-focus-ring-control dark:border-[var(--sb-border)] dark:bg-[var(--sb-surface-soft)]'
const TEXTAREA_CLASS =
  'w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 ui-text-control outline-none ui-focus-ring-control dark:border-[var(--sb-border)] dark:bg-[var(--sb-surface-soft)] resize-y min-h-[4.5rem]'
const LABEL_CLASS = 'ui-text-label-compact text-neutral-700 dark:text-neutral-200'

type PlaneswalkerCoreInputsProps = {
  startingLoyalty: string
  planeswalkerStaticText: string
  planeswalkerAbilityCount: number
  planeswalkerAbilities: PlaneswalkerAbility[]
  flavorText: string
  showFlavorTextOnCard: boolean
  setField: <K extends keyof CardData>(key: K, value: CardData[K]) => void
  commitState: () => void
}

function PlaneswalkerCoreInputs({
  startingLoyalty,
  planeswalkerStaticText,
  planeswalkerAbilityCount,
  planeswalkerAbilities,
  flavorText,
  showFlavorTextOnCard,
  setField,
  commitState,
}: PlaneswalkerCoreInputsProps) {
  const count = normalizePlaneswalkerAbilityCount(planeswalkerAbilityCount)

  const patchAbility = useCallback(
    (index: number, patch: Partial<PlaneswalkerAbility>) => {
      const next = planeswalkerAbilities.map((row, i) =>
        i === index ? { ...row, ...patch } : row,
      )
      setField('planeswalkerAbilities', next)
    },
    [planeswalkerAbilities, setField],
  )

  return (
    <div className="space-y-3">
      <FieldRow label="Static ability" layout="stacked">
        <textarea
          value={planeswalkerStaticText}
          onChange={(e) => setField('planeswalkerStaticText', e.target.value)}
          onBlur={commitState}
          className={TEXTAREA_CLASS}
          placeholder="Passive rules text (no loyalty badge)…"
          rows={3}
        />
      </FieldRow>

      <FieldRow label="Starting Loyalty" layout="stacked">
        <input
          value={startingLoyalty}
          onChange={(e) => setField('startingLoyalty', e.target.value)}
          onBlur={commitState}
          className={INPUT_CLASS}
          placeholder="e.g., 4 or X"
          aria-label="Starting loyalty"
        />
      </FieldRow>

      <FieldRow label="Activated abilities" layout="stacked">
        <select
          value={String(count)}
          onChange={(e) => {
            const nextCount = normalizePlaneswalkerAbilityCount(Number(e.target.value))
            setField('planeswalkerAbilityCount', nextCount)
            commitState()
          }}
          className={INPUT_CLASS}
          aria-label="Number of loyalty abilities"
        >
          {Array.from({ length: PLANESWALKER_MAX_ABILITY_ROWS }, (_, i) => i + 1).map((n) => (
            <option key={n} value={String(n)}>
              {n} {n === 1 ? 'ability' : 'abilities'}
            </option>
          ))}
        </select>
      </FieldRow>

      <div className="space-y-3 border-l-2 border-neutral-200 pl-3 dark:border-[color-mix(in_srgb,var(--sb-border)_70%,transparent)]">
        {planeswalkerAbilities.slice(0, count).map((row, index) => (
          <div key={`pw-ability-${index}`} className="space-y-2 rounded-xl bg-neutral-50/80 p-3 dark:bg-neutral-900/30">
            <div className={`${LABEL_CLASS} font-medium`}>Ability {index + 1}</div>
            <div className="grid grid-cols-[minmax(0,5rem)_minmax(0,5rem)_1fr] gap-2 items-end">
              <FieldRow label="Sign" layout="stacked">
                <select
                  value={row.costSign}
                  onChange={(e) => {
                    const costSign = e.target.value as PlaneswalkerCostSign
                    patchAbility(index, {
                      costSign,
                      costValue: costSign === '0' ? 0 : row.costValue || 1,
                    })
                  }}
                  onBlur={commitState}
                  className={INPUT_CLASS}
                  aria-label={`Ability ${index + 1} cost sign`}
                >
                  <option value="+">+</option>
                  <option value="-">−</option>
                  <option value="0">0</option>
                </select>
              </FieldRow>
              <FieldRow label="Cost" layout="stacked">
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={row.costSign === '0' ? 0 : row.costValue}
                  disabled={row.costSign === '0'}
                  onChange={(e) => {
                    patchAbility(index, {
                      costValue: Math.max(0, Math.min(99, Number(e.target.value) || 0)),
                    })
                  }}
                  onBlur={commitState}
                  className={INPUT_CLASS}
                  aria-label={`Ability ${index + 1} loyalty cost`}
                />
              </FieldRow>
              <div className="col-span-3">
                <label className={`block ${LABEL_CLASS} mb-1`}>Ability text</label>
                <textarea
                  value={row.text}
                  onChange={(e) => patchAbility(index, { text: e.target.value })}
                  onBlur={commitState}
                  className={TEXTAREA_CLASS}
                  placeholder="Ability effect…"
                  rows={2}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <FieldRow label="Flavor Text" layout="stacked">
        <textarea
          value={flavorText}
          onChange={(e) => setField('flavorText', e.target.value)}
          onBlur={commitState}
          className={`${TEXTAREA_CLASS} h-20`}
          placeholder="Flavor text…"
        />
      </FieldRow>
      <SwitchRow
        label="Show flavor on card"
        checked={!!showFlavorTextOnCard}
        onToggle={() => {
          setField('showFlavorTextOnCard', !showFlavorTextOnCard)
          commitState()
        }}
        ariaLabel="Show flavor text on card"
      />
    </div>
  )
}

export default memo(PlaneswalkerCoreInputs)
