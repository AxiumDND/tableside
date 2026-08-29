import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  test,
  expect,
  _electron as electron,
  type ElectronApplication,
  type Page
} from '@playwright/test'

let app: ElectronApplication
let dmWindow: Page

test.beforeAll(async () => {
  // Isolate the profile so the run is hermetic (fresh first launch loads the
  // bundled Greystead sample) and never collides with a real install.
  const userDataDir = mkdtempSync(join(tmpdir(), 'tableside-e2e-'))
  app = await electron.launch({
    // Pin the local Electron binary so Playwright does not download another copy.
    executablePath: join(process.cwd(), 'node_modules', 'electron', 'dist', 'electron.exe'),
    args: ['.', `--user-data-dir=${userDataDir}`, '--no-sandbox'],
    env: {
      ...process.env,
      NODE_ENV: 'production',
      TABLESIDE_E2E: '1'
    },
    timeout: 120_000
  })
  dmWindow = await app.firstWindow()
  await dmWindow.waitForLoadState('domcontentloaded')
})

test.afterAll(async () => {
  await app?.close()
})

test('DM console boots with the bundled sample campaign', async () => {
  // Toolbar renders → the renderer bundle loaded and mounted.
  await expect(dmWindow.getByRole('button', { name: 'Lookup' })).toBeVisible()
  await expect(dmWindow.getByRole('button', { name: 'Combat' })).toBeVisible()

  // First launch opens the Greystead one-shot (legacy table-dm migrate skipped in e2e).
  await expect(dmWindow.getByText(/Greystead/i).first()).toBeVisible({ timeout: 30_000 })
})

test('Lookup opens and searches the offline SRD', async () => {
  const lookup = dmWindow.getByRole('button', { name: 'Lookup' })
  // Panel toggles — open if the search field is not already visible.
  const search = dmWindow.getByPlaceholder(/poisoned/i)
  if (!(await search.isVisible().catch(() => false))) {
    await lookup.click()
  }
  await expect(search).toBeVisible()
  await search.fill('goblin')

  // A matching SRD entry should surface for the query.
  await expect(dmWindow.getByText(/goblin/i).first()).toBeVisible()
})

test('Greystead night sheet exposes nested combat Add to initiative', async () => {
  const sessions = dmWindow.getByText(/^Sessions$/i).first()
  if (await sessions.isVisible().catch(() => false)) {
    await sessions.click()
  }
  await dmWindow.getByText(/Session 1 — Game Night Sheet/i).first().click()
  await expect(dmWindow.getByRole('button', { name: 'Add to initiative' }).first()).toBeVisible({
    timeout: 30_000
  })
})
