import { lazy, memo, startTransition, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Settings2,
  Wand2,
  LayoutTemplate,
  Blend,
} from 'lucide-react'
import {
  IDENTITY_SWIRL_RASTER_PX,
  getIdentitySwirlPatternCanvas,
  getSwirlStopsFromResolvedIdentity,
} from '../../authority/identitySwirlAuthority'
import { landFullArtManaCircleKeyToBracketToken } from '../../authority/landFullArtManaCircle'
import {
  getActiveLayoutCapabilitiesFromState,
  serializeLayoutId,
} from '../../authority/layoutRegistry'
import { shouldDefaultWhiteInnerBorder as computeShouldDefaultWhiteInnerBorder } from '../../authority/textBackgroundContrastAuthority'
import type { ColorBlendDirection } from '../../store/useCardStore'
import {
  COLOR_IDENTITY_PIP_CHIP,
  mergeAutoColorIdentityPips,
} from '../../authority/colorAuthority'
import { normalizeColorIdentityPips, resolveProceduralIdentity, useCardStore } from '../../store/useCardStore'
import { TEXTURE_OPTIONS } from '../../data/textureOptions'
import { isOuterBorderTexture, outerBorderPngUrl } from '../../data/outerBorderOptions'
import LazyOuterBorderPicker from './LazyOuterBorderPicker'
import {
  UI_TEXT_HELP_COMPACT,
  UI_TEXT_LABEL_COMPACT,
  UI_TEXT_LABEL_SEMIBOLD,
  UI_TEXT_METADATA,
  UI_TEXT_METADATA_SEMIBOLD,
  UI_TEXT_SECTION_HEADER,
} from '../../authority/typographyAuthority'
import {
  shouldShowColorIdentityPipControls,
  shouldShowManualColorPaletteControls,
  shouldShowCrownArmorSelectors,
  shouldShowPlateGeometry,
  shouldShowPreModernTextBoxSelector,
  shouldShowSpellTextBoxSelector,
} from '../../authority/progressiveDisclosureAuthority'
import { SPELL_PANEL_OPTIONS } from '../../data/spellPanelOptions'
import { PRE_MODERN_RULES_TEXT_BOX_OPTIONS } from '../../data/preModernRulesTextBoxOptions'
import {
  CROWN_OPTIONS,
  CROWN_TINT_PRESETS,
  getCrownTintPreset,
  normalizeCrownTintPreset,
  rgbToHex,
  type CrownTintPresetId,
} from '../../data/crownOptions'
import ColorSwatchPopover from '../ui/ColorSwatchPopover'
import { CONSTRAINT_COPY } from '../../authority/constraintFeedbackAuthority'
import CollapsibleSection from './CollapsibleSection'
import SwitchRow from '../ui/SwitchRow'
import AppearanceThemeControl from '../ui/AppearanceThemeControl'
import FieldRow from '../ui/FieldRow'
import ConstraintHint from '../ui/ConstraintHint'
import LayoutThumbnailPicker from './LayoutThumbnailPicker'
import { usePersistedUiState } from '../../hooks/usePersistedUiState'
import { useScrollFieldIntoView } from '../../hooks/useScrollFieldIntoView'
import {
  isFlowSectionVisible,
  isSoleInlineSection,
  type StudioFlowStepId,
} from '../../authority/studioFlowAuthority'

/** Phase 10.3 correction — exactly one top-level section open per right sidebar. */
type RightSectionId = 'layout' | 'identity' | 'frame-options' | 'panels' | 'settings'
type RightOpenStored = RightSectionId | 'none'

function isRightOpenStored(v: string): v is RightOpenStored {
  return (
    v === 'none' ||
    v === 'layout' ||
    v === 'identity' ||
    v === 'frame-options' ||
    v === 'panels' ||
    v === 'settings'
  )
}

const IdentitySwirlPreviewBar = memo(function IdentitySwirlPreviewBar({ stops }: { stops: string[] }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const w = IDENTITY_SWIRL_RASTER_PX
  const h = IDENTITY_SWIRL_RASTER_PX
  const stopsKey = stops.join(';')
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const src = getIdentitySwirlPatternCanvas(w, h, stops)
    const ctx = el.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, w, h)
    ctx.drawImage(src, 0, 0)
  }, [stopsKey, h, w, stops])
  return (
    <canvas
      ref={ref}
      width={w}
      height={h}
      className="h-4 w-full rounded-[var(--ui-radius-lg)] border border-[var(--ui-color-border)]"
      style={{ width: '100%', height: '1rem', display: 'block' }}
      aria-label="Identity swirl preview"
    />
  )
})

const AdvancedPanelsSection = lazy(() => import('./AdvancedPanelsSection'))

export type SidebarRightInspectorSegment = 'look' | 'details'

type SidebarRightProps = {
  /** When set, renders as inspector content (no rail chrome). */
  inspectorSegment?: SidebarRightInspectorSegment
  /** Active step pill — scopes which menu rows appear (no overlapping editors). */
  flowStepId?: StudioFlowStepId | null
}

export default function SidebarRight({ inspectorSegment, flowStepId = null }: SidebarRightProps) {
  const embedded = inspectorSegment != null
  const [collapsed, setCollapsed] = useState(false)
  const [rightOpenStored, setRightOpenStored] = usePersistedUiState<RightOpenStored>(
    'umps-right-open-section',
    'none',
    isRightOpenStored,
  )
  const rightOpenSection: RightSectionId | null = rightOpenStored === 'none' ? null : rightOpenStored
  /** Look = frame/colors (+ Frame Options & Panels under Frame pill); Details = guides. */
  const showLookSections = !embedded || inspectorSegment === 'look'
  const showDetailsSections = !embedded || inspectorSegment === 'details'
  /** Frame Options + Panels live under Frame (Look) only — not Details. */
  const showFrameExtras = !embedded || inspectorSegment === 'look'
  const drillMode = embedded
  const sectionMode = drillMode ? 'drill' : 'accordion'
  const stackOccupied = drillMode && rightOpenSection != null
  const scrollFieldIntoView = useScrollFieldIntoView()
  const showSection = (key: RightSectionId) =>
    !embedded || isFlowSectionVisible(flowStepId, 'right', key)
  const sectionInline = (key: RightSectionId) =>
    embedded && isSoleInlineSection(flowStepId, 'right', key)
  const toggleRightSection = (id: RightSectionId) => {
    startTransition(() => {
      setRightOpenStored((cur) => {
        const current = cur === 'none' ? null : cur
        const next = current === id ? null : id
        if (next && inspectorSegment === 'details') {
          try {
            window.localStorage.setItem('umps-left-open-section', 'none')
          } catch {
            /* private mode */
          }
        }
        queueMicrotask(() => window.dispatchEvent(new CustomEvent('umps-inspector-section')))
        return next ?? 'none'
      })
    })
  }
  const workspaceInitEpoch = useCardStore((s) => s.workspaceInitEpoch)
  const restoreSession = useCardStore((s) => s.settings.restoreSession)

  const showTooltips = useCardStore((s) => s.showTooltips)

// Phase 4.1 – Procedural Color & Stroke Identity (behavioral pass)
const autoColorEnabled = useCardStore((s) => s.autoColorEnabled)
const manualColorKey = useCardStore((s) => s.manualColorKey)
const setAutoColorEnabled = useCardStore((s) => s.setAutoColorEnabled)
const manualColorHex1 = useCardStore((s) => s.manualColorHex1)
const manualColorHex2 = useCardStore((s) => s.manualColorHex2)
const manualColorHex3 = useCardStore((s) => s.manualColorHex3)
const manualColorHex4 = useCardStore((s) => s.manualColorHex4)
const manualColorHex5 = useCardStore((s) => s.manualColorHex5)
const manualColorCount = useCardStore((s) => s.manualColorCount)
const colorBlendDirection = useCardStore((s) => s.colorBlendDirection)
const setColorBlendDirection = useCardStore((s) => s.setColorBlendDirection)
const setManualColorHex1 = useCardStore((s) => s.setManualColorHex1)
const setManualColorHex2 = useCardStore((s) => s.setManualColorHex2)
const setManualColorHex3 = useCardStore((s) => s.setManualColorHex3)
const setManualColorHex4 = useCardStore((s) => s.setManualColorHex4)
const setManualColorHex5 = useCardStore((s) => s.setManualColorHex5)
const setManualColorCount = useCardStore((s) => s.setManualColorCount)
const currentLayout = useCardStore((s) => s.currentLayout)
const activeLayout = useCardStore((s) => s.cardData.layout)
const setLayout = useCardStore((s) => s.setLayout)
const layoutCapabilitiesKey = serializeLayoutId(activeLayout)
const activeLayoutCapabilities = useMemo(
  () =>
    getActiveLayoutCapabilitiesFromState({
      currentLayout,
      cardData: { layout: activeLayout },
    }),
  // layout identity is fully captured by `layoutCapabilitiesKey`; omit `activeLayout` ref to avoid churn
  [currentLayout, layoutCapabilitiesKey],
)

  const selectedTexture = useCardStore((s) => s.cardData.selectedTexture)
  const textureOpacity = useCardStore((s) => s.cardData.textureOpacity)
  const outerBorderFrameTexture = useCardStore((s) => s.cardData.outerBorderFrameTexture)
  const outerBorderFrameTextureOpacity = useCardStore((s) => s.cardData.outerBorderFrameTextureOpacity)
  const innerBorderEnabled = useCardStore((s) => s.cardData.innerBorderEnabled)
  const innerBorderOpacity = useCardStore((s) => s.cardData.innerBorderOpacity)
  const innerBorderBackground = useCardStore((s) => s.cardData.innerBorderBackground ?? 'identity')
  // Card Frame Texture is unavailable when the inner border uses a picked image/texture.
  const cardFrameTextureDisabled =
    innerBorderBackground !== 'identity' && outerBorderPngUrl(innerBorderBackground) != null
  const bezierPlateEnabled = useCardStore((s) => s.cardData.bezierPlateEnabled)
  const spellTextBoxId = useCardStore((s) => s.cardData.spellTextBoxId)
  const preModernRulesTextBoxId = useCardStore((s) => s.cardData.preModernRulesTextBoxId)
  const crownAssetId = useCardStore((s) => s.cardData.crownAssetId)
  const crownTintPreset = useCardStore((s) => s.cardData.crownTintPreset)
  const crownColor = useCardStore((s) => s.cardData.crownColor)
  const crownShadowEnabled = useCardStore((s) => s.cardData.crownShadowEnabled)
  const crownShadowColor = useCardStore((s) => s.cardData.crownShadowColor)
  const crownShadowColorManual = useCardStore((s) => s.cardData.crownShadowColorManual)
  const pdColorInput = useMemo(
    () => ({ autoColorEnabled: !!autoColorEnabled }),
    [autoColorEnabled],
  )
  const outerBorderColor = useCardStore((s) => s.cardData.outerBorderColor ?? 'black')
  // OBF Texture/Opacity only apply to Solid, M15 Solid, and Dual color selections —
  // Textures and Guild frames (m15tex:) already paint the full border.
  const outerBorderFrameTextureApplicable = !isOuterBorderTexture(outerBorderColor)
  const [obfTextureOpen, setObfTextureOpen] = useState(false)
  const [innerBorderOpen, setInnerBorderOpen] = useState(false)
  const [outerBorderOpen, setOuterBorderOpen] = useState(false)

  const setField = useCardStore((s) => s.setField)
  const commitState = useCardStore((s) => s.commitState)
  const setRestoreSession = useCardStore((s) => s.setRestoreSession)
  const toggleTooltips = useCardStore((s) => s.toggleTooltips)
  const colorIdentity = useCardStore((s) => s.cardData.colorIdentity)
  const cardTypeLine = useCardStore((s) => s.cardData.typeLine)
  const cardName = useCardStore((s) => s.cardData.name)
  const manaCost = useCardStore((s) => s.cardData.manaCost)
  const landFullArtManaCircleKey = useCardStore((s) => s.cardData.landFullArtManaCircleKey)

  const landFullArtManaCircle = activeLayoutCapabilities.useLandFullArtManaCircle
  const identityManaCost = landFullArtManaCircle
    ? landFullArtManaCircleKeyToBracketToken(landFullArtManaCircleKey)
    : (manaCost ?? '')
  const identityPips = landFullArtManaCircle ? [] : colorIdentity
  const identityAutoColorEnabled = landFullArtManaCircle ? true : autoColorEnabled

  /** Matches auto-color: explicit pips + braced symbols in name and mana (e.g. mana picker {R}). */
  const mergedColorIdentityPips = useMemo(
    () => mergeAutoColorIdentityPips(colorIdentity, cardName ?? '', identityManaCost ?? ''),
    [colorIdentity, cardName, identityManaCost],
  )

  const resolvedIdentity = useMemo(
    () =>
      resolveProceduralIdentity(
        cardTypeLine,
        identityPips,
        cardName,
        identityManaCost,
        identityAutoColorEnabled,
        manualColorKey,
        manualColorHex1,
        manualColorHex2,
        manualColorHex3,
        manualColorHex4,
        manualColorHex5,
        manualColorCount,
      ),
    [
      landFullArtManaCircle,
      landFullArtManaCircleKey,
      cardTypeLine,
      identityPips,
      cardName,
      identityManaCost,
      identityAutoColorEnabled,
      manualColorKey,
      manualColorHex1,
      manualColorHex2,
      manualColorHex3,
      manualColorHex4,
      manualColorHex5,
      manualColorCount,
    ],
  )

  const shouldDefaultWhiteInnerBorder = useMemo(
    () =>
      computeShouldDefaultWhiteInnerBorder({
        autoColorEnabled,
        manualColorKey,
        manualColorHex1,
        manualColorHex2,
        manualColorHex3,
        manualColorHex4,
        manualColorHex5,
        manualColorCount,
      }),
    [
      autoColorEnabled,
      manualColorHex1,
      manualColorHex2,
      manualColorHex3,
      manualColorHex4,
      manualColorHex5,
      manualColorKey,
      manualColorCount,
    ],
  )

  const swirlPreviewStops = useMemo(
    () => getSwirlStopsFromResolvedIdentity(resolvedIdentity),
    [resolvedIdentity],
  )

  const asideWidthClass = embedded ? '' : collapsed ? 'lg:w-14' : 'lg:w-[304px]'

  const manualColorPreview = useMemo(() => {
    if (colorBlendDirection === 'swirl') return 'transparent'
    const dir =
      colorBlendDirection === 'horizontal'
        ? 'to right'
        : colorBlendDirection === 'vertical'
          ? 'to bottom'
          : 'to bottom right'
    const slots = [manualColorHex1, manualColorHex2, manualColorHex3, manualColorHex4, manualColorHex5].slice(
      0,
      manualColorCount,
    )
    const valid = slots.filter((s) => /^#([0-9a-f]{6})$/i.test(String(s ?? ''))) as string[]
    if (valid.length >= 2) {
      const stops = valid.map((c, i) => `${c} ${(i / (valid.length - 1)) * 100}%`).join(', ')
      return `linear-gradient(${dir}, ${stops})`
    }
    if (valid.length === 1) return valid[0]
    return '#90adbb'
  }, [
    colorBlendDirection,
    manualColorCount,
    manualColorHex1,
    manualColorHex2,
    manualColorHex3,
    manualColorHex4,
    manualColorHex5,
  ])

  const manualHexSlots = [
    { n: 1, hex: manualColorHex1, setHex: setManualColorHex1, def: '#90adbb' },
    { n: 2, hex: manualColorHex2, setHex: setManualColorHex2, def: '#0e68ab' },
    { n: 3, hex: manualColorHex3, setHex: setManualColorHex3, def: '#00733d' },
    { n: 4, hex: manualColorHex4, setHex: setManualColorHex4, def: '#d3202a' },
    { n: 5, hex: manualColorHex5, setHex: setManualColorHex5, def: '#c0b673' },
  ] as const

  useEffect(() => {
    if (workspaceInitEpoch === 0) return
    setRightOpenStored('none')
  }, [workspaceInitEpoch])

  useEffect(() => {
    // Details owns settings only; Look owns layout / identity / frame-options / panels.
    if (
      inspectorSegment === 'details' &&
      (rightOpenStored === 'layout' ||
        rightOpenStored === 'identity' ||
        rightOpenStored === 'panels' ||
        rightOpenStored === 'frame-options')
    ) {
      setRightOpenStored('none')
    }
    if (inspectorSegment === 'look' && rightOpenStored === 'settings') {
      setRightOpenStored('none')
    }
  }, [inspectorSegment])

  useEffect(() => {
    // Step strip: collapse to menu, or open sole submenu when event carries rightOpen.
    const onFlowStep = (e: Event) => {
      const detail = (e as CustomEvent<{ rightOpen?: string; menuLevel?: boolean }>).detail
      if (detail && detail.menuLevel === false && typeof detail.rightOpen === 'string') {
        setRightOpenStored(isRightOpenStored(detail.rightOpen) ? detail.rightOpen : 'none')
        return
      }
      setRightOpenStored('none')
    }
    window.addEventListener('umps-flow-step', onFlowStep)
    return () => {
      window.removeEventListener('umps-flow-step', onFlowStep)
    }
  }, [setRightOpenStored])

  const shellClass = embedded
    ? inspectorSegment === 'details'
      ? `min-h-0 min-w-0 w-full flex flex-col overflow-x-hidden`
      : `h-full min-h-0 min-w-0 w-full flex flex-col overflow-x-hidden`
    : `sidebar-shell h-full min-h-0 min-w-0 w-full max-w-none flex flex-col flex-none overflow-x-hidden lg:shrink-[2] lg:max-w-[320px] ${asideWidthClass} order-3 max-h-[min(40vh,22rem)] lg:order-none lg:max-h-none`

  return (
    <aside
      data-phone-surface={embedded ? undefined : 'style'}
      className={shellClass}
      aria-label={
        inspectorSegment === 'look'
          ? 'Look inspector'
          : inspectorSegment === 'details'
            ? 'Details styling'
            : 'Right sidebar'
      }
    >
      <div
        className={
          inspectorSegment === 'details'
            ? 'min-h-0 flex flex-col'
            : 'h-full min-h-0 flex flex-col'
        }
      >
        {!embedded ? (
        <div className="sidebar-header flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="sidebar-header-badge h-9 w-9 rounded-xl flex items-center justify-center">
              <SlidersHorizontal className="h-4 w-4" aria-hidden />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className={`${UI_TEXT_SECTION_HEADER} leading-5 truncate`}>Styling</div>
                <div className={`${UI_TEXT_METADATA} truncate`}>
                  Color, borders & panels
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              startTransition(() => setCollapsed((v) => !v))
            }}
            className="sidebar-btn-secondary ui-focus-ring h-9 w-9 rounded-xl flex items-center justify-center text-neutral-600 dark:text-neutral-300"
            aria-label={collapsed ? 'Expand right sidebar' : 'Collapse right sidebar'}
          >
            {collapsed ? <ChevronLeft className="h-4 w-4" aria-hidden /> : <ChevronRight className="h-4 w-4" aria-hidden />}
          </button>
        </div>
        ) : null}

	        <div
	          className={[
	            inspectorSegment === 'details' ? 'sidebar-content min-h-0' : 'sidebar-content flex-1 min-h-0',
	            drillMode
	              ? inspectorSegment === 'details'
	                ? 'inspector-drill-stack'
	                : 'inspector-drill-stack overflow-hidden'
	              : 'overflow-y-auto',
	          ]
	            .filter(Boolean)
	            .join(' ')}
	          aria-label="Styling sections"
	        >
	          {(embedded || !collapsed) && (
            <>
  {showLookSections ? (
  <>
  {showSection('layout') ? (
  <CollapsibleSection
    title="Frame"
    icon={<LayoutTemplate className="h-4 w-4" />}
    open={rightOpenSection === 'layout'}
    onToggle={() => toggleRightSection('layout')}
    mode={sectionMode}
    stackOccupied={stackOccupied}
    inline={sectionInline('layout')}
  >
    <div className="space-y-2" onFocusCapture={scrollFieldIntoView}>
      <LayoutThumbnailPicker
        layout={activeLayout}
        onSelectFamily={(family) => {
          setLayout({ family, variant: activeLayout.variant })
          commitState()
        }}
        onSelectVariant={(variant) => {
          setLayout({ family: activeLayout.family, variant })
          commitState()
        }}
      />
    </div>
  </CollapsibleSection>
  ) : null}

  {showSection('identity') &&
  activeLayout.family !== 'pkmn' &&
  activeLayout.family !== 'space-gothic' ? (
  <CollapsibleSection
    title="Colors"
    icon={<Wand2 className="h-4 w-4" />}
    open={rightOpenSection === 'identity'}
    onToggle={() => toggleRightSection('identity')}
    mode={sectionMode}
    stackOccupied={stackOccupied}
    inline={sectionInline('identity')}
  >
    <div className="space-y-2">
      <SwitchRow
        label="Auto Color"
        checked={!!autoColorEnabled}
        onToggle={() => setAutoColorEnabled(!autoColorEnabled)}
        ariaLabel="Auto color"
      />
      {autoColorEnabled ? (
        <ConstraintHint>{CONSTRAINT_COPY.colorAutoOn}</ConstraintHint>
      ) : (
        <ConstraintHint>{CONSTRAINT_COPY.colorAutoOff}</ConstraintHint>
      )}
      {landFullArtManaCircle ? <ConstraintHint>{CONSTRAINT_COPY.colorLandFullArt}</ConstraintHint> : null}

      <div className="space-y-2">
        <div className={UI_TEXT_LABEL_SEMIBOLD}>Color identity blend</div>
        <select
          value={colorBlendDirection}
          onChange={(e) => setColorBlendDirection(e.target.value as ColorBlendDirection)}
          className="w-full h-10 rounded-xl border border-neutral-200 bg-white px-3 ui-text-control outline-none ui-focus-ring-control dark:border-[var(--sb-border)] dark:bg-[var(--sb-surface-soft)]"
          aria-label="Color identity blend mode"
        >
          <option value="vertical">Vertical</option>
          <option value="horizontal">Horizontal</option>
          <option value="diagonal">Diagonal</option>
          <option value="swirl">Swirl</option>
        </select>
        {colorBlendDirection === 'swirl' ? (
          <p className={`${UI_TEXT_HELP_COMPACT} leading-snug`}>
            Procedural swirl matches the card inner border in preview and export (no linear direction).
          </p>
        ) : null}
      </div>

      {shouldShowColorIdentityPipControls(pdColorInput) ? (
        <div className="space-y-1">
          <label className={`block ${UI_TEXT_LABEL_COMPACT}`}>
            Color identity (explicit WUBRG — drives auto-color)
          </label>
          <div className="flex flex-wrap gap-2">
            {(['W', 'U', 'B', 'R', 'G'] as const).map((pip) => {
              const active = mergedColorIdentityPips.includes(pip)
              const chip = COLOR_IDENTITY_PIP_CHIP[pip]
              return (
                <button
                  key={pip}
                  type="button"
                  onClick={() => {
                    const cur = [...colorIdentity]
                    const idx = cur.indexOf(pip)
                    if (idx >= 0) cur.splice(idx, 1)
                    else if (cur.length < 5) cur.push(pip)
                    setField('colorIdentity', normalizeColorIdentityPips(cur))
                    commitState()
                  }}
                  className={[
                    `sidebar-btn-secondary ui-focus-ring h-9 min-w-[2.25rem] rounded-xl border px-2 ${UI_TEXT_METADATA_SEMIBOLD}`,
                    active ? '' : 'text-[var(--sb-text)]',
                  ].join(' ')}
                  style={
                    active
                      ? {
                          background: chip.background,
                          color: chip.letter,
                          borderColor: chip.border,
                        }
                      : undefined
                  }
                  aria-pressed={active}
                  aria-label={`Toggle ${pip} identity`}
                >
                  {pip}
                </button>
              )
            })}
          </div>
          <p className={`${UI_TEXT_HELP_COMPACT} leading-snug`}>
            Up to five colors. Braced pips in the card name or mana cost field also count (e.g. {'{R}'},{' '}
            {'{W/U}'}); bare letters in the name are ignored. Two = hybrid gradient; three or more = multi-stop inner border.
          </p>
        </div>
      ) : null}

      {shouldShowManualColorPaletteControls(pdColorInput) ? (
        <div className="space-y-2">
            <div className="space-y-1">
              <label className={`block ${UI_TEXT_LABEL_COMPACT}`}>
                Manual colors (1–5)
              </label>
              <select
                value={manualColorCount}
                onChange={(e) => setManualColorCount(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                className="w-full h-10 rounded-xl border border-neutral-200 bg-white px-3 ui-text-control outline-none ui-focus-ring-control dark:border-[var(--sb-border)] dark:bg-[var(--sb-surface-soft)]"
                aria-label="Number of manual colors"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} color{n > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {manualHexSlots.slice(0, manualColorCount).map(({ n, hex, setHex, def }) => (
                <div key={n} className="space-y-1">
                  <label className={`block ${UI_TEXT_LABEL_COMPACT}`}>Color {n}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={/^#([0-9a-f]{6})$/i.test(hex) ? hex : def}
                      onChange={(e) => setHex(e.target.value)}
                      className="h-10 w-10 shrink-0 rounded-xl border border-neutral-200 bg-white p-0 dark:border-[var(--sb-border)] dark:bg-[var(--sb-surface-soft)]"
                      aria-label={`Manual color ${n} picker`}
                    />
                    <input
                      value={hex}
                      onChange={(e) => setHex(e.target.value)}
                      placeholder="#RRGGBB"
                      className="w-full h-10 rounded-xl border border-neutral-200 bg-white px-3 ui-text-mono-value outline-none ui-focus-ring-control dark:border-[var(--sb-border)] dark:bg-[var(--sb-surface-soft)]"
                      aria-label={`Manual color ${n} hex`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-1">
              {colorBlendDirection === 'swirl' ? (
                shouldDefaultWhiteInnerBorder ? (
                  <div
                    className="h-4 w-full rounded-[var(--ui-radius-lg)] border border-[var(--ui-color-border)] bg-[var(--ui-color-surface-elevated)]"
                    aria-label="Manual color preview"
                  />
                ) : (
                  <IdentitySwirlPreviewBar stops={swirlPreviewStops} />
                )
              ) : (
                <div
                  className="h-4 w-full rounded-[var(--ui-radius-lg)] border border-[var(--ui-color-border)]"
                  style={{ background: manualColorPreview }}
                  aria-label="Manual color preview"
                />
              )}
            </div>
        </div>
      ) : null}
      <CollapsibleSection
        title="Inner Border"
        open={innerBorderOpen}
        onToggle={() => {
          setInnerBorderOpen((v) => !v)
          if (!innerBorderOpen) setOuterBorderOpen(false)
        }}
        mode={sectionMode}
        stackOccupied={drillMode && (innerBorderOpen || outerBorderOpen) && !innerBorderOpen}
      >
        <div className="space-y-2">
          <SwitchRow
            label="Inner Border - ON/OFF"
            checked={innerBorderEnabled !== false}
            onToggle={() => {
              setField('innerBorderEnabled', !(innerBorderEnabled !== false))
              commitState()
            }}
            ariaLabel="Inner border on/off"
          />

          <LazyOuterBorderPicker
            field="innerBorderBackground"
            buttonLabel="Inner Border Background"
            identityOption={{ value: 'identity', label: 'From Color Identity' }}
          />

          <FieldRow label="Inner Border Opacity" layout="stacked">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={typeof innerBorderOpacity === 'number' ? innerBorderOpacity : 1}
              disabled={innerBorderEnabled === false}
              onChange={(e) => setField('innerBorderOpacity', parseFloat(e.target.value))}
              onMouseUp={commitState}
              onTouchEnd={commitState}
              className="w-full disabled:opacity-50"
              aria-label="Inner border opacity"
            />
          </FieldRow>

          <FieldRow label="Card Frame Texture" layout="stacked">
            <select
              value={selectedTexture}
              onChange={(e) => {
                setField('selectedTexture', e.target.value)
                commitState()
              }}
              disabled={cardFrameTextureDisabled}
              className="w-full h-10 rounded-xl border border-neutral-200 bg-white px-3 ui-text-control outline-none ui-focus-ring-control disabled:opacity-50 dark:border-[var(--sb-border)] dark:bg-[var(--sb-surface-soft)]"
              aria-label="Card frame texture"
            >
              {TEXTURE_OPTIONS.map((t) => (
                <option key={t.file || 'none'} value={t.file}>
                  {t.label}
                </option>
              ))}
            </select>
          </FieldRow>

          {selectedTexture && !cardFrameTextureDisabled ? (
            <FieldRow label="Card Frame Texture Opacity" layout="stacked">
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={typeof textureOpacity === 'number' ? textureOpacity : 1}
                onChange={(e) => setField('textureOpacity', parseFloat(e.target.value))}
                onMouseUp={commitState}
                onTouchEnd={commitState}
                className="w-full"
                aria-label="Card frame texture opacity"
              />
            </FieldRow>
          ) : null}
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Outer Border"
        open={outerBorderOpen}
        onToggle={() => {
          setOuterBorderOpen((v) => !v)
          if (!outerBorderOpen) setInnerBorderOpen(false)
        }}
        mode={sectionMode}
        stackOccupied={drillMode && (innerBorderOpen || outerBorderOpen) && !outerBorderOpen}
      >
        <div className="space-y-2">
          <LazyOuterBorderPicker buttonLabel="Outer Border Background" />

          <div className="rounded-xl border border-neutral-200 dark:border-[var(--sb-border)]">
            <button
              type="button"
              disabled={!outerBorderFrameTextureApplicable}
              onClick={() => setObfTextureOpen((v) => !v)}
              aria-expanded={outerBorderFrameTextureApplicable && obfTextureOpen}
              className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left ui-text-control outline-none ui-focus-ring-control enabled:hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:enabled:hover:bg-neutral-800"
              title={
                outerBorderFrameTextureApplicable
                  ? 'Overlay a frame texture on the Outer Border'
                  : 'Available for Solid, M15, and Dual colors only'
              }
            >
              <span>Outer Border Texture</span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 transition-transform ${
                  outerBorderFrameTextureApplicable && obfTextureOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {outerBorderFrameTextureApplicable && obfTextureOpen && (
              <div className="space-y-3 border-t border-neutral-200 px-3 py-3 dark:border-[var(--sb-border)]">
                <FieldRow label="Texture" layout="stacked">
                  <select
                    value={outerBorderFrameTexture}
                    onChange={(e) => {
                      setField('outerBorderFrameTexture', e.target.value)
                      commitState()
                    }}
                    className="w-full h-10 rounded-xl border border-neutral-200 bg-white px-3 ui-text-control outline-none ui-focus-ring-control dark:border-[var(--sb-border)] dark:bg-[var(--sb-surface-soft)]"
                    aria-label="Outer border frame texture"
                  >
                    {TEXTURE_OPTIONS.map((t) => (
                      <option key={`obf-${t.file || 'none'}`} value={t.file}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </FieldRow>

                <FieldRow label="Opacity" layout="stacked">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={typeof outerBorderFrameTextureOpacity === 'number' ? outerBorderFrameTextureOpacity : 1}
                    onChange={(e) => setField('outerBorderFrameTextureOpacity', parseFloat(e.target.value))}
                    onMouseUp={commitState}
                    onTouchEnd={commitState}
                    className="w-full"
                    aria-label="Outer border frame texture opacity"
                  />
                </FieldRow>
              </div>
            )}
          </div>
        </div>
      </CollapsibleSection>
    </div>
  </CollapsibleSection>
  ) : null}

  {showFrameExtras && showSection('frame-options') ? (
  <CollapsibleSection
    title="Frame options"
    icon={<LayoutTemplate className="h-4 w-4" />}
    open={rightOpenSection === 'frame-options'}
    onToggle={() => toggleRightSection('frame-options')}
    mode={sectionMode}
    stackOccupied={stackOccupied}
    inline={sectionInline('frame-options')}
  >
    <div className="space-y-2" onFocusCapture={scrollFieldIntoView}>
      {shouldShowSpellTextBoxSelector({ layoutFamily: activeLayout.family, layout: activeLayout }) ? (
        <FieldRow label="Spell Text Box" layout="stacked">
          <select
            value={spellTextBoxId}
            onChange={(e) => {
              setField('spellTextBoxId', e.target.value)
              commitState()
            }}
            className="w-full h-10 rounded-xl border border-neutral-200 bg-white px-3 ui-text-control outline-none ui-focus-ring-control dark:border-[var(--sb-border)] dark:bg-[var(--sb-surface-soft)]"
            aria-label="Spell text box parchment panel"
          >
            {SPELL_PANEL_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </FieldRow>
      ) : null}
      {shouldShowPreModernTextBoxSelector({ layoutFamily: activeLayout.family, layout: activeLayout }) ? (
        <FieldRow label="Rules Text Box" layout="stacked">
          <select
            value={preModernRulesTextBoxId}
            onChange={(e) => {
              setField('preModernRulesTextBoxId', e.target.value)
              commitState()
            }}
            className="w-full h-10 rounded-xl border border-neutral-200 bg-white px-3 ui-text-control outline-none ui-focus-ring-control dark:border-[var(--sb-border)] dark:bg-[var(--sb-surface-soft)]"
            aria-label="Rules text box background"
          >
            {PRE_MODERN_RULES_TEXT_BOX_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </FieldRow>
      ) : null}
      {shouldShowPlateGeometry(activeLayoutCapabilities) ? (
        <SwitchRow
          label="Bezier Plate"
          checked={!!bezierPlateEnabled}
          onToggle={() => {
            setField('bezierPlateEnabled', !bezierPlateEnabled)
            commitState()
          }}
          ariaLabel="Bezier plate"
        />
      ) : null}
      {shouldShowCrownArmorSelectors({ layout: activeLayout }) ? (
        <>
          <FieldRow label="Crown" layout="stacked">
            <select
              value={crownAssetId}
              onChange={(e) => {
                setField('crownAssetId', e.target.value)
                commitState()
              }}
              className="w-full h-10 rounded-xl border border-neutral-200 bg-white px-3 ui-text-control outline-none ui-focus-ring-control dark:border-[var(--sb-border)] dark:bg-[var(--sb-surface-soft)]"
              aria-label="Crown asset"
            >
              {CROWN_OPTIONS.map((o) => (
                <option key={o.id || 'none'} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </FieldRow>
          {crownAssetId ? (
            <>
              <FieldRow label="Crown tint" layout="stacked">
                <select
                  value={crownTintPreset}
                  onChange={(e) => {
                    const presetId = normalizeCrownTintPreset(e.target.value) as CrownTintPresetId
                    const preset = getCrownTintPreset(presetId)
                    setField('crownTintPreset', presetId)
                    setField('crownColor', rgbToHex(...preset.crownRgb))
                    if (crownShadowEnabled && !crownShadowColorManual) {
                      setField('crownShadowColor', rgbToHex(...preset.shadowRgb))
                    }
                    commitState()
                  }}
                  className="w-full h-10 rounded-xl border border-neutral-200 bg-white px-3 ui-text-control outline-none ui-focus-ring-control dark:border-[var(--sb-border)] dark:bg-[var(--sb-surface-soft)]"
                  aria-label="Crown tint preset"
                >
                  {CROWN_TINT_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </FieldRow>
              <FieldRow label="Crown color" layout="stacked">
                <ColorSwatchPopover
                  value={crownColor}
                  ariaLabel="Crown fill color"
                  onChange={(hex) => {
                    setField('crownColor', hex)
                    setField('crownTintPreset', 'custom')
                    commitState()
                  }}
                />
              </FieldRow>
              <SwitchRow
                label="Crown shadow"
                checked={!!crownShadowEnabled}
                onToggle={() => {
                  const next = !crownShadowEnabled
                  setField('crownShadowEnabled', next)
                  if (next && !crownShadowColorManual) {
                    const preset = getCrownTintPreset(crownTintPreset)
                    setField('crownShadowColor', rgbToHex(...preset.shadowRgb))
                  }
                  commitState()
                }}
                ariaLabel="Crown shadow"
              />
              {crownShadowEnabled ? (
                <FieldRow label="Shadow color" layout="stacked">
                  <ColorSwatchPopover
                    value={crownShadowColor}
                    ariaLabel="Crown shadow color"
                    onChange={(hex) => {
                      setField('crownShadowColor', hex)
                      setField('crownShadowColorManual', true)
                      commitState()
                    }}
                  />
                </FieldRow>
              ) : null}
            </>
          ) : null}
        </>
      ) : null}
    </div>
  </CollapsibleSection>
  ) : null}

  {showFrameExtras && showSection('panels') ? (
  <CollapsibleSection
    title="Panels"
    icon={<Blend className="h-4 w-4" aria-hidden />}
    open={rightOpenSection === 'panels'}
    onToggle={() => toggleRightSection('panels')}
    mode={sectionMode}
    stackOccupied={stackOccupied}
    inline={sectionInline('panels')}
  >
    {sectionInline('panels') || rightOpenSection === 'panels' ? (
      <Suspense fallback={<p className={`${UI_TEXT_HELP_COMPACT} leading-snug`}>Loading panels…</p>}>
        <AdvancedPanelsSection />
      </Suspense>
    ) : null}
  </CollapsibleSection>
  ) : null}
  </>
  ) : null}

  {showDetailsSections || !embedded ? (
  <>
  {showSection('settings') ? (
  <CollapsibleSection
    title="Guides / Settings"
    icon={<Settings2 className="h-4 w-4" />}
    open={rightOpenSection === 'settings'}
    onToggle={() => toggleRightSection('settings')}
    mode={sectionMode}
    stackOccupied={stackOccupied}
    inline={sectionInline('settings')}
  >
    <div className="space-y-3">
      <AppearanceThemeControl />
      <div className="space-y-2">
        <SwitchRow
          label="Restore last session"
          checked={!!restoreSession}
          onToggle={() => setRestoreSession(!restoreSession)}
          ariaLabel="Restore last session"
        />
        <SwitchRow
          label="Show Layout Labels"
          checked={!!showTooltips}
          onToggle={() => toggleTooltips()}
          ariaLabel="Show layout labels"
        />
      </div>
    </div>
  </CollapsibleSection>
  ) : null}
  </>
  ) : null}
</>
	          )}
	        </div>
	      </div>
	    </aside>
  )
}
