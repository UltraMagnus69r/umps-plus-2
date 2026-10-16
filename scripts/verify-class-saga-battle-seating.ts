/**
 * Smoke-check Class / Saga / Battle recipe stage rects vs Card Conjurer packs.
 * Run: npx tsx scripts/verify-class-saga-battle-seating.ts
 */
import {
  BATTLE_REGULAR_RECIPE,
  CLASS_REGULAR_RECIPE,
  SAGA_REGULAR_RECIPE,
  buildRecipeCoreStageRects,
  buildRecipeExtensionStageRects,
  trimNormToStageRect,
} from '../src/authority/recipes/layoutRecipeAuthority'

let failed = 0
function check(name: string, ok: boolean, detail: string) {
  console.log(`  [${ok ? 'OK' : 'FAIL'}] ${name}: ${detail}`)
  if (!ok) failed += 1
}

function near(a: number, b: number, tol = 2) {
  return Math.abs(a - b) <= tol
}

console.log('Class Regular (left art / right levels)')
{
  const r = buildRecipeCoreStageRects(CLASS_REGULAR_RECIPE)
  const artWant = trimNormToStageRect(CLASS_REGULAR_RECIPE.regions.art)
  check('art left column', near(r.art.x, artWant.x) && r.art.width < 800, `${r.art.x},${r.art.width}`)
  check('rules right of art', r.rulesText.x > r.art.x + r.art.width - 20, `rules.x=${r.rulesText.x} artR=${r.art.x + r.art.width}`)
  check('type at bottom', r.typeLine.y > 1700, `type.y=${r.typeLine.y}`)
  const ext = buildRecipeExtensionStageRects(CLASS_REGULAR_RECIPE)
  check('level bands', Boolean(ext?.levelBand1 && ext?.levelBand2 && ext?.levelBand3), JSON.stringify(Object.keys(ext ?? {})))
}

console.log('\nSaga Regular (right art / left chapters)')
{
  const r = buildRecipeCoreStageRects(SAGA_REGULAR_RECIPE)
  check('art right column', r.art.x > 700, `art.x=${r.art.x}`)
  check('rules left of art', r.rulesText.x + r.rulesText.width <= r.art.x + 20, `rulesR=${r.rulesText.x + r.rulesText.width} art.x=${r.art.x}`)
  check('type at bottom', r.typeLine.y > 1700, `type.y=${r.typeLine.y}`)
  const ext = buildRecipeExtensionStageRects(SAGA_REGULAR_RECIPE)
  check('chapter rows', Boolean(ext?.chapterRow1 && ext?.chapterRow2 && ext?.reminder), JSON.stringify(Object.keys(ext ?? {})))
}

console.log('\nBattle Regular (landscape→portrait map)')
{
  const r = buildRecipeCoreStageRects(BATTLE_REGULAR_RECIPE)
  check('art nearly full', r.art.width > 1200 && r.art.height > 1600, `${r.art.width}x${r.art.height}`)
  check('name present', r.nameBar.height > 50, `h=${r.nameBar.height}`)
  check('rules present', r.rulesText.width > 400, `w=${r.rulesText.width}`)
  const ext = buildRecipeExtensionStageRects(BATTLE_REGULAR_RECIPE)
  check('defense ext', Boolean(ext?.defense), JSON.stringify(Object.keys(ext ?? {})))
}

if (failed) {
  console.error(`\n${failed} check(s) failed`)
  process.exit(1)
}
console.log('\nAll checks passed')
