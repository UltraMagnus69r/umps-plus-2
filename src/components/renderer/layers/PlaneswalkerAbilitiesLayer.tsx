import { memo, useMemo, useRef } from 'react'
import { Group, Image, Layer, Rect, Text } from 'react-konva'
import { shallow } from 'zustand/shallow'
import {
  getActiveLayoutCapabilitiesFromState,
  getActiveLayoutRegionsFromState,
  layoutRegionToStageRect,
} from '../../../authority/layoutRegistry'
import {
  normalizePlaneswalkerAbilities,
  normalizePlaneswalkerAbilityCount,
} from '../../../authority/planeswalkerAbilityAuthority'
import {
  getPlaneswalkerLoyaltyBadgeUrl,
  PLANESWALKER_BADGE_COST_TEXT_FILL,
  PLANESWALKER_BADGE_COST_FONT_FAMILY,
  PLANESWALKER_LOYALTY_BADGE_INTRINSIC,
  ABILITY_BADGE_DISPLAY_SCALE,
  layoutPlaneswalkerBadgeCostOnShield,
  type PlaneswalkerCostSign,
} from '../../../authority/planeswalkerSymbolAuthority'
import {
  getPlaneswalkerModernV2TextBoxInnerRect,
  getPlaneswalkerModernV2BadgeRightEdgeX,
  PW_MODERN_V2_ABILITY_BADGE_SCALE,
  PW_MODERN_V2_RULES_BOX_BOTTOM_BOW_DEPTH_PX,
  PW_MODERN_V2_RULES_BOX_BOTTOM_CORNER_RADIUS_PX,
} from '../../../authority/planeswalkerModernV2LayoutAuthority'
import { addPlaneswalkerModernV2RulesPanelPath } from './planeswalkerModernV2RulesPanelPath'
import { useEffectiveTypographyFontKey } from '../../../hooks/useEffectiveTypographyFontKey'
import {
  resolveTypographyFontFace,
  resolveTypographyInkColor,
  typographyPtToStagePx,
  TYPO_RULES_PT_REF_PX,
} from '../../../authority/typographyAuthority'
import { resolveReadableInkOnBoxPanel } from '../../../authority/boxPanelFillAuthority'
import { RULES_LINE_HEIGHT_RATIO, RULES_MAX_FONT, RULES_MIN_FONT, RULES_PADDING, measureWrappedTextHeight } from './textIconsShared'
import type { LayoutId } from '../../../authority/layoutTaxonomy'
import { isPlaneswalkerModernAbilityBoxLayout } from '../../../authority/layoutTaxonomy'
import { useCardStore } from '../../../store/useCardStore'
import { useKonvaPublicImage } from '../../../hooks/useKonvaPublicImage'

const SECONDARY_STYLE_TEXT_FILL_LIGHT = '#fff'
const SECONDARY_STYLE_TEXT_FILL_DARK = '#111'
const SECONDARY_STYLE_STROKE_WIDTH = 2
const SECONDARY_STYLE_SHADOW_BLUR = 4
const TEXT_SHADOW_OFFSET = { x: 1, y: 1 }

const BADGE_TEXT_GAP = 6
const ROW_GAP = 4
/** Alternating loyalty-row band — semi-opaque smoke over full-bleed art (real PW borderless striping). */
const ABILITY_ROW_SMOKED_FILL = 'rgba(0, 0, 0, 0.26)'
const ABILITY_ROW_SMOKED_CORNER_RADIUS = 3

type AbilityRowModel = {
  kind: 'ability'
  rowIndex: number
  costSign: PlaneswalkerCostSign
  costValue: number
  text: string
  y: number
  rowHeight: number
  badgeUrl: string
}

function PlaneswalkerAbilitiesLayer() {
  const {
    planeswalkerStaticText,
    planeswalkerAbilityCount,
    planeswalkerAbilities,
    rulesTypography,
    rulesTextBoxColor,
    rulesTextBoxGradientEnabled,
    rulesTextBoxGradientDirection,
    rulesTextBoxGradientSaturation,
    secondaryNameLightText,
    currentLayout,
    activeLayout,
  } = useCardStore(
    (s) => ({
      planeswalkerStaticText: s.cardData.planeswalkerStaticText,
      planeswalkerAbilityCount: s.cardData.planeswalkerAbilityCount,
      planeswalkerAbilities: s.cardData.planeswalkerAbilities,
      rulesTypography: s.cardData.rulesTypography,
      rulesTextBoxColor: s.cardData.rulesTextBoxColor,
      rulesTextBoxGradientEnabled: s.cardData.rulesTextBoxGradientEnabled,
      rulesTextBoxGradientDirection: s.cardData.rulesTextBoxGradientDirection,
      rulesTextBoxGradientSaturation: s.cardData.rulesTextBoxGradientSaturation,
      secondaryNameLightText: s.cardData.secondaryNameLightText,
      currentLayout: s.currentLayout,
      activeLayout: s.cardData.layout as LayoutId,
    }),
    shallow,
  )

  const capabilities = getActiveLayoutCapabilitiesFromState({
    currentLayout,
    cardData: { layout: activeLayout },
  })
  const floatingTextTreatment = capabilities.supportsFloatingTextTreatment
  const modernV2Layout = capabilities.supportsPlaneswalkerModernV2Layout
  const expandableAbilityRows = isPlaneswalkerModernAbilityBoxLayout(activeLayout)
  const measureCtxRef = useRef<CanvasRenderingContext2D | null>(null)
  const activeRegions = getActiveLayoutRegionsFromState({
    currentLayout,
    cardData: { layout: activeLayout },
  })
  const rulesRect = modernV2Layout
    ? getPlaneswalkerModernV2TextBoxInnerRect()
    : layoutRegionToStageRect(activeRegions.rulesText)
  const innerX = rulesRect.x + RULES_PADDING
  const innerY = rulesRect.y + RULES_PADDING
  const innerW = Math.max(1, rulesRect.width - 2 * RULES_PADDING)
  const innerH = Math.max(1, rulesRect.height - 2 * RULES_PADDING)

  const count = normalizePlaneswalkerAbilityCount(planeswalkerAbilityCount)
  const abilities = normalizePlaneswalkerAbilities(planeswalkerAbilities, count)
  const staticText = String(planeswalkerStaticText ?? '').trim()
  const rowCount = (staticText ? 1 : 0) + count

  const effectiveRulesFontKey = useEffectiveTypographyFontKey('rulesTypography', rulesTypography.fontKey)

  const rulesFace = useMemo(
    () => resolveTypographyFontFace(effectiveRulesFontKey, rulesTypography.weight),
    [effectiveRulesFontKey, rulesTypography.weight],
  )
  const rulesStack = rulesFace.fontStack
  const rulesFontStyle = rulesFace.fontStyle
  const rulesInk = useMemo(
    () => {
      if (floatingTextTreatment) {
        return secondaryNameLightText ? SECONDARY_STYLE_TEXT_FILL_LIGHT : SECONDARY_STYLE_TEXT_FILL_DARK
      }
      return resolveTypographyInkColor(
        rulesTypography,
        resolveReadableInkOnBoxPanel(
          rulesTextBoxColor,
          undefined,
          rulesTextBoxGradientEnabled,
          rulesTextBoxGradientDirection,
          rulesTextBoxGradientSaturation,
        ),
      )
    },
    [
      floatingTextTreatment,
      secondaryNameLightText,
      rulesTypography,
      rulesTextBoxColor,
      rulesTextBoxGradientEnabled,
      rulesTextBoxGradientDirection,
      rulesTextBoxGradientSaturation,
    ],
  )
  const rulesStroke = floatingTextTreatment
    ? secondaryNameLightText
      ? SECONDARY_STYLE_TEXT_FILL_DARK
      : SECONDARY_STYLE_TEXT_FILL_LIGHT
    : undefined
  const rulesShadow = floatingTextTreatment ? (secondaryNameLightText ? '#000' : '#fff') : undefined
  const rulesFontStyleEffective = floatingTextTreatment ? 'bold' : rulesFontStyle

  const fontSize = useMemo(() => {
    const base = typographyPtToStagePx(rulesTypography.sizePt, TYPO_RULES_PT_REF_PX)
    const rowBudget = Math.max(1, (innerH - ROW_GAP * Math.max(0, rowCount - 1)) / Math.max(1, rowCount))
    const scaled = Math.min(base, rowBudget * 0.58, RULES_MAX_FONT)
    return Math.max(RULES_MIN_FONT, Math.floor(scaled * 2) / 2)
  }, [rulesTypography.sizePt, innerH, rowCount])

  const lineHeight = Math.max(fontSize + 2, fontSize * RULES_LINE_HEIGHT_RATIO)
  const badgeDisplayScale =
    ABILITY_BADGE_DISPLAY_SCALE * (modernV2Layout ? PW_MODERN_V2_ABILITY_BADGE_SCALE : 1)
  const badgeTargetH =
    Math.min(lineHeight * 0.95, (innerH / Math.max(1, rowCount)) * 0.9) * badgeDisplayScale
  const abilityRowHeight = Math.max(lineHeight, badgeTargetH)

  const resolveAbilityRowTextBounds = (costSign: PlaneswalkerCostSign) => {
    const intrinsic =
      PLANESWALKER_LOYALTY_BADGE_INTRINSIC[
        costSign === '+' ? 'up' : costSign === '-' ? 'down' : 'neutral'
      ]
    const badgeW = intrinsic.width * (badgeTargetH / Math.max(1, intrinsic.height))
    if (modernV2Layout) {
      const textX = Math.max(innerX, getPlaneswalkerModernV2BadgeRightEdgeX() + BADGE_TEXT_GAP)
      return { textX, textW: Math.max(1, innerX + innerW - textX) }
    }
    const textX = innerX + badgeW + BADGE_TEXT_GAP
    return { textX, textW: Math.max(1, innerW - badgeW - BADGE_TEXT_GAP) }
  }

  const staticTextBounds = useMemo(() => {
    if (!staticText) return { textX: innerX, textW: innerW }
    if (modernV2Layout) {
      const textX = Math.max(innerX, getPlaneswalkerModernV2BadgeRightEdgeX() + BADGE_TEXT_GAP)
      return { textX, textW: Math.max(1, innerX + innerW - textX) }
    }
    return { textX: innerX, textW: innerW }
  }, [staticText, modernV2Layout, innerX, innerW])

  const rows = useMemo(() => {
    const measureCtx = (() => {
      if (!measureCtxRef.current) {
        const canvas = document.createElement('canvas')
        measureCtxRef.current = canvas.getContext('2d')
      }
      return measureCtxRef.current
    })()

    const out: Array<{ kind: 'static'; text: string; y: number } | AbilityRowModel> = []
    let y = innerY
    if (staticText) {
      out.push({ kind: 'static', text: staticText, y })
      y += lineHeight + ROW_GAP
    }
    for (let i = 0; i < count; i++) {
      const ab = abilities[i]
      const { textW } = resolveAbilityRowTextBounds(ab.costSign)
      const measuredTextHeight = expandableAbilityRows
        ? measureWrappedTextHeight(
            measureCtx,
            String(ab.text ?? ''),
            textW,
            rulesStack,
            rulesFontStyleEffective,
            fontSize,
            lineHeight,
          )
        : lineHeight
      const rowHeight = Math.max(abilityRowHeight, measuredTextHeight)
      out.push({
        kind: 'ability',
        rowIndex: i + 1,
        costSign: ab.costSign,
        costValue: ab.costValue,
        text: String(ab.text ?? ''),
        y,
        rowHeight,
        badgeUrl: getPlaneswalkerLoyaltyBadgeUrl(i + 1, ab.costSign),
      })
      y += rowHeight + ROW_GAP
    }
    return out
  }, [
    staticText,
    count,
    abilities,
    innerY,
    lineHeight,
    abilityRowHeight,
    expandableAbilityRows,
    fontSize,
    rulesStack,
    rulesFontStyleEffective,
    modernV2Layout,
    innerX,
    innerW,
    badgeTargetH,
  ])

  if (!capabilities.supportsPlaneswalkerAbilities) return null

  const sharedTextProps = {
    fontFamily: rulesStack,
    fontStyle: rulesFontStyleEffective,
    fontSize,
    fill: rulesInk,
    stroke: rulesStroke,
    strokeWidth: floatingTextTreatment ? SECONDARY_STYLE_STROKE_WIDTH : 0,
    shadowColor: rulesShadow,
    shadowBlur: floatingTextTreatment ? SECONDARY_STYLE_SHADOW_BLUR : 0,
    shadowOffset: floatingTextTreatment ? TEXT_SHADOW_OFFSET : undefined,
  }

  return (
    <Layer listening={false}>
      <Group
        {...(modernV2Layout
          ? {
              clipFunc: (ctx) => {
                const c = ctx as unknown as CanvasRenderingContext2D
                addPlaneswalkerModernV2RulesPanelPath(
                  c,
                  rulesRect.x,
                  rulesRect.y,
                  rulesRect.width,
                  rulesRect.height,
                  PW_MODERN_V2_RULES_BOX_BOTTOM_BOW_DEPTH_PX,
                  false,
                  PW_MODERN_V2_RULES_BOX_BOTTOM_CORNER_RADIUS_PX,
                )
                c.clip()
              },
            }
          : {
              clipX: rulesRect.x,
              clipY: rulesRect.y,
              clipWidth: rulesRect.width,
              clipHeight: rulesRect.height,
            })}
        listening={false}
      >
        {rows.map((row, idx) =>
          row.kind === 'static' ? (
            <Text
              key={`pw-static-${idx}`}
              text={row.text}
              x={staticTextBounds.textX}
              y={row.y}
              width={staticTextBounds.textW}
              height={lineHeight}
              {...sharedTextProps}
              wrap="word"
              listening={false}
            />
          ) : (
            <Group key={`pw-ab-${idx}-${row.rowIndex}`} listening={false}>
              {row.rowIndex % 2 === 1 ? (
                <Rect
                  x={rulesRect.x}
                  y={row.y}
                  width={rulesRect.width}
                  height={row.rowHeight}
                  fill={ABILITY_ROW_SMOKED_FILL}
                  cornerRadius={ABILITY_ROW_SMOKED_CORNER_RADIUS}
                  listening={false}
                />
              ) : null}
              {(() => {
                const { textX, textW } = resolveAbilityRowTextBounds(row.costSign)
                return (
                  <Text
                    text={row.text}
                    x={textX}
                    y={row.y}
                    width={textW}
                    height={row.rowHeight}
                    {...sharedTextProps}
                    wrap="word"
                    verticalAlign={expandableAbilityRows ? 'middle' : 'top'}
                    listening={false}
                  />
                )
              })()}
            </Group>
          ),
        )}
      </Group>
      {rows.map((row, idx) =>
        row.kind === 'ability' ? (
          <PlaneswalkerAbilityRow
            key={`pw-badge-${idx}-${row.rowIndex}`}
            row={row}
            badgeX={modernV2Layout ? getPlaneswalkerModernV2BadgeRightEdgeX() : innerX}
            badgeAnchor={modernV2Layout ? 'right' : 'left'}
            lineHeight={row.rowHeight}
            badgeTargetH={badgeTargetH}
            badgesOnly
          />
        ) : null,
      )}
    </Layer>
  )
}

function PlaneswalkerAbilityRow({
  row,
  badgeX,
  badgeAnchor,
  lineHeight,
  badgeTargetH,
  badgesOnly = false,
  showSmokedBand = false,
  textX,
  textW,
  fontFamily,
  fontStyle,
  fontSize,
  fill,
  stroke,
  strokeWidth,
  shadowColor,
  shadowBlur,
  shadowOffset,
}: {
  row: AbilityRowModel
  badgeX: number
  badgeAnchor: 'left' | 'right'
  lineHeight: number
  badgeTargetH: number
  badgesOnly?: boolean
  showSmokedBand?: boolean
  textX?: number
  textW?: number
  fontFamily?: string
  fontStyle?: string
  fontSize?: number
  fill?: string
  stroke?: string
  strokeWidth?: number
  shadowColor?: string
  shadowBlur?: number
  shadowOffset?: { x: number; y: number }
}) {
  const badgeImg = useKonvaPublicImage(row.badgeUrl)
  const intrinsic =
    PLANESWALKER_LOYALTY_BADGE_INTRINSIC[
      row.costSign === '+' ? 'up' : row.costSign === '-' ? 'down' : 'neutral'
    ]
  const badgeScale = badgeTargetH / Math.max(1, intrinsic.height)
  const badgeW = intrinsic.width * badgeScale
  const badgeH = badgeTargetH
  const badgeY = row.y + (lineHeight - badgeH) / 2
  const resolvedBadgeX =
    badgeAnchor === 'right' ? badgeX - badgeW : badgeX
  const textInnerX = textX != null ? textX + badgeW + BADGE_TEXT_GAP : 0
  const textInnerW = textW != null ? Math.max(1, textW - badgeW - BADGE_TEXT_GAP) : 0
  const costFontSize = Math.max(12, badgeH * 0.42)
  const costLayout = useMemo(
    () =>
      layoutPlaneswalkerBadgeCostOnShield(row.costSign, row.costValue, costFontSize, {
        x: resolvedBadgeX,
        y: badgeY,
        width: badgeW,
        height: badgeH,
      }),
    [row.costSign, row.costValue, costFontSize, resolvedBadgeX, badgeY, badgeW, badgeH],
  )
  const badgeCostFont = `${PLANESWALKER_BADGE_COST_FONT_FAMILY}, serif`

  return (
    <Group listening={false}>
      {showSmokedBand && textX != null && textW != null ? (
        <Rect
          x={textX}
          y={row.y}
          width={textW}
          height={lineHeight}
          fill={ABILITY_ROW_SMOKED_FILL}
          cornerRadius={ABILITY_ROW_SMOKED_CORNER_RADIUS}
          listening={false}
        />
      ) : null}
      {badgeImg ? (
        <Image
          image={badgeImg}
          x={resolvedBadgeX}
          y={badgeY}
          width={badgeW}
          height={badgeH}
          listening={false}
        />
      ) : null}
      {costLayout.sign ? (
        <Text
          text={costLayout.sign.text}
          x={costLayout.sign.centerX}
          y={costLayout.sign.centerY}
          offsetX={costLayout.sign.offsetX}
          offsetY={costLayout.sign.offsetY}
          fontFamily={badgeCostFont}
          fontStyle="bold"
          fontSize={costFontSize}
          fill={PLANESWALKER_BADGE_COST_TEXT_FILL}
          listening={false}
        />
      ) : null}
      <Text
        text={costLayout.digit.text}
        x={costLayout.digit.centerX}
        y={costLayout.digit.centerY}
        offsetX={costLayout.digit.offsetX}
        offsetY={costLayout.digit.offsetY}
        fontFamily={badgeCostFont}
        fontStyle="bold"
        fontSize={costFontSize}
        fill={PLANESWALKER_BADGE_COST_TEXT_FILL}
        listening={false}
      />
      {!badgesOnly && fontFamily && fontSize != null && fill != null && textW != null ? (
        <Text
          text={row.text}
          x={textInnerX}
          y={row.y}
          width={textInnerW}
          height={lineHeight}
          fontFamily={fontFamily}
          fontStyle={fontStyle ?? 'normal'}
          fontSize={fontSize}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth ?? 0}
          shadowColor={shadowColor}
          shadowBlur={shadowBlur ?? 0}
          shadowOffset={shadowOffset}
          wrap="word"
          verticalAlign="middle"
          listening={false}
        />
      ) : null}
    </Group>
  )
}

export default memo(PlaneswalkerAbilitiesLayer)
