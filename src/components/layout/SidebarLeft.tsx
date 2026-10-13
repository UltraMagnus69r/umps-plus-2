import {
  lazy,
  Suspense,
  useCallback,
  useDeferredValue,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  startTransition,
} from 'react'
import type {
  ChangeEventHandler,
  KeyboardEventHandler,
  MouseEventHandler,
  MutableRefObject,
  ReactEventHandler,
} from 'react'
import {
  ALargeSmall,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Wand2,
  Type,
  Image as ImageIcon,
  BookOpen,
  CloudDownload,
} from 'lucide-react'
import { shallow } from 'zustand/shallow'
import { getWorkflowDerivationSnapshot, useCardStore } from '../../store/useCardStore'
import { getActiveLayoutCapabilitiesFromState } from '../../authority/layoutRegistry'
import { DEFAULT_CARD_COPYRIGHT } from '../../authority/collectorDataAuthority'
import type { LayoutId } from '../../authority/layoutTaxonomy'
import {
  LAND_FULL_ART_MANA_CIRCLE_OPTIONS,
  normalizeLandFullArtManaCircleKey,
} from '../../authority/landFullArtManaCircle'
import { UI_FOCUS_RING_CONTROL } from '../../authority/panelSurfaceAuthority'
import {
  UI_GUIDANCE_INLINE,
} from '../../authority/guidanceAuthority'
import {
  UI_ASYNC_SPINNER_XS,
  UI_INLINE_STATUS_LOADING,
  UI_INLINE_STATUS_SUCCESS,
} from '../../authority/stateFeedbackAuthority'
import CollapsibleSection from './CollapsibleSection'
import SwitchRow from '../ui/SwitchRow'
import FieldRow from '../ui/FieldRow'
import ConstraintHint from '../ui/ConstraintHint'
import ValidationInline from '../ui/ValidationInline'
import SecondaryUtilityButton from '../ui/SecondaryUtilityButton'

import { LAND_PANEL_OPTIONS } from '../../data/landPanelOptions'
import { CONSTRAINT_COPY } from '../../authority/constraintFeedbackAuthority'
import { resolveWorkflowValidationHints } from '../../authority/validationFeedbackAuthority'
import {
  isLandFullArtReducedCore,
  shouldShowFlavorTextField,
  shouldShowFlavorTypographySubsection,
  shouldShowLandPanelArtSelector,
  shouldShowPlaneswalkerCoreInputs,
  shouldShowPowerToughnessControls,
  shouldShowPtTypographySubsection,
  shouldShowRulesTextEditor,
  shouldShowRulesTypographySubsection,
  shouldShowSecondaryNameFields,
} from '../../authority/progressiveDisclosureAuthority'
import PlaneswalkerCoreInputs from './PlaneswalkerCoreInputs'
import { usePersistedUiState, useUiComplexityMode } from '../../hooks/usePersistedUiState'
import { useScrollFieldIntoView } from '../../hooks/useScrollFieldIntoView'

const FontMenu = lazy(() => import('../ui/FontMenu'))
const ScryfallImportSection = lazy(() => import('./ScryfallImportSection'))

// Styling tokens to keep SidebarLeft visually aligned with SidebarRight.
const SHELL_CLASS =
  'sidebar-shell h-full min-h-0 min-w-0 w-full max-w-none flex flex-col flex-none overflow-x-hidden lg:shrink-[2] lg:max-w-[320px]'
const HEADER_CLASS = 'sidebar-header flex items-center justify-between'
const LABEL_CLASS = 'sidebar-label'
const INPUT_CLASS =
  `sidebar-input ${UI_FOCUS_RING_CONTROL} h-10 w-full px-3 text-sm outline-none [direction:ltr]`
const TEXTAREA_CLASS =
  `sidebar-textarea ${UI_FOCUS_RING_CONTROL} w-full resize-none px-3 py-2 text-sm outline-none [direction:ltr]`

/** Phase 10.3 correction — one top-level section open at a time (left sidebar). */
type LeftSectionKey = 'import-sync' | 'core' | 'collector' | 'font-styling' | 'art'
/** Face font sub-panels: at most one open inside Font Styling. */
type LeftFontPanelKey = 'name-font' | 'type-font' | 'rules-font' | 'flavor-font' | 'pt-font'

function ManaSymbolAssistantIcon({ target }: { target: 'manaCost' | 'rulesText' }) {
  const openManaPopup = useCardStore((s) => s.openManaPopup)
  const setManaPopupTarget = useCardStore((s) => s.setManaPopupTarget)
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        className="sidebar-icon-btn ui-focus-ring flex h-8 items-center gap-1 rounded-lg px-2"
        aria-label="Open mana picker"
        title="Pick mana symbols"
        onClick={() => {
          setManaPopupTarget(target)
          openManaPopup()
        }}
      >
        <Sparkles size={14} className="text-[var(--sb-accent)]" />
        <span className="text-[11px] font-semibold text-[var(--sb-accent)]">Mana</span>
      </button>
    </div>
  )
}

/**
 * Zustand updates re-render the whole sidebar; without this, controlled fields often lose selection
 * (caret jumps to start → characters appear "backwards"). `unicode-bidi: plaintext` also broke caret
 * behavior in some browsers — avoid it on inputs.
 */
function useCaretPreservingField<T extends HTMLInputElement | HTMLTextAreaElement>(
  value: string,
  onValue: (next: string) => void,
): {
  ref: MutableRefObject<T | null>
  value: string
  onChange: ChangeEventHandler<T>
  onSelect: ReactEventHandler<T>
  onKeyUp: KeyboardEventHandler<T>
  onClick: MouseEventHandler<T>
  onMouseUp: MouseEventHandler<T>
} {
  const ref = useRef<T | null>(null) as MutableRefObject<T | null>
  const pendingCaret = useRef<{ start: number; end: number } | null>(null)

  const capture = (el: T) => {
    if (document.activeElement !== el) return
    const a = el.selectionStart
    const b = el.selectionEnd
    if (a != null && b != null) pendingCaret.current = { start: a, end: b }
  }

  useLayoutEffect(() => {
    const el = ref.current
    const t = pendingCaret.current
    if (!el || t == null || document.activeElement !== el) return
    pendingCaret.current = null
    try {
      const max = el.value.length
      const s = Math.min(Math.max(0, t.start), max)
      const e = Math.min(Math.max(0, t.end), max)
      el.setSelectionRange(s, e)
    } catch {
      /* ignore */
    }
  }, [value])

  return {
    ref,
    value,
    onChange: (e) => {
      const el = e.currentTarget
      onValue(el.value)
      const a = el.selectionStart
      const b = el.selectionEnd
      if (a != null && b != null) pendingCaret.current = { start: a, end: b }
    },
    onSelect: (e) => capture(e.currentTarget),
    onKeyUp: (e) => capture(e.currentTarget),
    onClick: (e) => capture(e.currentTarget),
    onMouseUp: (e) => capture(e.currentTarget),
  }
}

type LeftOpenStored = LeftSectionKey | 'none'

function isLeftOpenStored(v: string): v is LeftOpenStored {
  return (
    v === 'none' ||
    v === 'import-sync' ||
    v === 'core' ||
    v === 'collector' ||
    v === 'font-styling' ||
    v === 'art'
  )
}

export type SidebarLeftInspectorSegment = 'content' | 'details'

type SidebarLeftProps = {
  /** When set, renders as inspector content (no rail chrome / Simple-Advanced). */
  inspectorSegment?: SidebarLeftInspectorSegment
}

export default function SidebarLeft({ inspectorSegment }: SidebarLeftProps) {
  const embedded = inspectorSegment != null
  const [collapsed, setCollapsed] = useState(false)
  const [leftOpenStored, setLeftOpenStored] = usePersistedUiState<LeftOpenStored>(
    'umps-left-open-section',
    'core',
    isLeftOpenStored,
  )
  const leftOpenSection: LeftSectionKey | null = leftOpenStored === 'none' ? null : leftOpenStored
  const [uiMode, setUiMode] = useUiComplexityMode()
  const scrollFieldIntoView = useScrollFieldIntoView()
  /** Details segment always shows collector/typography; Content never does (D1). */
  const isAdvanced = embedded ? inspectorSegment === 'details' : uiMode === 'advanced'
  const showContentSections = !embedded || inspectorSegment === 'content'
  const showDetailsSections = !embedded || inspectorSegment === 'details'
  /** Studio inspector: drill-in panels instead of nested accordion scroll. */
  const drillMode = embedded
  const sectionMode = drillMode ? 'drill' : 'accordion'
  const stackOccupied = drillMode && leftOpenSection != null
  const [openFontPanel, setOpenFontPanel] = useState<LeftFontPanelKey | null>(null)
  const [metadataFontOpen, setMetadataFontOpen] = useState(false)
  const [cardImageUrl, setCardImageUrl] = useState('')

  const toggleLeftSection = (key: LeftSectionKey) => {
    startTransition(() => {
      setLeftOpenStored((cur) => {
        const current = cur === 'none' ? null : cur
        const next = current === key ? null : key
        if (next !== 'font-styling') setOpenFontPanel(null)
        if (next !== 'collector') setMetadataFontOpen(false)
        return next ?? 'none'
      })
    })
  }
  const toggleFontPanel = (key: LeftFontPanelKey) => {
    startTransition(() => {
      setOpenFontPanel((cur) => (cur === key ? null : key))
    })
  }

  const name = useCardStore((s) => s.cardData.name)
  const secondaryName = useCardStore((s) => s.cardData.secondaryName)
  const showSecondaryName = useCardStore((s) => s.cardData.showSecondaryName)
  const secondaryNameFontSize = useCardStore((s) => s.cardData.secondaryNameFontSize)
  const secondaryNameLightText = useCardStore((s) => s.cardData.secondaryNameLightText)
  const typeLine = useCardStore((s) => s.cardData.typeLine)
  const manaCost = useCardStore((s) => s.cardData.manaCost)
  const cardText = useCardStore((s) => s.cardData.cardText)
  const flavorText = useCardStore((s) => s.cardData.flavorText)
  const rarity = useCardStore((s) => s.cardData.rarity)
  const power = useCardStore((s) => s.cardData.power)
  const toughness = useCardStore((s) => s.cardData.toughness)
  const showPowerToughness = useCardStore((s) => s.cardData.showPowerToughness)
  const startingLoyalty = useCardStore((s) => s.cardData.startingLoyalty)
  const planeswalkerStaticText = useCardStore((s) => s.cardData.planeswalkerStaticText)
  const planeswalkerAbilityCount = useCardStore((s) => s.cardData.planeswalkerAbilityCount)
  const planeswalkerAbilities = useCardStore((s) => s.cardData.planeswalkerAbilities)
  const showFlavorTextOnCard = useCardStore((s) => s.cardData.showFlavorTextOnCard)
  const currentLayout = useCardStore((s) => s.currentLayout)
  const activeLayout = useCardStore((s) => s.cardData.layout as LayoutId)
  const artImage = useCardStore((s) => s.cardData.artImage)
  const landSecondaryPanelId = useCardStore((s) => s.cardData.landSecondaryPanelId)
  const landFullArtManaCircleKey = useCardStore((s) => s.cardData.landFullArtManaCircleKey)
  const artZoom = useCardStore((s) => s.cardData.artZoom)
  const iconScale = useCardStore((s) => s.cardData.iconScale)
  const set = useCardStore((s) => s.cardData.set)
  const collector_number = useCardStore((s) => s.cardData.collector_number)
  const language = useCardStore((s) => s.cardData.language)
  const artist = useCardStore((s) => s.cardData.artist)
  const copyright = useCardStore((s) => s.cardData.copyright)

  const [localSet, setLocalSet] = useState(set ?? '')
  const [localCollectorNumber, setLocalCollectorNumber] = useState(collector_number ?? '')
  const [localLanguage, setLocalLanguage] = useState(language ?? 'EN')
  const [artistLocal, setArtistLocal] = useState(artist ?? '')
  const [copyrightLocal, setCopyrightLocal] = useState(copyright ?? '')

  const setField = useCardStore((s) => s.setField)
  const ingestArtUpload = useCardStore((s) => s.ingestArtUpload)
  const refitArtPlacement = useCardStore((s) => s.refitArtPlacement)
  const commitState = useCardStore((s) => s.commitState)
  const workspaceInitEpoch = useCardStore((s) => s.workspaceInitEpoch)
  const showHologram = useCardStore((s) => s.showHologram)
  const setShowHologram = useCardStore((s) => s.setShowHologram)
  const asyncArtUpload = useCardStore((s) => s.asyncStatus.artUpload)
  const asyncSetIconUpload = useCardStore((s) => s.asyncStatus.setIconUpload)
  const setAsyncStatus = useCardStore((s) => s.setAsyncStatus)
  const clonedCardImage = useCardStore((s) => s.cardData.clonedCardImage)

  useEffect(() => {
    setLocalSet(set ?? '')
    setLocalCollectorNumber(collector_number ?? '')
    setLocalLanguage(language ?? 'EN')
    setArtistLocal(artist ?? '')
    setCopyrightLocal(copyright ?? '')
  }, [set, collector_number, language, artist, copyright])

  // Module 5.3 — New Card / reset: clear scratch URL/search fields; collapse section accordions.
  useEffect(() => {
    if (workspaceInitEpoch === 0) return
    setLeftOpenStored('none')
    setOpenFontPanel(null)
    setMetadataFontOpen(false)
    setCardImageUrl('')
  }, [workspaceInitEpoch])

  useEffect(() => {
    if (inspectorSegment === 'content' && (leftOpenStored === 'collector' || leftOpenStored === 'font-styling')) {
      setLeftOpenStored('core')
    }
    if (inspectorSegment === 'details' && (leftOpenStored === 'core' || leftOpenStored === 'art' || leftOpenStored === 'import-sync' || leftOpenStored === 'none')) {
      setLeftOpenStored('collector')
    }
  }, [inspectorSegment])

  useEffect(() => {
    const openImport = () => {
      if (inspectorSegment && inspectorSegment !== 'content') return
      setLeftOpenStored('import-sync')
    }
    window.addEventListener('umps-open-import', openImport)
    return () => window.removeEventListener('umps-open-import', openImport)
  }, [inspectorSegment, setLeftOpenStored])

  // Phase 3.5 – Mana Symbol Picker UI coordination (popup from field sparkles; register focus for after insert)
  const setActiveInputId = useCardStore((s) => s.setActiveInputId)
  const setActiveSelectionRange = useCardStore((s) => s.setActiveSelectionRange)
  const setRegisterManaInputFocus = useCardStore((s) => s.setRegisterManaInputFocus)

  const manaCostRef = useRef<HTMLInputElement | null>(null) as MutableRefObject<HTMLInputElement | null>
  const rulesTextRef = useRef<HTMLTextAreaElement | null>(null) as MutableRefObject<HTMLTextAreaElement | null>

  /** After focus/click, selection APIs can be wrong in the same tick; read caret on the next frame. */
  const queueSelectionSyncToStore = useCallback(
    (el: HTMLInputElement | HTMLTextAreaElement) => {
      requestAnimationFrame(() => {
        if (document.activeElement !== el) return
        const a = el.selectionStart
        const b = el.selectionEnd
        if (a != null && b != null) setActiveSelectionRange(a, b)
      })
    },
    [setActiveSelectionRange],
  )

  const pushSelectionToStoreIfAvailable = (el: HTMLInputElement | HTMLTextAreaElement) => {
    const a = el.selectionStart
    const b = el.selectionEnd
    if (a != null && b != null) setActiveSelectionRange(a, b)
  }

  const nameField = useCaretPreservingField<HTMLInputElement>(name, (v) => setField('name', v))
  const secondaryNameField = useCaretPreservingField<HTMLInputElement>(secondaryName, (v) =>
    setField('secondaryName', v),
  )
  const manaField = useCaretPreservingField<HTMLInputElement>(manaCost, (v) => setField('manaCost', v))
  const typeLineField = useCaretPreservingField<HTMLInputElement>(typeLine, (v) => setField('typeLine', v))
  const rulesField = useCaretPreservingField<HTMLTextAreaElement>(cardText, (v) => setField('cardText', v))
  const flavorField = useCaretPreservingField<HTMLTextAreaElement>(flavorText, (v) => setField('flavorText', v))
  const powerField = useCaretPreservingField<HTMLInputElement>(power, (v) => setField('power', v))
  const toughnessField = useCaretPreservingField<HTMLInputElement>(toughness, (v) => setField('toughness', v))
  const activeLayoutCapabilities = getActiveLayoutCapabilitiesFromState({
    currentLayout,
    cardData: { layout: activeLayout },
  })
  const pdInput = useMemo(
    () => ({
      layoutFamily: activeLayout.family,
      capabilities: activeLayoutCapabilities,
      showSecondaryName: !!showSecondaryName,
      showFlavorTextOnCard: !!showFlavorTextOnCard,
    }),
    [activeLayout.family, activeLayoutCapabilities, showSecondaryName, showFlavorTextOnCard],
  )

  const wfInput = useCardStore(getWorkflowDerivationSnapshot, shallow)
  /** Phase 17.2 — hints are advisory chrome; defer so high-frequency field edits stay responsive. */
  const deferredWfInput = useDeferredValue(wfInput)
  const landFullArtReducedCore = isLandFullArtReducedCore(activeLayoutCapabilities)
  const validationHints = useMemo(
    () =>
      resolveWorkflowValidationHints(deferredWfInput, {
        landFullArtReducedCore,
      }),
    [deferredWfInput, landFullArtReducedCore],
  )

  const nameFieldHintId = useId()
  const typeLineFieldHintId = useId()

  useEffect(() => {
    setRegisterManaInputFocus((target, caret) => {
      const el = target === 'manaCost' ? manaCostRef.current : rulesTextRef.current
      if (!el) return
      requestAnimationFrame(() => {
        const ae = document.activeElement
        if (
          ae &&
          ae !== el &&
          (ae instanceof HTMLInputElement || ae instanceof HTMLTextAreaElement)
        ) {
          return
        }
        el.focus()
        try {
          ;(el as HTMLInputElement | HTMLTextAreaElement).setSelectionRange?.(caret, caret)
        } catch {
          /* ignore */
        }
      })
    })
    return () => setRegisterManaInputFocus(null)
  }, [setRegisterManaInputFocus])

  const asideWidthClass = embedded
    ? 'w-full max-w-none lg:max-w-none'
    : collapsed
      ? 'lg:w-14'
      : 'lg:w-[304px]'

  return (
    <>
      <aside
        data-phone-surface={embedded ? undefined : 'data'}
        className={
          embedded
            ? `h-full min-h-0 min-w-0 w-full flex flex-col overflow-x-hidden ${asideWidthClass}`
            : `${SHELL_CLASS} ${asideWidthClass} order-2 max-h-[min(40vh,22rem)] lg:order-none lg:max-h-none`
        }
        dir="ltr"
        aria-label={
          inspectorSegment === 'content'
            ? 'Content inspector'
            : inspectorSegment === 'details'
              ? 'Details inspector'
              : 'Card data'
        }
      >
        {!embedded ? (
        <div className={HEADER_CLASS}>
          <div className="flex min-w-0 items-center gap-2">
            <Wand2 size={16} className="sidebar-header-icon shrink-0" />
            {!collapsed && (
              <div className="min-w-0 leading-tight">
                <div className="text-sm font-semibold">Card Data</div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <div
                    className="inline-flex rounded-lg border border-neutral-200 p-0.5 dark:border-[var(--sb-border)]"
                    role="group"
                    aria-label="Editor complexity"
                  >
                    <button
                      type="button"
                      className={`ui-focus-ring rounded-md px-2 py-0.5 text-[10px] font-semibold ${uiMode === 'simple' ? 'bg-[var(--sb-accent)] text-white' : 'text-neutral-500'}`}
                      aria-pressed={uiMode === 'simple'}
                      onClick={() => setUiMode('simple')}
                    >
                      Simple
                    </button>
                    <button
                      type="button"
                      className={`ui-focus-ring rounded-md px-2 py-0.5 text-[10px] font-semibold ${uiMode === 'advanced' ? 'bg-[var(--sb-accent)] text-white' : 'text-neutral-500'}`}
                      aria-pressed={uiMode === 'advanced'}
                      onClick={() => setUiMode('advanced')}
                    >
                      Advanced
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <button
            type="button"
            className="ui-focus-ring rounded-lg p-1 hover:bg-neutral-100 dark:hover:bg-neutral-900"
            onClick={() => {
              startTransition(() => setCollapsed((v) => !v))
            }}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
        ) : null}

      {(embedded || !collapsed) && (
        <div
          className={
            drillMode
              ? 'flex min-h-0 flex-1 flex-col overflow-hidden'
              : 'flex-1 min-h-0 overflow-y-auto'
          }
        >
          <div
            className={[
              'sidebar-content min-h-full',
              drillMode ? 'inspector-drill-stack' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {showContentSections ? (
            <>
            <CollapsibleSection
                title="Import & Sync"
                icon={<CloudDownload size={16} className="text-neutral-500 dark:text-neutral-400" />}
                open={leftOpenSection === 'import-sync'}
                onToggle={() => toggleLeftSection('import-sync')}
              mode={sectionMode}
              stackOccupied={stackOccupied}
            >
              {leftOpenSection === 'import-sync' ? (
                <Suspense fallback={<p className="text-xs text-neutral-500">Loading Scryfall…</p>}>
                  <ScryfallImportSection
                    cardImageUrl={cardImageUrl}
                    setCardImageUrl={setCardImageUrl}
                    cloneExportHint={validationHints.cloneExportHint}
                  />
                </Suspense>
              ) : null}
              </CollapsibleSection>

            <CollapsibleSection
              title="Identity"
              icon={<Type size={16} className="text-neutral-500 dark:text-neutral-400" />}
              open={leftOpenSection === 'core'}
              onToggle={() => toggleLeftSection('core')}
              mode={sectionMode}
              stackOccupied={stackOccupied}
            >
              {validationHints.coreBrowsingHint ? (
                <ValidationInline>{validationHints.coreBrowsingHint}</ValidationInline>
              ) : null}
              {landFullArtReducedCore ? (
                <>
                  <FieldRow label="Card Name" layout="stacked">
                    <div className="space-y-2">
                      <input
                        {...nameField}
                        onFocus={scrollFieldIntoView}
                        onBlur={commitState}
                        className={`${INPUT_CLASS} w-full`}
                        placeholder="e.g., Lightning Bolt"
                        aria-invalid={!!validationHints.nameUnderField}
                        aria-describedby={
                          validationHints.nameUnderField ? nameFieldHintId : undefined
                        }
                      />
                      {validationHints.nameUnderField ? (
                        <ValidationInline id={nameFieldHintId}>
                          {validationHints.nameUnderField}
                        </ValidationInline>
                      ) : null}
                    </div>
                  </FieldRow>
                  <FieldRow label="Name-plate mana" layout="stacked">
                    <div className="space-y-1">
                      <select
                        value={landFullArtManaCircleKey}
                        onChange={(e) => {
                          setField('landFullArtManaCircleKey', normalizeLandFullArtManaCircleKey(e.target.value))
                          commitState()
                        }}
                        className={INPUT_CLASS}
                        aria-label="Land full art name-plate mana symbol"
                      >
                        {LAND_FULL_ART_MANA_CIRCLE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </FieldRow>
                  {validationHints.typeLineCorePanel ? (
                    <ValidationInline>{validationHints.typeLineCorePanel}</ValidationInline>
                  ) : null}
                </>
              ) : (
                <>
                  <FieldRow label="Card Name" layout="stacked">
                    <div className="space-y-2">
                      <input
                        {...nameField}
                        onFocus={scrollFieldIntoView}
                        onBlur={commitState}
                        className={`${INPUT_CLASS} w-full`}
                        placeholder="e.g., Lightning Bolt"
                        aria-invalid={!!validationHints.nameUnderField}
                        aria-describedby={
                          validationHints.nameUnderField ? nameFieldHintId : undefined
                        }
                      />
                      {validationHints.nameUnderField ? (
                        <ValidationInline id={nameFieldHintId}>
                          {validationHints.nameUnderField}
                        </ValidationInline>
                      ) : null}
                    </div>
                  </FieldRow>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <SwitchRow
                        label="Show Secondary Name"
                        checked={!!showSecondaryName}
                        onToggle={() => {
                          setField('showSecondaryName', !showSecondaryName)
                          commitState()
                        }}
                        ariaLabel="Show secondary name"
                      />
                    </div>

                    {shouldShowSecondaryNameFields(pdInput) ? (
                      <>
                        <div className="space-y-1">
                          <label className={LABEL_CLASS}>Secondary Name</label>
                          <input
                            {...secondaryNameField}
                            onBlur={commitState}
                            className={INPUT_CLASS}
                            placeholder="e.g., Original Card Name"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className={LABEL_CLASS}>Secondary Name Size</label>
                          <input
                            type="range"
                            min={20}
                            max={90}
                            step={0.5}
                            value={typeof secondaryNameFontSize === 'number' ? secondaryNameFontSize : 55}
                            onChange={(e) => setField('secondaryNameFontSize', parseFloat(e.target.value))}
                            onMouseUp={commitState}
                            onTouchEnd={commitState}
                            className="w-full"
                          />
                        </div>

                        <div className="space-y-1">
                          <SwitchRow
                            label="Secondary Name Light Text"
                            checked={!!secondaryNameLightText}
                            onToggle={() => {
                              setField('secondaryNameLightText', !secondaryNameLightText)
                              commitState()
                            }}
                            ariaLabel="Secondary name light text"
                          />
                        </div>
                      </>
                    ) : null}
                  </div>
                  <div className="space-y-1 py-3">
                <div className="flex items-center gap-2">
                  <label className={LABEL_CLASS}>Mana Cost</label>
                  <ManaSymbolAssistantIcon target="manaCost" />
                </div>
                <div className="min-w-0">
                  <input
                    {...manaField}
                    ref={(node) => {
                      manaCostRef.current = node
                      manaField.ref.current = node
                    }}
                    onFocus={(e) => {
                      scrollFieldIntoView(e)
                      setActiveInputId('manaCost')
                      queueSelectionSyncToStore(e.currentTarget)
                    }}
                    onMouseUp={(e) => {
                      manaField.onMouseUp(e)
                      pushSelectionToStoreIfAvailable(e.currentTarget)
                    }}
                    onClick={(e) => {
                      manaField.onClick(e)
                      pushSelectionToStoreIfAvailable(e.currentTarget)
                    }}
                    onKeyUp={(e) => {
                      manaField.onKeyUp(e)
                      pushSelectionToStoreIfAvailable(e.currentTarget)
                    }}
                    onSelect={(e) => {
                      manaField.onSelect(e)
                      pushSelectionToStoreIfAvailable(e.currentTarget)
                    }}
                    onBlur={() => {
                      setActiveInputId(null)
                      commitState()
                    }}
                    className={INPUT_CLASS}
                    placeholder="e.g., {R}"
                  />
                </div>
              </div>

              <FieldRow label="Type Line" layout="stacked">
                <div className="space-y-2">
                  <input
                    {...typeLineField}
                    onBlur={commitState}
                    className={INPUT_CLASS}
                    placeholder="e.g., Instant"
                    aria-invalid={!!validationHints.typeLineUnderField}
                    aria-describedby={
                      validationHints.typeLineUnderField ? typeLineFieldHintId : undefined
                    }
                  />
                  {validationHints.typeLineUnderField ? (
                    <ValidationInline id={typeLineFieldHintId}>
                      {validationHints.typeLineUnderField}
                    </ValidationInline>
                  ) : null}
                </div>
              </FieldRow>

              {shouldShowPlaneswalkerCoreInputs(pdInput) ? (
                <PlaneswalkerCoreInputs
                  startingLoyalty={startingLoyalty}
                  planeswalkerStaticText={planeswalkerStaticText}
                  planeswalkerAbilityCount={planeswalkerAbilityCount}
                  planeswalkerAbilities={planeswalkerAbilities}
                  flavorText={flavorText}
                  showFlavorTextOnCard={showFlavorTextOnCard}
                  setField={setField}
                  commitState={commitState}
                />
              ) : null}

              {shouldShowRulesTextEditor(pdInput) ? (
                <>
                  <div className="space-y-1 py-3">
                    <div className="flex items-center gap-2">
                      <label className={LABEL_CLASS}>Rules Text</label>
                      <ManaSymbolAssistantIcon target="rulesText" />
                    </div>
                    <div className="min-w-0 space-y-2">
                      <textarea
                        {...rulesField}
                        ref={(node) => {
                          rulesTextRef.current = node
                          rulesField.ref.current = node
                        }}
                        onFocus={(e) => {
                          scrollFieldIntoView(e)
                          setActiveInputId('rulesText')
                          queueSelectionSyncToStore(e.currentTarget)
                        }}
                        onMouseUp={(e) => {
                          rulesField.onMouseUp(e)
                          pushSelectionToStoreIfAvailable(e.currentTarget)
                        }}
                        onClick={(e) => {
                          rulesField.onClick(e)
                          pushSelectionToStoreIfAvailable(e.currentTarget)
                        }}
                        onKeyUp={(e) => {
                          rulesField.onKeyUp(e)
                          pushSelectionToStoreIfAvailable(e.currentTarget)
                        }}
                        onSelect={(e) => {
                          rulesField.onSelect(e)
                          pushSelectionToStoreIfAvailable(e.currentTarget)
                        }}
                        onBlur={() => {
                          setActiveInputId(null)
                          commitState()
                        }}
                        className={`${TEXTAREA_CLASS} h-28`}
                        placeholder="Card rules text..."
                      />
                    </div>
                  </div>

                  {shouldShowFlavorTextField(pdInput) ? (
                    <FieldRow label="Flavor Text" layout="stacked">
                      <div className="space-y-2">
                        <textarea
                          {...flavorField}
                          onBlur={commitState}
                          className={`${TEXTAREA_CLASS} h-20`}
                          placeholder="Flavor text..."
                        />
                      </div>
                    </FieldRow>
                  ) : null}
                </>
              ) : null}

              {shouldShowPowerToughnessControls(pdInput) ? (
                <>
                  <div className="space-y-2">
                    <div className="grid w-full max-w-full grid-cols-1 gap-2 sm:grid-cols-2">
                      <FieldRow label="Power" layout="stacked">
                        <input
                          {...powerField}
                          onBlur={commitState}
                          className={INPUT_CLASS}
                          placeholder="e.g., 3"
                        />
                      </FieldRow>
                      <FieldRow label="Toughness" layout="stacked">
                        <input
                          {...toughnessField}
                          onBlur={commitState}
                          className={INPUT_CLASS}
                          placeholder="e.g., 2"
                        />
                      </FieldRow>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <SwitchRow
                      label="Show Power/Toughness Box"
                      checked={!!showPowerToughness}
                      onToggle={() => {
                        setField('showPowerToughness', !showPowerToughness)
                        commitState()
                      }}
                      ariaLabel="Show power toughness box"
                    />
                  </div>
                </>
              ) : null}
                </>
              )}
            </CollapsibleSection>

            <CollapsibleSection
              title="Art"
              icon={<ImageIcon size={16} className="text-neutral-500 dark:text-neutral-400" />}
              open={leftOpenSection === 'art'}
              onToggle={() => toggleLeftSection('art')}
              mode={sectionMode}
              stackOccupied={stackOccupied}
            >
              <div className="space-y-1">
                <label className={LABEL_CLASS}>Art Upload</label>
                {!String(artImage ?? '').trim() && !String(clonedCardImage ?? '').trim() ? (
                  <p className={UI_GUIDANCE_INLINE}>Upload art to begin.</p>
                ) : null}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="ui-focus-ring block w-full text-sm text-neutral-900 dark:text-neutral-100 file:mr-3 file:rounded-xl file:border-0 file:bg-neutral-900 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-neutral-800 dark:file:bg-white dark:file:text-black dark:hover:file:bg-neutral-100"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    void ingestArtUpload(file).finally(() => commitState())
                  }}
                />
                {asyncArtUpload.status === 'loading' && (
                  <div className={UI_INLINE_STATUS_LOADING}>
                    <span className={UI_ASYNC_SPINNER_XS} aria-hidden />
                    Loading…
                  </div>
                )}
                {asyncArtUpload.status === 'success' && (
                  <div className={UI_INLINE_STATUS_SUCCESS}>Art updated</div>
                )}
                {asyncArtUpload.status === 'error' && asyncArtUpload.message && (
                  <div className="text-xs text-red-600 dark:text-red-400">{asyncArtUpload.message}</div>
                )}
              </div>

              <div className="space-y-1">
                <label className={LABEL_CLASS}>Art Zoom</label>
                <input
                  type="range"
                  min={1}
                  max={4}
                  step={0.01}
                  value={artZoom ?? 1}
                  onChange={(e) => setField('artZoom', parseFloat(e.target.value))}
                  onMouseUp={commitState}
                  onTouchEnd={commitState}
                  className="w-full"
                />
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Drag the art in the preview to reposition.
                </div>
              </div>

              <SecondaryUtilityButton
                onClick={() => {
                  void refitArtPlacement().finally(() => commitState())
                }}
                disabled={!artImage}
                className="w-full"
              >
                Reset Art Position
              </SecondaryUtilityButton>
              {!artImage ? <ConstraintHint>{CONSTRAINT_COPY.sidebarResetArt}</ConstraintHint> : null}

              {shouldShowLandPanelArtSelector(activeLayoutCapabilities) ? (
                <FieldRow label="Land Selection" layout="stacked">
                  <div className="space-y-1">
                    <select
                      value={landSecondaryPanelId}
                      onChange={(e) => {
                        setField('landSecondaryPanelId', e.target.value)
                        commitState()
                      }}
                      className={INPUT_CLASS}
                      aria-label="Land panel for rules region"
                    >
                      {LAND_PANEL_OPTIONS.map((o) => (
                        <option key={o.id || 'none'} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Bundled land panels (secondary art in the rules-text frame). Primary card art is unchanged.
                    </div>
                  </div>
                </FieldRow>
              ) : null}

              <div className="space-y-2">
                <div className={LABEL_CLASS}>Expansion Symbol Upload</div>
                <input
                  type="file"
                  accept="image/*"
                  className="ui-focus-ring block w-full text-sm text-neutral-900 dark:text-neutral-100 file:mr-3 file:rounded-xl file:border-0 file:bg-neutral-900 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-neutral-800 dark:file:bg-white dark:file:text-black dark:hover:file:bg-neutral-100"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null
                    if (!file) return
                    setAsyncStatus('setIconUpload', 'loading')
                    const reader = new FileReader()
                    reader.onerror = () => {
                      setAsyncStatus('setIconUpload', 'error', 'Failed to load expansion symbol')
                      setTimeout(() => setAsyncStatus('setIconUpload', 'idle'), 2000)
                    }
                    reader.onload = () => {
                      const base64 = String(reader.result ?? '')
                      if (!base64) {
                        setAsyncStatus('setIconUpload', 'error', 'Unsupported image format')
                        setTimeout(() => setAsyncStatus('setIconUpload', 'idle'), 2000)
                        return
                      }
                      setField('setIconImage', base64)
                      commitState()
                      setAsyncStatus('setIconUpload', 'success')
                      setTimeout(() => setAsyncStatus('setIconUpload', 'idle'), 2000)
                    }
                    reader.readAsDataURL(file)
                  }}
                />
                {asyncSetIconUpload.status === 'loading' && (
                  <div className={UI_INLINE_STATUS_LOADING}>
                    <span className={UI_ASYNC_SPINNER_XS} aria-hidden />
                    Loading…
                  </div>
                )}
                {asyncSetIconUpload.status === 'success' && (
                  <div className={UI_INLINE_STATUS_SUCCESS}>Expansion symbol updated</div>
                )}
                {asyncSetIconUpload.status === 'error' && asyncSetIconUpload.message && (
                  <div className="text-xs text-red-600 dark:text-red-400">{asyncSetIconUpload.message}</div>
                )}

                <div className="space-y-1">
                  <label className={LABEL_CLASS}>Expansion Symbol - Size (PX)</label>
                  <input
                    type="range"
                    min={40}
                    max={220}
                    step={1}
                    value={iconScale ?? 135}
                    onChange={(e) => setField('iconScale', Number(e.target.value))}
                    onMouseUp={commitState}
                    onTouchEnd={commitState}
                    className="w-full"
                  />
                </div>
              </div>
            </CollapsibleSection>
            </>
            ) : null}

            {isAdvanced && showDetailsSections ? (
            <CollapsibleSection
              title="Collector"
              icon={<BookOpen size={16} className="text-neutral-500 dark:text-neutral-400" />}
              open={leftOpenSection === 'collector'}
              onToggle={() => toggleLeftSection('collector')}
              mode={sectionMode}
              stackOccupied={stackOccupied}
            >
              <FieldRow label="Set Code" layout="stacked">
                <input
                  value={localSet}
                  onChange={(e) => {
                    const v = e.target.value
                    setLocalSet(v)
                    setField('set', v)
                  }}
                  onBlur={() => commitState()}
                  className={INPUT_CLASS}
                  placeholder="e.g., CMM"
                />
              </FieldRow>
              <FieldRow label="Collector Number" layout="stacked">
                <input
                  value={localCollectorNumber}
                  onChange={(e) => {
                    const v = e.target.value
                    setLocalCollectorNumber(v)
                    setField('collector_number', v)
                  }}
                  onBlur={() => commitState()}
                  className={INPUT_CLASS}
                  placeholder="e.g., 0256"
                />
              </FieldRow>
              <FieldRow label="Rarity" layout="stacked">
                <select
                  value={rarity}
                  onChange={(e) => {
                    setField('rarity', e.target.value as any)
                    commitState()
                  }}
                  className={INPUT_CLASS}
                >
                  <option value="common">Common</option>
                  <option value="uncommon">Uncommon</option>
                  <option value="rare">Rare</option>
                  <option value="mythic">Mythic</option>
                </select>
              </FieldRow>
              <div className="space-y-1">
                <SwitchRow
                  label="Hologram"
                  checked={!!showHologram}
                  onToggle={() => setShowHologram(!showHologram)}
                  ariaLabel="Hologram"
                />
              </div>
              <FieldRow label="Language" layout="stacked">
                <input
                  value={localLanguage}
                  onChange={(e) => {
                    const v = e.target.value
                    setLocalLanguage(v)
                    setField('language', v)
                  }}
                  onBlur={() => commitState()}
                  className={INPUT_CLASS}
                  placeholder="EN"
                />
              </FieldRow>
              <FieldRow label="Artist Name" layout="stacked">
                <input
                  value={artistLocal}
                  onChange={(e) => {
                    const v = e.target.value
                    setArtistLocal(v)
                    setField('artist', v)
                  }}
                  onBlur={() => commitState()}
                  className={INPUT_CLASS}
                  placeholder="e.g., Alan Pollack"
                />
              </FieldRow>
              <FieldRow label="Copyright" layout="stacked">
                <input
                  value={copyrightLocal}
                  onChange={(e) => {
                    const v = e.target.value
                    setCopyrightLocal(v)
                    setField('copyright', v)
                  }}
                  onBlur={() => commitState()}
                  className={INPUT_CLASS}
                  placeholder={DEFAULT_CARD_COPYRIGHT}
                />
              </FieldRow>
              <CollapsibleSection
                title="Footer Metadata Font"
                icon={<ALargeSmall size={16} className="text-neutral-500 dark:text-neutral-400" />}
                open={metadataFontOpen}
                onToggle={() => setMetadataFontOpen((v) => !v)}
              mode={sectionMode}
              stackOccupied={false}
            >
                {metadataFontOpen ? (
                  <Suspense fallback={<p className="text-xs text-neutral-500">Loading fonts…</p>}>
                    <FontMenu typographyKey="metadataTypography" legend="Footer metadata typography" />
                  </Suspense>
                ) : null}
              </CollapsibleSection>


            </CollapsibleSection>
            ) : null}

            {isAdvanced && showDetailsSections ? (
            <CollapsibleSection
              title="Text"
              icon={<ALargeSmall size={16} className="text-neutral-500 dark:text-neutral-400" />}
              open={leftOpenSection === 'font-styling'}
              onToggle={() => toggleLeftSection('font-styling')}
              mode={sectionMode}
              stackOccupied={stackOccupied}
            >
              <CollapsibleSection
                title="Card name"
                icon={<ALargeSmall size={16} className="text-neutral-500 dark:text-neutral-400" />}
                open={openFontPanel === 'name-font'}
                onToggle={() => toggleFontPanel('name-font')}
              mode={sectionMode}
              stackOccupied={drillMode && openFontPanel != null}
            >
                {openFontPanel === 'name-font' ? (
                  <Suspense fallback={<p className="text-xs text-neutral-500">Loading fonts…</p>}>
                    <FontMenu typographyKey="nameTypography" legend="Card name typography" />
                  </Suspense>
                ) : null}
              </CollapsibleSection>
              <CollapsibleSection
                title="Type line"
                icon={<ALargeSmall size={16} className="text-neutral-500 dark:text-neutral-400" />}
                open={openFontPanel === 'type-font'}
                onToggle={() => toggleFontPanel('type-font')}
              mode={sectionMode}
              stackOccupied={drillMode && openFontPanel != null}
            >
                {openFontPanel === 'type-font' ? (
                  <Suspense fallback={<p className="text-xs text-neutral-500">Loading fonts…</p>}>
                    <FontMenu typographyKey="typeTypography" legend="Type line typography" />
                  </Suspense>
                ) : null}
              </CollapsibleSection>
              {shouldShowRulesTypographySubsection(pdInput) ? (
                <CollapsibleSection
                  title="Rules text"
                  icon={<ALargeSmall size={16} className="text-neutral-500 dark:text-neutral-400" />}
                  open={openFontPanel === 'rules-font'}
                  onToggle={() => toggleFontPanel('rules-font')}
              mode={sectionMode}
              stackOccupied={drillMode && openFontPanel != null}
            >
                  {openFontPanel === 'rules-font' ? (
                    <Suspense fallback={<p className="text-xs text-neutral-500">Loading fonts…</p>}>
                      <FontMenu typographyKey="rulesTypography" legend="Rules text typography" />
                    </Suspense>
                  ) : null}
                </CollapsibleSection>
              ) : null}
              {shouldShowFlavorTypographySubsection(pdInput) ? (
                <CollapsibleSection
                  title="Flavor text"
                  icon={<ALargeSmall size={16} className="text-neutral-500 dark:text-neutral-400" />}
                  open={openFontPanel === 'flavor-font'}
                  onToggle={() => toggleFontPanel('flavor-font')}
              mode={sectionMode}
              stackOccupied={drillMode && openFontPanel != null}
            >
                  {openFontPanel === 'flavor-font' ? (
                    <Suspense fallback={<p className="text-xs text-neutral-500">Loading fonts…</p>}>
                      <FontMenu typographyKey="flavorTypography" legend="Flavor text typography" />
                    </Suspense>
                  ) : null}
                </CollapsibleSection>
              ) : null}
              {shouldShowPtTypographySubsection(activeLayoutCapabilities) ? (
                <CollapsibleSection
                  title="Power / toughness"
                  icon={<ALargeSmall size={16} className="text-neutral-500 dark:text-neutral-400" />}
                  open={openFontPanel === 'pt-font'}
                  onToggle={() => toggleFontPanel('pt-font')}
              mode={sectionMode}
              stackOccupied={drillMode && openFontPanel != null}
            >
                  {openFontPanel === 'pt-font' ? (
                    <Suspense fallback={<p className="text-xs text-neutral-500">Loading fonts…</p>}>
                      <FontMenu typographyKey="ptTypography" legend="Power / toughness typography" />
                    </Suspense>
                  ) : null}
                </CollapsibleSection>
              ) : null}
            </CollapsibleSection>
            ) : null}

          <div className="h-2" />
        </div>
        </div>
      )}
      </aside>
    </>
  )
}