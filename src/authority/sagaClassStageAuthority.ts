/**
 * Saga / Class structured stage text (reminder + I / II / III).
 * Mirrors the planeswalker ability pattern: first-class CardData fields, not one blob.
 */

export const SAGA_CLASS_STAGE_COUNT = 3 as const

export type SagaClassStageTexts = [string, string, string]

export function normalizeSagaReminderText(value: unknown, fallback = ''): string {
  return String(value ?? fallback)
}

export function normalizeSagaStageTexts(
  value: unknown,
  fallback: readonly string[] = ['', '', ''],
): SagaClassStageTexts {
  const src = Array.isArray(value) ? value : fallback
  return [
    String(src[0] ?? fallback[0] ?? ''),
    String(src[1] ?? fallback[1] ?? ''),
    String(src[2] ?? fallback[2] ?? ''),
  ]
}

export function defaultSagaStageTexts(): SagaClassStageTexts {
  return ['', '', '']
}
