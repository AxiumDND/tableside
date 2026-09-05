import { test, expect, type ElectronApplication, type Page } from '@playwright/test'
import { launchTableside } from './harness'

let app: ElectronApplication
let dmWindow: Page

test.beforeAll(async () => {
  app = await launchTableside()
  dmWindow = await app.firstWindow()
  await dmWindow.waitForLoadState('domcontentloaded')
})

test.afterAll(async () => {
  await app?.close()
})

test('DM console boots with the bundled sample campaign', async () => {
  // Toolbar renders → the renderer bundle loaded and mounted.
  await expect(dmWindow.getByRole('button', { name: 'Tools' })).toBeVisible()
  await expect(dmWindow.getByRole('button', { name: 'Combat' })).toBeVisible()

  // First launch opens the Greystead one-shot (legacy table-dm migrate skipped in e2e).
  await expect(dmWindow.getByText(/Greystead/i).first()).toBeVisible({ timeout: 30_000 })
})

test('Dice tool and built-in Sfx oneshots are on the console', async () => {
  const tools = dmWindow.getByRole('button', { name: 'Tools' })
  await tools.click()
  await dmWindow.getByRole('navigation', { name: 'Tools' }).getByRole('button', { name: 'Dice' }).click()
  await expect(dmWindow.getByRole('button', { name: 'Show', exact: true })).toBeVisible()
  await expect(dmWindow.getByText('Play sound on Roll')).toBeVisible()

  await dmWindow.getByRole('button', { name: 'Music' }).click()
  await expect(dmWindow.getByRole('heading', { name: 'Soundboard' })).toBeVisible()
  await expect(dmWindow.getByRole('button', { name: 'Dice (one)', exact: true })).toBeVisible()
  await expect(dmWindow.getByRole('button', { name: 'Dice (two)', exact: true })).toBeVisible()
  await expect(dmWindow.getByRole('button', { name: 'Dice (handful)', exact: true })).toBeVisible()
})

test('Timer tool shows a waiting glass and a separate Start control', async () => {
  const tools = dmWindow.getByRole('button', { name: 'Tools' })
  await tools.click()
  await dmWindow.getByRole('navigation', { name: 'Tools' }).getByRole('button', { name: 'Timer' }).click()
  await expect(dmWindow.getByRole('button', { name: 'Show', exact: true })).toBeVisible()
  await expect(dmWindow.getByRole('button', { name: 'Start' })).toBeVisible()
  await expect(dmWindow.getByRole('button', { name: 'Start' })).toBeDisabled()
  await expect(dmWindow.getByText('Chime at zero')).toBeVisible()
})

test('Dice tray exposes show-to-players and roll-sound toggles', async () => {
  await expect(dmWindow.getByText('Show rolls to players')).toBeVisible()
  await expect(dmWindow.getByText('Play roll sound')).toBeVisible()
  await expect(dmWindow.getByRole('button', { name: 'Adv', exact: true })).toBeVisible()
  await expect(dmWindow.getByRole('button', { name: 'Dis', exact: true })).toBeVisible()
})

test('Lookup opens and searches the offline SRD', async () => {
  const tools = dmWindow.getByRole('button', { name: 'Tools' })
  // Panel toggles — open if the search field is not already visible.
  const search = dmWindow.getByPlaceholder(/poisoned/i)
  if (!(await search.isVisible().catch(() => false))) {
    await tools.click()
  }
  const lookupTab = dmWindow.getByRole('button', { name: 'Lookup' })
  if (!(await search.isVisible().catch(() => false))) {
    await lookupTab.click()
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
