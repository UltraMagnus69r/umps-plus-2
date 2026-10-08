import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import App from './App'

const PrintFeaturePage = lazy(() => import('./features/print/PrintFeaturePage'))

export default function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/print"
        element={
          <Suspense fallback={<div className="p-6 text-sm">Loading print sheets…</div>}>
            <PrintFeaturePage />
          </Suspense>
        }
      />
      <Route path="/*" element={<App />} />
    </Routes>
  )
}
