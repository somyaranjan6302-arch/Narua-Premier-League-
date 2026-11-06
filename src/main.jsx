import { Component, lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { NplProvider } from './context/NplContext.jsx'

const App = lazy(() => import('./App.jsx'))
const ScorerPortal = lazy(() => import('./components/ScorerPortal.jsx'))
const AuctionBroadcast = lazy(() => import('./components/AuctionBroadcast.jsx'))

class AppErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.error('NPL app failed to render:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-[100dvh] items-center justify-center bg-[#070E20] p-5 text-center text-white">
          <section role="alert" className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-950 p-6 shadow-2xl">
            <h1 className="font-sports text-2xl">NPL could not load</h1>
            <p className="mt-2 text-sm text-slate-300">
              Reload the page to try again. Your saved tournament data is not affected.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 min-h-11 rounded-xl bg-amber-500 px-5 py-2 font-bold text-slate-950"
            >
              Reload page
            </button>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}

const currentPath = window.location.pathname.replace(/\/+$/, '')
const RootApp = currentPath === '/scorer'
  ? ScorerPortal
  : currentPath === '/auction-live'
    ? AuctionBroadcast
    : App

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppErrorBoundary>
      <Suspense fallback={
        <main className="flex min-h-[100dvh] items-center justify-center bg-[#070E20] p-5 text-center text-white">
          <p role="status">Loading NPL…</p>
        </main>
      }>
        <NplProvider>
          <RootApp />
        </NplProvider>
      </Suspense>
    </AppErrorBoundary>
  </StrictMode>,
)
