import { UI_CHROME_FOOTER, UI_FOCUS_RING_CONTROL } from '../../authority/panelSurfaceAuthority'
import {
  UI_ACTION_SUCCESS_SURFACE,
  UI_ASYNC_SPINNER_SM,
} from '../../authority/stateFeedbackAuthority'
import { UI_TEXT_FOOTER_INPUT } from '../../authority/typographyAuthority'
import { memo, useCallback, useEffect, useId, useRef } from 'react'
import { shallow } from 'zustand/shallow'
import { useNavigate } from 'react-router-dom'
import { Check, Redo2, Undo2, FileJson2, Image as ImageIcon, Download, FolderOpen, Plus, Printer } from 'lucide-react'
import { migrateDesignPayload, useCardStore } from '../../store/useCardStore'
import { saveDesign } from '../../utils/fileUtils'
import ExportOptionsControls from '../ui/ExportOptionsControls'
import FooterActionButton from '../ui/FooterActionButton'
import PrimaryActionButton from '../ui/PrimaryActionButton'

const BAR_INPUT_CLASS =
  `h-[var(--ui-control-height-sm)] w-full min-w-0 max-w-full rounded-[var(--ui-radius-md)] px-ui2 ${UI_TEXT_FOOTER_INPUT} ${UI_FOCUS_RING_CONTROL} outline-none ` +
  'border border-[var(--ui-color-border)] bg-[var(--ui-color-surface-elevated)] text-[var(--ui-color-text-strong)] placeholder:text-[var(--ui-color-muted)] ' +
  'text-[length:clamp(0.6875rem,0.4rem+0.65vw,0.8125rem)] shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_1px_2px_rgba(15,23,42,0.05)] hover:border-[color-mix(in_srgb,var(--ui-color-primary)_25%,var(--ui-color-border))]'

/** Phase 17.3 — filename row only; isolates slug churn from toolbar. */
const BottomBarFilenameSection = memo(function BottomBarFilenameSection() {
  const filename = useCardStore((s) => s.cardData.filename)
  const filenameSlug = useCardStore((s) => s.cardData.filenameSlug)
  const filenameFieldDirty = useCardStore((s) => s.isFieldDirty.filename)
  const setField = useCardStore((s) => s.setField)
  const commitState = useCardStore((s) => s.commitState)

  return (
    <div className="flex min-w-0 shrink-0 basis-full items-center gap-ui2 sm:basis-auto sm:shrink-0">
      <div
        className="footer-action-btn footer-action-btn--static !h-8 !min-h-8 !w-8 !min-w-8 shrink-0 !p-0"
        aria-hidden
      >
        <Download className="h-3.5 w-3.5 shrink-0 text-sky-600 dark:text-sky-400" />
      </div>
      <div className="min-w-0 w-full max-w-full sm:max-w-[min(14rem,32vw)]">
        <input
          value={filenameFieldDirty ? (filename ?? '') : (filenameSlug ?? '')}
          onChange={(e) => setField('filename', e.target.value)}
          onBlur={() => commitState()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              ;(e.currentTarget as HTMLInputElement).blur()
            }
          }}
          className={BAR_INPUT_CLASS}
          placeholder="Enter filename..."
          aria-label="File name"
        />
      </div>
    </div>
  )
})

/** Phase 17.3 — actions + export chrome; Save reads filename via getState to avoid filename subscriptions. */
const BottomBarToolbar = memo(function BottomBarToolbar() {
  const navigate = useNavigate()
  const loadDesignInputRef = useRef<HTMLInputElement>(null)
  const exportOptionsBleedId = useId()

  const {
    undo,
    redo,
    canUndo,
    canRedo,
    resetCard,
    hydrateFromDesign,
    setAsyncStatus,
    asyncDesignLoad,
    asyncExport,
    exportCardImage,
    markDesignSaved,
  } = useCardStore(
    (s) => ({
      undo: s.undo,
      redo: s.redo,
      canUndo: (s.past?.length ?? 0) > 0,
      canRedo: (s.future?.length ?? 0) > 0,
      resetCard: s.resetCard,
      hydrateFromDesign: s.hydrateFromDesign,
      setAsyncStatus: s.setAsyncStatus,
      asyncDesignLoad: s.asyncStatus.designLoad,
      asyncExport: s.asyncStatus.export,
      exportCardImage: s.exportCardImage,
      markDesignSaved: s.markDesignSaved,
    }),
    shallow,
  )

  const handleSaveDesign = useCallback(() => {
    const st = useCardStore.getState()
    saveDesign(
      st.getDesignSnapshot(),
      st.cardData.filename,
      st.cardData.filenameSlug,
      st.isFieldDirty.filename,
    )
    markDesignSaved()
  }, [markDesignSaved])

  const handleResetCard = useCallback(() => {
    resetCard()
  }, [resetCard])

  const handleExportPng = useCallback(() => {
    void exportCardImage()
  }, [exportCardImage])

  return (
    <div className="min-w-0 flex-1">
      <div className="footer-toolbar flex min-h-[2.75rem] w-full min-w-0 flex-wrap items-center justify-end gap-x-ui1 gap-y-ui2 sm:flex-nowrap sm:gap-x-ui2">
        <FooterActionButton onClick={() => navigate('/print')} ariaLabel="Open Proxy Printer page">
          <Printer className="h-3.5 w-3.5 shrink-0 text-slate-600 dark:text-slate-400" />
          <span className="footer-action-btn__label">Proxy Printer</span>
        </FooterActionButton>

        <FooterActionButton onClick={undo} disabled={!canUndo} ariaLabel="Undo last change" title="Undo (Ctrl+Z)">
          <Undo2 className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
          <span className="footer-action-btn__label">Undo</span>
        </FooterActionButton>

        <FooterActionButton onClick={redo} disabled={!canRedo} ariaLabel="Redo last change" title="Redo (Ctrl+Y)">
          <Redo2 className="h-3.5 w-3.5 shrink-0 text-indigo-600 dark:text-indigo-400" />
          <span className="footer-action-btn__label">Redo</span>
        </FooterActionButton>

        <FooterActionButton onClick={handleResetCard} ariaLabel="New card">
          <Plus className="h-3.5 w-3.5 shrink-0 text-violet-600 dark:text-violet-400" />
          <span className="footer-action-btn__label">New Card</span>
        </FooterActionButton>

        <input
          type="file"
          accept=".json,application/json"
          ref={loadDesignInputRef}
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
          }}
          aria-hidden
        />
        <FooterActionButton onClick={handleSaveDesign} ariaLabel="Save design as JSON">
          <FileJson2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="footer-action-btn__label">Save Design</span>
        </FooterActionButton>
        <FooterActionButton
          onClick={() => loadDesignInputRef.current?.click()}
          disabled={asyncDesignLoad.status === 'loading'}
          ariaLabel="Load design from JSON"
          className={asyncDesignLoad.status === 'success' ? UI_ACTION_SUCCESS_SURFACE : ''}
          title={
            asyncDesignLoad.status === 'error' && asyncDesignLoad.message
              ? asyncDesignLoad.message
              : undefined
          }
        >
          {asyncDesignLoad.status === 'loading' ? (
            <span className={UI_ASYNC_SPINNER_SM} aria-hidden />
          ) : asyncDesignLoad.status === 'success' ? (
            <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
          ) : (
            <FolderOpen className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
          )}
          <span className="footer-action-btn__label">Load Design</span>
        </FooterActionButton>
        {asyncDesignLoad.status === 'error' && asyncDesignLoad.message ? (
          <span className="sr-only" role="alert">
            {asyncDesignLoad.message}
          </span>
        ) : null}

        <ExportOptionsControls
          disabled={asyncExport.status === 'loading'}
          bleedCheckboxId={exportOptionsBleedId}
          showPreset={false}
          compactLabels
        />

        <PrimaryActionButton
          onClick={handleExportPng}
          disabled={asyncExport.status === 'loading'}
          ariaLabel="Download card as PNG"
          className={`footer-download-card shrink-0 !h-8 !min-h-8 !rounded-[var(--ui-radius-md)] !px-2.5 !text-[length:clamp(0.6875rem,0.4rem+0.65vw,0.8125rem)] ${asyncExport.status === 'success' ? UI_ACTION_SUCCESS_SURFACE : ''}`}
        >
          {asyncExport.status === 'loading' ? (
            <span className={UI_ASYNC_SPINNER_SM} aria-hidden />
          ) : asyncExport.status === 'success' ? (
            <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
          ) : (
            <ImageIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
          )}
          <span className="footer-action-btn__label">Download card</span>
        </PrimaryActionButton>
        {asyncExport.status === 'error' && asyncExport.message ? (
          <span className="sr-only" role="alert">
            {asyncExport.message}
          </span>
        ) : null}
      </div>
    </div>
  )
})

export default function BottomBar() {
  const footerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = footerRef.current
    if (!el) return
    const apply = () => {
      document.documentElement.style.setProperty('--app-footer-h', `${Math.ceil(el.getBoundingClientRect().height)}px`)
    }
    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <footer ref={footerRef} className={`${UI_CHROME_FOOTER} app-footer-safe fixed bottom-0 left-0 right-0 z-20 min-h-0 py-1.5`}>
      <div className="flex h-full min-h-[2.75rem] w-full min-w-0 flex-wrap items-center gap-x-ui2 gap-y-ui2 pl-ui3 pr-ui3 sm:flex-nowrap sm:gap-y-0 sm:gap-x-ui3 sm:pl-ui4 sm:pr-ui4">
        <BottomBarFilenameSection />
        <BottomBarToolbar />
      </div>
    </footer>
  )
}
