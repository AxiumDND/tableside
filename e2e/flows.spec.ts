import { test, expect, type ElectronApplication, type Page } from '@playwright/test'
import { launchTableside } from './harness'

let app: ElectronApplication
let dmWindow: Page

test.beforeAll(async () => {
  app = await launchTableside()
  dmWindow = await app.firstWindow()
  await dmWindow.waitForLoadState('domcontentloaded')
  // First launch loads the Greystead sample; wait until the tree is populated.
  await expect(dmWindow.getByText(/Greystead/i).first()).toBeVisible({ timeout: 30_000 })
})

test.afterAll(async () => {
  await app?.close()
})

test('combat tracker adds a combatant and starts a round', async () => {
  await dmWindow.getByRole('button', { name: 'Combat' }).click()

  await dmWindow.getByPlaceholder('Name').fill('Dire Wolf')
  await dmWindow.getByPlaceholder('Init').fill('15')
  await dmWindow.getByRole('button', { name: 'Add', exact: true }).click()
  await expect(dmWindow.getByText('Dire Wolf').first()).toBeVisible()

  await dmWindow.getByRole('button', { name: /start combat/i }).click()
  // Combat is running: the round controls + Next turn replace Start combat.
  await expect(dmWindow.getByRole('button', { name: 'Next turn' })).toBeVisible()
  await expect(dmWindow.getByText(/Round/).first()).toBeVisible()
})

test('map note exposes fog tools and covers the map without error', async () => {
  const maps = dmWindow.getByText(/^Maps$/).first()
  if (await maps.isVisible().catch(() => false)) await maps.click()
  await dmWindow.getByText(/Pale Well Caves/i).first().click()

  // MapView mounted for a map note → primary tool toolbar is present.
  await expect(dmWindow.getByRole('button', { name: 'Fog' })).toBeVisible({ timeout: 15_000 })
  await dmWindow.getByRole('button', { name: 'Fog' }).click()
  await dmWindow.getByRole('button', { name: 'Cover all' }).click()

  // App stayed responsive: the fog can be cleared again.
  await expect(dmWindow.getByRole('button', { name: 'Clear fog' })).toBeVisible()
})

test('editing a note autosaves when switching away and back', async () => {
  const npcs = dmWindow.getByText(/^NPCs$/).first()
  if (await npcs.isVisible().catch(() => false)) await npcs.click()

  await dmWindow.getByText(/^Ash$/).first().click()
  await dmWindow.getByRole('button', { name: 'Edit' }).click()

  const marker = `Autosave marker ${Date.now()}`
  const editor = dmWindow.locator('textarea')
  await expect(editor).toBeVisible()
  await editor.fill(`# Ash\n\n${marker}\n`)

  // Switch to another note WITHOUT pressing Save → exercises flush-on-leave autosave.
  await dmWindow.getByText(/^Old Tam$/).first().click()
  // Return to Ash → the appended marker was persisted and re-rendered from disk.
  await dmWindow.getByText(/^Ash$/).first().click()
  await expect(dmWindow.getByText(marker).first()).toBeVisible({ timeout: 15_000 })
})
