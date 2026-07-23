/**
 * Forward-only mana normalization: shorthand → canonical bracketed tokens.
 * Idempotent for already-canonical input.
 * Lexical safety: do not convert letters that are part of words (e.g. "green", "bug").
 */

const CANONICAL_COLOR = /^[WUBRG]$/i
const IS_COLOR_OR_C = (ch: string) => CANONICAL_COLOR.test(ch) || ch === 'c' || ch === 'C'

/**
 * Normalize raw shorthand into canonical bracketed form.
 * - ubr → {U}{B}{R}
 * - 12 → {12}
 * - 2gr → {2}{G}{R}
 * - {G} remains {G}
 * - green remains green (letter g not standalone / not after number)
 */
export function normalizeMana(input: string): string {
  if (input == null || typeof input !== 'string') return ''
  const s = input
  let out = ''
  let i = 0
  while (i < s.length) {
    const brace = s.indexOf('{', i)
    if (brace === -1) {
      out += consumeShorthand(s.slice(i), i > 0 ? s.charCodeAt(i - 1) : -1)
      break
    }
    out += consumeShorthand(s.slice(i, brace), i > 0 ? s.charCodeAt(i - 1) : -1)
    const end = s.indexOf('}', brace + 1)
    if (end === -1) {
      out += s.slice(brace)
      break
    }
    const inner = s.slice(brace + 1, end).trim()
    out += inner ? `{${inner}}` : ''
    i = end + 1
  }
  return out
}

/**
 * Convert shorthand only when:
 * A) Standalone: symbol surrounded by whitespace or string boundaries.
 * B) Immediately preceded by a number (e.g. 2g, 12u).
 * C) Immediately after an already-converted number or color token (greedy run: 2gg → {2}{G}{G}).
 * Exclusion: if the letter is adjacent to another letter that was not part of a converted token, leave literal (e.g. green, bug).
 * prevChar: -1 = start of segment, otherwise previous character code for context.
 */
function consumeShorthand(segment: string, prevChar: number): string {
  if (!segment) return ''
  let out = ''
  let i = 0
  let prev: number = prevChar
  let lastEmittedNumberOrColor = false
  while (i < segment.length) {
    const numMatch = segment.slice(i).match(/^\d+/)
    if (numMatch) {
      out += `{${numMatch[0]}}`
      i += numMatch[0].length
      prev = numMatch[0].charCodeAt(numMatch[0].length - 1)
      lastEmittedNumberOrColor = true
      continue
    }
    const ch = segment[i]
    const upper = ch.toUpperCase()
    const nextCh = segment[i + 1]
    const nextIsLetter = nextCh != null && /[a-zA-Z]/.test(nextCh)
    const prevIsLetter = prev >= 0 && /[a-zA-Z]/.test(String.fromCharCode(prev))
    const standalone = !prevIsLetter && !nextIsLetter
    const afterNumber = prev >= 0 && prev >= 48 && prev <= 57
    const inGreedyRun = lastEmittedNumberOrColor && IS_COLOR_OR_C(ch)
    if (IS_COLOR_OR_C(ch) && (standalone || afterNumber || inGreedyRun)) {
      out += `{${upper}}`
      i += 1
      prev = ch.charCodeAt(0)
      lastEmittedNumberOrColor = true
      continue
    }
    out += ch
    i += 1
    prev = ch.charCodeAt(0)
    lastEmittedNumberOrColor = false
  }
  return out
}
