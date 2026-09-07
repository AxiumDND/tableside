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

async function openQuickTool(group: 'Prep' | 'Table', tool: 'NPC' | 'Improvise' | 'Links' | 'Dice' | 'Timer'): Promise<void> {
  if (await dmWindow.getByRole('heading', { name: tool, exact: true }).isVisible().catch(() => false)) return
  const bar = dmWindow.getByRole('navigation', { name: 'Quick links' })
  await bar.getByRole('button', { name: group }).click()
  await dmWindow.getByRole('menuitem', { name: tool }).click()
}

test('DM console boots with the bundled sample campaign', async () => {
  // Toolbar renders → the renderer bundle loaded and mounted.
  await expect(dmWindow.getByRole('button', { name: 'Lookup' })).toBeVisible()
  await expect(dmWindow.getByRole('button', { name: 'Combat' })).toBeVisible()
  await expect(dmWindow.getByRole('button', { name: 'Tools' })).toHaveCount(0)

  // First launch opens the Greystead one-shot (legacy table-dm migrate skipped in e2e).
  await expect(dmWindow.getByText(/Greystead/i).first()).toBeVisible({ timeout: 30_000 })
})

test('quick links bar lists party stats and conditions', async () => {
  const bar = dmWindow.getByRole('navigation', { name: 'Quick links' })
  await expect(bar).toBeVisible()
  await bar.getByRole('button', { name: /Party/ }).click()
  await expect(dmWindow.getByRole('menuitem', { name: /Bren Oak/ })).toBeVisible()
  await dmWindow.keyboard.press('Escape')
  await bar.getByRole('button', { name: /Conditions/ }).click()
  await expect(dmWindow.getByRole('menuitem', { name: /Poisoned/ })).toBeVisible()
})

test('quick links bar shows the Greystead in-world calendar', async () => {
  const bar = dmWindow.getByRole('navigation', { name: 'Quick links' })
  await dmWindow.keyboard.press('Escape')
  await expect(bar.getByRole('button', { name: /1 Seedmoon 412 AF/ })).toBeVisible()
  await expect(bar.getByRole('button', { name: 'Back one day' })).toBeVisible()
  await expect(bar.getByRole('button', { name: 'Back one hour' })).toBeVisible()
  await expect(bar.getByRole('button', { name: 'Forward one hour' })).toBeVisible()
  await expect(bar.getByRole('button', { name: 'Advance one day' })).toBeVisible()
  await expect(bar.getByRole('button', { name: 'Advance to next morning' })).toBeVisible()
  await expect(bar.getByRole('button', { name: 'Calendar settings' })).toBeVisible()
  await bar.getByRole('button', { name: 'Forward one hour' }).click()
  await expect(bar.getByRole('button', { name: /10am/ })).toBeVisible()
  await bar.getByRole('button', { name: 'Advance to next morning' }).click()
  await expect(bar.getByRole('button', { name: /2 Seedmoon 412 AF/ })).toBeVisible()
  await expect(bar.getByRole('button', { name: /6am/ })).toBeVisible()
  await bar.getByRole('button', { name: 'Calendar settings' }).click()
  await expect(dmWindow.getByRole('dialog', { name: 'Calendar' })).toBeVisible()
  await dmWindow.getByRole('radio', { name: /Greyhawk/ }).click()
  await expect(dmWindow.getByText(/1 Fireseek 576 CY/)).toBeVisible()
  await dmWindow.getByRole('button', { name: 'Cancel' }).click()
  await expect(bar.getByRole('button', { name: /2 Seedmoon 412 AF/ })).toBeVisible()
})

test('calendar can hide and show a light mark to players', async () => {
  const bar = dmWindow.getByRole('navigation', { name: 'Quick links' })
  await dmWindow.keyboard.press('Escape')
  await expect(bar.getByRole('button', { name: /Seedmoon/ })).toBeVisible()
  await expect(bar.getByRole('checkbox', { name: 'Show to players' })).toBeVisible()
  await bar.getByRole('checkbox', { name: 'Show to players' }).check()
  await expect(dmWindow.locator('.player-calendar-light')).toHaveAttribute('aria-label', /Sunrise|Morning|Afternoon|Sunset|Night/)
  await expect(dmWindow.locator('.player-calendar-light')).not.toContainText(/am|pm/i)
  await bar.getByRole('button', { name: 'Hide calendar on Quick bar' }).click()
  await expect(bar.getByRole('button', { name: 'Show calendar on Quick bar' })).toBeVisible()
  await expect(bar.getByRole('button', { name: /Seedmoon/ })).toHaveCount(0)
  await expect(dmWindow.locator('.player-calendar-light')).toBeVisible()
  await bar.getByRole('button', { name: 'Show calendar on Quick bar' }).click()
  await expect(bar.getByRole('button', { name: /Seedmoon/ })).toBeVisible()
  await bar.getByRole('checkbox', { name: 'Show to players' }).uncheck()
  await expect(dmWindow.locator('.player-calendar-light')).toHaveCount(0)
})

test('Dice tool and built-in Sfx oneshots are on the console', async () => {
  await openQuickTool('Table', 'Dice')
  await expect(dmWindow.getByRole('button', { name: 'Show', exact: true })).toBeVisible()
  await expect(dmWindow.getByText('Play sound on Roll')).toBeVisible()

  await dmWindow.getByRole('button', { name: 'Music' }).click()
  await expect(dmWindow.getByRole('heading', { name: 'Soundboard' })).toBeVisible()
  await expect(dmWindow.getByRole('button', { name: 'Dice (one)', exact: true })).toBeVisible()
  await expect(dmWindow.getByRole('button', { name: 'Dice (two)', exact: true })).toBeVisible()
  await expect(dmWindow.getByRole('button', { name: 'Dice (handful)', exact: true })).toBeVisible()
  await expect(dmWindow.getByRole('button', { name: 'Hourglass', exact: true })).toBeVisible()
})

test('Timer tool shows a waiting glass and a separate Start control', async () => {
  await openQuickTool('Table', 'Timer')
  await expect(dmWindow.getByRole('button', { name: 'Show', exact: true })).toBeVisible()
  await expect(dmWindow.getByRole('button', { name: 'Start', exact: true })).toBeVisible()
  await expect(dmWindow.getByRole('button', { name: 'Start', exact: true })).toBeDisabled()
  await expect(dmWindow.getByText('Chime at zero')).toBeVisible()
})

test('Timer minutes field updates a waiting glass', async () => {
  await openQuickTool('Table', 'Timer')
  await dmWindow.getByRole('button', { name: 'Show', exact: true }).click()
  await expect(dmWindow.getByText('wait', { exact: false })).toBeVisible()
  await dmWindow.getByLabel('Minutes').fill('7')
  await expect(dmWindow.locator('[aria-live="polite"]')).toContainText('7:00')
  await expect(dmWindow.locator('.hourglass-clock')).toHaveText('7:00')
})

test('Dice tray exposes show-to-players and roll-sound toggles', async () => {
  await expect(dmWindow.getByText('Show rolls to players')).toBeVisible()
  await expect(dmWindow.getByText('Play roll sound')).toBeVisible()
  await expect(dmWindow.getByRole('button', { name: 'Adv', exact: true })).toBeVisible()
  await expect(dmWindow.getByRole('button', { name: 'Dis', exact: true })).toBeVisible()
  await dmWindow.getByRole('button', { name: 'd20' }).click()
  await dmWindow.getByRole('button', { name: 'View log' }).click()
  await expect(dmWindow.getByRole('dialog', { name: 'Dice log' })).toBeVisible()
  await expect(dmWindow.getByRole('dialog', { name: 'Dice log' })).toContainText('1d20')
  await dmWindow.getByRole('dialog', { name: 'Dice log' }).getByRole('button', { name: 'Done' }).click()
  await expect(dmWindow.getByRole('dialog', { name: 'Dice log' })).toHaveCount(0)
})

test('Quick bar tools open, switch, and close the right rail', async () => {
  const bar = dmWindow.getByRole('navigation', { name: 'Quick links' })
  await bar.getByRole('button', { name: 'Lookup' }).click()
  await expect(dmWindow.getByRole('heading', { name: 'Lookup' })).toBeVisible()
  await openQuickTool('Prep', 'NPC')
  await expect(dmWindow.getByRole('heading', { name: 'NPC' })).toBeVisible()
  await expect(dmWindow.getByRole('heading', { name: 'Lookup' })).toHaveCount(0)
  await expect(bar.getByRole('button', { name: 'Prep' })).toBeVisible()
  await expect(bar.getByRole('button', { name: 'Table' })).toBeVisible()
  await openQuickTool('Table', 'Improvise')
  await expect(dmWindow.getByRole('heading', { name: 'Improvise', exact: true })).toBeVisible()
  await expect(bar.getByRole('button', { name: 'Table' })).toBeVisible()
  await bar.getByRole('button', { name: 'Lookup' }).click()
  await expect(dmWindow.getByRole('heading', { name: 'Lookup' })).toBeVisible()
  await bar.getByRole('button', { name: 'Lookup' }).click()
  await expect(dmWindow.getByRole('heading', { name: 'Lookup' })).toHaveCount(0)
})

test('Lookup opens and searches the offline SRD', async () => {
  const search = dmWindow.getByPlaceholder(/poisoned/i)
  if (!(await search.isVisible().catch(() => false))) {
    await dmWindow.getByRole('navigation', { name: 'Quick links' }).getByRole('button', { name: 'Lookup' }).click()
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
