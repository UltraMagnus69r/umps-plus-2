/**
 * Phase 17.1 — eager modal shell (`BaseModal`); heavy interior loads on first open via `React.lazy`.
 */
import { lazy, memo, Suspense } from 'react'
import { UI_PANEL_OVERLAY } from '../../authority/panelSurfaceAuthority'
import { UI_ASYNC_SPINNER_SM } from '../../authority/stateFeedbackAuthority'
import { UI_TEXT_METADATA } from '../../authority/typographyAuthority'
import { useCardStore } from '../../store/useCardStore'
import BaseModal from './BaseModal'

const QuickViewModalBody = lazy(() => import('./QuickViewModalBody'))

function QuickViewModalFallback() {
  return (
    <div
      className={`${UI_PANEL_OVERLAY} ui-quick-view-panel relative flex w-[min(94vw,580px)] max-w-[94vw] min-h-[min(40vh,280px)] flex-col items-center justify-center gap-ui2 overflow-hidden`}
      style={{ maxHeight: 'min(88vh, 920px)' }}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading quick view"
    >
      <span className={UI_ASYNC_SPINNER_SM} aria-hidden />
      <span className={UI_TEXT_METADATA}>Loading preview…</span>
    </div>
  )
}

function QuickViewModal() {
  const open = useCardStore((s) => s.quickViewOpen)
  const closeQuickView = useCardStore((s) => s.closeQuickView)

  return (
    <BaseModal
      open={open}
      onClose={closeQuickView}
      zIndexVar="--ui-z-modal-quick-view"
      lockBodyScroll
      backdropLayout="centered"
    >
      {open ? (
        <Suspense fallback={<QuickViewModalFallback />}>
          <QuickViewModalBody />
        </Suspense>
      ) : null}
    </BaseModal>
  )
}

export default memo(QuickViewModal)
