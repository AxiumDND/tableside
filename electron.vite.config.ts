import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Content-Security-Policy for the packaged renderer. Scripts are restricted to
// the app's own bundle (no inline/eval, no remote scripts); local schemes used
// for campaign media (tabledm:, data:, blob:, file:) stay allowed. Injected at
// build time only so the Vite dev server and its HMR are left untouched.
const PRODUCTION_CSP = [
  "default-src 'self' file: tabledm:",
  "script-src 'self' file:",
  "style-src 'self' file: 'unsafe-inline'",
  "img-src 'self' file: tabledm: data: blob: https: http:",
  "media-src 'self' file: tabledm: data: blob: https: http:",
  "font-src 'self' file: data:",
  "connect-src 'self' file: tabledm: data:",
  "frame-src 'self' file: tabledm:",
  "worker-src 'self' file: blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'"
].join('; ')

function cspMetaPlugin(): Plugin {
  return {
    name: 'tableside-csp-meta',
    apply: 'build',
    transformIndexHtml() {
      return [
        {
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: PRODUCTION_CSP },
          injectTo: 'head-prepend'
        }
      ]
    }
  }
}

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve('src/renderer/src')
      }
    },
    build: {
      // Chromium in Electron supports modulepreload natively, so skip Vite's
      // inline polyfill script — that keeps the CSP free of inline scripts.
      modulePreload: { polyfill: false }
    },
    plugins: [react(), tailwindcss(), cspMetaPlugin()]
  }
})
