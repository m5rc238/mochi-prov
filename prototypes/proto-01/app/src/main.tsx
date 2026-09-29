import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// React Flow's base layout rules first; the design system overrides them after.
import '@xyflow/react/dist/style.css'

import { App } from './app/App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
