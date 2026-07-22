import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const container = document.getElementById('root')!
const tree = (
  <StrictMode>
    <App />
  </StrictMode>
)

// `npm run build` prerenders the page into #root (scripts/prerender.ts), so the
// production bundle adopts that markup instead of discarding and redrawing it.
// In dev the container is empty and there is nothing to hydrate.
if (container.firstChild) {
  hydrateRoot(container, tree)
} else {
  createRoot(container).render(tree)
}
