import { memo, useCallback, useMemo } from 'react'
import { shallow } from 'zustand/shallow'
import { Download, Redo2, Undo2 } from 'lucide-react'
import {
  deriveContextTriStatus,
  WORKFLOW_STATE_LABEL,
} from '../../authority/statusIndicatorAuthority'
import { useCardStore } from '../../store/useCardStore'
import type { InspectorSegment } from '../../hooks/useInspectorSegment'
import StatusTriIndicator from '../ui/StatusTriIndicator'
import PrimaryActionButton from '../ui/PrimaryActionButton'
import StudioMoreMenu from './StudioMoreMenu'

type Props = {
  segment: InspectorSegment
  onSegmentChange: (next: InspectorSegment) => void
  onOpenDownload: () => void
}

const SEGMENTS: { id: InspectorSegment; label: string }[] = [
  { id: 'content', label: 'Content' },
  { id: 'look', label: 'Look' },
  { id: 'details', label: 'Details' },
]

function StudioTopBar({ segment, onSegmentChange, onOpenDownload }: Props) {
  const {
    workflowState,
    asyncScryfall,
    asyncArt,
    asyncSetIcon,
    asyncDesignLoad,
    designDirty,
    undo,
    redo,
    canUndo,
    canRedo,
    name,
  } = useCardStore(
    (s) => ({
      workflowState: s.workflowState,
      asyncScryfall: s.asyncStatus.scryfallFetch,
      asyncArt: s.asyncStatus.artUpload,
      asyncSetIcon: s.asyncStatus.setIconUpload,
      asyncDesignLoad: s.asyncStatus.designLoad,
      designDirty: s.designDirty,
      undo: s.undo,
      redo: s.redo,
      canUndo: (s.past?.length ?? 0) > 0,
      canRedo: (s.future?.length ?? 0) > 0,
      name: s.cardData.name,
    }),
    shallow,
  )

  const readiness = useMemo(
    () =>
      deriveContextTriStatus(workflowState, {
        scryfallFetch: asyncScryfall,
        artUpload: asyncArt,
        setIconUpload: asyncSetIcon,
        designLoad: asyncDesignLoad,
      }),
    [workflowState, asyncScryfall, asyncArt, asyncSetIcon, asyncDesignLoad],
  )

  const displayName = String(name ?? '').trim() || 'Untitled'
  const onUndo = useCallback(() => undo(), [undo])
  const onRedo = useCallback(() => redo(), [redo])

  return (
    <header className="studio-topbar" role="banner">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="studio-brand shrink-0" title="UltraMagnus Proxy Showcase">
          UMPS
        </div>
        <div className="hidden min-w-0 flex-col sm:flex">
          <div className="truncate text-[0.8125rem] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
            {displayName}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusTriIndicator
              status={readiness}
              title={`Workflow: ${WORKFLOW_STATE_LABEL[workflowState]}`}
            />
            <span
              className={`studio-status-chip ${designDirty ? 'studio-status-chip--unsaved' : 'studio-status-chip--saved'}`}
              title={designDirty ? 'Changes since last save or load' : 'No unsaved design changes'}
            >
              {designDirty ? 'Unsaved' : 'Saved'}
            </span>
          </div>
        </div>
      </div>

      <div className="studio-segmented order-3 w-full sm:order-none sm:w-auto" role="tablist" aria-label="Inspector">
        {SEGMENTS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={segment === id}
            className="studio-segmented__btn"
            onClick={() => onSegmentChange(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          className="ui-focus-ring flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-white/70 text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-40"
          aria-label="Undo"
          title="Undo (Ctrl+Z)"
          disabled={!canUndo}
          onClick={onUndo}
        >
          <Undo2 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className="ui-focus-ring flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-white/70 text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-40"
          aria-label="Redo"
          title="Redo (Ctrl+Y)"
          disabled={!canRedo}
          onClick={onRedo}
        >
          <Redo2 className="h-3.5 w-3.5" />
        </button>
        <StudioMoreMenu onOpenDownload={onOpenDownload} />
        <PrimaryActionButton
          onClick={onOpenDownload}
          ariaLabel="Download card"
          className="!h-9 !min-h-9 !rounded-[var(--radius-control)] !px-3 !text-[0.8125rem]"
        >
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Download</span>
        </PrimaryActionButton>
      </div>
    </header>
  )
}

export default memo(StudioTopBar)
