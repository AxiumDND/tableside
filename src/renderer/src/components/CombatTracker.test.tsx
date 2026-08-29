// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CombatTracker from './CombatTracker'
import { emptyCombat, type CombatState, type Combatant } from '../../../shared/types'

function combatant(overrides: Partial<Combatant> & { id: string; name: string }): Combatant {
  return {
    kind: 'npc',
    initiative: 0,
    hp: 10,
    maxHp: 10,
    ac: 12,
    ...overrides
  }
}

function makeCombat(combatants: Combatant[]): CombatState {
  return { ...emptyCombat(), combatants }
}

describe('CombatTracker', () => {
  it('renders each combatant name in the tracker', () => {
    const combat = makeCombat([
      combatant({ id: 'a', name: 'Goblin Scout', initiative: 12 }),
      combatant({ id: 'b', name: 'Bandit Captain', initiative: 18 })
    ])
    render(<CombatTracker combat={combat} onChange={() => {}} />)

    // The highest-initiative combatant is also shown in the detail panel, so a
    // name can appear more than once — assert each renders at least once.
    expect(screen.getAllByText('Goblin Scout').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Bandit Captain').length).toBeGreaterThan(0)
  })

  it('starts combat on the highest-initiative combatant', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const combat = makeCombat([
      combatant({ id: 'low', name: 'Goblin Scout', initiative: 12 }),
      combatant({ id: 'high', name: 'Bandit Captain', initiative: 18 })
    ])
    render(<CombatTracker combat={combat} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: /start combat/i }))

    expect(onChange).toHaveBeenCalledTimes(1)
    const next = onChange.mock.calls[0][0] as CombatState
    expect(next.round).toBe(1)
    expect(next.activeId).toBe('high')
  })

  it('adds a manual combatant from the form', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<CombatTracker combat={makeCombat([])} onChange={onChange} />)

    await user.type(screen.getByPlaceholderText('Name'), 'Dire Wolf')
    await user.type(screen.getByPlaceholderText('Init'), '15')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(onChange).toHaveBeenCalledTimes(1)
    const next = onChange.mock.calls[0][0] as CombatState
    expect(next.combatants).toHaveLength(1)
    expect(next.combatants[0]).toMatchObject({ name: 'Dire Wolf', initiative: 15 })
  })
})
