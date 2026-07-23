import { Route, Routes } from 'react-router-dom'
import App from './App'
import PrintFeaturePage from './features/print/PrintFeaturePage'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/print" element={<PrintFeaturePage />} />
      <Route path="/*" element={<App />} />
    </Routes>
  )
}
