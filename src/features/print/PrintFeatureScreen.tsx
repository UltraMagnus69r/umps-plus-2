import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { letterSheetLayoutFacts } from './authority/printFeatureAuthority'
import { ProxyPrinterWorkspace } from './components/ProxyPrinterWorkspace'

export function PrintFeatureScreen() {
  const navigate = useNavigate()

  return (
    <>
      <header className="print-studio-chrome">
        <button
          type="button"
          className="print-studio-chrome__back"
          onClick={() => navigate('/')}
          aria-label="Back to Studio"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          <span>Studio</span>
        </button>
        <div className="print-studio-chrome__title">
          <div className="print-studio-chrome__brand">PipMint</div>
          <div className="print-studio-chrome__heading">Proxy Printer</div>
        </div>
        <div className="print-studio-chrome__meta">
          {letterSheetLayoutFacts.gridLabel} · 600 DPI
        </div>
      </header>
      <main className="printer-screen">
        <ProxyPrinterWorkspace variant="page" consumePendingOnMount />
      </main>
    </>
  )
}
