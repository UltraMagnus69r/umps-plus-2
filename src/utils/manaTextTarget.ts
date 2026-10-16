/**
 * Insert destinations for the mana picker / brace tokens.
 * Stage targets cover Saga / Class / Saga Creature chapter I–V fields.
 */

export const SAGA_STAGE_MANA_TARGETS = [
  'sagaStage0',
  'sagaStage1',
  'sagaStage2',
  'sagaStage3',
  'sagaStage4',
] as const

export type SagaStageManaTarget = (typeof SAGA_STAGE_MANA_TARGETS)[number]

export type ManaTextTarget = 'manaCost' | 'rulesText' | SagaStageManaTarget

export function isSagaStageManaTarget(value: unknown): value is SagaStageManaTarget {
  return (
    typeof value === 'string' &&
    (SAGA_STAGE_MANA_TARGETS as readonly string[]).includes(value)
  )
}

export function isManaTextTarget(value: unknown): value is ManaTextTarget {
  return value === 'manaCost' || value === 'rulesText' || isSagaStageManaTarget(value)
}

export function manaTargetForSagaStage(index: number): SagaStageManaTarget {
  const i = Math.max(0, Math.min(SAGA_STAGE_MANA_TARGETS.length - 1, Math.floor(index)))
  return SAGA_STAGE_MANA_TARGETS[i]!
}

export function sagaStageIndexFromTarget(target: SagaStageManaTarget): number {
  const i = SAGA_STAGE_MANA_TARGETS.indexOf(target)
  return i >= 0 ? i : 0
}
