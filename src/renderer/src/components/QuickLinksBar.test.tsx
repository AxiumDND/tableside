// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { calendarNoteTemplate } from '../../../shared/calendarNote'
import { calendarPreset } from '../../../shared/calendarPresets'
import QuickLinksBar from './QuickLinksBar'

const greyhawk = calendarPreset('greyhawk')
const calendarMd = calendarNoteTemplate(greyhawk.definition, greyhawk.now)

describe('QuickLinksBar', () => {
  const saveFile = vi.fn()

  beforeEach(() => {
    saveFile.mockReset()
    saveFile.mockResolvedValue({ campaign: { name: 'C' }, path: 'Calendar/Calendar.md', renamed: false })
    window.tabledm = {
      readFile: vi.fn(async (path: string) => {
        if (path.includes('Ilya')) {
          return '| **AC** | 13 |\n| **Spell Save DC** | 14 |\n| **Passive Perception** | 15 |\n'
        }
        if (path.startsWith('Calendar/')) return calendarMd
        return '| **AC** | 16 |\n| **Passive Perception** | 13 |\n'
      }),
      saveFile
    } as unknown as Window['tabledm']
  })

  afterEach(() => {
    Reflect.deleteProperty(window, 'tabledm')
  })

  const notes = [
    { relativePath: 'Party/PC — Ilya Song.md', name: 'PC — Ilya Song.md', stem: 'PC — Ilya Song' },
    { relativePath: 'Calendar/Calendar.md', name: 'Calendar.md', stem: 'Calendar' }
  ]

  it('shows Party, Conditions, tools, panel toggles, and the live calendar clock', async () => {
    render(
      <QuickLinksBar
        notes={notes}
        onOpenNote={() => {}}
        onToggleSidebar={() => {}}
        onToggleRightPanel={() => {}}
      />
    )
    expect(screen.getByRole('button', { name: /Party/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Conditions/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Lookup' })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Prep/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Table/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Hide sidebar' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Show right panel' })).toBeTruthy()
    expect(await screen.findByRole('button', { name: /1 Fireseek 576 CY/ })).toBeTruthy()
    expect(screen.getByText('Day')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Back one hour' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Forward one hour' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Advance one day' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Calendar settings' })).toBeTruthy()
  })

  it('opens a grouped tool from Prep and Table', async () => {
    const user = userEvent.setup()
    const onOpenTool = vi.fn()
    render(<QuickLinksBar notes={notes} onOpenNote={() => {}} onOpenTool={onOpenTool} />)
    await user.click(screen.getByRole('button', { name: /Prep/ }))
    await user.click(screen.getByRole('menuitem', { name: 'NPC' }))
    expect(onOpenTool).toHaveBeenCalledWith('npc')
    await user.click(screen.getByRole('button', { name: /Table/ }))
    await user.click(screen.getByRole('menuitem', { name: 'Dice' }))
    expect(onOpenTool).toHaveBeenCalledWith('dice')
  })

  it('names the open Prep or Table page on the group button', () => {
    render(
      <QuickLinksBar notes={notes} onOpenNote={() => {}} toolsTab="dice" toolsOpen />
    )
    expect(screen.getByRole('button', { name: /^Dice/ })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /^Table/ })).toBeNull()
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

  it('advances one hour and writes the calendar note', async () => {
    const user = userEvent.setup()
    render(<QuickLinksBar notes={notes} onOpenNote={() => {}} />)
    await screen.findByRole('button', { name: /1 Fireseek 576 CY/ })
    await user.click(screen.getByRole('button', { name: 'Forward one hour' }))
    expect(saveFile).toHaveBeenCalled()
    const written = String(saveFile.mock.calls[0]?.[1] ?? '')
    expect(written).toMatch(/hour:\s*10/)
    expect(written).toMatch(/month:\s*Fireseek/)
  })

  it('opens settings from the gear and can switch type', async () => {
    const user = userEvent.setup()
    render(<QuickLinksBar notes={notes} onOpenNote={() => {}} />)
    await user.click(await screen.findByRole('button', { name: 'Calendar settings' }))
    expect(screen.getByRole('dialog', { name: 'Calendar' })).toBeTruthy()
    await user.click(screen.getByRole('radio', { name: /Forgotten Realms/ }))
    expect(screen.getByText(/1 Hammer 1492 DR/)).toBeTruthy()
  })

  it('offers Set calendar when no note exists', async () => {
    window.tabledm.readFile = vi.fn(async () => {
      throw new Error('missing')
    }) as unknown as Window['tabledm']['readFile']
    render(<QuickLinksBar notes={[]} onOpenNote={() => {}} />)
    expect(await screen.findByRole('button', { name: /Set calendar/ })).toBeTruthy()
  })
})
