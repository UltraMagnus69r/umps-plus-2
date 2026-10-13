import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './AppRoutes'
import { seedStudioFlowStartOnBoot } from './authority/studioFlowAuthority'
import './index.css'

// Every full page load opens Studio at pill 1 Start (collapsed menus).
// Session card-data restore is unchanged; only inspector flow UI is reset.
seedStudioFlowStartOnBoot()

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Keep installability wiring silent in production.
    })
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </React.StrictMode>,
)
