/**
 * Advanced Style → Panels section (lazy-loaded off the main editor chunk).
 */
import { memo, useMemo } from 'react'
import {
  getActiveLayoutCapabilitiesFromState,
  serializeLayoutId,
} from '../../authority/layoutRegistry'
import { BOX_PANEL_GRADIENT_DIRECTION_OPTIONS } from '../../authority/boxPanelFillAuthority'
import type { BoxColorGradientDirection, CardData } from '../../store/useCardStore'
import { useCardStore } from '../../store/useCardStore'
import {
  WATERMARK_SELECT_OPTIONS,
  type WatermarkPathKey,
} from '../../authority/watermarkAuthority'
import OuterBorderPicker from './OuterBorderPicker'
import PanelFillSwatch from './PanelFillSwatch'
import { effectivePanelBackground } from '../../authority/panelBackgroundAuthority'
import {
  UI_TEXT_ACTION,
  UI_TEXT_CONTROL,
  UI_TEXT_HELP_COMPACT,
  UI_TEXT_LABEL_COMPACT,
  UI_TEXT_LABEL_SEMIBOLD,
  UI_TEXT_METADATA,
} from '../../authority/typographyAuthority'
import { shouldShowPtPanelGradientField } from '../../authority/progressiveDisclosureAuthority'
import { BOX_PANEL_COLOR_UI } from '../../authority/boxColorUiAuthority'
import { CONSTRAINT_COPY } from '../../authority/constraintFeedbackAuthority'
import { CLASSIC_OUTER_BORDER_SECTION_ID } from '../../data/outerBorderOptions'
import FieldRow from '../ui/FieldRow'
import ConstraintHint from '../ui/ConstraintHint'
import SwitchRow from '../ui/SwitchRow'

const BoxPanelGradientControls = memo(function BoxPanelGradientControls({
  enabled,
  direction,
  saturation,
  reversed,
  enabledKey,
  directionKey,
  saturationKey,
  reversedKey,
  setField,
  commitState,
  gradientAriaPrefix,
}: {
  enabled: boolean
  direction: BoxColorGradientDirection
  saturation: number
  reversed: boolean
  enabledKey: keyof CardData
  directionKey: keyof CardData
  saturationKey: keyof CardData
  reversedKey: keyof CardData
  setField: <K extends keyof CardData>(key: K, value: CardData[K]) => void
  commitState: () => void
  /** Disambiguates identical visible labels when multiple box panels appear in one section. */
  gradientAriaPrefix?: string
}) {
  const sat = Math.max(0, Math.min(100, Math.round(Number(saturation) || 0)))
  const p = gradientAriaPrefix?.trim()
  const ariaPanelGradient = p ? `${p} panel gradient` : 'Panel gradient'
  const ariaDirection = p ? `${p} gradient direction` : 'Gradient direction'
  const ariaSaturation = p ? `${p} gradient saturation` : 'Gradient saturation'
  const ariaReverse = p ? `${p} reverse gradient` : 'Reverse gradient'
  return (
    <div className="mt-2 space-y-2 border-l-2 border-neutral-200 pl-2 dark:border-[color-mix(in_srgb,var(--sb-border)_70%,transparent)]">
      <SwitchRow
        label="Panel Gradient"
        checked={!!enabled}
        onToggle={() => {
          setField(enabledKey, (!enabled) as CardData[typeof enabledKey])
          commitState()
        }}
        ariaLabel={ariaPanelGradient}
      />
      {enabled ? (
        <div className="space-y-2">
          <div className="space-y-1">
            <label className={`block ${UI_TEXT_LABEL_COMPACT}`}>Gradient Direction</label>
            <select
              value={direction}
              onChange={(e) => {
                setField(directionKey, e.target.value as BoxColorGradientDirection)
                commitState()
              }}
              className="ui-text-control w-full h-10 rounded-xl border border-neutral-200 bg-white px-3 outline-none ui-focus-ring-control dark:border-[var(--sb-border)] dark:bg-[var(--sb-surface-soft)]"
              aria-label={ariaDirection}
            >
              {BOX_PANEL_GRADIENT_DIRECTION_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <FieldRow label="Saturation" layout="stacked">
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={sat}
                onChange={(e) => setField(saturationKey, Number(e.target.value) as CardData[typeof saturationKey])}
                onMouseUp={commitState}
                onTouchEnd={commitState}
                className="w-full min-w-0"
                aria-label={ariaSaturation}
              />
              <span className={`shrink-0 tabular-nums ${UI_TEXT_METADATA} w-8 text-right`}>
                {sat}
              </span>
            </div>
          </FieldRow>
          <SwitchRow
            label="Reverse Gradient"
            checked={!!reversed}
            onToggle={() => {
              setField(reversedKey, (!reversed) as CardData[typeof reversedKey])
              commitState()
            }}
            ariaLabel={ariaReverse}
          />
          <p className={`${UI_TEXT_HELP_COMPACT} leading-snug`}>
            0 = grayscale ramp; 100 = full chroma. Reverse swaps light and rich ends (and swirl sampling).
          </p>
        </div>
      ) : null}
    </div>
  )
})

export default function AdvancedPanelsSection() {
  const setField = useCardStore((s) => s.setField)
  const commitState = useCardStore((s) => s.commitState)
  const currentLayout = useCardStore((s) => s.currentLayout)
  const activeLayout = useCardStore((s) => s.cardData.layout)
  const layoutCapabilitiesKey = serializeLayoutId(activeLayout)
  const activeLayoutCapabilities = useMemo(
    () =>
      getActiveLayoutCapabilitiesFromState({
        currentLayout,
        cardData: { layout: activeLayout },
      }),
    [currentLayout, activeLayout, layoutCapabilitiesKey],
  )

  const nameBoxColor = useCardStore((s) => s.cardData.nameBoxColor)
  const typeLineBoxColor = useCardStore((s) => s.cardData.typeLineBoxColor)
  const rulesTextBoxColor = useCardStore((s) => s.cardData.rulesTextBoxColor)
  const ptBoxColor = useCardStore((s) => s.cardData.ptBoxColor)
  const nameBoxGradientEnabled = useCardStore((s) => s.cardData.nameBoxGradientEnabled)
  const nameBoxGradientDirection = useCardStore((s) => s.cardData.nameBoxGradientDirection)
  const nameBoxGradientSaturation = useCardStore((s) => s.cardData.nameBoxGradientSaturation)
  const nameBoxGradientReversed = useCardStore((s) => s.cardData.nameBoxGradientReversed)
  const typeLineBoxGradientEnabled = useCardStore((s) => s.cardData.typeLineBoxGradientEnabled)
  const typeLineBoxGradientDirection = useCardStore((s) => s.cardData.typeLineBoxGradientDirection)
  const typeLineBoxGradientSaturation = useCardStore((s) => s.cardData.typeLineBoxGradientSaturation)
  const typeLineBoxGradientReversed = useCardStore((s) => s.cardData.typeLineBoxGradientReversed)
  const rulesTextBoxGradientEnabled = useCardStore((s) => s.cardData.rulesTextBoxGradientEnabled)
  const rulesTextBoxGradientDirection = useCardStore((s) => s.cardData.rulesTextBoxGradientDirection)
  const rulesTextBoxGradientSaturation = useCardStore((s) => s.cardData.rulesTextBoxGradientSaturation)
  const rulesTextBoxGradientReversed = useCardStore((s) => s.cardData.rulesTextBoxGradientReversed)
  const ptBoxGradientEnabled = useCardStore((s) => s.cardData.ptBoxGradientEnabled)
  const ptBoxGradientDirection = useCardStore((s) => s.cardData.ptBoxGradientDirection)
  const ptBoxGradientSaturation = useCardStore((s) => s.cardData.ptBoxGradientSaturation)
  const ptBoxGradientReversed = useCardStore((s) => s.cardData.ptBoxGradientReversed)
  const watermarkPath = useCardStore((s) => s.cardData.watermarkPath)
  const customWatermarkDataUrl = useCardStore((s) => s.cardData.customWatermarkDataUrl)
  const watermarkOpacity = useCardStore((s) => s.cardData.watermarkOpacity)
  const panelBackgroundPreview = useCardStore((s) => s.panelBackgroundPreview)
  const referenceImage = useCardStore((s) => s.cardData.referenceImage)
  const referenceOpacity = useCardStore((s) => s.cardData.referenceOpacity)
  const setReferenceImage = useCardStore((s) => s.setReferenceImage)
  const setReferenceOpacity = useCardStore((s) => s.setReferenceOpacity)
  const clearReferenceImage = useCardStore((s) => s.clearReferenceImage)

  const classicPanelSectionIds = useMemo(() => [CLASSIC_OUTER_BORDER_SECTION_ID] as const, [])

  const effectiveNameBoxColor = effectivePanelBackground('nameBoxColor', nameBoxColor, panelBackgroundPreview)
  const effectiveTypeLineBoxColor = effectivePanelBackground(
    'typeLineBoxColor',
    typeLineBoxColor,
    panelBackgroundPreview,
  )
  const effectiveRulesTextBoxColor = effectivePanelBackground(
    'rulesTextBoxColor',
    rulesTextBoxColor,
    panelBackgroundPreview,
  )
  const effectivePtBoxColor = effectivePanelBackground('ptBoxColor', ptBoxColor, panelBackgroundPreview)

  return (
<div className="space-y-3">
      <p className={`${UI_TEXT_HELP_COMPACT} leading-snug`}>
        Base colors and optional per-panel gradients for name, type, rules, and P/T (preview and export). Typography ink uses your font color when contrast allows.
      </p>
      <FieldRow label={BOX_PANEL_COLOR_UI.name.rowLabel} layout="stacked">
        <>
          <div className="flex items-center gap-2">
            <PanelFillSwatch
              value={effectiveNameBoxColor}
              ariaLabel={BOX_PANEL_COLOR_UI.name.colorAriaLabel}
              onHexChange={(hex) => {
                setField('nameBoxColor', hex)
                commitState()
              }}
            />
            <input
              value={effectiveNameBoxColor}
              onChange={(e) => setField('nameBoxColor', e.target.value)}
              onBlur={commitState}
              placeholder="#RRGGBB"
              className="w-full h-10 rounded-xl border border-neutral-200 bg-white px-3 ui-text-mono-value outline-none ui-focus-ring-control dark:border-[var(--sb-border)] dark:bg-[var(--sb-surface-soft)]"
              aria-label={BOX_PANEL_COLOR_UI.name.hexAriaLabel}
            />
          </div>
          <BoxPanelGradientControls
            enabled={nameBoxGradientEnabled}
            direction={nameBoxGradientDirection}
            saturation={nameBoxGradientSaturation}
            reversed={nameBoxGradientReversed}
            enabledKey="nameBoxGradientEnabled"
            directionKey="nameBoxGradientDirection"
            saturationKey="nameBoxGradientSaturation"
            reversedKey="nameBoxGradientReversed"
            setField={setField}
            commitState={commitState}
            gradientAriaPrefix={BOX_PANEL_COLOR_UI.name.gradientAriaPrefix}
          />
          <div className="mt-2">
            <OuterBorderPicker
              field="nameBoxColor"
              sectionIds={classicPanelSectionIds}
              buttonLabel="Name Plate Background"
            />
          </div>
        </>
      </FieldRow>
      <FieldRow label={BOX_PANEL_COLOR_UI.typeLine.rowLabel} layout="stacked">
        <>
          <div className="flex items-center gap-2">
            <PanelFillSwatch
              value={effectiveTypeLineBoxColor}
              ariaLabel={BOX_PANEL_COLOR_UI.typeLine.colorAriaLabel}
              onHexChange={(hex) => {
                setField('typeLineBoxColor', hex)
                commitState()
              }}
            />
            <input
              value={effectiveTypeLineBoxColor}
              onChange={(e) => setField('typeLineBoxColor', e.target.value)}
              onBlur={commitState}
              placeholder="#RRGGBB"
              className="w-full h-10 rounded-xl border border-neutral-200 bg-white px-3 ui-text-mono-value outline-none ui-focus-ring-control dark:border-[var(--sb-border)] dark:bg-[var(--sb-surface-soft)]"
              aria-label={BOX_PANEL_COLOR_UI.typeLine.hexAriaLabel}
            />
          </div>
          <BoxPanelGradientControls
            enabled={typeLineBoxGradientEnabled}
            direction={typeLineBoxGradientDirection}
            saturation={typeLineBoxGradientSaturation}
            reversed={typeLineBoxGradientReversed}
            enabledKey="typeLineBoxGradientEnabled"
            directionKey="typeLineBoxGradientDirection"
            saturationKey="typeLineBoxGradientSaturation"
            reversedKey="typeLineBoxGradientReversed"
            setField={setField}
            commitState={commitState}
            gradientAriaPrefix={BOX_PANEL_COLOR_UI.typeLine.gradientAriaPrefix}
          />
          <div className="mt-2">
            <OuterBorderPicker
              field="typeLineBoxColor"
              sectionIds={classicPanelSectionIds}
              buttonLabel="Type Line Background"
            />
          </div>
        </>
      </FieldRow>
      <FieldRow label={BOX_PANEL_COLOR_UI.rulesText.rowLabel} layout="stacked">
        <>
          <div className="flex items-center gap-2">
            <PanelFillSwatch
              value={effectiveRulesTextBoxColor}
              ariaLabel={BOX_PANEL_COLOR_UI.rulesText.colorAriaLabel}
              onHexChange={(hex) => {
                setField('rulesTextBoxColor', hex)
                commitState()
              }}
            />
            <input
              value={effectiveRulesTextBoxColor}
              onChange={(e) => setField('rulesTextBoxColor', e.target.value)}
              onBlur={commitState}
              placeholder="#RRGGBB"
              className="w-full h-10 rounded-xl border border-neutral-200 bg-white px-3 ui-text-mono-value outline-none ui-focus-ring-control dark:border-[var(--sb-border)] dark:bg-[var(--sb-surface-soft)]"
              aria-label={BOX_PANEL_COLOR_UI.rulesText.hexAriaLabel}
            />
          </div>
          <BoxPanelGradientControls
            enabled={rulesTextBoxGradientEnabled}
            direction={rulesTextBoxGradientDirection}
            saturation={rulesTextBoxGradientSaturation}
            reversed={rulesTextBoxGradientReversed}
            enabledKey="rulesTextBoxGradientEnabled"
            directionKey="rulesTextBoxGradientDirection"
            saturationKey="rulesTextBoxGradientSaturation"
            reversedKey="rulesTextBoxGradientReversed"
            setField={setField}
            commitState={commitState}
            gradientAriaPrefix={BOX_PANEL_COLOR_UI.rulesText.gradientAriaPrefix}
          />
          <div className="mt-2">
            <OuterBorderPicker
              field="rulesTextBoxColor"
              sectionIds={classicPanelSectionIds}
              buttonLabel="Rules Text Background"
            />
          </div>
        </>
      </FieldRow>
      {shouldShowPtPanelGradientField(activeLayoutCapabilities) ? (
        <FieldRow label={BOX_PANEL_COLOR_UI.powerToughness.rowLabel} layout="stacked">
          <>
            <div className="flex items-center gap-2">
              <PanelFillSwatch
                value={effectivePtBoxColor}
                ariaLabel={BOX_PANEL_COLOR_UI.powerToughness.colorAriaLabel}
                onHexChange={(hex) => {
                  setField('ptBoxColor', hex)
                  commitState()
                }}
              />
              <input
                value={effectivePtBoxColor}
                onChange={(e) => setField('ptBoxColor', e.target.value)}
                onBlur={commitState}
                placeholder="#RRGGBB"
                className="w-full h-10 rounded-xl border border-neutral-200 bg-white px-3 ui-text-mono-value outline-none ui-focus-ring-control dark:border-[var(--sb-border)] dark:bg-[var(--sb-surface-soft)]"
                aria-label={BOX_PANEL_COLOR_UI.powerToughness.hexAriaLabel}
              />
            </div>
            <BoxPanelGradientControls
              enabled={ptBoxGradientEnabled}
              direction={ptBoxGradientDirection}
              saturation={ptBoxGradientSaturation}
              reversed={ptBoxGradientReversed}
              enabledKey="ptBoxGradientEnabled"
              directionKey="ptBoxGradientDirection"
              saturationKey="ptBoxGradientSaturation"
              reversedKey="ptBoxGradientReversed"
              setField={setField}
              commitState={commitState}
              gradientAriaPrefix={BOX_PANEL_COLOR_UI.powerToughness.gradientAriaPrefix}
            />
            <div className="mt-2">
              <OuterBorderPicker
                field="ptBoxColor"
                sectionIds={classicPanelSectionIds}
                buttonLabel="P/T Background"
              />
            </div>
          </>
        </FieldRow>
      ) : (
        <ConstraintHint>{CONSTRAINT_COPY.gradientNoPt}</ConstraintHint>
      )}

      <div className="space-y-3 border-t border-neutral-200 pt-3 dark:border-[var(--sb-border)]">
      <div className="space-y-1.5">
        <div className={UI_TEXT_LABEL_SEMIBOLD}>Watermark</div>

        <FieldRow label="Selection" layout="stacked">
          <select
            value={watermarkPath}
            onChange={(e) => {
              setField('watermarkPath', e.target.value as WatermarkPathKey)
              commitState()
            }}
            className="w-full h-10 rounded-xl border border-neutral-200 bg-white px-3 ui-text-control outline-none ui-focus-ring-control dark:border-[var(--sb-border)] dark:bg-[var(--sb-surface-soft)]"
            aria-label="Rules text watermark"
          >
            {WATERMARK_SELECT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </FieldRow>

        <FieldRow label="Upload" layout="stacked">
          <div className="space-y-2">
            <input
              type="file"
              accept="image/svg+xml,image/*"
              className={`ui-focus-ring block w-full ${UI_TEXT_CONTROL} text-[var(--ui-color-text-strong)] file:mr-3 file:rounded-xl file:border-0 file:bg-neutral-900 file:px-3 file:py-2 file:text-[length:var(--ui-font-size-xs)] file:font-semibold file:text-white hover:file:bg-neutral-800 dark:file:bg-white dark:file:text-black dark:hover:file:bg-neutral-100`}
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null
                if (!file) return
                const reader = new FileReader()
                reader.onerror = () => {
                  // Non-destructive: ignore failed reads.
                }
                reader.onload = () => {
                  const base64 = String(reader.result ?? '')
                  if (!base64) return
                  setField('customWatermarkDataUrl', base64)
                  setField('watermarkPath', 'custom' as WatermarkPathKey)
                  commitState()
                }
                reader.readAsDataURL(file)
              }}
              aria-label="Upload custom watermark"
            />

            {customWatermarkDataUrl ? (
              <button
                type="button"
                className={`sidebar-btn-secondary ui-focus-ring h-9 w-full rounded-xl border px-3 ${UI_TEXT_ACTION} hover:bg-neutral-50 dark:hover:bg-neutral-800`}
                onClick={() => {
                  setField('customWatermarkDataUrl', '')
                  if (watermarkPath === 'custom') setField('watermarkPath', 'none' as WatermarkPathKey)
                  commitState()
                }}
                aria-label="Clear custom watermark"
              >
                Clear Custom Watermark
              </button>
            ) : null}
          </div>
        </FieldRow>

        <FieldRow label="Watermark Opacity" layout="stacked">
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={typeof watermarkOpacity === 'number' ? watermarkOpacity : 0.14}
            onChange={(e) => setField('watermarkOpacity', parseFloat(e.target.value))}
            onMouseUp={commitState}
            onTouchEnd={commitState}
            className="w-full"
            aria-label="Watermark opacity"
          />
        </FieldRow>
      </div>

      <div className="space-y-2 border-t border-neutral-200/60 pt-3 dark:border-neutral-800/60">
        <div className="space-y-1">
          <div className={`block ${UI_TEXT_LABEL_SEMIBOLD}`}>Fidelity reference</div>
          <p className={`${UI_TEXT_HELP_COMPACT} leading-snug`}>
            Ghost overlay (editor only, excluded from export). Load a Card Conjurer / scan face at trim
            aspect, opacity ~0.4, toggle against Standard / Modern seating.
          </p>
        </div>
        <FieldRow label="Reference image" layout="stacked">
          <div className="space-y-2">
            <input
              type="file"
              accept="image/*"
              className="block w-full text-xs"
              aria-label="Upload fidelity reference image"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = () => {
                  const base64 = String(reader.result ?? '')
                  if (!base64) return
                  setReferenceImage(base64)
                }
                reader.readAsDataURL(file)
                e.target.value = ''
              }}
            />
            {referenceImage ? (
              <button
                type="button"
                className={`sidebar-btn-secondary ui-focus-ring h-9 w-full rounded-xl border px-3 ${UI_TEXT_ACTION} hover:bg-neutral-50 dark:hover:bg-neutral-800`}
                onClick={() => clearReferenceImage()}
                aria-label="Clear fidelity reference image"
              >
                Clear reference
              </button>
            ) : null}
          </div>
        </FieldRow>
        <FieldRow label="Reference opacity" layout="stacked">
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={typeof referenceOpacity === 'number' ? referenceOpacity : 0.4}
            onChange={(e) => setReferenceOpacity(parseFloat(e.target.value))}
            className="w-full"
            aria-label="Fidelity reference opacity"
            disabled={!referenceImage}
          />
        </FieldRow>
      </div>
      </div>
    </div>
  )
}
