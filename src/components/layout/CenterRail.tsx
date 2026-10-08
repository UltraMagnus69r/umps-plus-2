import { memo } from 'react'
import { WORKING_PREVIEW_FOCUS_ID } from '../../data/layoutConstants'
import CardPreviewSelectionShell from './CardPreviewSelectionShell'
import ContextHeader from './ContextHeader'

function CenterRail() {
  return (
    <main
      data-phone-surface="card"
      className="order-1 flex h-full min-h-[min(42vh,20rem)] w-full min-w-0 flex-1 flex-col bg-neutral-50 dark:bg-black lg:order-none lg:min-h-0 lg:min-w-[28rem] lg:flex-[2] lg:basis-0"
    >
      <div className="h-full min-h-0 flex flex-col min-w-0">
        <ContextHeader />

        <div className="relative flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden flex flex-col">
          <div
            id={WORKING_PREVIEW_FOCUS_ID}
            tabIndex={-1}
            className="flex-1 min-h-0 flex items-center justify-center p-ui6 outline-none"
          >
            <CardPreviewSelectionShell />
          </div>
        </div>
      </div>
    </main>
  )
}

/** Phase 17.3 — skip rail shell churn when parent re-renders without prop changes; children keep own store subscriptions. */
export default memo(CenterRail)
