import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PrintPersistentFooter } from './components/PrintPersistentFooter'
import { PrintSheetPreview } from './components/PrintSheetPreview'
import { PrintUploadPanel } from './components/PrintUploadPanel'
import { exportPrintFullSetPdf } from './export/printSheetExport'
import { usePrintFeatureState } from './state/usePrintFeatureState'

export function PrintFeatureScreen() {
  const navigate = useNavigate()
  const {
    frontCards,
    backAssetUrl,
    usingDefaultBack,
    customBackFileName,
    backAssetLoaded,
    setBackAssetLoaded,
    backSourceSize,
    setBackSourceSize,
    layout,
    activeSheetIndex,
    setActiveSheetIndex,
    addFrontFiles,
    removeFrontCard,
    clearFronts,
    setCustomBackFromFiles,
    clearCustomBack,
  } = usePrintFeatureState()

  const [includeBleedInExport, setIncludeBleedInExport] = useState(true)

  const activeSheet = layout.sheets[activeSheetIndex] ?? layout.sheets[0]

  useEffect(() => {
    const image = new Image()
    image.onload = () => {
      setBackAssetLoaded(true)
      setBackSourceSize({
        width: image.naturalWidth,
        height: image.naturalHeight,
      })
    }
    image.onerror = () => {
      setBackAssetLoaded(false)
      setBackSourceSize({ width: 0, height: 0 })
    }
    image.src = backAssetUrl
  }, [backAssetUrl, setBackAssetLoaded, setBackSourceSize])

  const exportContext = useMemo(
    () => ({
      frontCards,
      backAssetUrl,
      sheets: layout.sheets,
      includeBleedInExport,
    }),
    [frontCards, backAssetUrl, layout.sheets, includeBleedInExport],
  )

  const readyToPrintLabel = useMemo(() => {
    if (layout.uploadedCount === 0) {
      return 'Add cards to start'
    }
    if (!backAssetLoaded) {
      return 'Almost there'
    }
    return 'Yes'
  }, [layout.uploadedCount, backAssetLoaded])

  return (
    <>
      <main className="printer-screen printer-screen--with-footer">
        <header className="hero-header">
          <h1>Proxy Printer</h1>
          <p>Build printable proxy sheets with a clear front-and-back workflow.</p>
        </header>

        <section className="stats-row stats-row-simple">
          <div className="stat-card stat-card-primary">
            <span>Cards Added</span>
            <strong>{layout.uploadedCount}</strong>
          </div>
          <div className="stat-card stat-card-primary">
            <span>Sheets Ready</span>
            <strong>{layout.totalSheets}</strong>
          </div>
          <div className="stat-card stat-card-primary">
            <span>Ready to Print</span>
            <strong>{readyToPrintLabel}</strong>
          </div>
        </section>

        <section className="workspace-grid">
          <PrintUploadPanel
            frontCards={frontCards}
            onRemoveCard={removeFrontCard}
            onClear={clearFronts}
            usingDefaultBack={usingDefaultBack}
            customBackFileName={customBackFileName}
            onClearBack={clearCustomBack}
            extraSheetCount={layout.totalSheets > 1 ? layout.totalSheets - 1 : 0}
          />
          <div className="control-stack">
            <section className="panel">
              <h2>Sheet Navigation</h2>
              <p className="panel-subtitle">Step through each sheet pair.</p>
              <p className="sheet-indicator">
                Sheet <strong>{activeSheetIndex + 1}</strong> of <strong>{layout.totalSheets}</strong>
              </p>
              <div className="sheet-nav">
                <button
                  type="button"
                  disabled={activeSheetIndex === 0}
                  onClick={() => setActiveSheetIndex((prev) => Math.max(0, prev - 1))}
                >
                  Previous Sheet
                </button>
                <button
                  type="button"
                  disabled={activeSheetIndex >= layout.totalSheets - 1}
                  onClick={() => setActiveSheetIndex((prev) => Math.min(layout.totalSheets - 1, prev + 1))}
                >
                  Next Sheet
                </button>
              </div>
            </section>

            <section className="panel">
              <h2>Card back</h2>
              <p className="panel-subtitle">
                One back image fills every back slot. Upload your own in the footer, or keep the default.
              </p>
              <p className={`status-chip ${backAssetLoaded ? 'ok' : 'warn'}`}>
                {backAssetLoaded ? 'Back image is ready' : 'Back image is still loading'}
              </p>
            </section>
          </div>
        </section>

        <section className="previews-workspace panel">
          <div className="preview-header">
            <h2>Preview</h2>
            <p>What you see here matches your exported files.</p>
          </div>
          <div className="previews-grid">
            <PrintSheetPreview
              title="Fronts"
              instruction="Print these pages first."
              side="front"
              placements={activeSheet?.frontPlacements ?? []}
              frontCards={frontCards}
              backAssetUrl={backAssetUrl}
              backSourceSize={backSourceSize}
            />
            <PrintSheetPreview
              title="Backs"
              instruction="Flip the paper, then print these pages."
              side="back"
              placements={activeSheet?.backPlacements ?? []}
              frontCards={frontCards}
              backAssetUrl={backAssetUrl}
              backSourceSize={backSourceSize}
            />
          </div>
        </section>
      </main>
      <PrintPersistentFooter
        onBackToShowcase={() => navigate('/')}
        onUploadFronts={addFrontFiles}
        onUploadBack={setCustomBackFromFiles}
        includeBleedInExport={includeBleedInExport}
        onIncludeBleedInExportChange={setIncludeBleedInExport}
        onExportPdf={() => void exportPrintFullSetPdf(exportContext)}
      />
    </>
  )
}
