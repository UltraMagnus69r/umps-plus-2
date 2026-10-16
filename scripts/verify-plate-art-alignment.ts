/**
 * Verify name/type plate flat span equals art-frame outer for Standard/Modern recipe.
 * Run: npx tsx scripts/verify-plate-art-alignment.ts
 */
import { BEVEL_INSET } from '../src/authority/geometryAuthority'
import { buildModernDummyStageRects } from '../src/authority/modernDummyLayoutAuthority'
import { resolveArtAlignedPlateOuterRect } from '../src/authority/plateArtAlignmentAuthority'

const rects = buildModernDummyStageRects()
const art = rects.art
/** Visible art-window chrome outer (matches FrameLayer contractArtFrame). */
const artFrame = {
  x: art.x - BEVEL_INSET,
  width: art.width + 2 * BEVEL_INSET,
}
const nameH = rects.nameBar.height + 2 * BEVEL_INSET
const typeH = rects.typeLine.height + 2 * BEVEL_INSET

const name = resolveArtAlignedPlateOuterRect({
  artX: artFrame.x,
  artW: artFrame.width,
  plateY: rects.nameBar.y - BEVEL_INSET,
  plateH: nameH,
  shape: 'reverseBezierPlate',
  barRadius: 53,
})
const type = resolveArtAlignedPlateOuterRect({
  artX: artFrame.x,
  artW: artFrame.width,
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

console.log('Art content', art.x, art.x + art.width, 'w', art.width)
console.log('Art frame', artFrame.x, artFrame.x + artFrame.width, 'w', artFrame.width)
console.log('Name flat', name.flatX, name.flatX + name.flatW, 'ends ±', name.endCapPx)
console.log('Type flat', type.flatX, type.flatX + type.flatW, 'ends ±', type.endCapPx)
console.log('Rules', rects.rulesText.x, rects.rulesText.x + rects.rulesText.width)

check('name flat L', name.flatX === artFrame.x, `${name.flatX} vs ${artFrame.x}`)
check('name flat W', name.flatW === artFrame.width, `${name.flatW} vs ${artFrame.width}`)
check('type flat L', type.flatX === artFrame.x, `${type.flatX} vs ${artFrame.x}`)
check('type flat W', type.flatW === artFrame.width, `${type.flatW} vs ${artFrame.width}`)
check('name ends outside', name.x < artFrame.x && name.x + name.width > artFrame.x + artFrame.width, `box ${name.x}..${name.x + name.width}`)
check('type ends outside', type.x < artFrame.x && type.x + type.width > artFrame.x + artFrame.width, `box ${type.x}..${type.x + type.width}`)
check('endCap >= bevel', name.endCapPx >= BEVEL_INSET && type.endCapPx >= BEVEL_INSET, `${name.endCapPx}`)
check('rules = art content L', rects.rulesText.x === art.x, `${rects.rulesText.x} vs ${art.x}`)
check('rules = art content W', rects.rulesText.width === art.width, `${rects.rulesText.width} vs ${art.width}`)

if (failed) {
  console.error(`\n${failed} check(s) failed`)
  process.exit(1)
}
console.log('\nAll checks passed')
