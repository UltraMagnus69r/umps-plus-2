import { useCallback, useId, useRef } from 'react'
import {
  Check,
  Download,
  FileJson2,
  FolderOpen,
  Image as ImageIcon,
  X,
} from 'lucide-react'
import { shallow } from 'zustand/shallow'
import { migrateDesignPayload, useCardStore } from '../../store/useCardStore'
import { saveDesign } from '../../utils/fileUtils'
import {
  UI_ACTION_SUCCESS_SURFACE,
  UI_ASYNC_SPINNER_SM,
} from '../../authority/stateFeedbackAuthority'
import { UI_FOCUS_RING_CONTROL } from '../../authority/panelSurfaceAuthority'
import { UI_TEXT_FOOTER_INPUT } from '../../authority/typographyAuthority'
import ExportOptionsControls from '../ui/ExportOptionsControls'
import PrimaryActionButton from '../ui/PrimaryActionButton'
import SecondaryUtilityButton from '../ui/SecondaryUtilityButton'

type Props = {
  open: boolean
  onClose: () => void
}

const INPUT_CLASS =
  `h-10 w-full rounded-[var(--radius-control)] px-3 ${UI_TEXT_FOOTER_INPUT} ${UI_FOCUS_RING_CONTROL} outline-none ` +
  'border border-[var(--border-subtle)] bg-[var(--surface-inset)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]'

export default function StudioSaveSheet({ open, onClose }: Props) {
  const bleedId = useId()
  const loadRef = useRef<HTMLInputElement>(null)
  const {
    filename,
    filenameSlug,
    filenameFieldDirty,
    setField,
    commitState,
    exportCardImage,
    asyncExport,
    hydrateFromDesign,
    setAsyncStatus,
    asyncDesignLoad,
    markDesignSaved,
  } = useCardStore(
    (s) => ({
      filename: s.cardData.filename,
      filenameSlug: s.cardData.filenameSlug,
      filenameFieldDirty: s.isFieldDirty.filename,
      setField: s.setField,
      commitState: s.commitState,
      exportCardImage: s.exportCardImage,
      asyncExport: s.asyncStatus.export,
      hydrateFromDesign: s.hydrateFromDesign,
      setAsyncStatus: s.setAsyncStatus,
      asyncDesignLoad: s.asyncStatus.designLoad,
      markDesignSaved: s.markDesignSaved,
    }),
    shallow,
  )

  const handleSaveJson = useCallback(() => {
    const st = useCardStore.getState()
    void saveDesign(
      st.getDesignSnapshot(),
      st.cardData.filename,
      st.cardData.filenameSlug,
      st.isFieldDirty.filename,
    ).then(() => markDesignSaved())
  }, [markDesignSaved])

  const handleLoadJson = useCallback(
    (file: File) => {
      setAsyncStatus('designLoad', 'loading')
      const reader = new FileReader()
      reader.onerror = () => {
        setAsyncStatus('designLoad', 'error', 'Failed to read file')
        setTimeout(() => setAsyncStatus('designLoad', 'idle'), 2000)
      }
      reader.onload = () => {
        try {
          const text = typeof reader.result === 'string' ? reader.result : ''
          const parsed = JSON.parse(text) as unknown
          const migrated = migrateDesignPayload(parsed)
          if (migrated) {
            hydrateFromDesign(migrated)
            setAsyncStatus('designLoad', 'success')
          } else {
            setAsyncStatus('designLoad', 'error', 'Unsupported design schema')
          }
        } catch {
          setAsyncStatus('designLoad', 'error', 'Invalid design file')
        }
        setTimeout(() => setAsyncStatus('designLoad', 'idle'), 2000)
      }
      reader.readAsText(file)
    },
    [hydrateFromDesign, setAsyncStatus],
  )

  if (!open) return null

  return (
    <>
      <button type="button" className="studio-sheet-backdrop" aria-label="Close save sheet" onClick={onClose} />
      <div
        className="studio-sheet studio-sheet--save"
        role="dialog"
        aria-modal="true"
        aria-labelledby="studio-save-title"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 id="studio-save-title" className="text-[1.05rem] font-semibold tracking-[-0.02em]">
              Save
            </h2>
            <p className="mt-1 text-[0.8125rem] text-[var(--text-secondary)]">
              Filename, design JSON, and PNG download with bleed or trim.
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
          className={`${INPUT_CLASS} mb-4`}
          placeholder="Enter filename…"
        />

        <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <SecondaryUtilityButton
            onClick={handleSaveJson}
            ariaLabel="Save design as JSON"
            className="!w-full !justify-center"
          >
            <FileJson2 className="h-3.5 w-3.5" aria-hidden />
            <span>Save JSON</span>
          </SecondaryUtilityButton>
          <input
            type="file"
            accept=".json,application/json"
            ref={loadRef}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (file) handleLoadJson(file)
            }}
          />
          <SecondaryUtilityButton
            onClick={() => loadRef.current?.click()}
            disabled={asyncDesignLoad.status === 'loading'}
            ariaLabel="Load design from JSON"
            className={`!w-full !justify-center ${asyncDesignLoad.status === 'success' ? UI_ACTION_SUCCESS_SURFACE : ''}`}
          >
            {asyncDesignLoad.status === 'loading' ? (
              <span className={UI_ASYNC_SPINNER_SM} aria-hidden />
            ) : asyncDesignLoad.status === 'success' ? (
              <Check className="h-3.5 w-3.5 text-[var(--success)]" aria-hidden />
            ) : (
              <FolderOpen className="h-3.5 w-3.5" aria-hidden />
            )}
            <span>Load JSON</span>
          </SecondaryUtilityButton>
        </div>

        <div className="mb-1 text-[0.75rem] font-semibold text-[var(--text-secondary)]">Download PNG</div>
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
          <span>Download PNG</span>
          <Download className="h-3.5 w-3.5 opacity-70" aria-hidden />
        </PrimaryActionButton>
      </div>
    </>
  )
}
