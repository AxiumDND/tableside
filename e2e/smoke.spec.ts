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
    args: ['.', `--user-data-dir=${userDataDir}`, '--no-sandbox'],
    env: { ...process.env, NODE_ENV: 'production' }
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

  // First launch opens the Greystead one-shot.
  await expect(dmWindow.getByText(/Greystead/i).first()).toBeVisible()
})

test('Lookup opens and searches the offline SRD', async () => {
  await dmWindow.getByRole('button', { name: 'Lookup' }).click()

  const search = dmWindow.getByPlaceholder(/poisoned/i)
  await expect(search).toBeVisible()
  await search.fill('goblin')

  // A matching SRD entry should surface for the query.
  await expect(dmWindow.getByText(/goblin/i).first()).toBeVisible()
})
