import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App                    from './App.jsx'
import SigningPage             from './pages/SigningPage.jsx'
import DashboardPage          from './pages/DashboardPage.jsx'
import DocumentDetailPage     from './pages/DocumentDetailPage.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/"              element={<DashboardPage />} />
        <Route path="/new"           element={<App />} />
        <Route path="/documents/:id" element={<DocumentDetailPage />} />
        <Route path="/sign/:token"   element={<SigningPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
