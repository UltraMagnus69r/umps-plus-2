import { useId, useRef } from 'react'
import { Check, Download, Image as ImageIcon, X } from 'lucide-react'
import { shallow } from 'zustand/shallow'
import { useCardStore } from '../../store/useCardStore'
import {
  UI_ACTION_SUCCESS_SURFACE,
  UI_ASYNC_SPINNER_SM,
} from '../../authority/stateFeedbackAuthority'
import { UI_FOCUS_RING_CONTROL } from '../../authority/panelSurfaceAuthority'
import { UI_TEXT_FOOTER_INPUT } from '../../authority/typographyAuthority'
import ExportOptionsControls from '../ui/ExportOptionsControls'
import PrimaryActionButton from '../ui/PrimaryActionButton'

type Props = {
  open: boolean
  onClose: () => void
}

const INPUT_CLASS =
  `h-10 w-full rounded-[var(--radius-control)] px-3 ${UI_TEXT_FOOTER_INPUT} ${UI_FOCUS_RING_CONTROL} outline-none ` +
  'border border-[var(--border-subtle)] bg-white text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]'

export default function StudioDownloadSheet({ open, onClose }: Props) {
  const bleedId = useId()
  const titleRef = useRef<HTMLHeadingElement>(null)
  const { filename, filenameSlug, filenameFieldDirty, setField, commitState, exportCardImage, asyncExport } =
    useCardStore(
      (s) => ({
        filename: s.cardData.filename,
        filenameSlug: s.cardData.filenameSlug,
        filenameFieldDirty: s.isFieldDirty.filename,
        setField: s.setField,
        commitState: s.commitState,
        exportCardImage: s.exportCardImage,
        asyncExport: s.asyncStatus.export,
      }),
      shallow,
    )

  if (!open) return null

  return (
    <>
      <button type="button" className="studio-sheet-backdrop" aria-label="Close download sheet" onClick={onClose} />
      <div
        className="studio-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="studio-download-title"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 id="studio-download-title" ref={titleRef} className="text-[1.05rem] font-semibold tracking-[-0.02em]">
              Download PNG
            </h2>
            <p className="mt-1 text-[0.8125rem] text-[var(--text-secondary)]">
              Choose bleed or trim, then export a high-res proxy.
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

        <label className="mb-1 block text-[0.75rem] font-semibold text-[var(--text-secondary)]" htmlFor="studio-filename">
          Filename
        </label>
        <input
          id="studio-filename"
          value={filenameFieldDirty ? (filename ?? '') : (filenameSlug ?? '')}
          onChange={(e) => setField('filename', e.target.value)}
          onBlur={() => commitState()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur()
          }}
          className={`${INPUT_CLASS} mb-3`}
          placeholder="Enter filename…"
        />

        <div className="mb-4">
          <ExportOptionsControls disabled={asyncExport.status === 'loading'} bleedCheckboxId={bleedId} />
        </div>

        <PrimaryActionButton
          onClick={() => {
            void exportCardImage()
          }}
          disabled={asyncExport.status === 'loading'}
          ariaLabel="Download card as PNG"
          className={`w-full !justify-center ${asyncExport.status === 'success' ? UI_ACTION_SUCCESS_SURFACE : ''}`}
        >
          {asyncExport.status === 'loading' ? (
            <span className={UI_ASYNC_SPINNER_SM} aria-hidden />
          ) : asyncExport.status === 'success' ? (
            <Check className="h-4 w-4" aria-hidden />
          ) : (
            <ImageIcon className="h-4 w-4" aria-hidden />
          )}
          <span>Download card</span>
          <Download className="h-3.5 w-3.5 opacity-70" aria-hidden />
        </PrimaryActionButton>
      </div>
    </>
  )
}
