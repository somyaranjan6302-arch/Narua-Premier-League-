import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { NplProvider } from './context/NplContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <NplProvider>
      <App />
    </NplProvider>
  </StrictMode>,
)

