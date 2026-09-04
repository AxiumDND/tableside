// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NpcPanel from './NpcPanel'

describe('NpcPanel', () => {
  it('rolls names and can copy or create an NPC', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const onCreateNpc = vi.fn()
    render(
      <NpcPanel
        system="dnd5e"
        canCreate
        hidePortraits
        onHidePortraitsChange={() => undefined}
        onCreateNpc={onCreateNpc}
      />
    )

    expect(screen.getByText('Race')).toBeTruthy()
    const first = screen.getAllByRole('button', { name: 'Copy' })[0]
    expect(first).toBeTruthy()
    await user.click(first)
    expect(writeText).toHaveBeenCalledOnce()

    await user.click(screen.getAllByRole('button', { name: 'New NPC…' })[0])
    expect(onCreateNpc).toHaveBeenCalledOnce()
    const payload = onCreateNpc.mock.calls[0]?.[0] as { name: string; species: string; statBlockId?: string }
    expect(String(payload.name).length).toBeGreaterThan(0)
    expect(payload.species).toBe('Human')
    expect(payload.statBlockId).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Roll names' }))
    expect(screen.getAllByRole('button', { name: /^(Copy|Copied)$/ }).length).toBe(5)
    vi.unstubAllGlobals()
  })

  it('shows portrait picks unless hidden', () => {
    const { rerender } = render(
      <NpcPanel
        system="dnd5e"
        canCreate
        hidePortraits={false}
        onHidePortraitsChange={() => undefined}
        onCreateNpc={() => undefined}
      />
    )
    expect(screen.getByText('AI portrait picks')).toBeTruthy()

    rerender(
      <NpcPanel
        system="dnd5e"
        canCreate
        hidePortraits
        onHidePortraitsChange={() => undefined}
        onCreateNpc={() => undefined}
      />
    )
    expect(screen.queryByText('AI portrait picks')).toBeNull()
  })

  it('offers name flavors on 5e and keeps species from race', async () => {
    const user = userEvent.setup()
    const onCreateNpc = vi.fn()
    render(
      <NpcPanel
        system="dnd5e"
        canCreate
        hidePortraits
        onHidePortraitsChange={() => undefined}
        onCreateNpc={onCreateNpc}
      />
    )
    expect(screen.getByText('Name flavor')).toBeTruthy()
    const flavor = screen.getByLabelText('Name flavor') as HTMLSelectElement
    await user.selectOptions(flavor, 'norse')
    await user.click(screen.getByRole('button', { name: 'Roll names' }))
    await user.click(screen.getAllByRole('button', { name: 'New NPC…' })[0])
    expect(onCreateNpc).toHaveBeenCalledOnce()
    const payload = onCreateNpc.mock.calls[0]?.[0] as { name: string; species: string }
    expect(payload.species).toBe('Human')
    expect(String(payload.name).length).toBeGreaterThan(0)
  })

  it('hides name flavors on Vampire nights', () => {
    render(
      <NpcPanel
        system="v5"
        canCreate={false}
        hidePortraits
        onHidePortraitsChange={() => undefined}
        onCreateNpc={() => {}}
      />
    )
    expect(screen.getByText('Name tradition')).toBeTruthy()
    expect(screen.queryByText('Name flavor')).toBeNull()
  })

  it('disables New NPC when no campaign is open', () => {
    render(
      <NpcPanel
        system="v5"
        canCreate={false}
        hidePortraits
        onHidePortraitsChange={() => undefined}
        onCreateNpc={() => {}}
      />
    )
    for (const button of screen.getAllByRole('button', { name: 'New NPC…' })) {
      expect((button as HTMLButtonElement).disabled).toBe(true)
    }
  })
})
