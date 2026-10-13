import { UI_PANEL_OVERLAY } from './authority/panelSurfaceAuthority'
import { UI_TEXT_SECTION_HEADER } from './authority/typographyAuthority'
import { useEffect, useState } from 'react'
import SidebarLeft from './components/layout/SidebarLeft'
import CenterRail from './components/layout/CenterRail'
import SidebarRight from './components/layout/SidebarRight'
import BottomBar from './components/layout/BottomBar'
import ManaSymbolPopup from './components/layout/ManaSymbolPopup'
import QuickViewModal from './components/layout/QuickViewModal'
import { useCardStore } from './store/useCardStore'
import { CORE_FONT_SPECS, ensureCreativeFontsLoaded } from './data/fonts'

type PhonePane = 'card' | 'data' | 'style'
const PHONE_PANE_KEY = 'umps-phone-pane'

function readPhonePane(): PhonePane {
  try {
    const value = sessionStorage.getItem(PHONE_PANE_KEY)
    if (value === 'card' || value === 'data' || value === 'style') return value
  } catch {
    /* private mode */
  }
  return 'card'
}

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
  const [phonePane, setPhonePane] = useState<PhonePane>('card')
  const fontsLoaded = useCardStore((s) => s.fontsLoaded)
  const setFontsLoaded = useCardStore((s) => s.setFontsLoaded)

  useEffect(() => {
    let cancelled = false
    const fontsApi = (document as Document & { fonts?: FontFaceSet }).fonts

    async function loadRequiredFonts() {
      try {
        // Soft gate: load the five core faces only — do not wait on full document fonts.ready
        // (catalog faces load on demand). Cap wait so chrome is usable on slow networks.
        const coreLoad = fontsApi
          ? Promise.allSettled(CORE_FONT_SPECS.map((d) => fontsApi.load(d)))
          : Promise.resolve([])
        await Promise.race([
          coreLoad.then(() => undefined),
          new Promise<void>((resolve) => window.setTimeout(resolve, 900)),
        ])
        if (cancelled) return
        // With font-display: swap, allow the editor through even if a core face is still settling.
        setFontsLoaded(true)
        await coreLoad
      } catch {
        if (!cancelled) setFontsLoaded(true)
      }
      if (cancelled) return
      // Only load faces the current card already uses — not the full catalog.
      void ensureCreativeFontsLoaded(cardTypographyFontKeys())
    }

    loadRequiredFonts()
    return () => {
      cancelled = true
    }
  }, [setFontsLoaded])
  useEffect(() => {
    setIsMounted(true)
    setPhonePane(readPhonePane())
  }, [])

  useEffect(() => {
    try {
      sessionStorage.setItem(PHONE_PANE_KEY, phonePane)
    } catch {
      /* private mode */
    }
  }, [phonePane])

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

  return (
    <div data-app-theme="googled">
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
          <div className="phone-pane-switch lg:hidden" role="tablist" aria-label="Editor section">
            {(
              [
                ['card', 'Card'],
                ['data', 'Data'],
                ['style', 'Style'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={phonePane === id}
                className="phone-pane-switch__btn"
                onClick={() => setPhonePane(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <div
            className="app-workspace relative flex min-h-0 w-full flex-1 flex-col overflow-x-hidden lg:flex-row"
            data-phone-pane={phonePane}
          >
            <SidebarLeft />
            <CenterRail />
            <SidebarRight />
          </div>
        </div>
        {isMounted ? <BottomBar /> : null}
        {isMounted ? <ManaSymbolPopup /> : null}
        {isMounted ? <QuickViewModal /> : null}
      </div>
    </div>
  )
}
