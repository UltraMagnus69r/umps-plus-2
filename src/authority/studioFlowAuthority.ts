import type { InspectorSegment } from '../hooks/useInspectorSegment'

export type StudioFlowStepId =
  | 'start'
  | 'frame'
  | 'name-mana'
  | 'colors'
  | 'type'
  | 'art'
  | 'text'
  | 'collector'
  | 'settings'

export type StudioFlowStep = {
  id: StudioFlowStepId
  n: number
  label: string
  short: string
  segment: InspectorSegment
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
    nextHint: 'Next: Collector',
  },
  {
    id: 'collector',
    n: 8,
    label: 'Collector',
    short: 'Collector',
    segment: 'details',
    leftOpen: 'collector',
    nextHint: 'Next: Settings',
  },
  {
    id: 'settings',
    n: 9,
    label: 'Settings',
    short: 'Settings',
    segment: 'details',
    rightOpen: 'settings',
    nextHint: 'Save · Print',
  },
]

/**
 * Exclusive section ownership per step pill — no section appears under more than one pill.
 * Left keys: SidebarLeft. Right keys: SidebarRight.
 */
export const FLOW_STEP_LEFT_SECTIONS: Record<StudioFlowStepId, readonly string[]> = {
  start: ['import-sync'],
  frame: [],
  'name-mana': ['core'],
  colors: [],
  type: ['type'],
  art: ['art'],
  text: ['text'],
  collector: ['collector'],
  settings: [],
}

export const FLOW_STEP_RIGHT_SECTIONS: Record<StudioFlowStepId, readonly string[]> = {
  start: [],
  /** Frame owns family/variant + Frame Options + Panels (Look segment). */
  frame: ['layout', 'frame-options', 'panels'],
  'name-mana': [],
  colors: ['identity'],
  type: [],
  art: [],
  text: [],
  collector: [],
  /** Guides / restore / labels — Settings pill only. */
  settings: ['settings'],
}

/** Combined left+right submenu count for a step pill. */
export function getFlowStepSubmenuCount(stepId: StudioFlowStepId): number {
  return FLOW_STEP_LEFT_SECTIONS[stepId].length + FLOW_STEP_RIGHT_SECTIONS[stepId].length
}

/**
 * When a pill owns exactly one submenu, return it so the inspector can render that
 * section inline (no accordion / drill chrome). Multiple submenus → null (menu list).
 */
export function getSoleFlowStepSection(
  stepId: StudioFlowStepId,
): { side: 'left' | 'right'; key: string } | null {
  const left = FLOW_STEP_LEFT_SECTIONS[stepId]
  const right = FLOW_STEP_RIGHT_SECTIONS[stepId]
  if (left.length + right.length !== 1) return null
  if (left.length === 1) return { side: 'left', key: left[0]! }
  return { side: 'right', key: right[0]! }
}

/** True when this section is the only submenu on the active pill (render inline). */
export function isSoleInlineSection(
  stepId: StudioFlowStepId | null | undefined,
  side: 'left' | 'right',
  sectionKey: string,
): boolean {
  if (stepId == null) return false
  const sole = getSoleFlowStepSection(stepId)
  return sole != null && sole.side === side && sole.key === sectionKey
}

/** Whether a sidebar section row belongs to the active flow step. */
export function isFlowSectionVisible(
  stepId: StudioFlowStepId | null | undefined,
  side: 'left' | 'right',
  sectionKey: string,
): boolean {
  if (stepId == null) return true
  const owned = side === 'left' ? FLOW_STEP_LEFT_SECTIONS[stepId] : FLOW_STEP_RIGHT_SECTIONS[stepId]
  return owned.includes(sectionKey)
}

function isStudioFlowStepId(v: string): v is StudioFlowStepId {
  return STUDIO_FLOW_STEPS.some((s) => s.id === v)
}

export function readStoredStudioFlowStepId(): StudioFlowStepId | null {
  try {
    const raw = window.localStorage.getItem(FLOW_STEP_STORAGE_KEY)
    // Legacy chips → current pills.
    if (raw === 'save' || raw === 'details') return 'collector'
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
      if (rightOpen === 'identity') return STUDIO_FLOW_STEPS[3]
      return STUDIO_FLOW_STEPS[1]
    }
    if (segment === 'details') {
      if (rightOpen === 'settings') return STUDIO_FLOW_STEPS[8]
      return STUDIO_FLOW_STEPS[7]
    }
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
  if (segment === 'details') {
    return preferredStepId === 'settings' ? STUDIO_FLOW_STEPS[8] : STUDIO_FLOW_STEPS[7]
  }
  if (segment === 'content') {
    return STUDIO_FLOW_STEPS[2]
  }
  return STUDIO_FLOW_STEPS[0]
}

const INSPECTOR_SEGMENT_KEY = 'umps-inspector-segment'

function writeStudioFlowStartKeys() {
  try {
    window.localStorage.setItem(FLOW_STEP_STORAGE_KEY, 'start')
    window.localStorage.setItem('umps-left-open-section', 'none')
    window.localStorage.setItem('umps-right-open-section', 'none')
    window.localStorage.setItem(INSPECTOR_SEGMENT_KEY, 'content')
  } catch {
    /* private mode */
  }
}

/**
 * Full-page load: force inspector UI to pill 1 Start with collapsed menus.
 * Call before React mounts so persisted segment/drill keys do not rehydrate mid-flow.
 * Card data restore (session) is unaffected.
 */
export function seedStudioFlowStartOnBoot() {
  writeStudioFlowStartKeys()
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
 * New Card / explicit flow reset: Content segment, pill 1 Start, no drill-in.
 * Dispatches `umps-flow-step` so sidebars/strip sync; listeners should set segment to content.
 */
export function resetStudioFlowToStart() {
  writeStudioFlowStartKeys()
  window.dispatchEvent(
    new CustomEvent('umps-flow-step', {
      detail: { menuLevel: true as const, stepId: 'start' as const },
    }),
  )
}

/**
 * Step-strip navigation: switch segment context and show the pill’s inspector surface.
 * Sole-section pills render content inline (no accordion chrome) — drill stays cleared.
 * Multi-section pills (e.g. Frame) show the collapsed menu list.
 */
export function applyStudioFlowStep(step: StudioFlowStep) {
  try {
    window.localStorage.setItem(FLOW_STEP_STORAGE_KEY, step.id)
  } catch {
    /* private mode */
  }
  clearStudioInspectorDrill()
}
