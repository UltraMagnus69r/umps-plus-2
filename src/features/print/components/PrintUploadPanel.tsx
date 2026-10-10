import { frontImageIncludesBleed } from '../authority/printFeatureAuthority'
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

function marginNotice(card: PrintUploadedFrontCard): { kind: 'bleed' | 'trim' | 'unknown'; text: string } {
  if (card.widthPx <= 0 || card.heightPx <= 0) {
    return { kind: 'unknown', text: 'Size still loading…' }
  }
  if (frontImageIncludesBleed(card.widthPx, card.heightPx)) {
    return {
      kind: 'bleed',
      text: 'Bleed size — fills the black print box (includes cut margin).',
    }
  }
  return {
    kind: 'trim',
    text: 'Trim size — finished card only; centered in the bleed box with a black margin.',
  }
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
  const loaded = frontCards.filter((c) => c.widthPx > 0 && c.heightPx > 0)
  const bleedCount = loaded.filter((c) => frontImageIncludesBleed(c.widthPx, c.heightPx)).length
  const trimCount = loaded.length - bleedCount

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
      {loaded.length > 0 ? (
        <p className={`status-chip ${trimCount > 0 && bleedCount > 0 ? 'warn' : 'ok'}`}>
          {bleedCount > 0 && trimCount === 0
            ? 'Uploads look like full-bleed (with cut margin).'
            : trimCount > 0 && bleedCount === 0
              ? 'Uploads look like trim-only (finished card size). They will be centered on a black bleed box.'
              : `Mixed sizes: ${bleedCount} bleed, ${trimCount} trim. Each card is placed by its own size.`}
        </p>
      ) : null}
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
          {frontCards.map((card) => {
            const notice = marginNotice(card)
            return (
              <li key={card.id} className="upload-list-item">
                <div className="upload-list-item__meta">
                  <span>{card.name}</span>
                  <small className={`upload-margin-note upload-margin-note--${notice.kind}`}>
                    {notice.text}
                  </small>
                </div>
                <button type="button" onClick={() => onRemoveCard(card.id)}>
                  Remove
                </button>
              </li>
            )
          })}
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
