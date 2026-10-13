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
  /**
   * Associated left/right section for this step (used when the user drills in via a
   * menu row, and for inference). Step-strip clicks do **not** auto-open these.
   */
  leftOpen?: string
  rightOpen?: string
  nextHint: string
}

const FLOW_STEP_STORAGE_KEY = 'umps-studio-flow-step'

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

function isStudioFlowStepId(v: string): v is StudioFlowStepId {
  return STUDIO_FLOW_STEPS.some((s) => s.id === v)
}

export function readStoredStudioFlowStepId(): StudioFlowStepId | null {
  try {
    const raw = window.localStorage.getItem(FLOW_STEP_STORAGE_KEY)
    if (raw != null && isStudioFlowStepId(raw)) return raw
  } catch {
    /* private mode */
  }
  return null
}

function isMenuLevel(leftOpen: string | null, rightOpen: string | null): boolean {
  const leftClosed = leftOpen == null || leftOpen === 'none'
  const rightClosed = rightOpen == null || rightOpen === 'none'
  return leftClosed && rightClosed
}

export function inferStudioFlowStep(args: {
  segment: InspectorSegment
  leftOpen: string | null
  rightOpen: string | null
  cardEmpty: boolean
  /** When the strip selected a step and the sidebar is still at menu level. */
  preferredStepId?: StudioFlowStepId | null
}): StudioFlowStep {
  const { segment, leftOpen, rightOpen, cardEmpty, preferredStepId } = args

  // Drill-in wins: highlight follows the open menu row.
  if (!isMenuLevel(leftOpen, rightOpen)) {
    if (segment === 'look') {
      if (rightOpen === 'identity' || rightOpen === 'panels') return STUDIO_FLOW_STEPS[3]
      return STUDIO_FLOW_STEPS[1]
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
  }

  // Menu level: keep the strip chip the user last chose (same segment).
  if (preferredStepId) {
    const preferred = STUDIO_FLOW_STEPS.find((s) => s.id === preferredStepId)
    if (preferred && preferred.segment === segment) return preferred
  }

  if (segment === 'look') {
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
    return STUDIO_FLOW_STEPS[2]
  }
  return STUDIO_FLOW_STEPS[0]
}

/**
 * Collapse inspector sidebars to the section list (no drill-in panel).
 * Used by step-strip clicks and Content/Look/Details segment switches.
 */
export function clearStudioInspectorDrill() {
  try {
    window.localStorage.setItem('umps-left-open-section', 'none')
    window.localStorage.setItem('umps-right-open-section', 'none')
  } catch {
    /* private mode */
  }
  window.dispatchEvent(
    new CustomEvent('umps-flow-step', {
      detail: { menuLevel: true as const },
    }),
  )
}

/**
 * Step-strip navigation: switch segment context and clear drill-in so the
 * sidebar shows the collapsed menu list. Does not open a submenu — never
 * applies step.leftOpen / step.rightOpen.
 */
export function applyStudioFlowStep(step: StudioFlowStep) {
  try {
    window.localStorage.setItem(FLOW_STEP_STORAGE_KEY, step.id)
  } catch {
    /* private mode */
  }
  clearStudioInspectorDrill()
}
