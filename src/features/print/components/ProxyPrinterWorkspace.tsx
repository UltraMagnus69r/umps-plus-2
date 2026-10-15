import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CONSTRAINT_COPY } from '../../../authority/constraintFeedbackAuthority'
import {
  letterSheetLayoutFacts,
  printBuiltinBacks,
  slotBackBadgeLabel,
} from '../authority/printFeatureAuthority'
import { exportPrintFullSetPdf, exportPrintFullSetPng } from '../export/printSheetExport'
import { takePendingStudioCard } from '../pendingStudioCard'
import { usePrintFeatureState } from '../state/usePrintFeatureState'
import type { PrintUploadedFrontCard } from '../types/printFeature'
import { PrintSheetPreview } from './PrintSheetPreview'

export type ProxyPrinterWorkspaceProps = {
  /** `page` = full /print route; `sheet` = Studio print modal. */
  variant?: 'page' | 'sheet'
  /** When true (e.g. sheet opens), pull any stashed Studio card into fronts. */
  consumePendingOnMount?: boolean
  /**
   * Optional primary action source: export the live Studio card and append it.
   * When provided, shows “Add current card”.
   * Optional `backBlob` is used when the maker has stored print back art.
   */
  getCurrentCard?: () => Promise<{
    blob: Blob
    name: string
    backBlob?: Blob
    backName?: string
  } | null>
  addCurrentCardLabel?: string
}

function SlotCardRow({
  card,
  index,
  onRemove,
  onSetDefault,
  onSetMagic,
  onReplaceBack,
}: {
  card: PrintUploadedFrontCard
  index: number
  onRemove: () => void
  onSetDefault: () => void
  onSetMagic: () => void
  onReplaceBack: (files: FileList | null) => void
}) {
  const backInputRef = useRef<HTMLInputElement>(null)
  const badge = slotBackBadgeLabel(card)

  return (
    <li className="proxy-printer__slot">
      <div className="proxy-printer__slot-main">
        <div className="proxy-printer__slot-thumb" aria-hidden>
          {card.url ? <img src={card.url} alt="" /> : null}
        </div>
        <div className="proxy-printer__slot-copy">
          <div className="proxy-printer__slot-title-row">
            <span className="proxy-printer__slot-index">#{index + 1}</span>
            <span className="proxy-printer__slot-name truncate" title={card.name}>
              {card.name}
            </span>
          </div>
          <span
            className={`proxy-printer__slot-badge proxy-printer__slot-badge--${badge.toLowerCase()}`}
          >
            {badge} back
          </span>
        </div>
      </div>
      <div className="proxy-printer__slot-actions" role="group" aria-label={`Back options for ${card.name}`}>
        <button
          type="button"
          className="proxy-printer__btn proxy-printer__btn--slot"
          onClick={() => backInputRef.current?.click()}
        >
          {card.backMode === 'custom' ? 'Replace back' : 'Add back'}
        </button>
        <input
          ref={backInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="sr-only"
          onChange={(e) => {
            onReplaceBack(e.target.files)
            e.currentTarget.value = ''
          }}
        />
        <button
          type="button"
          className={`proxy-printer__btn proxy-printer__btn--slot${card.backMode === 'default' ? ' is-selected' : ''}`}
          aria-pressed={card.backMode === 'default'}
          onClick={onSetDefault}
        >
          Use default
        </button>
        <button
          type="button"
          className={`proxy-printer__btn proxy-printer__btn--slot${card.backMode === 'magic' ? ' is-selected' : ''}`}
          aria-pressed={card.backMode === 'magic'}
          onClick={onSetMagic}
        >
          Use Magic
        </button>
        <button
          type="button"
          className="proxy-printer__btn proxy-printer__btn--slot proxy-printer__btn--danger"
          onClick={onRemove}
          aria-label={`Remove ${card.name}`}
        >
          Remove
        </button>
      </div>
    </li>
  )
}

/**
 * Shared Proxy Printer body — used by `/print` and the Studio Print sheet.
 * Per-slot backs: each front pairs with Default / Magic / Custom for duplex.
 */
export function ProxyPrinterWorkspace({
  variant = 'page',
  consumePendingOnMount = true,
  getCurrentCard,
  addCurrentCardLabel = 'Add current card',
}: ProxyPrinterWorkspaceProps) {
  const {
    frontCards,
    sheetFallbackBackId,
    layout,
    activeSheetIndex,
    setActiveSheetIndex,
    addFrontFiles,
    addFrontBlob,
    addFrontAndBackFiles,
    setSlotBackMode,
    setSlotCustomBackFromFiles,
    removeFrontCard,
    clearFronts,
    selectSheetFallbackBack,
  } = usePrintFeatureState()

  const frontsInputRef = useRef<HTMLInputElement>(null)
  const dualFrontRef = useRef<HTMLInputElement>(null)
  const dualBackRef = useRef<HTMLInputElement>(null)
  const pendingDualFront = useRef<File | null>(null)
  const [addingCurrent, setAddingCurrent] = useState(false)
  const [dualStep, setDualStep] = useState<'idle' | 'need-back'>('idle')

  useEffect(() => {
    if (!consumePendingOnMount) return
    const pending = takePendingStudioCard()
    if (pending) {
      addFrontBlob(pending.blob, pending.name, {
        backBlob: pending.backBlob,
        backName: pending.backName,
      })
    }
  }, [addFrontBlob, consumePendingOnMount])

  /** One control: bleed/cut marks on sheet preview AND in PDF/PNG export. */
  const [showBleedMarks, setShowBleedMarks] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const handleAddCurrent = useCallback(async () => {
    if (!getCurrentCard) return
    setAddingCurrent(true)
    try {
      const next = await getCurrentCard()
      if (next) {
        addFrontBlob(next.blob, next.name, {
          backBlob: next.backBlob,
          backName: next.backName,
        })
      }
    } finally {
      setAddingCurrent(false)
    }
  }, [addFrontBlob, getCurrentCard])

  const startDualSided = useCallback(() => {
    pendingDualFront.current = null
    setDualStep('idle')
    dualFrontRef.current?.click()
  }, [])

  const onDualFrontPicked = useCallback((files: FileList | null) => {
    const file = files?.[0] ?? null
    if (!file || file.type !== 'image/png') {
      setDualStep('idle')
      return
    }
    pendingDualFront.current = file
    setDualStep('need-back')
    // Let the first picker close, then open the back picker (phone-friendly sequential).
    window.setTimeout(() => dualBackRef.current?.click(), 120)
  }, [])

  const onDualBackPicked = useCallback(
    (files: FileList | null) => {
      const front = pendingDualFront.current
      const back = files?.[0] ?? null
      pendingDualFront.current = null
      setDualStep('idle')
      if (front && back) addFrontAndBackFiles(front, back)
    },
    [addFrontAndBackFiles],
  )

  const activeSheet = layout.sheets[activeSheetIndex] ?? layout.sheets[0]

  const exportContext = useMemo(
    () => ({
      frontCards,
      sheetFallbackBackId,
      sheets: layout.sheets,
      includeBleedInExport: showBleedMarks,
    }),
    [frontCards, sheetFallbackBackId, layout.sheets, showBleedMarks],
  )

  const runExport = useCallback(
    async (kind: 'pdf' | 'png') => {
      setExporting(true)
      setExportError(null)
      try {
        if (kind === 'pdf') await exportPrintFullSetPdf(exportContext)
        else await exportPrintFullSetPng(exportContext)
      } catch (err) {
        setExportError(err instanceof Error ? err.message : 'Export failed')
      } finally {
        setExporting(false)
      }
    },
    [exportContext],
  )

  const metaLine =
    layout.uploadedCount === 0
      ? `${letterSheetLayoutFacts.gridLabel} · 600 DPI`
      : `${layout.uploadedCount} card${layout.uploadedCount === 1 ? '' : 's'} · sheet ${activeSheetIndex + 1}/${layout.totalSheets} · ${letterSheetLayoutFacts.gridLabel} · 600 DPI`

  return (
    <div className={`proxy-printer proxy-printer--${variant}`}>
      <div className="proxy-printer__intro">
        <p className="proxy-printer__lede">
          Letter {letterSheetLayoutFacts.gridLabel}. Each card has its own back for duplex — Default unless you
          add a custom or Magic back.
        </p>
        <p className="proxy-printer__meta" aria-live="polite">
          {metaLine}
          {layout.uploadedCount > 0 ? ' · Ready' : ''}
        </p>
      </div>

      <section className="proxy-printer__actions" aria-label="Card sources">
        {getCurrentCard ? (
          <button
            type="button"
            className="proxy-printer__btn proxy-printer__btn--primary"
            disabled={addingCurrent}
            onClick={() => void handleAddCurrent()}
          >
            {addingCurrent ? 'Adding…' : addCurrentCardLabel}
          </button>
        ) : null}
        <button
          type="button"
          className="proxy-printer__btn"
          onClick={() => frontsInputRef.current?.click()}
        >
          Upload fronts
        </button>
        <input
          ref={frontsInputRef}
          type="file"
          accept="image/png"
          multiple
          className="sr-only"
          onChange={(e) => {
            addFrontFiles(e.target.files)
            e.currentTarget.value = ''
          }}
        />
        <button type="button" className="proxy-printer__btn" onClick={startDualSided}>
          {dualStep === 'need-back' ? 'Pick back…' : 'Add front + back'}
        </button>
        <input
          ref={dualFrontRef}
          type="file"
          accept="image/png"
          className="sr-only"
          onChange={(e) => {
            onDualFrontPicked(e.target.files)
            e.currentTarget.value = ''
          }}
        />
        <input
          ref={dualBackRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="sr-only"
          onChange={(e) => {
            onDualBackPicked(e.target.files)
            e.currentTarget.value = ''
          }}
        />
        {frontCards.length > 0 ? (
          <button type="button" className="proxy-printer__btn proxy-printer__btn--ghost" onClick={clearFronts}>
            Clear all
          </button>
        ) : null}
      </section>

      {dualStep === 'need-back' ? (
        <p className="proxy-printer__dual-hint" role="status">
          Front selected — now choose the back image for this double-sided card.
        </p>
      ) : null}

      <section className="proxy-printer__slots-section" aria-label="Sheet slots">
        <div className="proxy-printer__section-label">Slots</div>
        {frontCards.length > 0 ? (
          <ol className="proxy-printer__slot-list">
            {frontCards.map((card, index) => (
              <SlotCardRow
                key={card.id}
                card={card}
                index={index}
                onRemove={() => removeFrontCard(card.id)}
                onSetDefault={() => setSlotBackMode(card.id, 'default')}
                onSetMagic={() => setSlotBackMode(card.id, 'magic')}
                onReplaceBack={(files) => setSlotCustomBackFromFiles(card.id, files)}
              />
            ))}
          </ol>
        ) : (
          <p className="proxy-printer__empty">
            No cards yet — add the current card, upload fronts (Default back), or add a front + back pair.
          </p>
        )}
      </section>

      <section className="proxy-printer__fallback" aria-label="Default back fallback">
        <div className="proxy-printer__section-label">Default back for unmarked slots</div>
        <p className="proxy-printer__fallback-hint">
          Slots set to Default use this. Magic or Custom on a slot always wins.
        </p>
        <div className="proxy-printer__back-choices" role="radiogroup" aria-label="Sheet default back">
          {printBuiltinBacks.map((back) => {
            const selected = sheetFallbackBackId === back.id
            return (
              <button
                key={back.id}
                type="button"
                role="radio"
                aria-checked={selected}
                className={selected ? 'is-selected' : undefined}
                onClick={() => selectSheetFallbackBack(back.id)}
              >
                {back.id === 'default' ? 'Default' : 'Magic'}
              </button>
            )
          })}
        </div>
      </section>

      <section className="proxy-printer__nav" aria-label="Sheet navigation">
        <button
          type="button"
          className="proxy-printer__btn"
          disabled={activeSheetIndex === 0}
          onClick={() => setActiveSheetIndex((prev) => Math.max(0, prev - 1))}
        >
          Previous
        </button>
        <span className="proxy-printer__sheet-indicator">
          Sheet {activeSheetIndex + 1} / {layout.totalSheets}
        </span>
        <button
          type="button"
          className="proxy-printer__btn"
          disabled={activeSheetIndex >= layout.totalSheets - 1}
          onClick={() => setActiveSheetIndex((prev) => Math.min(layout.totalSheets - 1, prev + 1))}
        >
          Next
        </button>
      </section>

      <section className="proxy-printer__preview panel previews-workspace">
        <div className="preview-header">
          <h2>Sheet preview</h2>
          <p title={CONSTRAINT_COPY.printAt100Percent}>Matches PDF / 600 DPI PNG. Print at 100%, not fit-to-page.</p>
          <label
            className="proxy-printer__bleed-toggle"
            title="Bleed box and cut marks on the preview and in the exported PDF/PNG"
          >
            <input
              type="checkbox"
              checked={showBleedMarks}
              onChange={(e) => setShowBleedMarks(e.target.checked)}
            />
            <span>Show bleed &amp; cut marks on preview</span>
          </label>
          {exportError ? <p className="export-error">{exportError}</p> : null}
        </div>
        <div className="previews-grid proxy-printer__previews">
          <PrintSheetPreview
            title="Fronts"
            instruction="Print these pages first."
            side="front"
            placements={activeSheet?.frontPlacements ?? []}
            frontCards={frontCards}
            sheetFallbackBackId={sheetFallbackBackId}
            includeBleed={showBleedMarks}
          />
          <PrintSheetPreview
            title="Backs"
            instruction="Flip on the long edge, then print backs. Same slot order pairs with fronts."
            side="back"
            placements={activeSheet?.backPlacements ?? []}
            frontCards={frontCards}
            sheetFallbackBackId={sheetFallbackBackId}
            includeBleed={showBleedMarks}
          />
        </div>
      </section>

      <section className="proxy-printer__export" aria-label="Export">
        <button
          type="button"
          className="proxy-printer__btn proxy-printer__btn--primary"
          disabled={exporting || frontCards.length === 0}
          onClick={() => void runExport('pdf')}
        >
          {exporting ? 'Exporting…' : 'Export PDF'}
        </button>
        <button
          type="button"
          className="proxy-printer__btn"
          disabled={exporting || frontCards.length === 0}
          onClick={() => void runExport('png')}
        >
          Export PNG (600 DPI)
        </button>
      </section>
    </div>
  )
}
