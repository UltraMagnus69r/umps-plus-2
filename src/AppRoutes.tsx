import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import App from './App'

const PrintFeaturePage = lazy(() => import('./features/print/PrintFeaturePage'))

function PrintLoadingSkeleton() {
  const skel = {
    background: 'linear-gradient(90deg, #e8eaed, #f5f6f8, #e8eaed)',
    backgroundSize: '200% 100%',
    animation: 'studio-sheet-present 0.01s linear',
  } as const
  return (
    <div
      data-app-theme="studio"
      style={{
        minHeight: '100dvh',
        fontFamily: 'var(--font-ui, system-ui, sans-serif)',
        background: 'linear-gradient(180deg, #fbfbfc 0%, #f5f6f8 48%, #eef0f3 100%)',
        padding: '28px 24px',
      }}
      aria-busy="true"
      aria-live="polite"
    >
      <div
        style={{
          maxWidth: 1260,
          margin: '0 auto',
          display: 'grid',
          gap: 16,
        }}
      >
        <div style={{ ...skel, height: 48, borderRadius: 14, backgroundColor: '#e8eaed' }} />
        <p style={{ margin: 0, fontSize: 14, color: '#636366' }}>Loading print sheets…</p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
          }}
        >
          <div style={{ ...skel, aspectRatio: '8.5 / 11', borderRadius: 16, border: '1px solid rgba(60,60,67,0.12)', backgroundColor: '#e8eaed' }} />
          <div style={{ ...skel, aspectRatio: '8.5 / 11', borderRadius: 16, border: '1px solid rgba(60,60,67,0.12)', backgroundColor: '#e8eaed' }} />
        </div>
      </div>
    </div>
  )
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/print"
        element={
          <Suspense fallback={<PrintLoadingSkeleton />}>
            <PrintFeaturePage />
          </Suspense>
        }
      />
      <Route path="/*" element={<App />} />
    </Routes>
  )
}
