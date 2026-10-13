import type { InspectorSegment } from '../hooks/useInspectorSegment'

export type StudioFlowStepId =
  | 'start'
  | 'frame'
  | 'name-mana'
  | 'colors'
  | 'type'
  | 'art'
  | 'text'
  | 'details'
  | 'save'

export type StudioFlowStep = {
  id: StudioFlowStepId
  n: number
  label: string
  short: string
  segment: InspectorSegment | 'download'
  /** Persisted left/right open section when navigating via the strip. */
  leftOpen?: string
  rightOpen?: string
  nextHint: string
}

/** Guided path; free nav between Content / Look / Details remains available. */
export const STUDIO_FLOW_STEPS: StudioFlowStep[] = [
  {
    id: 'start',
    n: 1,
    label: 'Import / Blank',
    short: 'Start',
    segment: 'content',
    leftOpen: 'import-sync',
    nextHint: 'Next: Look → Frame',
  },
  {
    id: 'frame',
    n: 2,
    label: 'Frame',
    short: 'Frame',
    segment: 'look',
    rightOpen: 'layout',
    nextHint: 'Next: Content → Name & Mana',
  },
  {
    id: 'name-mana',
    n: 3,
    label: 'Name & Mana',
    short: 'Name',
    segment: 'content',
    leftOpen: 'core',
    nextHint: 'Next: Look → Colors',
  },
  {
    id: 'colors',
    n: 4,
    label: 'Colors',
    short: 'Colors',
    segment: 'look',
    rightOpen: 'identity',
    nextHint: 'Next: Content → Type',
  },
  {
    id: 'type',
    n: 5,
    label: 'Type & Set',
    short: 'Type',
    segment: 'content',
    leftOpen: 'type',
    nextHint: 'Next: Content → Artwork',
  },
  {
    id: 'art',
    n: 6,
    label: 'Artwork',
    short: 'Art',
    segment: 'content',
    leftOpen: 'art',
    nextHint: 'Next: Content → Rules & Flavor',
  },
  {
    id: 'text',
    n: 7,
    label: 'Rules & Flavor',
    short: 'Rules Text',
    segment: 'content',
    leftOpen: 'text',
    nextHint: 'Next: Details → Collector',
  },
  {
    id: 'details',
    n: 8,
    label: 'Details',
    short: 'Details',
    segment: 'details',
    leftOpen: 'collector',
    nextHint: 'Next: Download / Save JSON',
  },
  {
    id: 'save',
    n: 9,
    label: 'Save',
    short: 'Save',
    segment: 'download',
    nextHint: 'Download · ⋯ More → Save/Load JSON · Print',
  },
]

export function inferStudioFlowStep(args: {
  segment: InspectorSegment
  leftOpen: string | null
  rightOpen: string | null
  cardEmpty: boolean
}): StudioFlowStep {
  const { segment, leftOpen, rightOpen, cardEmpty } = args
  if (segment === 'look') {
    if (rightOpen === 'identity' || rightOpen === 'panels') return STUDIO_FLOW_STEPS[3]
    return STUDIO_FLOW_STEPS[1]
  }
  if (
    cardEmpty &&
    segment === 'content' &&
    (leftOpen == null || leftOpen === 'none' || leftOpen === 'import-sync')
  ) {
    return STUDIO_FLOW_STEPS[0]
  }
  if (segment === 'details') return STUDIO_FLOW_STEPS[7]
  if (segment === 'content') {
    switch (leftOpen) {
      case 'core':
        return STUDIO_FLOW_STEPS[2]
      case 'type':
        return STUDIO_FLOW_STEPS[4]
      case 'art':
        return STUDIO_FLOW_STEPS[5]
      case 'text':
      case 'rules':
      case 'flavor':
        return STUDIO_FLOW_STEPS[6]
      case 'import-sync':
        return STUDIO_FLOW_STEPS[0]
      default:
        return STUDIO_FLOW_STEPS[2]
    }
  }
  return STUDIO_FLOW_STEPS[0]
}

export function applyStudioFlowStep(step: StudioFlowStep) {
  try {
    if (step.leftOpen) window.localStorage.setItem('umps-left-open-section', step.leftOpen)
    if (step.rightOpen) window.localStorage.setItem('umps-right-open-section', step.rightOpen)
    if (step.segment === 'look') {
      window.localStorage.setItem('umps-left-open-section', 'none')
    }
    if (step.segment === 'content' && step.leftOpen) {
      window.localStorage.setItem('umps-right-open-section', 'none')
    }
    if (step.segment === 'details') {
      window.localStorage.setItem('umps-right-open-section', 'none')
    }
  } catch {
    /* private mode */
  }
  window.dispatchEvent(new CustomEvent('umps-flow-step', { detail: step }))
}
