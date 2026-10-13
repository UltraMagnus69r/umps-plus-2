import { memo, useCallback, useEffect, useState } from 'react'
import type { InspectorSegment } from '../../hooks/useInspectorSegment'
import {
  applyStudioFlowStep,
  inferStudioFlowStep,
  readStoredStudioFlowStepId,
  STUDIO_FLOW_STEPS,
  type StudioFlowStep,
  type StudioFlowStepId,
} from '../../authority/studioFlowAuthority'
import {
  isCardEffectivelyEmptyForGuidance,
} from '../../authority/guidanceAuthority'
import { useCardStore } from '../../store/useCardStore'
import SidebarLeft from './SidebarLeft'
import SidebarRight from './SidebarRight'

type Props = {
  segment: InspectorSegment
  className?: string
  /** Phone bottom sheet: omit desktop chrome width classes */
  phone?: boolean
  onOpenDownload?: () => void
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
  onOpenDownload,
  onSegmentChange,
}: Props) {
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
    window.addEventListener('umps-open-look-frame', sync)
    window.addEventListener('umps-inspector-section', sync)
    window.addEventListener('storage', onStorage)
    const id = window.setInterval(sync, 800)
    return () => {
      window.removeEventListener('umps-flow-step', sync)
      window.removeEventListener('umps-open-import', sync)
      window.removeEventListener('umps-open-look-frame', sync)
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
      // Strip selects segment + highlights the chip; stay at collapsed menu (no auto drill-in).
      applyStudioFlowStep(step)
      setLeftOpen('none')
      setRightOpen('none')
      setPreferredStepId(step.id)
      if (step.segment === 'download') {
        onOpenDownload?.()
        return
      }
      onSegmentChange?.(step.segment)
    },
    [onOpenDownload, onSegmentChange],
  )

  const leftDrilled =
    segment === 'details' &&
    leftOpen != null &&
    leftOpen !== 'none' &&
    leftOpen === 'collector'
  const rightDrilled =
    segment === 'details' &&
    rightOpen != null &&
    rightOpen !== 'none' &&
    rightOpen === 'settings'

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
                  ? 'Name & mana → type → art → rules & flavor'
                  : segment === 'look'
                    ? 'Frame first, then colors, panels & materials'
                    : 'Collector info and guides'}
              </div>
            </div>
          </div>
          <div className="studio-step-strip" role="navigation" aria-label="Studio steps">
            {STUDIO_FLOW_STEPS.map((step) => {
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
          </div>
          <p className="studio-step-hint" role="status">
            {currentStep.nextHint}
          </p>
        </div>
      ) : null}
      <div className="studio-inspector__body" key={segment}>
        <div className="studio-inspector__pane">
          {segment === 'content' ? <SidebarLeft inspectorSegment="content" /> : null}
          {segment === 'look' ? <SidebarRight inspectorSegment="look" /> : null}
          {segment === 'details' ? (
            <div
              className={[
                'studio-details-stack',
                leftDrilled || rightDrilled ? 'is-drilled' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {!rightDrilled ? <SidebarLeft inspectorSegment="details" /> : null}
              {!leftDrilled ? <SidebarRight inspectorSegment="details" /> : null}
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  )
}

export default memo(StudioInspector)
