// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DiceTray, { DiceLogProvider } from './DiceTray'

afterEach(() => {
  vi.restoreAllMocks()
})

function renderTray() {
  return render(
    <DiceLogProvider>
      <DiceTray />
    </DiceLogProvider>
  )
}

describe('DiceTray', () => {
  it('keeps every die including d100 on one row', () => {
    const { container } = renderTray()
    const dice = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'].map((name) => screen.getByRole('button', { name }))
    const row = dice[0].parentElement
    expect(row?.className).toContain('flex-nowrap')
    expect(dice.every((button) => button.parentElement === row)).toBe(true)
    expect(container.querySelector('section')?.className).toContain('h-60')
  })

  it('opens a full dice log from View log', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const user = userEvent.setup()
    renderTray()

    expect(screen.queryByRole('dialog', { name: 'Dice log' })).toBeNull()
    await user.click(screen.getByRole('button', { name: 'd20' }))
    await user.click(screen.getByRole('button', { name: 'd6' }))
    await user.click(screen.getByRole('button', { name: 'View log' }))

    const dialog = screen.getByRole('dialog', { name: 'Dice log' })
    expect(dialog.textContent).toMatch(/2 rolls this session/)
    expect(dialog.textContent).toMatch(/1d20/)
    expect(dialog.textContent).toMatch(/1d6/)
    expect(dialog.textContent).toMatch(/\[11\]/)
    expect(dialog.textContent).toMatch(/\[4\]/)

    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(screen.queryByRole('dialog', { name: 'Dice log' })).toBeNull()
  })

  it('keeps more than the tray slots in View log', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const user = userEvent.setup()
    renderTray()
    for (let i = 0; i < 6; i += 1) {
      await user.click(screen.getByRole('button', { name: 'd20' }))
    }
    expect(document.querySelectorAll('section ul li')).toHaveLength(4)
    await user.click(screen.getByRole('button', { name: 'View log' }))
    expect(screen.getByRole('dialog', { name: 'Dice log' }).textContent).toMatch(/6 rolls this session/)
  })

  it('always reserves four previous-result slots', () => {
    const { container } = renderTray()
    expect(container.querySelectorAll('li')).toHaveLength(4)
  })

  it.each([
    { random: 0, summary: /^1d20 · Crit fail$/ },
    { random: 0.5, summary: /^1d20$/ },
    { random: 0.999, summary: /^1d20 · Crit success$/ }
  ])('puts the latest roll on one line ($summary)', async ({ random, summary }) => {
    vi.spyOn(Math, 'random').mockReturnValue(random)
    const user = userEvent.setup()
    renderTray()
    await user.click(screen.getByRole('button', { name: 'd20' }))
    const expr = screen.getByText(summary)
    const box = expr.closest('div')
    expect(box?.className).toContain('h-7')
    expect(box?.className).toContain('items-center')
  })
})
