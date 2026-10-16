/**
 * Smoke-check Class / Saga recipe stage rects + Spell Modern inner-border gate.
 * Run: npx tsx scripts/verify-class-saga-battle-seating.ts
 */
import {
  CLASS_REGULAR_RECIPE,
  SAGA_CREATURE_RECIPE,
  SAGA_REGULAR_RECIPE,
  buildRecipeCoreStageRects,
  buildRecipeExtensionStageRects,
} from '../src/authority/recipes/layoutRecipeAuthority'
import { getLayoutContract } from '../src/authority/layoutRegistry'
import {
  getInnerBorderCornerRadius,
  getInnerBorderStageRect,
  isModernDummyLayout,
  isSagaCreatureLayout,
} from '../src/authority/layoutTaxonomy'
import { BLEED_PX, TRIM_HEIGHT, TRIM_WIDTH } from '../src/authority/geometryAuthority'

let failed = 0
function check(name: string, ok: boolean, detail: string) {
  console.log(`  [${ok ? 'OK' : 'FAIL'}] ${name}: ${detail}`)
  if (!ok) failed += 1
}

console.log('Saga Regular (right art / left parchment + banner)')
{
  const r = buildRecipeCoreStageRects(SAGA_REGULAR_RECIPE)
  check('art right column', r.art.x > 700, `art.x=${r.art.x}`)
  check('rules left of art', r.rulesText.x + r.rulesText.width <= r.art.x + 20, `rulesR=${r.rulesText.x + r.rulesText.width} art.x=${r.art.x}`)
  check('type at bottom', r.typeLine.y > 1700, `type.y=${r.typeLine.y}`)
  const ext = buildRecipeExtensionStageRects(SAGA_REGULAR_RECIPE)
  check('banner+chapters', Boolean(ext?.banner && ext?.chapterRow1 && ext?.reminder), JSON.stringify(Object.keys(ext ?? {})))
  check('short reminder band', (ext?.reminder?.height ?? 999) < 200, `reminder.h=${ext?.reminder?.height}`)
  const bandH1 = ext?.chapterRow1?.height ?? 0
  const bandH2 = ext?.chapterRow2?.height ?? 0
  const bandH3 = ext?.chapterRow3?.height ?? 0
  check(
    'three equal chapter bands',
    Math.abs(bandH1 - bandH2) <= 2 && Math.abs(bandH2 - bandH3) <= 2,
    `h=${bandH1},${bandH2},${bandH3}`,
  )
  const c = getLayoutContract({ family: 'spell', variant: 'saga' })
  check('saga chrome flag', c.capabilities.supportsSagaClassChrome === true, String(c.capabilities.supportsSagaClassChrome))
  check('suppress rules text', c.capabilities.suppressRulesTextRendering === true, String(c.capabilities.suppressRulesTextRendering))
}

console.log('\nClass Regular (opposite of Saga — art left / text right)')
{
  const r = buildRecipeCoreStageRects(CLASS_REGULAR_RECIPE)
  check('art left column', r.art.x < 400, `art.x=${r.art.x}`)
  check('rules right of art', r.rulesText.x >= r.art.x + r.art.width - 20, `rules.x=${r.rulesText.x} artR=${r.art.x + r.art.width}`)
  check('type at bottom', r.typeLine.y > 1700, `type.y=${r.typeLine.y}`)
  const ext = buildRecipeExtensionStageRects(CLASS_REGULAR_RECIPE)
  check('banner+levels', Boolean(ext?.banner && ext?.levelBand1 && ext?.reminder), JSON.stringify(Object.keys(ext ?? {})))
  check('short reminder band', (ext?.reminder?.height ?? 999) < 200, `reminder.h=${ext?.reminder?.height}`)
  const bandH1 = ext?.levelBand1?.height ?? 0
  const bandH2 = ext?.levelBand2?.height ?? 0
  const bandH3 = ext?.levelBand3?.height ?? 0
  check(
    'three equal level bands',
    Math.abs(bandH1 - bandH2) <= 2 && Math.abs(bandH2 - bandH3) <= 2,
    `h=${bandH1},${bandH2},${bandH3}`,
  )
  const c = getLayoutContract({ family: 'spell', variant: 'class' })
  check('class chrome flag', c.capabilities.supportsSagaClassChrome === true, String(c.capabilities.supportsSagaClassChrome))
}

console.log('\nStandard / Saga Creature (reminder + split + creature rules + P/T)')
{
  const r = buildRecipeCoreStageRects(SAGA_CREATURE_RECIPE)
  check('art right column', r.art.x > 700, `art.x=${r.art.x}`)
  check('type mid-lower (above creature rules)', r.typeLine.y > 1400 && r.typeLine.y < 1700, `type.y=${r.typeLine.y}`)
  check('rules below type', r.rulesText.y > r.typeLine.y + r.typeLine.height - 4, `rules.y=${r.rulesText.y} typeBottom=${r.typeLine.y + r.typeLine.height}`)
  check('rules full-width vs art', r.rulesText.width > r.art.width + 200, `rules.w=${r.rulesText.width} art.w=${r.art.width}`)
  check('P/T slot present', r.lowerRight.width > 50 && r.lowerRight.y > 1800, `pt=${JSON.stringify(r.lowerRight)}`)
  const ext = buildRecipeExtensionStageRects(SAGA_CREATURE_RECIPE)
  check(
    'reminderStrip+banner+parchment',
    Boolean(ext?.reminderStrip && ext?.banner && ext?.parchment && ext?.abilityCol),
    JSON.stringify(Object.keys(ext ?? {})),
  )
  const c = getLayoutContract({ family: 'standard', variant: 'saga-creature' })
  check('saga-creature id', isSagaCreatureLayout(c.id), JSON.stringify(c.id))
  check('chrome flag', c.capabilities.supportsSagaClassChrome === true, String(c.capabilities.supportsSagaClassChrome))
  check('P/T box', c.capabilities.supportsPowerToughnessBox === true, String(c.capabilities.supportsPowerToughnessBox))
  check('rules frame', c.capabilities.supportsRulesTextBoxFrame === true, String(c.capabilities.supportsRulesTextBoxFrame))
  check('rules text not suppressed', c.capabilities.suppressRulesTextRendering === false, String(c.capabilities.suppressRulesTextRendering))
}

console.log('\nSpell Modern inner border matches Standard Modern')
check(
  'spell/modern is modern-dummy for inner border',
  isModernDummyLayout({ family: 'spell', variant: 'modern' }),
  'expected true',
)
check(
  'standard/modern still modern-dummy',
  isModernDummyLayout({ family: 'standard', variant: 'modern' }),
  'expected true',
)
check(
  'spell/saga is NOT modern-dummy',
  !isModernDummyLayout({ family: 'spell', variant: 'saga' }),
  'expected false',
)

{
  const frame = {
    trimY: BLEED_PX,
    trimH: TRIM_HEIGHT,
    innerX: BLEED_PX + 40,
    innerY: BLEED_PX + 40,
    innerW: TRIM_WIDTH - 80,
    innerH: TRIM_HEIGHT - 80,
  }
  const stdRect = getInnerBorderStageRect({ family: 'standard', variant: 'modern' }, frame)
  const spellRect = getInnerBorderStageRect({ family: 'spell', variant: 'modern' }, frame)
  check(
    'inner-border stage rect identical',
    JSON.stringify(stdRect) === JSON.stringify(spellRect),
    `std=${JSON.stringify(stdRect)} spell=${JSON.stringify(spellRect)}`,
  )
  const stdCorner = getInnerBorderCornerRadius({ family: 'standard', variant: 'modern' })
  const spellCorner = getInnerBorderCornerRadius({ family: 'spell', variant: 'modern' })
  check(
    'inner-border corner radius identical',
    JSON.stringify(stdCorner) === JSON.stringify(spellCorner),
    `std=${JSON.stringify(stdCorner)} spell=${JSON.stringify(spellCorner)}`,
  )
  const cStd = getLayoutContract({ family: 'standard', variant: 'modern' })
  const cSpell = getLayoutContract({ family: 'spell', variant: 'modern' })
  const regionsMatch =
    JSON.stringify(cStd.regions.art) === JSON.stringify(cSpell.regions.art) &&
    JSON.stringify(cStd.regions.nameBar) === JSON.stringify(cSpell.regions.nameBar) &&
    JSON.stringify(cStd.regions.typeLine) === JSON.stringify(cSpell.regions.typeLine) &&
    JSON.stringify(cStd.regions.rulesText) === JSON.stringify(cSpell.regions.rulesText)
  check('art/name/type/rules regions identical', regionsMatch, regionsMatch ? 'match' : 'mismatch')
}

if (failed) {
  console.error(`\n${failed} check(s) failed`)
  process.exit(1)
}
console.log('\nAll checks passed')
