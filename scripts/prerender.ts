/**
 * Prerender the homepage into dist/index.html.
 *
 * The journal and Turkish pages have always been plain HTML; the homepage was
 * a `<div id="root"></div>` shell, so the ledger, the rules and the whole "The
 * work" proof section existed only after JavaScript ran. That is the one page
 * people actually land on.
 *
 * Runs after `vite build`, as its own process. It loads the real App through a
 * throwaway Vite server in SSR mode — the same resolution as the client build,
 * so `@/` aliases, Tailwind classes and TSX all behave identically and there is
 * no second bundle to keep in sync. No new dependency: vite is already here.
 *
 * Deterministic by construction: the only clock-dependent text on the page is
 * the day stamp, which the browser corrects on hydration (see DayStamp).
 */
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { createServer } from 'vite'
import { injectPrerenderedHtml } from '../src/lib/prerender.ts'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const INDEX = path.join(ROOT, 'dist', 'index.html')

const server = await createServer({
  root: ROOT,
  appType: 'custom',
  logLevel: 'warn',
  server: { middlewareMode: true, hmr: false, watch: null },
})

try {
  // Only the app goes through vite (aliases, TSX, CSS imports). React itself is
  // imported directly: vite externalises node_modules in SSR, so both sides end
  // up on the same instance, and running it through the transform pipeline
  // would try to rewrite a CommonJS build.
  const { default: App } = await server.ssrLoadModule('/src/App.tsx')

  const appHtml = renderToString(createElement(App))
  const html = readFileSync(INDEX, 'utf8')
  writeFileSync(INDEX, injectPrerenderedHtml(html, appHtml))

  const bytes = Buffer.byteLength(appHtml)
  console.log(`prerender: dist/index.html filled with ${bytes.toLocaleString('en-US')} bytes of app`)
} finally {
  await server.close()
}
