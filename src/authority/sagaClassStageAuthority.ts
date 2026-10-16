/**
 * Saga / Class / Saga Creature structured stage text (reminder + I…V).
 * Chapter count is dynamic 2–5 (default 3).
 */

import { romanNumeral } from './sagaClassLayoutAuthority'

export const SAGA_CHAPTER_COUNT_MIN = 2
export const SAGA_CHAPTER_COUNT_MAX = 5
export const SAGA_CHAPTER_COUNT_DEFAULT = 3

export type SagaClassStageTexts = string[]

export function normalizeSagaChapterCount(value: unknown): number {
  const n = Math.round(Number(value))
  if (!Number.isFinite(n)) return SAGA_CHAPTER_COUNT_DEFAULT
  return Math.max(SAGA_CHAPTER_COUNT_MIN, Math.min(SAGA_CHAPTER_COUNT_MAX, n))
}

export function normalizeSagaReminderText(value: unknown, fallback = ''): string {
  return String(value ?? fallback)
}

export function normalizeSagaStageTexts(
  value: unknown,
  count: unknown = SAGA_CHAPTER_COUNT_DEFAULT,
): SagaClassStageTexts {
  const c = normalizeSagaChapterCount(count)
  const src = Array.isArray(value) ? value : []
  return Array.from({ length: c }, (_, i) => String(src[i] ?? ''))
}

export function defaultSagaStageTexts(
  count: unknown = SAGA_CHAPTER_COUNT_DEFAULT,
): SagaClassStageTexts {
  return normalizeSagaStageTexts([], count)
}

/** Default Saga reminder including “Sacrifice after N”. */
export function defaultSagaReminderForCount(count: unknown): string {
  const roman = romanNumeral(normalizeSagaChapterCount(count))
  return `(As this Saga enters and after your draw step, add a lore counter. Sacrifice after ${roman}.)`
}

/** Saga Creature reminder — same sacrifice clause so count stays consistent. */
export function defaultSagaCreatureReminderForCount(count: unknown): string {
  return defaultSagaReminderForCount(count)
}

export function defaultClassReminderText(): string {
  return '(Gain the next level as a sorcery to add its ability.)'
}

/** True when reminder is empty or matches a generated Saga/Creature default for any 2–5. */
export function isAutoManagedSagaReminder(text: unknown): boolean {
  const t = String(text ?? '').trim()
  if (!t) return true
  if (
    t === '(As this Saga enters and after your draw step, add a lore counter.)'
  ) {
    return true
  }
  return /^\(As this Saga enters and after your draw step, add a lore counter\. Sacrifice after (I|II|III|IV|V)\.\)$/.test(
    t,
  )
}

/**
 * When chapter count changes, refresh auto-managed Saga/Creature reminders.
 * Class reminder has no N clause — left unchanged.
 */
export function reminderAfterChapterCountChange(
  currentReminder: unknown,
  nextCount: unknown,
  mode: 'saga' | 'class' | 'saga-creature',
): string {
  const count = normalizeSagaChapterCount(nextCount)
  if (mode === 'class') {
    const cur = String(currentReminder ?? '').trim()
    return cur || defaultClassReminderText()
  }
  if (isAutoManagedSagaReminder(currentReminder)) {
    return mode === 'saga-creature'
      ? defaultSagaCreatureReminderForCount(count)
      : defaultSagaReminderForCount(count)
  }
  return String(currentReminder ?? '')
}
