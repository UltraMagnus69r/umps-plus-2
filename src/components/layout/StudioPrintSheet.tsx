import { useCallback } from 'react'
import { X } from 'lucide-react'
import { useCardStore } from '../../store/useCardStore'
import { generateHighResExport } from '../../services/exportService'
import { resolvePngFilename } from '../../utils/filenameAuthority'
import {
  applyExportPresetToPngFilename,
  applyTrimCropToPngFilename,
  getExportPreset,
} from '../../authority/exportPresetAuthority'
import { ProxyPrinterWorkspace } from '../../features/print/components/ProxyPrinterWorkspace'
import '../../features/print/styles/print-feature.css'
import '../../features/print/styles/proxy-printer-workspace.css'

type Props = {
  open: boolean
  onClose: () => void
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob | null> {
  try {
    const res = await fetch(dataUrl)
    return await res.blob()
  } catch {
    return null
  }
}

async function exportCurrentStudioCard(): Promise<{
  blob: Blob
  name: string
  backBlob?: Blob
  backName?: string
} | null> {
  const st = useCardStore.getState()
  if (!st.stageExporter) return null
  const blob = await generateHighResExport(st.stageExporter, {
    includeBleed: st.exportPngIncludeBleed,
  })
  const baseName = resolvePngFilename(
    st.cardData.filename,
    st.cardData.filenameSlug,
    st.isFieldDirty.filename,
    'card',
  )
  let outName = applyExportPresetToPngFilename(baseName, getExportPreset(st.exportPresetId))
  if (!st.exportPngIncludeBleed) outName = applyTrimCropToPngFilename(outName)
  const name = outName.endsWith('.png') ? outName : `${outName}.png`

  let backBlob: Blob | undefined
  let backName: string | undefined
  const printBack = st.cardData.printBackImage
  if (printBack) {
    const back = await dataUrlToBlob(printBack)
    if (back) {
      backBlob = back
      backName = name.replace(/\.png$/i, '-back.png')
    }
  }

  return { blob, name, backBlob, backName }
}

export default function StudioPrintSheet({ open, onClose }: Props) {
  const getCurrentCard = useCallback(() => exportCurrentStudioCard(), [])

  if (!open) return null

  return (
    <>
      <button type="button" className="studio-sheet-backdrop" aria-label="Close print sheet" onClick={onClose} />
      <div
        className="studio-sheet studio-sheet--print print-feature-root"
        role="dialog"
        aria-modal="true"
        aria-labelledby="studio-print-title"
      >
        <div className="studio-print-sheet__header">
          <div>
            <h2 id="studio-print-title" className="text-[1.05rem] font-semibold tracking-[-0.02em]">
              Print
            </h2>
            <p className="mt-1 text-[0.8125rem] text-[var(--text-secondary)]">
              Proxy printer — each card keeps its own back for duplex.
            </p>
          </div>
          <button
            type="button"
            className="ui-focus-ring rounded-lg p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--surface-inset)]"
            aria-label="Close"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="studio-print-sheet__body">
          <ProxyPrinterWorkspace
            variant="sheet"
            consumePendingOnMount
            getCurrentCard={getCurrentCard}
            addCurrentCardLabel="Add current card"
          />
        </div>
      </div>
    </>
  )
}
