import { memo, useCallback, useDeferredValue, useMemo } from 'react'
import { shallow } from 'zustand/shallow'
import { Maximize2, Redo2, Undo2 } from 'lucide-react'
import {
  deriveContextTriStatus,
  WORKFLOW_STATE_LABEL,
} from '../../authority/statusIndicatorAuthority'
import { UI_CHROME_CONTEXT_HEADER } from '../../authority/panelSurfaceAuthority'
import { UI_TEXT_METADATA, UI_TEXT_SECTION_HEADER } from '../../authority/typographyAuthority'
import { useCardStore } from '../../store/useCardStore'
import StatusTriIndicator from '../ui/StatusTriIndicator'

/** Phase 17.3 — narrow subscription: workflow + async only; skips name/type/layout churn. */
const ContextHeaderWorkflowPill = memo(function ContextHeaderWorkflowPill() {
  const { workflowState, asyncScryfall, asyncArt, asyncSetIcon, asyncDesignLoad } = useCardStore(
    (s) => ({
      workflowState: s.workflowState,
      asyncScryfall: s.asyncStatus.scryfallFetch,
      asyncArt: s.asyncStatus.artUpload,
      asyncSetIcon: s.asyncStatus.setIconUpload,
      asyncDesignLoad: s.asyncStatus.designLoad,
    }),
    shallow,
  )

  const contextTriStatus = useMemo(
    () =>
      deriveContextTriStatus(workflowState, {
        scryfallFetch: asyncScryfall,
        artUpload: asyncArt,
        setIconUpload: asyncSetIcon,
        designLoad: asyncDesignLoad,
      }),
    [workflowState, asyncScryfall, asyncArt, asyncSetIcon, asyncDesignLoad],
  )

  return (
    <div className="ui-context-workflow-pill max-w-full shrink-0 sm:max-w-[11rem]" aria-live="polite">
      <StatusTriIndicator
        status={contextTriStatus}
        title={`Workflow: ${WORKFLOW_STATE_LABEL[workflowState]}`}
      />
    </div>
  )
})

const ContextHeaderSavePill = memo(function ContextHeaderSavePill() {
  const designDirty = useCardStore((s) => s.designDirty)
  return (
    <span
      className={[
        'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        designDirty
          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200'
          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200',
      ].join(' ')}
      title={designDirty ? 'Changes since last save or load' : 'No unsaved design changes'}
      aria-live="polite"
    >
      {designDirty ? 'Unsaved' : 'Saved'}
    </span>
  )
})

/** Phase 17.2 deferred echo + 17.3 isolated subscription. */
const ContextHeaderTitleEcho = memo(function ContextHeaderTitleEcho() {
  const { name, typeLine, currentLayout } = useCardStore(
    (s) => ({
      name: s.cardData.name,
      typeLine: s.cardData.typeLine,
      currentLayout: s.currentLayout,
    }),
    shallow,
  )

  const deferredName = useDeferredValue(name)
  const deferredTypeLine = useDeferredValue(typeLine)
  const deferredLayout = useDeferredValue(currentLayout)

  const displayName = String(deferredName ?? '').trim() || 'Untitled card'
  const secondary =
    String(deferredTypeLine ?? '').trim().length > 0
      ? String(deferredTypeLine).trim()
      : `Layout · ${deferredLayout}`

  return (
    <div className="min-w-0 flex-1 flex flex-col gap-ui1 justify-center">
      <div className={`${UI_TEXT_SECTION_HEADER} truncate`} title={displayName}>
        {displayName}
      </div>
      <div className={`${UI_TEXT_METADATA} truncate`} title={secondary}>
        {secondary}
      </div>
    </div>
  )
})

/** Phase 17.3 — quick view launcher + undo/redo. */
const ContextHeaderActions = memo(function ContextHeaderActions() {
  const openQuickView = useCardStore((s) => s.openQuickView)
  const undo = useCardStore((s) => s.undo)
  const redo = useCardStore((s) => s.redo)
  const canUndo = useCardStore((s) => (s.past?.length ?? 0) > 0)
  const canRedo = useCardStore((s) => (s.future?.length ?? 0) > 0)

  const onOpenQuickView = useCallback(() => openQuickView(), [openQuickView])

  return (
    <div className="flex shrink-0 items-center gap-ui1 sm:gap-ui2">
      <button
        type="button"
        className="ui-focus-ring flex h-8 w-8 items-center justify-center rounded-[var(--ui-radius-md)] border border-[color-mix(in_srgb,var(--ui-color-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--ui-color-surface-elevated)_70%,transparent)] text-[var(--ui-color-muted)] transition-colors hover:text-[var(--ui-color-text)] disabled:opacity-40"
        aria-label="Undo last change"
        title="Undo"
        disabled={!canUndo}
        onClick={undo}
      >
        <Undo2 className="h-3.5 w-3.5" aria-hidden />
      </button>
      <button
        type="button"
        className="ui-focus-ring flex h-8 w-8 items-center justify-center rounded-[var(--ui-radius-md)] border border-[color-mix(in_srgb,var(--ui-color-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--ui-color-surface-elevated)_70%,transparent)] text-[var(--ui-color-muted)] transition-colors hover:text-[var(--ui-color-text)] disabled:opacity-40"
        aria-label="Redo last change"
        title="Redo"
        disabled={!canRedo}
        onClick={redo}
      >
        <Redo2 className="h-3.5 w-3.5" aria-hidden />
      </button>
      <button
        type="button"
        className="ui-focus-ring phone-view-btn flex shrink-0 items-center gap-ui1 rounded-[var(--ui-radius-md)] border border-[color-mix(in_srgb,var(--ui-color-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--ui-color-surface-elevated)_70%,transparent)] px-ui2 py-ui1 text-[var(--ui-color-muted)] transition-[border-color,background-color,box-shadow] duration-ui-standard ease-ui-out hover:border-[color-mix(in_srgb,var(--ui-color-primary)_22%,var(--ui-color-border))] hover:text-[var(--ui-color-text)]"
        aria-label="Open card quick view"
        title="Quick view"
        onClick={onOpenQuickView}
      >
        <Maximize2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className={UI_TEXT_METADATA}>View</span>
      </button>
    </div>
  )
})

export default function ContextHeader() {
  return (
    <header className={`${UI_CHROME_CONTEXT_HEADER} flex-wrap gap-y-ui2`} role="banner">
      <ContextHeaderWorkflowPill />
      <ContextHeaderSavePill />
      <ContextHeaderTitleEcho />
      <ContextHeaderActions />
    </header>
  )
}
