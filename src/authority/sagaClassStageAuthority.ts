/**
 * Saga / Class / Saga Creature structured stage text (reminder + I…V).
 * Chapter count is dynamic 2–5 (default 3).
 */

import { romanNumeral } from './sagaClassLayoutAuthority'

export const SAGA_CHAPTER_COUNT_MIN = 2
export const SAGA_CHAPTER_COUNT_MAX = 5
export const SAGA_CHAPTER_COUNT_DEFAULT = 3

const ROMAN_TO_N: Record<string, number> = {
  I: 1,
  II: 2,
  III: 3,
  IV: 4,
  V: 5,
}

/** Scryfall chapter line: `I — …`, `I, II — …`, `III, IV — …`. */
const SAGA_CHAPTER_LINE_RE =
  /^((?:I|II|III|IV|V)(?:\s*,\s*(?:I|II|III|IV|V))*)\s*[—–-]\s*(.+)$/i

/** Class level-up cost line: `{2}{U}: Level 2`. */
const CLASS_LEVEL_COST_RE = /^(\{[^}]+\}(?:\s*\{[^}]+\})*)\s*:\s*Level\s+(\d+)\s*$/i

export type ParsedSagaClassOracle = {
  reminder: string
  chapterCount: number
  stages: string[]
  /** Non-chapter lines after chapters (Saga Creature keyword/ability box). */
  creatureText: string
}

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

function parseRomanList(raw: string): number[] {
  return String(raw)
    .split(/\s*,\s*/)
    .map((part) => ROMAN_TO_N[part.trim().toUpperCase()])
    .filter((n): n is number => typeof n === 'number' && n >= 1 && n <= 5)
}

function isReminderLine(line: string): boolean {
  const t = line.trim()
  if (!t) return false
  if (/^\(.*\)$/.test(t)) return true
  return /^As this Saga enters/i.test(t) || /^Gain the next level as a sorcery/i.test(t)
}

/**
 * Parse Scryfall Saga / Saga Creature `oracle_text` into reminder + I…N stages.
 * Shared chapter lines (`I, II, III — …`) copy the body into each listed stage.
 * Trailing non-chapter lines become `creatureText` (keyword box on Saga Creature).
 */
export function parseSagaOracleText(oracle: string | null | undefined): ParsedSagaClassOracle {
  const lines = String(oracle ?? '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  const reminderLines: string[] = []
  const stageMap = new Map<number, string>()
  const trailing: string[] = []
  let seenChapter = false
  let maxChapter = 0

  for (const line of lines) {
    const chapter = line.match(SAGA_CHAPTER_LINE_RE)
    if (chapter) {
      seenChapter = true
      const romans = parseRomanList(chapter[1])
      const body = String(chapter[2] ?? '').trim()
      for (const n of romans) {
        maxChapter = Math.max(maxChapter, n)
        const prev = stageMap.get(n)
        stageMap.set(n, prev ? `${prev}\n${body}` : body)
      }
      continue
    }
    if (!seenChapter && isReminderLine(line)) {
      reminderLines.push(line)
      continue
    }
    if (!seenChapter) {
      reminderLines.push(line)
      continue
    }
    trailing.push(line)
  }

  const chapterCount = normalizeSagaChapterCount(
    maxChapter > 0 ? maxChapter : SAGA_CHAPTER_COUNT_DEFAULT,
  )
  const stages = Array.from({ length: chapterCount }, (_, i) => stageMap.get(i + 1) ?? '')
  const reminder =
    reminderLines.join('\n').trim() || defaultSagaReminderForCount(chapterCount)

  return {
    reminder,
    chapterCount,
    stages,
    creatureText: trailing.join('\n').trim(),
  }
}

/**
 * Parse Scryfall Class `oracle_text` into reminder + Level 1…N stage bodies.
 * Level-up cost lines (`{2}{U}: Level 2`) start the matching stage; cost is kept
 * on the first line so mana pips render in the parchment band.
 */
export function parseClassOracleText(oracle: string | null | undefined): ParsedSagaClassOracle {
  const lines = String(oracle ?? '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  let reminder = ''
  const levelBodies = new Map<number, string[]>()
  let currentLevel = 1
  let maxLevel = 1
  let i = 0

  if (lines.length > 0 && isReminderLine(lines[0])) {
    reminder = lines[0]
    i = 1
  }

  for (; i < lines.length; i++) {
    const line = lines[i]
    const levelCost = line.match(CLASS_LEVEL_COST_RE)
    if (levelCost) {
      const level = Math.round(Number(levelCost[2]))
      if (Number.isFinite(level) && level >= 1 && level <= 5) {
        currentLevel = level
        maxLevel = Math.max(maxLevel, level)
        const cost = String(levelCost[1] ?? '').trim()
        const bucket = levelBodies.get(currentLevel) ?? []
        bucket.push(cost)
        levelBodies.set(currentLevel, bucket)
        continue
      }
    }
    maxLevel = Math.max(maxLevel, currentLevel)
    const bucket = levelBodies.get(currentLevel) ?? []
    bucket.push(line)
    levelBodies.set(currentLevel, bucket)
  }

  const chapterCount = normalizeSagaChapterCount(Math.max(maxLevel, SAGA_CHAPTER_COUNT_DEFAULT))
  const stages = Array.from({ length: chapterCount }, (_, idx) => {
    const level = idx + 1
    return (levelBodies.get(level) ?? []).join('\n').trim()
  })

  return {
    reminder: reminder || defaultClassReminderText(),
    chapterCount,
    stages,
    creatureText: '',
  }
}

export function parseSagaClassOracleText(
  oracle: string | null | undefined,
  mode: 'saga' | 'class' | 'saga-creature',
): ParsedSagaClassOracle {
  if (mode === 'class') return parseClassOracleText(oracle)
  return parseSagaOracleText(oracle)
}
