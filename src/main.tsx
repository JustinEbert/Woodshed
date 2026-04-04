import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { MetronomeProvider } from './state/metronome'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MetronomeProvider>
      <App />
    </MetronomeProvider>
  </StrictMode>,
)
