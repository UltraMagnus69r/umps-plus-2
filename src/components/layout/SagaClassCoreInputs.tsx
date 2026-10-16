import { memo, useCallback } from 'react'
import {
  normalizeSagaChapterCount,
  normalizeSagaStageTexts,
  SAGA_CHAPTER_COUNT_MAX,
  SAGA_CHAPTER_COUNT_MIN,
  type SagaClassStageTexts,
} from '../../authority/sagaClassStageAuthority'
import { romanNumeral } from '../../authority/sagaClassLayoutAuthority'
import type { CardData } from '../../store/useCardStore'
import FieldRow from '../ui/FieldRow'

const INPUT_CLASS =
  'w-full h-10 rounded-xl border border-neutral-200 bg-white px-3 ui-text-control outline-none ui-focus-ring-control dark:border-[var(--sb-border)] dark:bg-[var(--sb-surface-soft)]'
const TEXTAREA_CLASS =
  'w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 ui-text-control outline-none ui-focus-ring-control dark:border-[var(--sb-border)] dark:bg-[var(--sb-surface-soft)] resize-y min-h-[3.5rem]'
const LABEL_CLASS = 'ui-text-label-compact text-neutral-700 dark:text-neutral-200'

type Props = {
  mode: 'saga' | 'class' | 'saga-creature'
  sagaReminderText: string
  sagaChapterCount: number
  sagaStageTexts: SagaClassStageTexts
  setField: <K extends keyof CardData>(key: K, value: CardData[K]) => void
  commitState: () => void
}

function SagaClassCoreInputs({
  mode,
  sagaReminderText,
  sagaChapterCount,
  sagaStageTexts,
  setField,
  commitState,
}: Props) {
  const count = normalizeSagaChapterCount(sagaChapterCount)
  const stages = normalizeSagaStageTexts(sagaStageTexts, count)
  const stageLabel = mode === 'class' ? 'Level' : 'Chapter'
  const countLabel = mode === 'class' ? 'Levels' : 'Chapters'
  const reminderPlaceholder =
    mode === 'class'
      ? '(Gain the next level as a sorcery to add its ability.)'
      : `(As this Saga enters and after your draw step, add a lore counter. Sacrifice after ${romanNumeral(count)}.)`

  const patchStage = useCallback(
    (index: number, text: string) => {
      const next = normalizeSagaStageTexts(stages, count)
      next[index] = text
      setField('sagaStageTexts', next)
    },
    [stages, count, setField],
  )

  return (
    <div className="space-y-3">
      <FieldRow label={countLabel} layout="stacked">
        <select
          value={String(count)}
          onChange={(e) => {
            setField('sagaChapterCount', normalizeSagaChapterCount(Number(e.target.value)))
            commitState()
          }}
          className={INPUT_CLASS}
          aria-label={`Number of ${countLabel.toLowerCase()}`}
        >
          {Array.from(
            { length: SAGA_CHAPTER_COUNT_MAX - SAGA_CHAPTER_COUNT_MIN + 1 },
            (_, i) => SAGA_CHAPTER_COUNT_MIN + i,
          ).map((n) => (
            <option key={n} value={String(n)}>
              {n} {n === 1 ? stageLabel.toLowerCase() : countLabel.toLowerCase()}
            </option>
          ))}
        </select>
      </FieldRow>

      <FieldRow label="Reminder" layout="stacked">
        <textarea
          value={sagaReminderText}
          onChange={(e) => setField('sagaReminderText', e.target.value)}
          onBlur={commitState}
          className={TEXTAREA_CLASS}
          placeholder={reminderPlaceholder}
          rows={2}
          aria-label={`${mode === 'class' ? 'Class' : 'Saga'} reminder text`}
        />
      </FieldRow>

      <div className="space-y-3 border-l-2 border-neutral-200 pl-3 dark:border-[color-mix(in_srgb,var(--sb-border)_70%,transparent)]">
        {stages.map((stageText, index) => (
          <div
            key={`saga-stage-${index}`}
            className="space-y-2 rounded-xl bg-neutral-50/80 p-3 dark:bg-neutral-900/30"
          >
            <div className={`${LABEL_CLASS} font-medium`}>
              {stageLabel} {romanNumeral(index + 1)}
            </div>
            <textarea
              value={stageText}
              onChange={(e) => patchStage(index, e.target.value)}
              onBlur={commitState}
              className={TEXTAREA_CLASS}
              placeholder={`${stageLabel} ${romanNumeral(index + 1)} ability…`}
              rows={3}
              aria-label={`${stageLabel} ${romanNumeral(index + 1)} text`}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default memo(SagaClassCoreInputs)
