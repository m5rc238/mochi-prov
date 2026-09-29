import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitest/config'

import { SITE_PAGES } from './shared/pages.ts'

const here = fileURLToPath(new URL('.', import.meta.url))
const fromRoot = (...parts: string[]) => resolve(here, ...parts)

// The site is a small set of static pages: the research catalog, one
// documentation page per prototype, the shared evidence model, and the Proto 01
// app itself. They are separate documents rather than client-side routes.
//
// The list lives in `shared/pages.ts` so the tests can check it; it is resolved
// to absolute paths here because that is what Rollup wants.
export const pages: Record<string, string> = Object.fromEntries(
  Object.entries(SITE_PAGES).map(([name, path]) => [name, fromRoot(path)]),
)

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: pages,
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [fromRoot('prototypes/proto-01/app/src/test/setup.ts')],
    css: false,
  },
})
