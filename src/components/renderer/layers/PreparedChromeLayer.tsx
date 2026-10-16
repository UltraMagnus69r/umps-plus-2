/**
 * Prepared Creatures — split rules box: left prepared rules + right nested mini-spell.
 */
import { memo } from 'react'
import { Layer, Shape, Text } from 'react-konva'
import { shallow } from 'zustand/shallow'
import {
  getPreparedLeftRulesRect,
  getPreparedSpellNameBarRect,
  getPreparedSpellTextRect,
  getPreparedSpellTypeBarRect,
  layoutUsesPreparedChrome,
  PREPARED_DEFAULT_REMINDER,
} from '../../../authority/preparedLayoutAuthority'
import { getActiveLayoutCapabilitiesFromState } from '../../../authority/layoutRegistry'
import type { LayoutId } from '../../../authority/layoutTaxonomy'
import { useCardStore } from '../../../store/useCardStore'

function PreparedChromeLayer() {
  const {
    currentLayout,
    activeLayout,
    cardText,
    preparedSpellName,
    preparedSpellManaCost,
    preparedSpellType,
    preparedSpellText,
  } = useCardStore(
    (s) => ({
      currentLayout: s.currentLayout,
      activeLayout: s.cardData.layout as LayoutId,
      cardText: s.cardData.cardText,
      preparedSpellName: s.cardData.preparedSpellName,
      preparedSpellManaCost: s.cardData.preparedSpellManaCost,
      preparedSpellType: s.cardData.preparedSpellType,
      preparedSpellText: s.cardData.preparedSpellText,
    }),
    shallow,
  )

  const caps = getActiveLayoutCapabilitiesFromState({
    currentLayout,
    cardData: { layout: activeLayout },
  })
  const enabled = caps.supportsPreparedChrome === true && layoutUsesPreparedChrome(activeLayout)

  const leftR = getPreparedLeftRulesRect()
  const nameBar = getPreparedSpellNameBarRect()
  const typeBar = getPreparedSpellTypeBarRect()
  const spellTextR = getPreparedSpellTextRect()

  const preparedBody = String(cardText ?? '').trim() || PREPARED_DEFAULT_REMINDER
  const spellName = String(preparedSpellName ?? '').trim() || 'Spell Ability'
  const spellMana = String(preparedSpellManaCost ?? '').trim()
  const spellType = String(preparedSpellType ?? '').trim() || 'Sorcery'
  const spellBody = String(preparedSpellText ?? '').trim()

  if (!enabled) return null

  const pad = 14
  const barPadX = 12

  return (
    <Layer listening={false}>
      {/* Left prepared parchment */}
      <Shape
        listening={false}
        sceneFunc={(ctx) => {
          const c = ctx as unknown as CanvasRenderingContext2D
          const r = 10
          c.beginPath()
          c.moveTo(leftR.x + r, leftR.y)
          c.arcTo(leftR.x + leftR.width, leftR.y, leftR.x + leftR.width, leftR.y + leftR.height, r)
          c.arcTo(leftR.x + leftR.width, leftR.y + leftR.height, leftR.x, leftR.y + leftR.height, r)
          c.arcTo(leftR.x, leftR.y + leftR.height, leftR.x, leftR.y, r)
          c.arcTo(leftR.x, leftR.y, leftR.x + leftR.width, leftR.y, r)
          c.closePath()
          c.fillStyle = '#f2efe8'
          c.fill()
          c.strokeStyle = 'rgba(60,50,40,0.22)'
          c.lineWidth = 1.5
          c.stroke()
        }}
      />
      <Text
        listening={false}
        x={leftR.x + pad}
        y={leftR.y + pad}
        width={leftR.width - pad * 2}
        height={leftR.height - pad * 2}
        text={preparedBody}
        fontFamily="Plantin, Georgia, serif"
        fontSize={30}
        fill="#1a1612"
        align="left"
        verticalAlign="top"
        wrap="word"
      />

      {/* Right mini-spell column outline */}
      <Shape
        listening={false}
        sceneFunc={(ctx) => {
          const c = ctx as unknown as CanvasRenderingContext2D
          const x = nameBar.x
          const y = nameBar.y
          const w = nameBar.width
          const h = typeBar.y + typeBar.height + spellTextR.height - nameBar.y
          const r = 8
          c.beginPath()
          c.moveTo(x + r, y)
          c.arcTo(x + w, y, x + w, y + h, r)
          c.arcTo(x + w, y + h, x, y + h, r)
          c.arcTo(x, y + h, x, y, r)
          c.arcTo(x, y, x + w, y, r)
          c.closePath()
          c.fillStyle = '#d8d4cf'
          c.fill()
          c.strokeStyle = 'rgba(20,18,16,0.55)'
          c.lineWidth = 2
          c.stroke()
        }}
      />

      {/* Spell name bar */}
      <Shape
        listening={false}
        sceneFunc={(ctx) => {
          const c = ctx as unknown as CanvasRenderingContext2D
          c.fillStyle = '#3a3836'
          c.fillRect(nameBar.x + 2, nameBar.y + 2, nameBar.width - 4, nameBar.height - 2)
        }}
      />
      <Text
        listening={false}
        x={nameBar.x + barPadX}
        y={nameBar.y}
        width={nameBar.width * 0.62 - barPadX}
        height={nameBar.height}
        text={spellName}
        fontFamily="Beleren, Georgia, serif"
        fontStyle="bold"
        fontSize={26}
        fill="#f4f0ea"
        align="left"
        verticalAlign="middle"
        wrap="none"
        ellipsis
      />
      <Text
        listening={false}
        x={nameBar.x + nameBar.width * 0.58}
        y={nameBar.y}
        width={nameBar.width * 0.42 - barPadX}
        height={nameBar.height}
        text={spellMana || '{0}'}
        fontFamily="Plantin, Georgia, serif"
        fontSize={24}
        fill="#f4f0ea"
        align="right"
        verticalAlign="middle"
        wrap="none"
      />

      {/* Spell type bar */}
      <Shape
        listening={false}
        sceneFunc={(ctx) => {
          const c = ctx as unknown as CanvasRenderingContext2D
          c.fillStyle = '#4a4744'
          c.fillRect(typeBar.x + 2, typeBar.y, typeBar.width - 4, typeBar.height)
        }}
      />
      <Text
        listening={false}
        x={typeBar.x + barPadX}
        y={typeBar.y}
        width={typeBar.width - barPadX * 2}
        height={typeBar.height}
        text={spellType}
        fontFamily="Beleren, Georgia, serif"
        fontStyle="bold"
        fontSize={22}
        fill="#f0ebe4"
        align="left"
        verticalAlign="middle"
        wrap="none"
        ellipsis
      />

      {/* Spell effect text */}
      <Shape
        listening={false}
        sceneFunc={(ctx) => {
          const c = ctx as unknown as CanvasRenderingContext2D
          c.fillStyle = '#e8e4de'
          c.fillRect(spellTextR.x + 2, spellTextR.y, spellTextR.width - 4, spellTextR.height - 2)
        }}
      />
      <Text
        listening={false}
        x={spellTextR.x + pad}
        y={spellTextR.y + 10}
        width={spellTextR.width - pad * 2}
        height={spellTextR.height - 20}
        text={spellBody || 'Spell effect…'}
        fontFamily="Plantin, Georgia, serif"
        fontSize={28}
        fill="#1a1612"
        align="left"
        verticalAlign="top"
        wrap="word"
      />
    </Layer>
  )
}

export default memo(PreparedChromeLayer)
