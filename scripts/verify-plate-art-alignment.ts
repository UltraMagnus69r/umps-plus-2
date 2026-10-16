/**
 * Verify name/type plate flat span equals art aperture for Standard/Modern recipe.
 * Run: npx tsx scripts/verify-plate-art-alignment.ts
 */
import { BEVEL_INSET } from '../src/authority/geometryAuthority'
import { buildModernDummyStageRects } from '../src/authority/modernDummyLayoutAuthority'
import { resolveArtAlignedPlateOuterRect } from '../src/authority/plateArtAlignmentAuthority'

const rects = buildModernDummyStageRects()
const art = rects.art
const nameH = rects.nameBar.height + 2 * BEVEL_INSET
const typeH = rects.typeLine.height + 2 * BEVEL_INSET

const name = resolveArtAlignedPlateOuterRect({
  artX: art.x,
  artW: art.width,
  plateY: rects.nameBar.y - BEVEL_INSET,
  plateH: nameH,
  shape: 'reverseBezierPlate',
  barRadius: 53,
})
const type = resolveArtAlignedPlateOuterRect({
  artX: art.x,
  artW: art.width,
  plateY: rects.typeLine.y - BEVEL_INSET,
  plateH: typeH,
  shape: 'reverseBezierPlate',
  barRadius: 53,
})

let failed = 0
function check(label: string, ok: boolean, detail: string) {
  console.log(`  [${ok ? 'OK' : 'FAIL'}] ${label}: ${detail}`)
  if (!ok) failed += 1
}

console.log('Art aperture', art.x, art.x + art.width, 'w', art.width)
console.log('Name flat', name.flatX, name.flatX + name.flatW, 'ends ±', name.endCapPx)
console.log('Type flat', type.flatX, type.flatX + type.flatW, 'ends ±', type.endCapPx)

check('name flat L', name.flatX === art.x, `${name.flatX} vs ${art.x}`)
check('name flat W', name.flatW === art.width, `${name.flatW} vs ${art.width}`)
check('type flat L', type.flatX === art.x, `${type.flatX} vs ${art.x}`)
check('type flat W', type.flatW === art.width, `${type.flatW} vs ${art.width}`)
check('name ends outside', name.x < art.x && name.x + name.width > art.x + art.width, `box ${name.x}..${name.x + name.width}`)
check('type ends outside', type.x < art.x && type.x + type.width > art.x + art.width, `box ${type.x}..${type.x + type.width}`)

if (failed) {
  console.error(`\n${failed} check(s) failed`)
  process.exit(1)
}
console.log('\nAll checks passed')
