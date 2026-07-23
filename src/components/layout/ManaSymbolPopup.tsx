/**
 * Phase 17.1 — eager `BaseModal` shell; picker panel + mana SVG grid load on open via `React.lazy`.
 */
import { lazy, memo, Suspense } from 'react'
import {
  UI_PANEL_OVERLAY,
} from '../../authority/panelSurfaceAuthority'
import { UI_TEXT_METADATA } from '../../authority/typographyAuthority'
import { MANA_POPUP_PANEL_WIDTH } from '../../data/layoutConstants'
import { useCardStore } from '../../store/useCardStore'
import BaseModal from './BaseModal'

const ManaSymbolPopupPanel = lazy(() => import('./ManaSymbolPopupPanel'))

function ManaSymbolPopupFallback({
  top,
  left,
}: {
  top: number
  left: number
}) {
  return (
    <div
      className={`${UI_PANEL_OVERLAY} flex min-h-[240px] select-none items-center justify-center`}
      style={{
        position: 'fixed',
        top,
        left,
        width: MANA_POPUP_PANEL_WIDTH,
      }}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading mana symbol picker"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <span className={UI_TEXT_METADATA}>Loading…</span>
    </div>
  )
}

function ManaSymbolPopup() {
  const manaPopupOpen = useCardStore((s) => s.manaPopupOpen)
  const closeManaPopup = useCardStore((s) => s.closeManaPopup)
  const manaPopupPosition = useCardStore((s) => s.manaPopupPosition)

  return (
    <BaseModal
      open={manaPopupOpen}
      onClose={closeManaPopup}
      zIndexVar="--ui-z-mana-popup"
      lockBodyScroll={false}
      backdropLayout="anchored"
      backdropVisual="clear"
    >
      {manaPopupOpen ? (
        <Suspense
          fallback={
            <ManaSymbolPopupFallback
              top={manaPopupPosition.top}
              left={manaPopupPosition.left}
            />
          }
        >
          <ManaSymbolPopupPanel />
        </Suspense>
      ) : null}
    </BaseModal>
  )
}

export default memo(ManaSymbolPopup)
