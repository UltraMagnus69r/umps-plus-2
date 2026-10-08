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
import { CORE_FONT_SPECS, REQUIRED_FONT_SPECS } from './data/fonts'

export default function App() {
  const [isMounted, setIsMounted] = useState(false)
  const fontsLoaded = useCardStore((s) => s.fontsLoaded)
  const setFontsLoaded = useCardStore((s) => s.setFontsLoaded)

  useEffect(() => {
    let cancelled = false

    async function loadRequiredFonts() {
      try {
        await Promise.allSettled(
          CORE_FONT_SPECS.map((d) => (document as any).fonts.load(d)),
        )
        await (document as any).fonts.ready
        const coreOk = CORE_FONT_SPECS.every((d) => (document as any).fonts.check(d))
        if (!cancelled && coreOk) setFontsLoaded(true)
      } catch {
        // Strict: do not enable Layer 4 on failure.
      }
      if (cancelled) return
      const core = new Set<string>(CORE_FONT_SPECS)
      const extended = REQUIRED_FONT_SPECS.filter((spec) => !core.has(spec))
      void Promise.allSettled(extended.map((d) => (document as any).fonts.load(d)))
    }

    loadRequiredFonts()
    return () => {
      cancelled = true
    }
  }, [setFontsLoaded])
  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <div data-app-theme="googled">
      <div className="app-frame h-screen w-screen overflow-hidden relative text-[var(--sb-text-strong)]">
        {!fontsLoaded ? (
          <div className="absolute inset-0 z-[var(--ui-z-font-blocking)] flex items-center justify-center bg-black/20">
            <div className={`${UI_PANEL_OVERLAY} ui-panel--pad-lg ${UI_TEXT_SECTION_HEADER}`}>Loading Fonts...</div>
          </div>
        ) : null}

        <div className="h-full w-full pb-[4rem] sm:pb-[4.25rem]">
          <div className="relative flex h-full min-h-0 min-w-0 w-full flex-col overflow-x-hidden lg:flex-row">
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
