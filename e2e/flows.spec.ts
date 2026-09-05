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

test('Help Updates can opt into test (beta) updates', async () => {
  await dmWindow.getByRole('button', { name: 'Help & settings' }).click()
  await expect(dmWindow.getByRole('heading', { name: 'Help & settings' })).toBeVisible()
  await dmWindow.getByRole('button', { name: 'Updates' }).click()
  const beta = dmWindow.getByRole('checkbox', { name: /include test \(beta\) updates/i })
  await expect(beta).toBeVisible()
  await expect(beta).not.toBeChecked()
  await beta.check()
  await expect(beta).toBeChecked()
  await expect(dmWindow.getByRole('button', { name: 'Check for updates' })).toBeVisible()
  await dmWindow.getByRole('button', { name: 'Check for updates' }).click()
  await expect(dmWindow.getByText(/installed app/i)).toBeVisible()
  await dmWindow.getByRole('button', { name: 'Help & settings' }).click()
})

test('header panel icon hides and restores the left sidebar', async () => {
  await expect(dmWindow.getByText('Players see')).toBeVisible()
  await expect(dmWindow.getByRole('button', { name: 'Show sidebar' })).toHaveCount(0)

  await dmWindow.getByRole('button', { name: 'Hide sidebar' }).click()
  await expect(dmWindow.getByText('Players see')).toHaveCount(0)
  await expect(dmWindow.getByRole('button', { name: 'Show sidebar' })).toBeVisible()

  await dmWindow.getByRole('button', { name: 'Show sidebar' }).click()
  await expect(dmWindow.getByText('Players see')).toBeVisible()
  await expect(dmWindow.getByRole('button', { name: 'Hide sidebar' })).toBeVisible()
})

test('header panel icon hides and restores the right panel', async () => {
  await dmWindow.getByRole('button', { name: 'Combat' }).click()
  await expect(dmWindow.getByRole('heading', { name: 'Combat' })).toBeVisible()

  await dmWindow.getByRole('button', { name: 'Hide right panel' }).click()
  await expect(dmWindow.getByRole('heading', { name: 'Combat' })).toHaveCount(0)
  await expect(dmWindow.getByRole('button', { name: 'Show right panel' })).toBeVisible()

  await dmWindow.getByRole('button', { name: 'Show right panel' }).click()
  await expect(dmWindow.getByRole('heading', { name: 'Combat' })).toBeVisible()
  await dmWindow.getByRole('button', { name: 'Hide right panel' }).click()
})

test('Party folder creates a party roster note', async () => {
  await dmWindow.getByText(/^Party$/).first().click({ button: 'right' })
  await dmWindow.getByText('New party roster…').click()
  await dmWindow.getByRole('heading', { name: 'New party roster' }).waitFor()
  await dmWindow.getByPlaceholder('Name').fill('Party Roster')
  await dmWindow.getByRole('button', { name: 'Create' }).click()

  await expect(dmWindow.getByRole('heading', { name: 'Party Roster', level: 1 })).toBeVisible({
    timeout: 15_000
  })
  await expect(dmWindow.getByText('Companions stay in NPCs/')).toBeVisible()
  await expect(dmWindow.getByRole('columnheader', { name: 'Race' })).toBeVisible()
  await expect(dmWindow.getByRole('button', { name: 'Add to combat' })).toHaveCount(0)
})

test('Sessions folder creates a session recap note', async () => {
  await dmWindow.getByText(/^Sessions$/).first().click({ button: 'right' })
  await dmWindow.getByText('New session recap…').click()
  await dmWindow.getByRole('heading', { name: 'New session recap' }).waitFor()
  await dmWindow.getByPlaceholder('Name').fill('Session 9')
  await dmWindow.getByRole('button', { name: 'Create' }).click()

  await expect(dmWindow.getByRole('heading', { name: 'Session 9 — Recap', level: 1 })).toBeVisible({
    timeout: 15_000
  })
  await expect(dmWindow.getByRole('heading', { name: 'What happened' })).toBeVisible()
  await expect(dmWindow.getByRole('heading', { name: 'Who sat' })).toBeVisible()
})

test('combat tracker adds a combatant and starts a round', async () => {
  const init = dmWindow.getByPlaceholder('Init')
  if (!(await init.isVisible().catch(() => false))) {
    await dmWindow.getByRole('button', { name: 'Combat' }).click()
  }
  await expect(init).toBeVisible()

  await dmWindow.getByPlaceholder('Name').fill('Dire Wolf')
  await init.fill('15')
  await dmWindow.getByRole('button', { name: 'Add', exact: true }).click()
  await expect(dmWindow.getByText('Dire Wolf').first()).toBeVisible()

  await expect(dmWindow.getByRole('checkbox', { name: /combat music/i })).toBeChecked()
  await dmWindow.getByRole('button', { name: /start combat/i }).click()
  // Combat is running: the round controls + Next turn replace Start combat.
  await expect(dmWindow.getByRole('button', { name: 'Next turn' })).toBeVisible()
  await expect(dmWindow.getByText(/Round/).first()).toBeVisible()
  await expect(dmWindow.getByRole('button', { name: 'End combat' })).toBeVisible()

  await dmWindow.getByRole('button', { name: 'Conditions for Dire Wolf' }).click()
  const dialog = dmWindow.getByRole('dialog')
  await expect(dialog.getByRole('heading', { name: 'Dire Wolf' })).toBeVisible()
  const poisoned = dialog.getByRole('button', { name: 'Poisoned', exact: true })
  await expect(poisoned).toHaveAttribute('aria-pressed', 'false')
  await poisoned.click()
  await expect(poisoned).toHaveAttribute('aria-pressed', 'true')
  await dmWindow.getByRole('button', { name: 'Done' }).click()
  await expect(dmWindow.getByRole('button', { name: 'Clear Poisoned' })).toBeVisible()
})

test('map note exposes fog tools and covers the map without error', async () => {
  const maps = dmWindow.getByText(/^Maps$/).first()
  if (await maps.isVisible().catch(() => false)) await maps.click()
  await dmWindow.getByText(/Pale Well Caves/i).first().click()

  // MapView mounted for a map note → primary tool toolbar is present.
  await expect(dmWindow.getByRole('button', { name: 'Fog' })).toBeVisible({ timeout: 15_000 })
  await expect(dmWindow.getByRole('button', { name: 'Fit' })).toBeVisible()
  await expect(dmWindow.getByRole('button', { name: 'Scale map' })).toBeVisible()
  await expect(dmWindow.getByRole('button', { name: 'Line' })).toBeVisible()
  await expect(dmWindow.getByRole('button', { name: 'Cone' })).toBeVisible()
  await expect(dmWindow.getByRole('button', { name: 'Round' })).toBeVisible()
  await expect(dmWindow.getByRole('button', { name: 'Square' })).toBeVisible()
  await dmWindow.getByRole('button', { name: 'Pin' }).click()
  await expect(dmWindow.getByRole('button', { name: 'Add pin' })).toBeVisible()
  await expect(dmWindow.getByRole('button', { name: 'Edit pin' })).toBeVisible()
  await expect(dmWindow.getByRole('button', { name: 'Lock pins' })).toBeVisible()

  await dmWindow.getByRole('button', { name: 'Fog' }).click()
  await dmWindow.getByRole('button', { name: 'Cover all' }).click()

  // App stayed responsive: the fog can be cleared again.
  await expect(dmWindow.getByRole('button', { name: 'Clear fog' })).toBeVisible()
})

test('map token can join combat and share condition chips', async () => {
  const maps = dmWindow.getByText(/^Maps$/).first()
  if (await maps.isVisible().catch(() => false)) await maps.click()
  await dmWindow.getByText(/Pale Well Caves/i).first().click()

  await dmWindow.getByRole('button', { name: 'Token' }).click()
  await dmWindow.getByRole('button', { name: /Monsters/ }).click()
  // Title is exact "Wolf"; name: 'Wolf' also matches leftover Dire Wolf combat rows.
  await dmWindow.getByTitle('Wolf', { exact: true }).click()
  await expect(dmWindow.getByText(/Click the map to place Wolf/)).toBeVisible()

  const stage = dmWindow.locator('.map-stage')
  await expect(stage.locator('img').first()).toBeVisible({ timeout: 15_000 })
  await stage.click({ position: { x: 220, y: 180 } })

  await expect(dmWindow.getByRole('button', { name: 'Add to combat' })).toBeVisible()
  await dmWindow.getByRole('button', { name: 'Add to combat' }).click()
  await expect(dmWindow.getByRole('heading', { name: 'Combat' })).toBeVisible()
  await expect(dmWindow.getByRole('button', { name: 'Open combat' })).toBeVisible()

  await dmWindow.getByRole('button', { name: 'Cnd', exact: true }).click()
  const dialog = dmWindow.getByRole('dialog')
  await expect(dialog.getByRole('heading', { name: 'Wolf', exact: true })).toBeVisible()
  // Prone is unused by the earlier Dire Wolf combat test (that row is already Poisoned).
  await dialog.getByRole('button', { name: 'Prone', exact: true }).click()
  await dmWindow.getByRole('button', { name: 'Done' }).click()
  await expect(dmWindow.getByRole('button', { name: 'Clear Prone' })).toBeVisible()
})

test('map can add every placed token to combat', async () => {
  const maps = dmWindow.getByText(/^Maps$/).first()
  if (await maps.isVisible().catch(() => false)) await maps.click()
  await dmWindow.getByText(/Pale Well Caves/i).first().click()

  await dmWindow.getByRole('button', { name: 'Token' }).click()
  await dmWindow.getByRole('button', { name: /Monsters/ }).click()
  await dmWindow.getByTitle('Wolf', { exact: true }).click()

  const stage = dmWindow.locator('.map-stage')
  await expect(stage.locator('img').first()).toBeVisible({ timeout: 15_000 })
  await stage.click({ position: { x: 260, y: 200 } })
  await stage.click({ position: { x: 300, y: 240 } })

  await expect(dmWindow.getByRole('button', { name: 'Add all to combat' })).toBeVisible()
  await dmWindow.getByRole('button', { name: 'Add all to combat' }).click()
  await expect(dmWindow.getByRole('heading', { name: 'Combat' })).toBeVisible()
  await expect(dmWindow.getByRole('button', { name: 'Open combat' })).toBeVisible()
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
