import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import './styles/editorial.css'
import './styles/technical-motion.css'
import './styles/micro-interactions.css'
import './styles/stage-content.css'
import './styles/region-theme.css'
import './styles/viewport-overview.css'
import './styles/stage-focus.css'
import './styles/single-row-map.css'
import './styles/process-composition.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
