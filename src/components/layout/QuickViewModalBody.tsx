/**
 * Phase 17.1 — lazy-loaded quick view interior (Konva second stage + actions).
 * Imported only via `React.lazy` from `QuickViewModal.tsx` when open.
 */
import { useCallback, useId } from 'react'
import { Check, Image as ImageIcon, Pencil, X } from 'lucide-react'
import { CONSTRAINT_COPY } from '../../authority/constraintFeedbackAuthority'
import { DIMENSIONS } from '../../authority/geometryAuthority'
import { UI_PANEL_OVERLAY } from '../../authority/panelSurfaceAuthority'
import {
  UI_ACTION_SUCCESS_SURFACE,
  UI_ASYNC_SPINNER_SM,
} from '../../authority/stateFeedbackAuthority'
import { UI_TEXT_LABEL_COMPACT } from '../../authority/typographyAuthority'
import { WORKING_PREVIEW_FOCUS_ID } from '../../data/layoutConstants'
import { useCardStore } from '../../store/useCardStore'
import ExportOptionsControls from '../ui/ExportOptionsControls'
import KonvaStage from '../renderer/KonvaStage'

const QUICK_VIEW_ACTION_BTN_CLASS =
  'ui-focus-ring flex min-h-[var(--ui-control-height-sm)] flex-1 items-center justify-center gap-ui1 rounded-[var(--ui-radius-md)] border border-[color-mix(in_srgb,var(--ui-color-border)_92%,transparent)] bg-[color-mix(in_srgb,var(--ui-color-surface-elevated)_72%,transparent)] px-ui2 py-ui1 text-[var(--ui-color-muted)] transition-[border-color,background-color,color,box-shadow] duration-ui-standard ease-ui-out hover:border-[color-mix(in_srgb,var(--ui-color-primary)_22%,var(--ui-color-border))] hover:text-[var(--ui-color-text)] disabled:cursor-not-allowed disabled:opacity-40 sm:min-w-[5.5rem] sm:flex-initial'

export default function QuickViewModalBody() {
  const closeQuickView = useCardStore((s) => s.closeQuickView)
  const exportCardImage = useCardStore((s) => s.exportCardImage)
  const exportPngIncludeBleed = useCardStore((s) => s.exportPngIncludeBleed)
  const workflowState = useCardStore((s) => s.workflowState)
  const asyncExport = useCardStore((s) => s.asyncStatus.export)
  const quickViewExportOptionsBleedId = useId()

  const handleEdit = useCallback(() => {
    closeQuickView()
    requestAnimationFrame(() => {
      document.getElementById(WORKING_PREVIEW_FOCUS_ID)?.focus({ preventScroll: true })
    })
  }, [closeQuickView])

  const handleExport = useCallback(() => {
    void exportCardImage()
  }, [exportCardImage])

  const exportDisabled =
    workflowState !== 'EXPORT_READY' || asyncExport.status === 'loading'

  const previewAspectW = exportPngIncludeBleed ? DIMENSIONS.FULL_BLEED.width : DIMENSIONS.TRIM.width
  const previewAspectH = exportPngIncludeBleed ? DIMENSIONS.FULL_BLEED.height : DIMENSIONS.TRIM.height

  return (
    <div
      className={`${UI_PANEL_OVERLAY} ui-quick-view-panel relative flex w-[min(94vw,580px)] max-w-[94vw] flex-col overflow-hidden`}
      style={{ maxHeight: 'min(88vh, 920px)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Card quick view"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="ui-focus-ring absolute right-ui2 top-ui2 z-10 flex h-8 w-8 items-center justify-center rounded-[var(--ui-radius-md)] border border-[var(--ui-color-border)] bg-[color-mix(in_srgb,var(--ui-color-surface-muted)_90%,transparent)] text-[var(--ui-color-text-strong)] shadow-[var(--ui-elevation-1)] transition-[border-color,background-color,box-shadow,color] duration-ui-standard ease-ui-out"
        onClick={closeQuickView}
        aria-label="Close quick view"
      >
        <X className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
      </button>

      <div className="flex min-h-0 flex-1 flex-col px-ui3 pb-ui2 pt-ui10">
        <div
          className="mx-auto w-full min-h-0 flex-1"
          style={{ aspectRatio: `${previewAspectW} / ${previewAspectH}` }}
        >
          <KonvaStage registerExporter={false} previewSurfaceChrome={false} />
        </div>

        <div
          className="mt-ui3 flex w-full shrink-0 flex-wrap items-stretch justify-center gap-ui2 border-t border-[color-mix(in_srgb,var(--ui-color-border)_85%,transparent)] pt-ui3"
          role="toolbar"
          aria-label="Quick view actions"
        >
          <div className="flex w-full basis-full flex-wrap items-center justify-center gap-x-ui3 gap-y-ui2 pb-ui1">
            <ExportOptionsControls
              disabled={asyncExport.status === 'loading'}
              bleedCheckboxId={quickViewExportOptionsBleedId}
            />
          </div>
          <button
            type="button"
            className={`${QUICK_VIEW_ACTION_BTN_CLASS} ${UI_TEXT_LABEL_COMPACT}`}
            onClick={handleEdit}
          >
            <Pencil className="h-3.5 w-3.5 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
            Edit
          </button>
          <button
            type="button"
            className={`${QUICK_VIEW_ACTION_BTN_CLASS} ${UI_TEXT_LABEL_COMPACT} ${asyncExport.status === 'success' ? UI_ACTION_SUCCESS_SURFACE : ''}`}
            onClick={handleExport}
            disabled={exportDisabled}
            aria-label="Export card as PNG"
            title={
              exportDisabled && asyncExport.status !== 'loading'
                ? CONSTRAINT_COPY.quickViewExportDisabled
                : undefined
            }
          >
            {asyncExport.status === 'loading' ? (
              <span className={UI_ASYNC_SPINNER_SM} aria-hidden />
            ) : asyncExport.status === 'success' ? (
              <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" strokeWidth={2} aria-hidden />
            ) : (
              <ImageIcon className="h-3.5 w-3.5 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
            )}
            Export
          </button>
        </div>
      </div>
    </div>
  )
}
