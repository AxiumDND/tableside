// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NpcNamesPanel from './NpcNamesPanel'

describe('NpcNamesPanel', () => {
  it('rolls names and can copy or create an NPC', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const onCreateNpc = vi.fn()
    render(<NpcNamesPanel system="dnd5e" canCreate onCreateNpc={onCreateNpc} />)

    expect(screen.getByText('Race')).toBeTruthy()
    const first = screen.getAllByRole('button', { name: 'Copy' })[0]
    expect(first).toBeTruthy()
    await user.click(first)
    expect(writeText).toHaveBeenCalledOnce()

    await user.click(screen.getAllByRole('button', { name: 'New NPC…' })[0])
    expect(onCreateNpc).toHaveBeenCalledOnce()
    expect(String(onCreateNpc.mock.calls[0]?.[0]).length).toBeGreaterThan(0)
    expect(onCreateNpc.mock.calls[0]?.[1]).toBe('Human')

    await user.click(screen.getByRole('button', { name: 'Roll again' }))
    expect(screen.getAllByRole('button', { name: /^(Copy|Copied)$/ }).length).toBe(5)
    vi.unstubAllGlobals()
  })

  it('disables New NPC when no campaign is open', () => {
    render(<NpcNamesPanel system="v5" canCreate={false} onCreateNpc={() => {}} />)
    expect(screen.getByText('Name tradition')).toBeTruthy()
    for (const button of screen.getAllByRole('button', { name: 'New NPC…' })) {
      expect((button as HTMLButtonElement).disabled).toBe(true)
    }
  })
})
