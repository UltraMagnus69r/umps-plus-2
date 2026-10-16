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
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Wand2,
  Type,
  Image as ImageIcon,
  BookOpen,
  CloudDownload,
  FileText,
  BadgeInfo,
  Plus,
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
  shouldShowArtControls,
  shouldShowBattleDefenseControls,
  shouldShowFlavorTextField,
  shouldShowLandPanelArtSelector,
  shouldShowManaCostTextField,
  shouldShowPlaneswalkerCoreInputs,
  shouldShowPowerToughnessControls,
  shouldShowPreparedCoreInputs,
  shouldShowPrintOnlyFrameNotice,
  shouldShowPtTypographySubsection,
  shouldShowRulesTextEditor,
  shouldShowSagaClassCoreInputs,
  shouldShowSecondaryNameFields,
  shouldShowSecondaryNameToggle,
  shouldShowTypeLineSection,
} from '../../authority/progressiveDisclosureAuthority'
import PlaneswalkerCoreInputs from './PlaneswalkerCoreInputs'
import PreparedCoreInputs from './PreparedCoreInputs'
import SagaClassCoreInputs from './SagaClassCoreInputs'
import { isClassLayout, isSagaCreatureLayout } from '../../authority/layoutTaxonomy'
import { usePersistedUiState, useUiComplexityMode } from '../../hooks/usePersistedUiState'
import { useScrollFieldIntoView } from '../../hooks/useScrollFieldIntoView'
import {
  isFlowSectionVisible,
  isSoleInlineSection,
  resetStudioFlowToStart,
  type StudioFlowStepId,
} from '../../authority/studioFlowAuthority'
import type { ManaTextTarget } from '../../utils/manaTextTarget'
import {
  normalizeSecondaryNameAlign,
  normalizeSecondaryNameFontSize,
  SECONDARY_NAME_ALIGNS,
  SECONDARY_NAME_FONT_SIZE_MAX,
  SECONDARY_NAME_FONT_SIZE_MIN,
  type SecondaryNameAlign,
} from '../../authority/secondaryNameAuthority'

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
type LeftSectionKey =
  | 'import-sync'
  | 'core'
  | 'type'
  | 'text'
  | 'collector'
  | 'font-styling'
  | 'art'
function ManaSymbolAssistantIcon({ target }: { target: ManaTextTarget }) {
  const manaPopupOpen = useCardStore((s) => s.manaPopupOpen)
  const manaPopupHost = useCardStore((s) => s.manaPopupHost)
  const openManaPopup = useCardStore((s) => s.openManaPopup)
  const closeManaPopup = useCardStore((s) => s.closeManaPopup)
  const activeHere = manaPopupOpen && manaPopupHost === target
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        className={[
          'studio-mana-cta ui-focus-ring',
          activeHere ? 'is-active' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-label={activeHere ? 'Close mana picker' : 'Open mana picker'}
        aria-pressed={activeHere}
        title="Pick mana symbols"
        data-mana-picker-entry={target}
        onClick={() => {
          if (activeHere) closeManaPopup()
          else openManaPopup(target)
        }}
      >
        <Plus size={14} aria-hidden />
        <Sparkles size={14} aria-hidden />
        <span>{activeHere ? 'Close' : '+ Mana'}</span>
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

type LeftOpenStored = LeftSectionKey | 'none' | 'rules' | 'flavor'

function isLeftOpenStored(v: string): v is LeftOpenStored {
  // Legacy 'rules' / 'flavor' migrate to merged 'text' section.
  if (v === 'rules' || v === 'flavor') return true
  return (
    v === 'none' ||
    v === 'import-sync' ||
    v === 'core' ||
    v === 'type' ||
    v === 'text' ||
    v === 'collector' ||
    v === 'font-styling' ||
    v === 'art'
  )
}

function normalizeLeftOpenStored(v: LeftOpenStored): LeftSectionKey | 'none' {
  if (v === 'rules' || v === 'flavor') return 'text'
  return v
}

export type SidebarLeftInspectorSegment = 'content' | 'details'

type SidebarLeftProps = {
  /** When set, renders as inspector content (no rail chrome / Simple-Advanced). */
  inspectorSegment?: SidebarLeftInspectorSegment
  /** Active step pill — scopes which menu rows appear (no overlapping editors). */
  flowStepId?: StudioFlowStepId | null
}

export default function SidebarLeft({ inspectorSegment, flowStepId = null }: SidebarLeftProps) {
  const embedded = inspectorSegment != null
  const [collapsed, setCollapsed] = useState(false)
  const [leftOpenStored, setLeftOpenStored] = usePersistedUiState<LeftOpenStored>(
    'umps-left-open-section',
    'none',
    isLeftOpenStored,
  )
  const leftOpenNormalized = normalizeLeftOpenStored(leftOpenStored)
  const leftOpenSection: LeftSectionKey | null =
    leftOpenNormalized === 'none' ? null : leftOpenNormalized

  useEffect(() => {
    if (leftOpenStored === 'rules' || leftOpenStored === 'flavor') {
      setLeftOpenStored('text')
    }
  }, [leftOpenStored, setLeftOpenStored])
  const [uiMode, setUiMode] = useUiComplexityMode()
  const scrollFieldIntoView = useScrollFieldIntoView()
  /** Details segment shows collector; Content never does (D1). Per-field typography lives on Content. */
  const isAdvanced = embedded ? inspectorSegment === 'details' : uiMode === 'advanced'
  const showContentSections = !embedded || inspectorSegment === 'content'
  const showDetailsSections = !embedded || inspectorSegment === 'details'
  /** Studio inspector: drill-in panels instead of nested accordion scroll. */
  const drillMode = embedded
  const sectionMode = drillMode ? 'drill' : 'accordion'
  const stackOccupied = drillMode && leftOpenSection != null
  const [cardImageUrl, setCardImageUrl] = useState('')
  const showSection = (key: LeftSectionKey) =>
    !embedded || isFlowSectionVisible(flowStepId, 'left', key)
  const sectionInline = (key: LeftSectionKey) =>
    embedded && isSoleInlineSection(flowStepId, 'left', key)

  const toggleLeftSection = (key: LeftSectionKey) => {
    startTransition(() => {
      setLeftOpenStored((cur) => {
        const current = cur === 'none' ? null : cur
        const next = current === key ? null : key
        if (next && inspectorSegment === 'details') {
          try {
            window.localStorage.setItem('umps-right-open-section', 'none')
          } catch {
            /* private mode */
          }
        }
        queueMicrotask(() => window.dispatchEvent(new CustomEvent('umps-inspector-section')))
        return next ?? 'none'
      })
    })
  }

  const name = useCardStore((s) => s.cardData.name)
  const secondaryName = useCardStore((s) => s.cardData.secondaryName)
  const showSecondaryName = useCardStore((s) => s.cardData.showSecondaryName)
  const secondaryNameFontSize = useCardStore((s) => s.cardData.secondaryNameFontSize)
  const secondaryNameAlign = useCardStore((s) => s.cardData.secondaryNameAlign)
  const secondaryNameLightText = useCardStore((s) => s.cardData.secondaryNameLightText)
  const typeLine = useCardStore((s) => s.cardData.typeLine)
  const manaCost = useCardStore((s) => s.cardData.manaCost)
  const cardText = useCardStore((s) => s.cardData.cardText)
  const flavorText = useCardStore((s) => s.cardData.flavorText)
  const rarity = useCardStore((s) => s.cardData.rarity)
  const power = useCardStore((s) => s.cardData.power)
  const toughness = useCardStore((s) => s.cardData.toughness)
  const showPowerToughness = useCardStore((s) => s.cardData.showPowerToughness)
  const battleDefense = useCardStore((s) => s.cardData.battleDefense)
  const preparedSpellName = useCardStore((s) => s.cardData.preparedSpellName)
  const preparedSpellManaCost = useCardStore((s) => s.cardData.preparedSpellManaCost)
  const preparedSpellType = useCardStore((s) => s.cardData.preparedSpellType)
  const preparedSpellText = useCardStore((s) => s.cardData.preparedSpellText)
  const startingLoyalty = useCardStore((s) => s.cardData.startingLoyalty)
  const planeswalkerStaticText = useCardStore((s) => s.cardData.planeswalkerStaticText)
  const planeswalkerAbilityCount = useCardStore((s) => s.cardData.planeswalkerAbilityCount)
  const planeswalkerAbilities = useCardStore((s) => s.cardData.planeswalkerAbilities)
  const showFlavorTextOnCard = useCardStore((s) => s.cardData.showFlavorTextOnCard)
  const sagaReminderText = useCardStore((s) => s.cardData.sagaReminderText)
  const sagaChapterCount = useCardStore((s) => s.cardData.sagaChapterCount)
  const sagaStageTexts = useCardStore((s) => s.cardData.sagaStageTexts)
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
  const resetCard = useCardStore((s) => s.resetCard)
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
    setCardImageUrl('')
  }, [workspaceInitEpoch])

  useEffect(() => {
    // Segment entry must stay at the collapsed menu — never auto-drill Name/etc.
    if (
      inspectorSegment === 'content' &&
      (leftOpenStored === 'collector' || leftOpenStored === 'font-styling')
    ) {
      setLeftOpenStored('none')
    }
    if (inspectorSegment === 'details' && leftOpenStored === 'font-styling') {
      // Typography moved to Content field controls — stay at Details menu.
      setLeftOpenStored('none')
    }
    if (
      inspectorSegment === 'details' &&
      (leftOpenStored === 'core' ||
        leftOpenStored === 'type' ||
        leftOpenStored === 'text' ||
        leftOpenStored === 'rules' ||
        leftOpenStored === 'flavor' ||
        leftOpenStored === 'art' ||
        leftOpenStored === 'import-sync')
    ) {
      setLeftOpenStored('none')
    }
  }, [inspectorSegment])

  useEffect(() => {
    const openImport = () => {
      if (inspectorSegment && inspectorSegment !== 'content') return
      setLeftOpenStored('import-sync')
      queueMicrotask(() => window.dispatchEvent(new CustomEvent('umps-inspector-section')))
    }
    // Step strip: collapse to menu, or open sole submenu when event carries leftOpen.
    const onFlowStep = (e: Event) => {
      const detail = (e as CustomEvent<{ leftOpen?: string; menuLevel?: boolean }>).detail
      if (detail && detail.menuLevel === false && typeof detail.leftOpen === 'string') {
        setLeftOpenStored(isLeftOpenStored(detail.leftOpen) ? detail.leftOpen : 'none')
        return
      }
      setLeftOpenStored('none')
    }
    window.addEventListener('umps-open-import', openImport)
    window.addEventListener('umps-flow-step', onFlowStep)
    return () => {
      window.removeEventListener('umps-open-import', openImport)
      window.removeEventListener('umps-flow-step', onFlowStep)
    }
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
  const battleDefenseField = useCaretPreservingField<HTMLInputElement>(battleDefense, (v) =>
    setField('battleDefense', v),
  )
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
      const el =
        target === 'manaCost'
          ? manaCostRef.current
          : target === 'rulesText'
            ? rulesTextRef.current
            : (document.querySelector(
                `[data-mana-input="${target}"]`,
              ) as HTMLTextAreaElement | null)
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
            ? inspectorSegment === 'details'
              ? `min-h-0 min-w-0 w-full flex flex-col overflow-x-hidden ${asideWidthClass}`
              : `h-full min-h-0 min-w-0 w-full flex flex-col overflow-x-hidden ${asideWidthClass}`
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
              ? inspectorSegment === 'details' && !stackOccupied
                ? 'flex min-h-0 flex-col'
                : 'flex min-h-0 flex-1 flex-col overflow-hidden'
              : 'flex-1 min-h-0 overflow-y-auto'
          }
        >
          <div
            className={[
              drillMode && inspectorSegment === 'details' ? 'sidebar-content' : 'sidebar-content min-h-full',
              drillMode ? 'inspector-drill-stack' : 'relative',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {showContentSections ? (
            <>
            {showSection('import-sync') ? (
            <CollapsibleSection
                title="Import & Sync"
                icon={<CloudDownload size={16} className="text-neutral-500 dark:text-neutral-400" />}
                open={leftOpenSection === 'import-sync'}
                onToggle={() => toggleLeftSection('import-sync')}
              mode={sectionMode}
              stackOccupied={stackOccupied}
              inline={sectionInline('import-sync')}
            >
              {sectionInline('import-sync') || leftOpenSection === 'import-sync' ? (
                <div className="space-y-3">
                  <SecondaryUtilityButton
                    className="w-full"
                    onClick={() => {
                      resetCard()
                      resetStudioFlowToStart()
                    }}
                    ariaLabel="New Card"
                  >
                    <span className="inline-flex items-center justify-center gap-1.5">
                      <Plus size={14} aria-hidden />
                      New Card
                    </span>
                  </SecondaryUtilityButton>
                  <Suspense fallback={<p className="text-xs text-neutral-500">Loading Scryfall…</p>}>
                    <ScryfallImportSection
                      cardImageUrl={cardImageUrl}
                      setCardImageUrl={setCardImageUrl}
                      cloneExportHint={validationHints.cloneExportHint}
                    />
                  </Suspense>
                </div>
              ) : null}
              </CollapsibleSection>
            ) : null}

            {showSection('core') ? (
            <CollapsibleSection
              title="Name & Mana"
              icon={<Type size={16} className="text-neutral-500 dark:text-neutral-400" />}
              open={leftOpenSection === 'core'}
              onToggle={() => toggleLeftSection('core')}
              mode={sectionMode}
              stackOccupied={stackOccupied}
              inline={sectionInline('core')}
            >
              {validationHints.coreBrowsingHint ? (
                <ValidationInline>{validationHints.coreBrowsingHint}</ValidationInline>
              ) : null}
              {shouldShowPrintOnlyFrameNotice(activeLayoutCapabilities) ? (
                <p className="text-[length:var(--ui-font-size-sm)] text-[var(--ui-color-muted)]">
                  Print-only land frame — the static PNG is the full card (no art upload or text
                  overlays).
                </p>
              ) : landFullArtReducedCore ? (
                <>
                  <FieldRow label="Card Name" layout="stacked">
                    <div className="space-y-2" data-mana-keep-clear="name">
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
                      <Suspense fallback={null}>
                        <FontMenu typographyKey="nameTypography" legend="Card name typography" compact />
                      </Suspense>
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
                    <div className="space-y-2" data-mana-keep-clear="name">
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
                      <Suspense fallback={null}>
                        <FontMenu typographyKey="nameTypography" legend="Card name typography" compact />
                      </Suspense>
                    </div>
                  </FieldRow>
                  {shouldShowManaCostTextField(activeLayoutCapabilities) ? (
                  <div className="space-y-2 py-3" data-mana-anchor-row="manaCost">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className={LABEL_CLASS}>Mana Cost</label>
                      <ManaSymbolAssistantIcon target="manaCost" />
                    </div>
                    <div className="min-w-0" data-mana-keep-clear="cost">
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
                        data-mana-input="manaCost"
                        className={INPUT_CLASS}
                        placeholder="e.g., {R} or tap + Mana"
                        aria-label="Mana cost text"
                      />
                    </div>
                  </div>
                  ) : null}

                  {shouldShowPowerToughnessControls(pdInput) ? (
                    <>
                      <div className="space-y-2" data-mana-keep-clear="pt">
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
                        {shouldShowPtTypographySubsection(activeLayoutCapabilities) ? (
                          <div data-mana-keep-clear="font">
                            <Suspense fallback={null}>
                              <FontMenu typographyKey="ptTypography" legend="Power / toughness typography" compact />
                            </Suspense>
                          </div>
                        ) : null}
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

              {shouldShowSecondaryNameToggle(pdInput) ? (
              <div className="space-y-2 pt-2">
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
                        min={SECONDARY_NAME_FONT_SIZE_MIN}
                        max={SECONDARY_NAME_FONT_SIZE_MAX}
                        step={0.5}
                        value={normalizeSecondaryNameFontSize(secondaryNameFontSize)}
                        onChange={(e) =>
                          setField(
                            'secondaryNameFontSize',
                            normalizeSecondaryNameFontSize(parseFloat(e.target.value)),
                          )
                        }
                        onMouseUp={commitState}
                        onTouchEnd={commitState}
                        className="w-full"
                        aria-label="Secondary name size"
                      />
                    </div>

                    <FieldRow label="Secondary Name Align" layout="stacked">
                      <select
                        value={normalizeSecondaryNameAlign(secondaryNameAlign)}
                        onChange={(e) => {
                          setField(
                            'secondaryNameAlign',
                            normalizeSecondaryNameAlign(e.target.value as SecondaryNameAlign),
                          )
                          commitState()
                        }}
                        className={INPUT_CLASS}
                        aria-label="Secondary name alignment"
                      >
                        {SECONDARY_NAME_ALIGNS.map((a) => (
                          <option key={a} value={a}>
                            {a === 'left' ? 'Left' : a === 'center' ? 'Center' : 'Right'}
                          </option>
                        ))}
                      </select>
                    </FieldRow>

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
              ) : null}
            </CollapsibleSection>
            ) : null}

            {showSection('type') && shouldShowTypeLineSection(activeLayoutCapabilities) ? (
            <CollapsibleSection
              title="Type & Set symbol"
              icon={<BadgeInfo size={16} className="text-neutral-500 dark:text-neutral-400" />}
              open={leftOpenSection === 'type'}
              onToggle={() => toggleLeftSection('type')}
              mode={sectionMode}
              stackOccupied={stackOccupied}
              inline={sectionInline('type')}
            >
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
                  <Suspense fallback={null}>
                    <FontMenu typographyKey="typeTypography" legend="Type line typography" compact />
                  </Suspense>
                </div>
              </FieldRow>

              <div className="space-y-2 pt-2">
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
            ) : null}

            {showSection('art') && shouldShowArtControls(pdInput) ? (
            <CollapsibleSection
              title="Artwork"
              icon={<ImageIcon size={16} className="text-neutral-500 dark:text-neutral-400" />}
              open={leftOpenSection === 'art'}
              onToggle={() => toggleLeftSection('art')}
              mode={sectionMode}
              stackOccupied={stackOccupied}
              inline={sectionInline('art')}
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
            </CollapsibleSection>
            ) : null}

            {showSection('text') ? (
            <CollapsibleSection
              title="Rules & Flavor"
              icon={<FileText size={16} className="text-neutral-500 dark:text-neutral-400" />}
              open={leftOpenSection === 'text'}
              onToggle={() => toggleLeftSection('text')}
              mode={sectionMode}
              stackOccupied={stackOccupied}
              inline={sectionInline('text')}
            >
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

              {shouldShowSagaClassCoreInputs(pdInput) ? (
                <SagaClassCoreInputs
                  mode={
                    isClassLayout(activeLayout)
                      ? 'class'
                      : isSagaCreatureLayout(activeLayout)
                        ? 'saga-creature'
                        : 'saga'
                  }
                  sagaReminderText={sagaReminderText}
                  sagaChapterCount={sagaChapterCount}
                  sagaStageTexts={sagaStageTexts}
                  setField={setField}
                  commitState={commitState}
                />
              ) : null}

              {shouldShowBattleDefenseControls(pdInput) ? (
                <FieldRow label="Defense" layout="stacked">
                  <input
                    {...battleDefenseField}
                    onBlur={commitState}
                    className={INPUT_CLASS}
                    placeholder="e.g., 6"
                    aria-label="Battle defense"
                    inputMode="numeric"
                  />
                </FieldRow>
              ) : null}

              {shouldShowPreparedCoreInputs(pdInput) ? (
                <PreparedCoreInputs
                  preparedSpellName={preparedSpellName}
                  preparedSpellManaCost={preparedSpellManaCost}
                  preparedSpellType={preparedSpellType}
                  preparedSpellText={preparedSpellText}
                  setField={setField}
                  commitState={commitState}
                />
              ) : null}

              {shouldShowRulesTextEditor(pdInput) ? (
                <div className="space-y-2 py-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className={LABEL_CLASS}>
                      {shouldShowPreparedCoreInputs(pdInput)
                        ? 'Prepared rules'
                        : shouldShowBattleDefenseControls(pdInput)
                          ? 'Battle rules'
                          : 'Rules Text'}
                    </label>
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
                      data-mana-input="rulesText"
                      className={`${TEXTAREA_CLASS} h-28`}
                      placeholder="Card rules text..."
                    />
                    <Suspense fallback={null}>
                      <FontMenu typographyKey="rulesTypography" legend="Rules text typography" compact />
                    </Suspense>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Rules text is hidden for this layout.
                </p>
              )}

              {shouldShowFlavorTextField(pdInput) ? (
                <FieldRow label="Flavor Text" layout="stacked">
                  <div className="space-y-2">
                    <textarea
                      {...flavorField}
                      onBlur={commitState}
                      className={`${TEXTAREA_CLASS} h-20`}
                      placeholder="Flavor text..."
                    />
                    <Suspense fallback={null}>
                      <FontMenu typographyKey="flavorTypography" legend="Flavor text typography" compact />
                    </Suspense>
                  </div>
                </FieldRow>
              ) : (
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Flavor text is not shown for this layout.
                </p>
              )}
            </CollapsibleSection>
            ) : null}
            </>
            ) : null}

            {isAdvanced && showDetailsSections && showSection('collector') ? (
            <CollapsibleSection
              title="Collector / Copy"
              icon={<BookOpen size={16} className="text-neutral-500 dark:text-neutral-400" />}
              open={leftOpenSection === 'collector'}
              onToggle={() => toggleLeftSection('collector')}
              mode={sectionMode}
              stackOccupied={stackOccupied}
              inline={sectionInline('collector')}
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
                  aria-describedby="collector-language-help"
                />
                <p id="collector-language-help" className="mt-1 text-[0.6875rem] leading-snug text-[var(--text-tertiary)]">
                  Card language line on the collector strip (localization code such as EN, JP, DE).
                </p>
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
              <div className="space-y-2 pb-4 pt-1">
                <Suspense fallback={null}>
                  <FontMenu typographyKey="metadataTypography" legend="Footer metadata typography" compact />
                </Suspense>
              </div>
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