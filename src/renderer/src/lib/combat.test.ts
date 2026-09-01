import { describe, expect, it } from 'vitest'
import {
  advanceCombatTurn,
  combatantCondition,
  combatProfileFor,
  combatToPlayerInitiative,
  isBloodied,
  rollInitiativeFor,
  sortCombatants
} from './combat'
import type { Combatant, CombatState } from '../../../shared/types'

function foe(partial: Partial<Combatant> & Pick<Combatant, 'id' | 'name'>): Combatant {
  return {
    kind: 'monster',
    initiative: 10,
    hp: 20,
    maxHp: 20,
    ac: 12,
    ...partial
  }
}

describe('combat helpers', () => {
  it('marks bloodied under half HP', () => {
    expect(isBloodied(foe({ id: '1', name: 'Wolf', hp: 9, maxHp: 20 }))).toBe(true)
    expect(isBloodied(foe({ id: '1', name: 'Wolf', hp: 10, maxHp: 20 }))).toBe(false)
    expect(isBloodied(foe({ id: '1', name: 'Wolf', hp: 0, maxHp: 20 }))).toBe(false)
  })

  it('maps 0 HP conditions', () => {
    expect(combatantCondition(foe({ id: '1', name: 'Wolf', hp: 0 }))).toBe('dead')
    expect(
      combatantCondition({
        id: '2',
        name: 'Mira',
        kind: 'pc',
        initiative: 12,
        hp: 0,
        maxHp: 30,
        ac: 16
      })
    ).toBe('unconscious')
  })

  it('uses Dying and Wounded on the Pathfinder profile', () => {
    const pf2e = combatProfileFor('pf2e')
    expect(combatantCondition(foe({ id: '1', name: 'Wolf', hp: 9, maxHp: 20 }), pf2e)).toBe('wounded')
    expect(
      combatantCondition(
        {
          id: '2',
          name: 'Mira',
          kind: 'pc',
          initiative: 12,
          hp: 0,
          maxHp: 30,
          ac: 16
        },
        pf2e
      )
    ).toBe('dying')
  })

  it('omits Bloodied on the Vampire profile and tags Hunger', () => {
    const v5 = combatProfileFor('v5')
    const kindred: Combatant = {
      id: 'v',
      name: 'Ash',
      kind: 'pc',
      initiative: 8,
      hp: 4,
      maxHp: 7,
      ac: 0,
      willpower: 2,
      maxWillpower: 5,
      hunger: 3
    }
    expect(isBloodied(kindred, v5)).toBe(false)
    expect(combatantCondition(kindred, v5)).toBe(null)
    const tags = combatToPlayerInitiative(
      { combatants: [kindred], activeId: null, round: 0, showOrderToPlayers: true },
      v5
    )[0].overlayTags?.map((tag) => tag.label)
    expect(tags).toEqual(expect.arrayContaining(['Health 4/7', 'WP 2/5', 'Hunger 3']))
  })

  it('adds tracker statuses to the player overlay without duplicating Unconscious', () => {
    const pc: Combatant = {
      id: '2',
      name: 'Mira',
      kind: 'pc',
      initiative: 12,
      hp: 0,
      maxHp: 30,
      ac: 16,
      conditions: ['poisoned', 'unconscious']
    }
    const tags = combatToPlayerInitiative({
      combatants: [pc],
      activeId: null,
      round: 0,
      showOrderToPlayers: true
    })[0].overlayTags?.map((tag) => tag.label)
    expect(tags).toContain('Unconscious')
    expect(tags).toContain('Poisoned')
    expect(tags?.filter((label) => label === 'Unconscious')).toHaveLength(1)
  })

  it('advances turns and rounds', () => {
    const combat: CombatState = {
      combatants: [
        foe({ id: 'a', name: 'A', initiative: 15 }),
        foe({ id: 'b', name: 'B', initiative: 10 })
      ],
      activeId: null,
      round: 0,
      showOrderToPlayers: false
    }
    const started = advanceCombatTurn(combat)
    expect(started.round).toBe(1)
    expect(started.activeId).toBe('a')
    const next = advanceCombatTurn(started)
    expect(next.activeId).toBe('b')
    expect(next.round).toBe(1)
    const wrap = advanceCombatTurn(next)
    expect(wrap.activeId).toBe('a')
    expect(wrap.round).toBe(2)
  })

  it('rolls only unrolled non-PCs', () => {
    const list: Combatant[] = [
      {
        id: 'pc',
        name: 'Mira',
        kind: 'pc',
        initiative: 0,
        hp: 20,
        maxHp: 20,
        ac: 15
      },
      foe({ id: 'm1', name: 'Wolf', initiative: 0 }),
      foe({ id: 'm2', name: 'Bear', initiative: 14 })
    ]
    const rolled = rollInitiativeFor(list, 'unrolled-npcs', () => 17)
    expect(rolled[0].initiative).toBe(0)
    expect(rolled[1].initiative).toBe(17)
    expect(rolled[2].initiative).toBe(14)
  })

  it('sorts by initiative then bonus', () => {
    const sorted = sortCombatants([
      foe({ id: 'a', name: 'A', initiative: 10, statBlock: { name: 'A', initiativeBonus: 1 } }),
      foe({ id: 'b', name: 'B', initiative: 12 }),
      foe({ id: 'c', name: 'C', initiative: 10, statBlock: { name: 'C', initiativeBonus: 3 } })
    ])
    expect(sorted.map((c) => c.id)).toEqual(['b', 'c', 'a'])
  })
})
