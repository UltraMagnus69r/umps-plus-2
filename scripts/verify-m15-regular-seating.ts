/**
 * Smoke-check Standard/Modern recipe stage rects vs Card Conjurer mapped targets.
 * Run: npx tsx scripts/verify-m15-regular-seating.ts
 */
import {
  buildModernDummyStageRects,
  getModernDummyManaPipGapPx,
  getModernDummyManaPipSizePx,
} from '../src/authority/modernDummyLayoutAuthority'

const TARGETS = {
  nameBar: { x: 203, y: 185, width: 1244, height: 114 },
  art: { x: 190, y: 312, width: 1271, height: 930 },
  typeLine: { x: 203, y: 1264, width: 1244, height: 114 },
  /** Rules L/R forced to art aperture (PipMint fidelity; CC pack was inset). */
  rulesText: { x: 190, y: 1399, width: 1271, height: 604 },
  lowerRight: { x: 1264, y: 1969, width: 205, height: 78 },
} as const

const TOL = { edge: 6, pipSize: 2 }

const rects = buildModernDummyStageRects()
const pip = getModernDummyManaPipSizePx()
const gap = getModernDummyManaPipGapPx()

let failed = 0
function check(name: string, ok: boolean, detail: string) {
  console.log(`  [${ok ? 'OK' : 'FAIL'}] ${name}: ${detail}`)
  if (!ok) failed += 1
}

console.log('M15 Regular seating (Standard/Modern recipe → stage)')
for (const key of Object.keys(TARGETS) as (keyof typeof TARGETS)[]) {
  const got = rects[key]
  const want = TARGETS[key]
  console.log(`\n${key}`)
  console.log(`  got  ${got.x}, ${got.y}, ${got.width}, ${got.height}`)
  console.log(`  want ${want.x}, ${want.y}, ${want.width}, ${want.height}`)
  check(
    'edges',
    Math.abs(got.x - want.x) <= TOL.edge &&
      Math.abs(got.y - want.y) <= TOL.edge &&
      Math.abs(got.width - want.width) <= TOL.edge + 2 &&
      Math.abs(got.height - want.height) <= TOL.edge + 2,
    `Δx=${got.x - want.x} Δy=${got.y - want.y} Δw=${got.width - want.width} Δh=${got.height - want.height}`,
  )
}

console.log('\nmana')
check('pip size', Math.abs(pip - 71) <= TOL.pipSize, `${pip} (target 71±${TOL.pipSize})`)
check('pip gap', gap >= 0 && gap <= 2, `${gap} (target 0–2)`)

if (failed) {
  console.error(`\n${failed} check(s) failed`)
  process.exit(1)
}
console.log('\nAll checks passed')
