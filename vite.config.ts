import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { siteHeadPlugin, staticPagesPlugin } from './scripts/static-pages.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages project page is served from /roadto100k-site/.
  // Change this to '/' if a custom domain is added.
  base: '/roadto100k-site/',
  plugins: [react(), tailwindcss(), siteHeadPlugin(), staticPagesPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    // The gate must only ever judge this checkout. Without this, vitest also
    // collects tests from scratch checkouts under .claude/worktrees/ and
    // reports red (or green) for files that are not in HEAD.
    exclude: [...configDefaults.exclude, '.claude/**', '.playwright-mcp/**'],
  },
})
