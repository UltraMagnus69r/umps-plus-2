import {
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
  Check,
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
import { UI_TEXT_HELP_COMPACT } from '../../authority/typographyAuthority'
import {
  isScryfallNoMatchingPrintsMessage,
  UI_GUIDANCE_INLINE,
} from '../../authority/guidanceAuthority'
import {
  UI_ASYNC_SPINNER_SM,
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

/** Shared print-picker row chrome (Scryfall Import + full-card overlay). */
const SCRYFALL_PRINT_THUMB_CLASS =
  'h-28 w-20 shrink-0 rounded object-cover border border-neutral-200/50 dark:border-neutral-700/50'
const SCRYFALL_PRINT_ACTION_BTN_CLASS =
  'ui-focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-neutral-300 bg-white text-neutral-500 transition-[color,border-color] duration-ui-standard ease-ui-out hover:border-emerald-500/45 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-600 dark:bg-neutral-900/80 dark:text-neutral-400 dark:hover:border-emerald-500/40 dark:hover:text-emerald-400'
import FontMenu from '../ui/FontMenu'
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
import { filterScryfallPrintCandidates } from '../../authority/scryfallResultsFilterAuthority'
import PlaneswalkerCoreInputs from './PlaneswalkerCoreInputs'
import { usePersistedUiState, useUiComplexityMode } from '../../hooks/usePersistedUiState'
import { useScrollFieldIntoView } from '../../hooks/useScrollFieldIntoView'

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

export default function SidebarLeft() {
  const [collapsed, setCollapsed] = useState(false)
  const [leftOpenStored, setLeftOpenStored] = usePersistedUiState<LeftOpenStored>(
    'umps-left-open-section',
    'core',
    isLeftOpenStored,
  )
  const leftOpenSection: LeftSectionKey | null = leftOpenStored === 'none' ? null : leftOpenStored
  const [uiMode, setUiMode] = useUiComplexityMode()
  const scrollFieldIntoView = useScrollFieldIntoView()
  const isAdvanced = uiMode === 'advanced'
  const [openFontPanel, setOpenFontPanel] = useState<LeftFontPanelKey | null>(null)
  const [metadataFontOpen, setMetadataFontOpen] = useState(false)
  const [scryfallSearchQuery, setScryfallSearchQuery] = useState('')
  const [scryfallCloneQuery, setScryfallCloneQuery] = useState('')
  const [cardImageUrl, setCardImageUrl] = useState('')
  /** Phase 18.3 — narrow local print rows (import / clone); reset when store replaces result sets. */
  const [scryfallImportPrintFilter, setScryfallImportPrintFilter] = useState('')
  const [scryfallClonePrintFilter, setScryfallClonePrintFilter] = useState('')

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
  const asyncScryfallFetch = useCardStore((s) => s.asyncStatus.scryfallFetch)
  const fetchAndApplyScryfallData = useCardStore((s) => s.fetchAndApplyScryfallData)
  const importScryfallPrintById = useCardStore((s) => s.importScryfallPrintById)
  const fetchScryfallCloneData = useCardStore((s) => s.fetchScryfallCloneData)
  const applyScryfallCloneById = useCardStore((s) => s.applyScryfallCloneById)
  const scryfallSearchStatus = useCardStore((s) => s.scryfallSearchStatus)
  const scryfallImportStatus = useCardStore((s) => s.scryfallImportStatus)
  const scryfallSearchResults = useCardStore((s) => s.scryfallSearchResults)
  const scryfallChosenPrint = useCardStore((s) => s.scryfallChosenPrint)
  const clearScryfallSearchFlow = useCardStore((s) => s.clearScryfallSearchFlow)
  const scryfallCloneSearchStatus = useCardStore((s) => s.scryfallCloneSearchStatus)
  const scryfallCloneApplyStatus = useCardStore((s) => s.scryfallCloneApplyStatus)
  const scryfallCloneSearchResults = useCardStore((s) => s.scryfallCloneSearchResults)
  const scryfallCloneChosenPrint = useCardStore((s) => s.scryfallCloneChosenPrint)
  const clearScryfallCloneFlow = useCardStore((s) => s.clearScryfallCloneFlow)
  const setAsyncStatus = useCardStore((s) => s.setAsyncStatus)

  useEffect(() => {
    setScryfallImportPrintFilter('')
  }, [scryfallSearchResults])

  useEffect(() => {
    setScryfallClonePrintFilter('')
  }, [scryfallCloneSearchResults])

  const filteredScryfallImportPrints = useMemo(
    () => filterScryfallPrintCandidates(scryfallSearchResults, scryfallImportPrintFilter),
    [scryfallSearchResults, scryfallImportPrintFilter],
  )
  const filteredScryfallClonePrints = useMemo(
    () => filterScryfallPrintCandidates(scryfallCloneSearchResults, scryfallClonePrintFilter),
    [scryfallCloneSearchResults, scryfallClonePrintFilter],
  )
  const clonedCardImage = useCardStore((s) => s.cardData.clonedCardImage)
  const setClonedCardImage = useCardStore((s) => s.setClonedCardImage)
  const clearClonedCardImage = useCardStore((s) => s.clearClonedCardImage)

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
    setScryfallSearchQuery('')
    setScryfallCloneQuery('')
    clearScryfallSearchFlow()
    clearScryfallCloneFlow()
    setCardImageUrl('')
  }, [workspaceInitEpoch, clearScryfallSearchFlow, clearScryfallCloneFlow])

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

  const asideWidthClass = collapsed ? 'lg:w-14' : 'lg:w-[304px]'

  return (
    <>
      <aside
        data-phone-surface="data"
        className={`${SHELL_CLASS} ${asideWidthClass} order-2 max-h-[min(40vh,22rem)] lg:order-none lg:max-h-none`}
        dir="ltr"
      >
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

      {!collapsed && (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="sidebar-content min-h-full">
            <CollapsibleSection
                title="Import & Sync"
                icon={<CloudDownload size={16} className="text-neutral-500 dark:text-neutral-400" />}
                open={leftOpenSection === 'import-sync'}
                onToggle={() => toggleLeftSection('import-sync')}
              >
              <FieldRow label="Scryfall Import" layout="stacked">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2 min-w-0">
                  <input
                    value={scryfallSearchQuery}
                    onChange={(e) => setScryfallSearchQuery(e.target.value)}
                    className={`${INPUT_CLASS} flex-1 min-w-0`}
                    placeholder="Name, Scryfall URL, or SET 123"
                    aria-label="Scryfall search"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        void fetchAndApplyScryfallData(scryfallSearchQuery)
                      }
                    }}
                  />
                  <SecondaryUtilityButton
                    onClick={() => {
                      void fetchAndApplyScryfallData(scryfallSearchQuery)
                    }}
                    disabled={asyncScryfallFetch.status === 'loading'}
                    ariaLabel="Fetch metadata from Scryfall"
                    className="w-full shrink-0 sm:w-auto"
                  >
                    {asyncScryfallFetch.status === 'loading' ? (
                      <span className="inline-flex items-center gap-2">
                        <span className={UI_ASYNC_SPINNER_SM} aria-hidden />
                        Working…
                      </span>
                    ) : (
                      'Search / Import'
                    )}
                  </SecondaryUtilityButton>
                </div>
                {scryfallSearchQuery.trim() === '' &&
                scryfallSearchResults.length === 0 &&
                asyncScryfallFetch.status !== 'loading' &&
                scryfallSearchStatus.status === 'idle' &&
                scryfallImportStatus.status === 'idle' ? (
                  <p className={UI_GUIDANCE_INLINE}>Search for a card to import.</p>
                ) : null}
                <div className="pt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                  Routing: URL to exact print, SET+collector to exact print, card name to print picker.
                </div>
                {asyncScryfallFetch.status === 'error' &&
                asyncScryfallFetch.message &&
                !isScryfallNoMatchingPrintsMessage(asyncScryfallFetch.message) ? (
                  <div className="text-xs text-red-600 dark:text-red-400 pt-1">{asyncScryfallFetch.message}</div>
                ) : null}
                {scryfallSearchStatus.status === 'failure' && scryfallSearchStatus.message ? (
                  isScryfallNoMatchingPrintsMessage(scryfallSearchStatus.message) ? (
                    <p className={UI_GUIDANCE_INLINE}>No results found.</p>
                  ) : (
                    <div className="text-xs text-red-600 dark:text-red-400 pt-1">{scryfallSearchStatus.message}</div>
                  )
                ) : null}
                {scryfallImportStatus.status === 'failure' && scryfallImportStatus.message && (
                  <div className="text-xs text-red-600 dark:text-red-400 pt-1">{scryfallImportStatus.message}</div>
                )}
                {scryfallImportStatus.status === 'success' && (
                  <div className={`${UI_INLINE_STATUS_SUCCESS} pt-1`}>Imported</div>
                )}
                {scryfallSearchStatus.status === 'success' && scryfallSearchStatus.message && (
                  <div className="text-xs text-emerald-700 dark:text-emerald-400 pt-1">{scryfallSearchStatus.message}</div>
                )}
                {scryfallSearchResults.length > 1 && (
                  <div className="pt-2 space-y-2 rounded-xl border border-neutral-200/45 dark:border-neutral-800/45 p-2 bg-white/40 dark:bg-neutral-900/28">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-medium text-neutral-700 dark:text-neutral-200">Choose Exact Print</div>
                      <button
                        type="button"
                        className="ui-focus-ring rounded-md px-1 py-0.5 text-[11px] text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
                        onClick={() => clearScryfallSearchFlow()}
                        aria-label="Clear print search results"
                      >
                        Clear
                      </button>
                    </div>
                    <input
                      type="search"
                      value={scryfallImportPrintFilter}
                      onChange={(e) => setScryfallImportPrintFilter(e.target.value)}
                      className={`${INPUT_CLASS} mt-1 h-9 py-1.5 text-xs`}
                      placeholder="Filter prints…"
                      aria-label="Filter import print list"
                    />
                    {scryfallImportPrintFilter.trim() && scryfallSearchResults.length > 1 ? (
                      <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
                        {filteredScryfallImportPrints.length === 0
                          ? 'No prints match filter.'
                          : `Showing ${filteredScryfallImportPrints.length} of ${scryfallSearchResults.length}`}
                      </div>
                    ) : null}
                    <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                      {filteredScryfallImportPrints.map((print) => {
                        const selected = scryfallChosenPrint?.id === print.id
                        return (
                          <div
                            key={print.id}
                            className={`rounded-lg border p-2 ${
                              selected
                                ? 'border-emerald-400 bg-emerald-50/70 dark:border-emerald-600 dark:bg-emerald-950/20'
                                : 'border-neutral-200/50 dark:border-neutral-800/50'
                            }`}
                          >
                            <div className="flex flex-wrap items-start gap-2 sm:flex-nowrap sm:items-center">
                              {print.small_image ? (
                                <img
                                  src={print.small_image}
                                  alt={`${print.name} ${print.set} ${print.collector_number}`}
                                  className={SCRYFALL_PRINT_THUMB_CLASS}
                                  loading="lazy"
                                  decoding="async"
                                />
                              ) : null}
                              <div className="min-w-0 flex-1 basis-[min(100%,12rem)] sm:basis-auto">
                                <div className="text-xs font-semibold truncate">{print.name}</div>
                                <div className="text-[11px] text-neutral-600 dark:text-neutral-300">
                                  {print.set.toUpperCase()} #{print.collector_number}
                                  {print.set_name ? ` - ${print.set_name}` : ''}
                                </div>
                                <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                  {print.released_at ?? 'Unknown release'}
                                  {print.rarity ? ` - ${print.rarity}` : ''}
                                  {print.lang ? ` - ${print.lang.toUpperCase()}` : ''}
                                </div>
                              </div>
                              <button
                                type="button"
                                className={`${SCRYFALL_PRINT_ACTION_BTN_CLASS} self-end sm:self-auto`}
                                onClick={() => {
                                  void importScryfallPrintById(print.id)
                                }}
                                disabled={scryfallImportStatus.status === 'loading'}
                                aria-label={`Import ${print.name} ${print.set} ${print.collector_number}`}
                                title="Import this print"
                              >
                                {scryfallImportStatus.status === 'loading' ? (
                                  <span className={UI_ASYNC_SPINNER_XS} aria-hidden />
                                ) : (
                                  <Check className="h-5 w-5 shrink-0 stroke-[2.25]" aria-hidden />
                                )}
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </FieldRow>

              <div className="space-y-3 rounded-xl border border-neutral-200/45 bg-white/40 p-3 dark:border-neutral-800/45 dark:bg-neutral-900/28">
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-100">
                    Full-card overlay
                  </div>
                  <p className={`${UI_TEXT_HELP_COMPACT} leading-snug`}>
                    For Hidden layout: drop in a printable full-card image. Unlike Import, this does not
                    fill name, rules, or art fields.
                  </p>
                </div>

              <FieldRow label="From Scryfall" layout="stacked">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2 min-w-0">
                  <input
                    value={scryfallCloneQuery}
                    onChange={(e) => setScryfallCloneQuery(e.target.value)}
                    className={`${INPUT_CLASS} flex-1 min-w-0`}
                    placeholder="Name, Scryfall URL, or SET 123"
                    aria-label="Scryfall overlay search"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        void fetchScryfallCloneData(scryfallCloneQuery)
                      }
                    }}
                  />
                  <SecondaryUtilityButton
                    onClick={() => {
                      void fetchScryfallCloneData(scryfallCloneQuery)
                    }}
                    disabled={scryfallCloneApplyStatus.status === 'loading' || scryfallCloneSearchStatus.status === 'loading'}
                    ariaLabel="Search Scryfall for full-card overlay"
                    className="w-full shrink-0 sm:w-auto"
                  >
                    {scryfallCloneApplyStatus.status === 'loading' || scryfallCloneSearchStatus.status === 'loading' ? (
                      <span className="inline-flex items-center gap-2">
                        <span className={UI_ASYNC_SPINNER_SM} aria-hidden />
                        Working…
                      </span>
                    ) : (
                      'Search / Apply'
                    )}
                  </SecondaryUtilityButton>
                </div>
                {scryfallCloneQuery.trim() === '' &&
                scryfallCloneSearchResults.length === 0 &&
                scryfallCloneSearchStatus.status !== 'loading' &&
                scryfallCloneApplyStatus.status !== 'loading' &&
                scryfallCloneSearchStatus.status === 'idle' &&
                scryfallCloneApplyStatus.status === 'idle' ? (
                  <p className={UI_GUIDANCE_INLINE}>Search for a card to use as the overlay.</p>
                ) : null}
                <div className="pt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                  Same routing as import; applies the selected print as the full-card overlay.
                </div>
                {scryfallCloneSearchStatus.status === 'failure' && scryfallCloneSearchStatus.message ? (
                  isScryfallNoMatchingPrintsMessage(scryfallCloneSearchStatus.message) ? (
                    <p className={UI_GUIDANCE_INLINE}>No results found.</p>
                  ) : (
                    <div className="text-xs text-red-600 dark:text-red-400 pt-1">
                      {scryfallCloneSearchStatus.message}
                    </div>
                  )
                ) : null}
                {scryfallCloneApplyStatus.status === 'failure' && scryfallCloneApplyStatus.message && (
                  <div className="text-xs text-red-600 dark:text-red-400 pt-1">{scryfallCloneApplyStatus.message}</div>
                )}
                {scryfallCloneApplyStatus.status === 'success' && (
                  <div className={`${UI_INLINE_STATUS_SUCCESS} pt-1`}>Overlay applied</div>
                )}
                {scryfallCloneSearchStatus.status === 'success' && scryfallCloneSearchStatus.message && (
                  <div className="text-xs text-emerald-700 dark:text-emerald-400 pt-1">{scryfallCloneSearchStatus.message}</div>
                )}
                {scryfallCloneSearchResults.length > 1 && (
                  <div className="pt-2 space-y-2 rounded-xl border border-neutral-200/45 dark:border-neutral-800/45 p-2 bg-white/40 dark:bg-neutral-900/28">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-medium text-neutral-700 dark:text-neutral-200">Choose print for overlay</div>
                      <button
                        type="button"
                        className="ui-focus-ring rounded-md px-1 py-0.5 text-[11px] text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
                        onClick={() => clearScryfallCloneFlow()}
                        aria-label="Clear overlay print search results"
                      >
                        Clear
                      </button>
                    </div>
                    <input
                      type="search"
                      value={scryfallClonePrintFilter}
                      onChange={(e) => setScryfallClonePrintFilter(e.target.value)}
                      className={`${INPUT_CLASS} mt-1 h-9 py-1.5 text-xs`}
                      placeholder="Filter prints…"
                      aria-label="Filter overlay print list"
                    />
                    {scryfallClonePrintFilter.trim() && scryfallCloneSearchResults.length > 1 ? (
                      <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
                        {filteredScryfallClonePrints.length === 0
                          ? 'No prints match filter.'
                          : `Showing ${filteredScryfallClonePrints.length} of ${scryfallCloneSearchResults.length}`}
                      </div>
                    ) : null}
                    <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                      {filteredScryfallClonePrints.map((print) => {
                        const selected = scryfallCloneChosenPrint?.id === print.id
                        return (
                          <div
                            key={print.id}
                            className={`rounded-lg border p-2 ${
                              selected
                                ? 'border-emerald-400 bg-emerald-50/70 dark:border-emerald-600 dark:bg-emerald-950/20'
                                : 'border-neutral-200/50 dark:border-neutral-800/50'
                            }`}
                          >
                            <div className="flex flex-wrap items-start gap-2 sm:flex-nowrap sm:items-center">
                              {print.small_image ? (
                                <img
                                  src={print.small_image}
                                  alt={`${print.name} ${print.set} ${print.collector_number}`}
                                  className={SCRYFALL_PRINT_THUMB_CLASS}
                                  loading="lazy"
                                  decoding="async"
                                />
                              ) : null}
                              <div className="min-w-0 flex-1 basis-[min(100%,12rem)] sm:basis-auto">
                                <div className="text-xs font-semibold truncate">{print.name}</div>
                                <div className="text-[11px] text-neutral-600 dark:text-neutral-300">
                                  {print.set.toUpperCase()} #{print.collector_number}
                                  {print.set_name ? ` - ${print.set_name}` : ''}
                                </div>
                                <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                  {print.released_at ?? 'Unknown release'}
                                  {print.rarity ? ` - ${print.rarity}` : ''}
                                  {print.lang ? ` - ${print.lang.toUpperCase()}` : ''}
                                </div>
                              </div>
                              <button
                                type="button"
                                className={`${SCRYFALL_PRINT_ACTION_BTN_CLASS} self-end sm:self-auto`}
                                onClick={() => {
                                  void applyScryfallCloneById(print.id)
                                }}
                                disabled={scryfallCloneApplyStatus.status === 'loading'}
                                aria-label={`Apply overlay: ${print.name} ${print.set} ${print.collector_number}`}
                                title="Apply this print as overlay"
                              >
                                {scryfallCloneApplyStatus.status === 'loading' ? (
                                  <span className={UI_ASYNC_SPINNER_XS} aria-hidden />
                                ) : (
                                  <Check className="h-5 w-5 shrink-0 stroke-[2.25]" aria-hidden />
                                )}
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </FieldRow>

              <FieldRow label="From image URL" layout="stacked">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2 min-w-0">
                  <input
                    value={cardImageUrl}
                    onChange={(e) => setCardImageUrl(e.target.value)}
                    className={`${INPUT_CLASS} flex-1 min-w-0`}
                    placeholder="https://…"
                    aria-label="Full-card overlay image URL"
                  />
                  <SecondaryUtilityButton
                    onClick={() => setClonedCardImage(cardImageUrl)}
                    ariaLabel="Apply full-card overlay from image URL"
                    className="w-full shrink-0 sm:w-auto"
                  >
                    Apply overlay
                  </SecondaryUtilityButton>
                </div>
              </FieldRow>

              <FieldRow label="Remove overlay" layout="stacked">
                <SecondaryUtilityButton
                  onClick={() => clearClonedCardImage()}
                  disabled={!clonedCardImage}
                  ariaLabel="Clear full-card overlay"
                  className="w-full"
                >
                  Clear overlay
                </SecondaryUtilityButton>
                {validationHints.cloneExportHint ? (
                  <ValidationInline>{validationHints.cloneExportHint}</ValidationInline>
                ) : !clonedCardImage ? (
                  <ConstraintHint>{CONSTRAINT_COPY.sidebarClearClone}</ConstraintHint>
                ) : null}
              </FieldRow>
              </div>
              </CollapsibleSection>

            <CollapsibleSection
              title="Identity"
              icon={<Type size={16} className="text-neutral-500 dark:text-neutral-400" />}
              open={leftOpenSection === 'core'}
              onToggle={() => toggleLeftSection('core')}
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

            {isAdvanced ? (
            <CollapsibleSection
              title="Collector"
              icon={<BookOpen size={16} className="text-neutral-500 dark:text-neutral-400" />}
              open={leftOpenSection === 'collector'}
              onToggle={() => toggleLeftSection('collector')}
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
              >
                <FontMenu typographyKey="metadataTypography" legend="Footer metadata typography" />
              </CollapsibleSection>


            </CollapsibleSection>
            ) : null}

            {isAdvanced ? (
            <CollapsibleSection
              title="Text"
              icon={<ALargeSmall size={16} className="text-neutral-500 dark:text-neutral-400" />}
              open={leftOpenSection === 'font-styling'}
              onToggle={() => toggleLeftSection('font-styling')}
            >
              <CollapsibleSection
                title="Card name"
                icon={<ALargeSmall size={16} className="text-neutral-500 dark:text-neutral-400" />}
                open={openFontPanel === 'name-font'}
                onToggle={() => toggleFontPanel('name-font')}
              >
                <FontMenu typographyKey="nameTypography" legend="Card name typography" />
              </CollapsibleSection>
              <CollapsibleSection
                title="Type line"
                icon={<ALargeSmall size={16} className="text-neutral-500 dark:text-neutral-400" />}
                open={openFontPanel === 'type-font'}
                onToggle={() => toggleFontPanel('type-font')}
              >
                <FontMenu typographyKey="typeTypography" legend="Type line typography" />
              </CollapsibleSection>
              {shouldShowRulesTypographySubsection(pdInput) ? (
                <CollapsibleSection
                  title="Rules text"
                  icon={<ALargeSmall size={16} className="text-neutral-500 dark:text-neutral-400" />}
                  open={openFontPanel === 'rules-font'}
                  onToggle={() => toggleFontPanel('rules-font')}
                >
                  <FontMenu typographyKey="rulesTypography" legend="Rules text typography" />
                </CollapsibleSection>
              ) : null}
              {shouldShowFlavorTypographySubsection(pdInput) ? (
                <CollapsibleSection
                  title="Flavor text"
                  icon={<ALargeSmall size={16} className="text-neutral-500 dark:text-neutral-400" />}
                  open={openFontPanel === 'flavor-font'}
                  onToggle={() => toggleFontPanel('flavor-font')}
                >
                  <FontMenu typographyKey="flavorTypography" legend="Flavor text typography" />
                </CollapsibleSection>
              ) : null}
              {shouldShowPtTypographySubsection(activeLayoutCapabilities) ? (
                <CollapsibleSection
                  title="Power / toughness"
                  icon={<ALargeSmall size={16} className="text-neutral-500 dark:text-neutral-400" />}
                  open={openFontPanel === 'pt-font'}
                  onToggle={() => toggleFontPanel('pt-font')}
                >
                  <FontMenu typographyKey="ptTypography" legend="Power / toughness typography" />
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