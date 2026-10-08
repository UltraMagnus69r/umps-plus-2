import type { PrintUploadedFrontCard } from '../types/printFeature'

interface PrintUploadPanelProps {
  frontCards: PrintUploadedFrontCard[]
  onRemoveCard: (cardId: string) => void
  onClear: () => void
  usingCustomBack: boolean
  activeBackLabel: string
  customBackFileName: string | null
  onClearBack: () => void
  extraSheetCount: number
}

export function PrintUploadPanel({
  frontCards,
  onRemoveCard,
  onClear,
  usingCustomBack,
  activeBackLabel,
  customBackFileName,
  onClearBack,
  extraSheetCount,
}: PrintUploadPanelProps) {
  return (
    <section className="panel">
      <h2>Your cards</h2>
      <p className="panel-subtitle">
        Cards stay in the order you add them. Use the footer to add more anytime.
      </p>
      <div className="upload-actions">
        <button type="button" onClick={onClear} disabled={frontCards.length === 0}>
          Clear all cards
        </button>
      </div>
      <div className="upload-meta">
        <strong>{frontCards.length} on the list</strong>
      </div>
      {extraSheetCount > 0 ? (
        <p className="overflow-note">
          {extraSheetCount} extra sheet{extraSheetCount === 1 ? '' : 's'} will print after the first.
        </p>
      ) : null}
      {frontCards.length === 0 ? (
        <div className="upload-empty">
          <strong>No cards yet</strong>
          <p>Upload proxy images from the bar below to see them here.</p>
        </div>
      ) : (
        <ol className="upload-list">
          {frontCards.map((card) => (
            <li key={card.id} className="upload-list-item">
              <span>{card.name}</span>
              <button type="button" onClick={() => onRemoveCard(card.id)}>
                Remove
              </button>
            </li>
          ))}
        </ol>
      )}

      <hr className="upload-divider" />
      <h2 className="upload-subheading">Back image</h2>
      <p className="panel-subtitle">Pick Default back or Magic back in the card back panel, or upload your own.</p>
      <div className="upload-actions">
        <button type="button" onClick={onClearBack} disabled={!usingCustomBack}>
          Clear uploaded back
        </button>
      </div>
      <div className="upload-meta">
        <strong>{usingCustomBack ? 'Using your upload' : activeBackLabel}</strong>
        {usingCustomBack && customBackFileName ? <span>{customBackFileName}</span> : null}
      </div>
    </section>
  )
}
