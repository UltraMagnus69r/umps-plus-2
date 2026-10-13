import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Check,
  FileJson2,
  FolderOpen,
  Maximize2,
  MoreHorizontal,
  Plus,
  Printer,
  Send,
} from 'lucide-react'
import { shallow } from 'zustand/shallow'
import { resetStudioFlowToStart } from '../../authority/studioFlowAuthority'
import { migrateDesignPayload, useCardStore } from '../../store/useCardStore'
import { saveDesign } from '../../utils/fileUtils'
import { generateHighResExport } from '../../services/exportService'
import { resolvePngFilename } from '../../utils/filenameAuthority'
import {
  applyExportPresetToPngFilename,
  applyTrimCropToPngFilename,
  getExportPreset,
} from '../../authority/exportPresetAuthority'
import { stashStudioCardForPrint } from '../../features/print/pendingStudioCard'
import {
  UI_ACTION_SUCCESS_SURFACE,
  UI_ASYNC_SPINNER_SM,
} from '../../authority/stateFeedbackAuthority'

type Props = {
  onOpenDownload: () => void
}

export default function StudioMoreMenu({ onOpenDownload }: Props) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const loadRef = useRef<HTMLInputElement>(null)
  const menuId = useId()

  const {
    resetCard,
    hydrateFromDesign,
    setAsyncStatus,
    asyncDesignLoad,
    markDesignSaved,
    openQuickView,
  } = useCardStore(
    (s) => ({
      resetCard: s.resetCard,
      hydrateFromDesign: s.hydrateFromDesign,
      setAsyncStatus: s.setAsyncStatus,
      asyncDesignLoad: s.asyncStatus.designLoad,
      markDesignSaved: s.markDesignSaved,
      openQuickView: s.openQuickView,
    }),
    shallow,
  )

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const handleSave = useCallback(() => {
    const st = useCardStore.getState()
    saveDesign(
      st.getDesignSnapshot(),
      st.cardData.filename,
      st.cardData.filenameSlug,
      st.isFieldDirty.filename,
    )
    markDesignSaved()
    setOpen(false)
  }, [markDesignSaved])

  const handleSendToPrinter = useCallback(async () => {
    const st = useCardStore.getState()
    if (!st.stageExporter) return
    setSending(true)
    try {
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
      stashStudioCardForPrint(blob, outName.endsWith('.png') ? outName : `${outName}.png`)
      setOpen(false)
      navigate('/print')
    } catch {
      /* export failures already rare; stay in studio */
    } finally {
      setSending(false)
    }
  }, [navigate])

  const itemClass =
    'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[0.8125rem] font-medium text-[var(--text-primary)] hover:bg-[var(--surface-inset)] ui-focus-ring'

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className="ui-focus-ring flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-white/70 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        title="More · ⌘Z undo"
        onClick={() => setOpen((v) => !v)}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-[calc(100%+6px)] z-30 min-w-[14.5rem] rounded-[14px] border border-[var(--border-subtle)] bg-[color-mix(in_srgb,#fff_94%,var(--surface-inset))] p-1.5 shadow-[var(--shadow-soft)]"
          style={{ animation: 'studio-sheet-present var(--dur-med) var(--ease-out)' }}
        >
          <button type="button" role="menuitem" className={itemClass} onClick={() => { openQuickView(); setOpen(false) }}>
            <Maximize2 className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
            Quick view
            <span className="ml-auto text-[0.65rem] text-[var(--text-tertiary)]">View</span>
          </button>
          <button type="button" role="menuitem" className={itemClass} onClick={() => { onOpenDownload(); setOpen(false) }}>
            <Send className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
            Export options…
          </button>
          <button
            type="button"
            role="menuitem"
            className={itemClass}
            disabled={sending}
            onClick={() => void handleSendToPrinter()}
          >
            {sending ? <span className={UI_ASYNC_SPINNER_SM} /> : <Printer className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />}
            Send to Printer
          </button>
          <button type="button" role="menuitem" className={itemClass} onClick={() => { navigate('/print'); setOpen(false) }}>
            <Printer className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
            Proxy Printer
          </button>
          <div className="my-1 h-px bg-[var(--separator)]" />
          <div className="px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)]">
            Save · Load · Print
          </div>
          <button
            type="button"
            role="menuitem"
            className={itemClass}
            onClick={() => {
              resetCard()
              resetStudioFlowToStart()
              setOpen(false)
            }}
          >
            <Plus className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
            New card
          </button>
          <button type="button" role="menuitem" className={itemClass} onClick={handleSave}>
            <FileJson2 className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
            Save design (JSON)
          </button>
          <input
            type="file"
            accept=".json,application/json"
            ref={loadRef}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (!file) return
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
              setOpen(false)
            }}
          />
          <button
            type="button"
            role="menuitem"
            className={`${itemClass} ${asyncDesignLoad.status === 'success' ? UI_ACTION_SUCCESS_SURFACE : ''}`}
            disabled={asyncDesignLoad.status === 'loading'}
            onClick={() => loadRef.current?.click()}
          >
            {asyncDesignLoad.status === 'loading' ? (
              <span className={UI_ASYNC_SPINNER_SM} />
            ) : asyncDesignLoad.status === 'success' ? (
              <Check className="h-3.5 w-3.5 text-[var(--success)]" />
            ) : (
              <FolderOpen className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
            )}
            Load design (JSON)
          </button>
          <div className="mt-1 px-2.5 py-1.5 text-[0.65rem] leading-snug text-[var(--text-tertiary)]">
            Download (top) · Send to Printer / Proxy Printer above · ⌘Z undo
          </div>
        </div>
      ) : null}
    </div>
  )
}
