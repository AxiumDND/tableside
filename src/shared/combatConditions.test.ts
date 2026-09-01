import { describe, expect, it } from 'vitest'
import {
  combatStatusesFor,
  normalizeStatuses,
  orderedStatuses,
  statusLabel,
  toggleStatus
} from './combatConditions'

describe('combat conditions', () => {
  it('lists the 5e SRD conditions for a D&D campaign', () => {
    const names = combatStatusesFor('dnd5e').map((item) => item.name)
    expect(names).toEqual(expect.arrayContaining(['Poisoned', 'Prone', 'Stunned', 'Charmed']))
    expect(names).not.toContain('Off-Guard')
  })

  it('lists Pathfinder conditions including Off-Guard', () => {
    expect(combatStatusesFor('pf2e').some((item) => item.id === 'pf2e-off-guard')).toBe(true)
  })

  it('toggles a status on and off without duplicates', () => {
    expect(toggleStatus(undefined, 'poisoned')).toEqual(['poisoned'])
    expect(toggleStatus(['poisoned', 'prone'], 'Poisoned')).toEqual(['prone'])
    expect(normalizeStatuses([' Poisoned ', 'poisoned', '', 'prone'])).toEqual(['poisoned', 'prone'])
  })

  it('orders known statuses like the catalog', () => {
    const catalog = combatStatusesFor('dnd5e')
    expect(orderedStatuses(['stunned', 'blinded', 'custom'], catalog)).toEqual([
      'blinded',
      'stunned',
      'custom'
    ])
  })

  it('labels unknown ids in title case', () => {
    expect(statusLabel('poisoned', combatStatusesFor('dnd5e'))).toBe('Poisoned')
    expect(statusLabel('hexed', combatStatusesFor('dnd5e'))).toBe('Hexed')
  })
})
