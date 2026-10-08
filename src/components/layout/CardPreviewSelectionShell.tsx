import { memo, useCallback } from 'react'
import { shallow } from 'zustand/shallow'
import {
  isCardEffectivelyEmptyForGuidance,
  UI_GUIDANCE_INLINE,
} from '../../authority/guidanceAuthority'
import { useCardStore } from '../../store/useCardStore'
import KonvaStage from '../renderer/KonvaStage'
import { requestArtZoomStep } from '../renderer/layers/ArtLayer'

function CardPreviewSelectionShell() {
  const { openQuickView, showPreviewGuidance } = useCardStore(
    (s) => {
      const cd = s.cardData
      return {
        openQuickView: s.openQuickView,
        showPreviewGuidance: isCardEffectivelyEmptyForGuidance({
          name: String(cd.name ?? ''),
          typeLine: String(cd.typeLine ?? ''),
          manaCost: String(cd.manaCost ?? ''),
          cardText: String(cd.cardText ?? ''),
          flavorText: String(cd.flavorText ?? ''),
          power: String(cd.power ?? ''),
          toughness: String(cd.toughness ?? ''),
          artImage: String(cd.artImage ?? ''),
          clonedCardImage: String(cd.clonedCardImage ?? ''),
        }),
      }
    },
    shallow,
  )

  const onDoubleClickOpenQuickView = useCallback(() => {
    openQuickView()
  }, [openQuickView])

  return (
    <div className="relative h-full w-full min-h-0" onDoubleClick={onDoubleClickOpenQuickView}>
      <KonvaStage />
      <div
        className="art-zoom-controls lg:hidden"
        role="group"
        aria-label="Art zoom"
        onClick={(event) => event.stopPropagation()}
        onDoubleClick={(event) => event.stopPropagation()}
      >
        <button type="button" aria-label="Zoom art out" onClick={() => requestArtZoomStep(-1)}>
          −
        </button>
        <button type="button" aria-label="Zoom art in" onClick={() => requestArtZoomStep(1)}>
          +
        </button>
      </div>
      {showPreviewGuidance ? (
        <p
          className={`pointer-events-none absolute bottom-ui4 left-1/2 z-[12] max-w-[min(20rem,88vw)] -translate-x-1/2 px-ui2 text-center ${UI_GUIDANCE_INLINE}`}
        >
          Start by entering a name or importing a card.
        </p>
      ) : null}
    </div>
  )
}

export default memo(CardPreviewSelectionShell)
