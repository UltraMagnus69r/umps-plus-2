import { memo, useCallback, useEffect, useState } from 'react'
import { CloudDownload, Plus } from 'lucide-react'
import { WORKING_PREVIEW_FOCUS_ID } from '../../data/layoutConstants'
import {
  isCardEffectivelyEmptyForGuidance,
} from '../../authority/guidanceAuthority'
import { useCardStore } from '../../store/useCardStore'
import type { InspectorSegment } from '../../hooks/useInspectorSegment'
import CardPreviewSelectionShell from './CardPreviewSelectionShell'

const TIP_KEY = 'umps-studio-onboarding-tip-v1'

type Props = {
  onRequestSegment: (segment: InspectorSegment) => void
  onRequestImport: () => void
}

function StudioCanvas({ onRequestSegment, onRequestImport }: Props) {
  const showEmpty = useCardStore((s) => {
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
  const resetCard = useCardStore((s) => s.resetCard)
  const [showTip, setShowTip] = useState(false)
  const [settleKey, setSettleKey] = useState(0)

  useEffect(() => {
    try {
      if (localStorage.getItem(TIP_KEY) !== '1') setShowTip(true)
    } catch {
      setShowTip(true)
    }
  }, [])

  useEffect(() => {
    setSettleKey((k) => k + 1)
  }, [showEmpty])

  const dismissTip = useCallback(() => {
    setShowTip(false)
    try {
      localStorage.setItem(TIP_KEY, '1')
    } catch {
      /* private mode */
    }
  }, [])

  return (
    <main className="studio-canvas-stage flex min-h-0 min-w-0 flex-1 flex-col" data-phone-surface="card">
      {showTip ? (
        <div className="studio-onboarding-tip" role="status">
          <div className="font-semibold text-[var(--text-primary)]">Studio flow</div>
          <p className="mt-0.5">
            Write in <strong>Content</strong>, style in <strong>Look</strong>, then{' '}
            <strong>Download</strong>. Details holds collector &amp; fine controls.
          </p>
          <button
            type="button"
            className="mt-2 text-[0.75rem] font-semibold text-[var(--accent-ink)] underline-offset-2 hover:underline"
            onClick={dismissTip}
          >
            Got it
          </button>
        </div>
      ) : null}

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div
          id={WORKING_PREVIEW_FOCUS_ID}
          tabIndex={-1}
          className="flex min-h-0 flex-1 items-center justify-center p-ui4 outline-none sm:p-ui6"
        >
          <div key={settleKey} className="studio-card-settle relative h-full w-full min-h-0">
            <CardPreviewSelectionShell hideInlineGuidance />
          </div>
        </div>

        {showEmpty ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-[12%] z-[12] flex justify-center px-4">
            <div className="pointer-events-auto flex max-w-[min(24rem,92vw)] flex-col items-center gap-3 text-center">
              <p className="text-[0.9375rem] font-medium tracking-[-0.01em] text-[var(--text-secondary)]">
                Start a proxy
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  className="studio-empty-cta studio-empty-cta--primary"
                  onClick={() => {
                    onRequestSegment('content')
                    onRequestImport()
                  }}
                >
                  <CloudDownload className="h-4 w-4" />
                  Import from Scryfall
                </button>
                <button
                  type="button"
                  className="studio-empty-cta"
                  onClick={() => {
                    resetCard()
                    onRequestSegment('look')
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Blank card
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  )
}

export default memo(StudioCanvas)
