// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import QuickLinksBar from './QuickLinksBar'

describe('QuickLinksBar', () => {
  beforeEach(() => {
    window.tabledm = {
      readFile: vi.fn(async (path: string) => {
        if (path.includes('Ilya')) {
          return '| **AC** | 13 |\n| **Spell Save DC** | 14 |\n| **Passive Perception** | 15 |\n'
        }
        return '| **AC** | 16 |\n| **Passive Perception** | 13 |\n'
      })
    } as unknown as Window['tabledm']
  })

  afterEach(() => {
    Reflect.deleteProperty(window, 'tabledm')
  })

  const notes = [
    { relativePath: 'Party/PC — Ilya Song.md', name: 'PC — Ilya Song.md', stem: 'PC — Ilya Song' },
    { relativePath: 'Reference/Calendar.md', name: 'Calendar.md', stem: 'Calendar' }
  ]

  it('shows the three quick menus', () => {
    render(<QuickLinksBar notes={[]} onOpenNote={() => {}} />)
    for (const label of ['Party', 'Conditions', 'Calendar']) {
      expect(screen.getByRole('button', { name: new RegExp(label, 'i') })).toBeTruthy()
    }
  })

  it('lists party AC, save DC, and PP, then opens the sheet', async () => {
    const user = userEvent.setup()
    const onOpenNote = vi.fn()
    render(<QuickLinksBar notes={notes} system="dnd5e" onOpenNote={onOpenNote} />)
    await user.click(screen.getByRole('button', { name: /Party/ }))
    const row = await screen.findByRole('menuitem', { name: /Ilya Song[\s\S]*14/ })
    expect(row.textContent).toMatch(/13/)
    expect(row.textContent).toMatch(/15/)
    await user.click(row)
    expect(onOpenNote).toHaveBeenCalledWith('Party/PC — Ilya Song.md')
  })

  it('shows a condition description without leaving the bar', async () => {
    const user = userEvent.setup()
    render(<QuickLinksBar notes={[]} system="dnd5e" onOpenNote={() => {}} />)
    await user.click(screen.getByRole('button', { name: /Conditions/ }))
    await user.click(screen.getByRole('menuitem', { name: /Poisoned/ }))
    expect(screen.getByText(/disadvantage/i)).toBeTruthy()
  })

  it('opens a calendar note from Reference', async () => {
    const user = userEvent.setup()
    const onOpenNote = vi.fn()
    render(<QuickLinksBar notes={notes} onOpenNote={onOpenNote} />)
    await user.click(screen.getByRole('button', { name: /Calendar/ }))
    await user.click(screen.getByRole('menuitem', { name: 'Calendar' }))
    expect(onOpenNote).toHaveBeenCalledWith('Reference/Calendar.md')
  })
})
