import { memo, useCallback, useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, PanelTopClose } from 'lucide-react'
import type { InspectorSegment } from '../../hooks/useInspectorSegment'
import {
  applyStudioFlowStep,
  FLOW_STEP_LEFT_SECTIONS,
  FLOW_STEP_RIGHT_SECTIONS,
  inferStudioFlowStep,
  readStoredStudioFlowStepId,
  STUDIO_FLOW_STEPS,
  type StudioFlowStep,
  type StudioFlowStepId,
} from '../../authority/studioFlowAuthority'
import {
  isCardEffectivelyEmptyForGuidance,
} from '../../authority/guidanceAuthority'
import { isPkmnLayout } from '../../authority/layoutTaxonomy'
import { useCardStore } from '../../store/useCardStore'
import SidebarLeft from './SidebarLeft'
import SidebarRight from './SidebarRight'

const PHONE_STEP_STRIP_HIDDEN_KEY = 'umps-phone-step-strip-hidden'

type Props = {
  segment: InspectorSegment
  className?: string
  /** Phone bottom sheet: omit desktop chrome width classes */
  phone?: boolean
  onOpenSave?: () => void
  onOpenPrint?: () => void
  onSegmentChange?: (segment: InspectorSegment) => void
}

function readStored(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function StudioInspector({
  segment,
  className = '',
  phone = false,
  onOpenSave,
  onOpenPrint,
  onSegmentChange,
}: Props) {
  const isPkmn = useCardStore((s) => isPkmnLayout(s.cardData.layout))
  const visibleFlowSteps = isPkmn
    ? STUDIO_FLOW_STEPS.filter((s) => s.id !== 'colors')
    : STUDIO_FLOW_STEPS
  const cardEmpty = useCardStore((s) => {
    const cd = s.cardData
    return isCardEffectivelyEmptyForGuidance({
      name: String(cd.name ?? ''),
      typeLine: String(cd.typeLine ?? ''),
      manaCost: String(cd.manaCost ?? ''),
      cardText: String(cd.cardText ?? ''),
      flavorText: String(cd.flavorText ?? ''),
      power: String(cd.power ?? ''),
      toughness: String(cd.toughness ?? ''),
      artImage: String(cd.artImage ?? ''),
      clonedCardImage: String(cd.clonedCardImage ?? ''),
    })
  })

  const [leftOpen, setLeftOpen] = useState<string | null>(() => readStored('umps-left-open-section'))
  const [rightOpen, setRightOpen] = useState<string | null>(() => readStored('umps-right-open-section'))
  const [preferredStepId, setPreferredStepId] = useState<StudioFlowStepId | null>(
    () => readStoredStudioFlowStepId(),
  )
  const [phoneStripHidden, setPhoneStripHidden] = useState(() => {
    try {
      return window.localStorage.getItem(PHONE_STEP_STRIP_HIDDEN_KEY) === '1'
    } catch {
      return false
    }
  })

  const togglePhoneStrip = useCallback(() => {
    setPhoneStripHidden((prev) => {
      const next = !prev
      try {
        window.localStorage.setItem(PHONE_STEP_STRIP_HIDDEN_KEY, next ? '1' : '0')
      } catch {
        /* private mode */
      }
      return next
    })
  }, [])

  useEffect(() => {
    const sync = () => {
      setLeftOpen(readStored('umps-left-open-section'))
      setRightOpen(readStored('umps-right-open-section'))
      setPreferredStepId(readStoredStudioFlowStepId())
    }
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === 'umps-left-open-section' ||
        e.key === 'umps-right-open-section' ||
        e.key === 'umps-studio-flow-step' ||
        e.key == null
      ) {
        sync()
      }
    }
    window.addEventListener('umps-flow-step', sync)
    window.addEventListener('umps-open-import', sync)
    window.addEventListener('umps-inspector-section', sync)
    window.addEventListener('storage', onStorage)
    const id = window.setInterval(sync, 800)
    return () => {
      window.removeEventListener('umps-flow-step', sync)
      window.removeEventListener('umps-open-import', sync)
      window.removeEventListener('umps-inspector-section', sync)
      window.removeEventListener('storage', onStorage)
      window.clearInterval(id)
    }
  }, [])

  const leftOpenNorm = leftOpen === 'none' ? null : leftOpen
  const rightOpenNorm = rightOpen === 'none' ? null : rightOpen

  // When the user drills in via a menu row, keep the strip chip in sync for later menu returns.
  useEffect(() => {
    if (leftOpenNorm == null && rightOpenNorm == null) return
    const drilled = inferStudioFlowStep({
      segment,
      leftOpen: leftOpenNorm,
      rightOpen: rightOpenNorm,
      cardEmpty,
      preferredStepId: null,
    })
    if (drilled.id === preferredStepId) return
    try {
      window.localStorage.setItem('umps-studio-flow-step', drilled.id)
    } catch {
      /* private mode */
    }
    setPreferredStepId(drilled.id)
  }, [segment, leftOpenNorm, rightOpenNorm, cardEmpty, preferredStepId])

  const currentStep = inferStudioFlowStep({
    segment,
    leftOpen: leftOpenNorm,
    rightOpen: rightOpenNorm,
    cardEmpty,
    preferredStepId,
  })

  const goStep = useCallback(
    (step: StudioFlowStep) => {
      // Sole-section pills render inline; multi-section pills show the menu list.
      applyStudioFlowStep(step)
      setLeftOpen('none')
      setRightOpen('none')
      setPreferredStepId(step.id)
      onSegmentChange?.(step.segment)
    },
    [onSegmentChange],
  )

  // PKMN has no Colors pill — leave the Colors step if the family switched under us.
  useEffect(() => {
    if (!isPkmn) return
    if (preferredStepId !== 'colors' && currentStep.id !== 'colors') return
    const frameStep = STUDIO_FLOW_STEPS.find((s) => s.id === 'frame')
    if (frameStep) goStep(frameStep)
  }, [isPkmn, preferredStepId, currentStep.id, goStep])

  const detailsShowLeft = FLOW_STEP_LEFT_SECTIONS[currentStep.id]?.length > 0
  const detailsShowRight = FLOW_STEP_RIGHT_SECTIONS[currentStep.id]?.length > 0

  // One flex-wrap flow for all pills (1–9 → Save → Print). No trailer row.
  const stepStrip = (
    <div className="studio-step-strip" role="navigation" aria-label="Studio steps">
      {visibleFlowSteps.map((step) => {
        const active = step.id === currentStep.id
        return (
          <button
            key={step.id}
            type="button"
            className={['studio-step-chip', active ? 'is-active' : ''].filter(Boolean).join(' ')}
            aria-current={active ? 'step' : undefined}
            title={`${step.n}. ${step.label}`}
            onClick={() => goStep(step)}
          >
            <span className="studio-step-chip__n">{step.n}</span>
            <span className="studio-step-chip__label">{step.short}</span>
          </button>
        )
      })}
      <button
        type="button"
        className="studio-step-chip studio-step-chip--save"
        title="Save · JSON · Download PNG"
        onClick={() => onOpenSave?.()}
      >
        <span className="studio-step-chip__label">Save</span>
      </button>
      <button
        type="button"
        className="studio-step-chip studio-step-chip--print"
        title="Print · Proxy sheets"
        onClick={() => onOpenPrint?.()}
      >
        <span className="studio-step-chip__label">Print</span>
      </button>
    </div>
  )

  const phoneStripChrome = phone ? (
    <div className="studio-phone-step-strip px-3 pb-1">
      <div className="studio-phone-step-strip__bar">
        <button
          type="button"
          className="studio-phone-step-strip__toggle"
          aria-expanded={!phoneStripHidden}
          aria-controls="studio-phone-step-strip-body"
          onClick={togglePhoneStrip}
        >
          {phoneStripHidden ? (
            <ChevronUp className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" aria-hidden />
          )}
          <PanelTopClose className="h-3.5 w-3.5 opacity-70" aria-hidden />
          <span>{phoneStripHidden ? 'Show steps' : 'Hide steps'}</span>
        </button>
        {phoneStripHidden ? (
          <div className="studio-phone-step-strip__actions">
            <button
              type="button"
              className="studio-step-chip studio-step-chip--save"
              title="Save · JSON · Download PNG"
              onClick={() => onOpenSave?.()}
            >
              <span className="studio-step-chip__label">Save</span>
            </button>
            <button
              type="button"
              className="studio-step-chip studio-step-chip--print"
              title="Print · Proxy sheets"
              onClick={() => onOpenPrint?.()}
            >
              <span className="studio-step-chip__label">Print</span>
            </button>
          </div>
        ) : null}
      </div>
      {!phoneStripHidden ? (
        <div id="studio-phone-step-strip-body">{stepStrip}</div>
      ) : null}
    </div>
  ) : null

  return (
    <aside
      className={[
        'studio-inspector',
        phone ? 'studio-phone-sheet' : 'studio-inspector--desktop',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label="Inspector"
    >
      {phone ? <div className="studio-phone-sheet__handle" aria-hidden /> : null}
      {!phone ? (
        <div className="border-b border-[var(--separator)] px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[0.8125rem] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
                {segment === 'content' ? 'Content' : segment === 'look' ? 'Look' : 'Details'}
              </div>
              <div className="truncate text-[0.6875rem] text-[var(--text-tertiary)]">
                {segment === 'content'
                  ? 'Start → name & mana → type → art → rules'
                  : segment === 'look'
                    ? 'Frame family, options & panels, then colors'
                    : 'Collector info, then settings & guides'}
              </div>
            </div>
          </div>
          {stepStrip}
          <p className="studio-step-hint" role="status">
            {currentStep.nextHint}
          </p>
        </div>
      ) : (
        phoneStripChrome
      )}
      <div className="studio-inspector__body" key={`${segment}-${currentStep.id}`}>
        <div className="studio-inspector__pane">
          {segment === 'content' ? (
            <SidebarLeft inspectorSegment="content" flowStepId={currentStep.id} />
          ) : null}
          {segment === 'look' ? (
            <SidebarRight inspectorSegment="look" flowStepId={currentStep.id} />
          ) : null}
          {segment === 'details' ? (
            <div className="studio-details-stack">
              {detailsShowLeft ? (
                <SidebarLeft inspectorSegment="details" flowStepId={currentStep.id} />
              ) : null}
              {detailsShowRight ? (
                <SidebarRight inspectorSegment="details" flowStepId={currentStep.id} />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  )
}

export default memo(StudioInspector)
