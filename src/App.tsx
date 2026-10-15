import { UI_PANEL_OVERLAY } from './authority/panelSurfaceAuthority'
import { UI_TEXT_SECTION_HEADER } from './authority/typographyAuthority'
import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import StudioTopBar from './components/layout/StudioTopBar'
import StudioCanvas from './components/layout/StudioCanvas'
import StudioInspector from './components/layout/StudioInspector'
import StudioSaveSheet from './components/layout/StudioSaveSheet'
import StudioPrintSheet from './components/layout/StudioPrintSheet'
import QuickViewModal from './components/layout/QuickViewModal'

const ManaSymbolPopup = lazy(() => import('./components/layout/ManaSymbolPopup'))
import { useCardStore } from './store/useCardStore'
import { CORE_FONT_SPECS, ensureCreativeFontsLoaded } from './data/fonts'
import { clearStudioInspectorDrill } from './authority/studioFlowAuthority'
import { useInspectorSegment, type InspectorSegment } from './hooks/useInspectorSegment'

function cardTypographyFontKeys(): string[] {
  const cd = useCardStore.getState().cardData
  return [
    cd.nameTypography?.fontKey,
    cd.typeTypography?.fontKey,
    cd.rulesTypography?.fontKey,
    cd.flavorTypography?.fontKey,
    cd.ptTypography?.fontKey,
    cd.metadataTypography?.fontKey,
  ].filter((k): k is NonNullable<typeof k> => typeof k === 'string' && k.length > 0)
}

export default function App() {
  const [isMounted, setIsMounted] = useState(false)
  const [saveOpen, setSaveOpen] = useState(false)
  const [printOpen, setPrintOpen] = useState(false)
  const [segment, setSegment] = useInspectorSegment()
  const [searchParams, setSearchParams] = useSearchParams()
  const fontsLoaded = useCardStore((s) => s.fontsLoaded)
  const setFontsLoaded = useCardStore((s) => s.setFontsLoaded)

  useEffect(() => {
    let cancelled = false
    const fontsApi = (document as Document & { fonts?: FontFaceSet }).fonts

    async function loadRequiredFonts() {
      try {
        const coreLoad = fontsApi
          ? Promise.allSettled(CORE_FONT_SPECS.map((d) => fontsApi.load(d)))
          : Promise.resolve([])
        await Promise.race([
          coreLoad.then(() => undefined),
          new Promise<void>((resolve) => window.setTimeout(resolve, 900)),
        ])
        if (cancelled) return
        setFontsLoaded(true)
        await coreLoad
      } catch {
        if (!cancelled) setFontsLoaded(true)
      }
      if (cancelled) return
      void ensureCreativeFontsLoaded(cardTypographyFontKeys())
    }

    loadRequiredFonts()
    return () => {
      cancelled = true
    }
  }, [setFontsLoaded])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Deep-link: /?sheet=print|save (or ?print=1 / ?save=1) opens the matching sheet.
  useEffect(() => {
    const sheet = searchParams.get('sheet')
    const openPrintParam = searchParams.get('print') === '1' || sheet === 'print'
    const openSaveParam = searchParams.get('save') === '1' || sheet === 'save'
    if (!openPrintParam && !openSaveParam) return
    if (openPrintParam) setPrintOpen(true)
    if (openSaveParam) setSaveOpen(true)
    const next = new URLSearchParams(searchParams)
    next.delete('print')
    next.delete('save')
    next.delete('sheet')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  // New Card / flow reset: always land on Content + pill 1 Start (no drill).
  useEffect(() => {
    const onFlowStep = (e: Event) => {
      const detail = (e as CustomEvent<{ stepId?: string }>).detail
      if (detail?.stepId === 'start') {
        setSegment('content')
      }
    }
    window.addEventListener('umps-flow-step', onFlowStep)
    return () => window.removeEventListener('umps-flow-step', onFlowStep)
  }, [setSegment])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return
      const t = e.target
      if (
        t instanceof HTMLInputElement ||
        t instanceof HTMLTextAreaElement ||
        (t instanceof HTMLElement && t.isContentEditable)
      ) {
        return
      }
      const key = e.key.toLowerCase()
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault()
        useCardStore.getState().undo()
      } else if (key === 'y' || (key === 'z' && e.shiftKey)) {
        e.preventDefault()
        useCardStore.getState().redo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const openSave = useCallback(() => setSaveOpen(true), [])
  const closeSave = useCallback(() => setSaveOpen(false), [])
  const openPrint = useCallback(() => setPrintOpen(true), [])
  const closePrint = useCallback(() => setPrintOpen(false), [])

  /** Content / Look / Details: switch segment and always show the section list (no auto drill-in). */
  const selectSegment = useCallback(
    (next: InspectorSegment) => {
      clearStudioInspectorDrill()
      setSegment(next)
    },
    [setSegment],
  )

  const onRequestImport = useCallback(() => {
    setSegment('content')
    try {
      window.localStorage.setItem('umps-left-open-section', 'import-sync')
      window.localStorage.setItem('umps-right-open-section', 'none')
    } catch {
      /* private mode */
    }
    window.dispatchEvent(new CustomEvent('umps-open-import'))
  }, [setSegment])

  return (
    <div data-app-theme="studio">
      <div className="app-frame app-frame-viewport overflow-hidden relative text-[var(--sb-text-strong)]">
        {!fontsLoaded ? (
          <div
            className="pointer-events-none absolute inset-0 z-[var(--ui-z-font-blocking)] flex items-center justify-center bg-black/10"
            aria-live="polite"
          >
            <div className={`${UI_PANEL_OVERLAY} ui-panel--pad-lg ${UI_TEXT_SECTION_HEADER}`}>Loading Fonts...</div>
          </div>
        ) : null}

        <div className="app-workspace-inset flex h-full min-h-0 w-full flex-col">
          <StudioTopBar
            segment={segment}
            onSegmentChange={selectSegment}
            onOpenSave={openSave}
            onOpenPrint={openPrint}
          />
          <div className="studio-workspace relative flex min-h-0 w-full flex-1 overflow-hidden lg:flex-row">
            <StudioCanvas onRequestSegment={selectSegment} onRequestImport={onRequestImport} />
            <StudioInspector
              segment={segment}
              className="hidden lg:flex lg:order-last"
              onOpenSave={openSave}
              onOpenPrint={openPrint}
              onSegmentChange={selectSegment}
            />
          </div>
          <div className="studio-phone-dock lg:hidden">
            <StudioInspector
              segment={segment}
              phone
              onOpenSave={openSave}
              onOpenPrint={openPrint}
              onSegmentChange={selectSegment}
            />
          </div>
        </div>
        {isMounted ? <StudioSaveSheet open={saveOpen} onClose={closeSave} /> : null}
        {isMounted ? <StudioPrintSheet open={printOpen} onClose={closePrint} /> : null}
        {isMounted ? <QuickViewModal /> : null}
        {/* Single mount — desktop+phone both have SidebarLeft; avoid duplicate portals. */}
        {isMounted ? (
          <Suspense fallback={null}>
            <ManaSymbolPopup />
          </Suspense>
        ) : null}
      </div>
    </div>
  )
}
