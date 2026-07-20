/// <reference types="vitest/config" />
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { staticPagesPlugin } from './scripts/static-pages.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages project page is served from /roadto100k-site/.
  // Change this to '/' if a custom domain is added.
  base: '/roadto100k-site/',
  plugins: [react(), tailwindcss(), staticPagesPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
  },
})
