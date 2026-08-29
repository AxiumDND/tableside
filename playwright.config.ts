import { defineConfig } from '@playwright/test'

// End-to-end smoke tests drive the real Electron app (see e2e/). They require a
// production build in out/ first — `pretest:e2e` runs `npm run build`.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 30_000 },
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list'
})
