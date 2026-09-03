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
