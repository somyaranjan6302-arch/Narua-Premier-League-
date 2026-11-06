import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ScorerPortal from './components/ScorerPortal.jsx'
import AuctionBroadcast from './components/AuctionBroadcast.jsx'
import { NplProvider } from './context/NplContext.jsx'

const currentPath = window.location.pathname.replace(/\/+$/, '')
const RootApp = currentPath === '/scorer'
  ? ScorerPortal
  : currentPath === '/auction-live'
    ? AuctionBroadcast
    : App

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <NplProvider>
      <RootApp />
    </NplProvider>
  </StrictMode>,
)
