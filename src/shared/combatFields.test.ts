import { describe, expect, it } from 'vitest'
import {
  parseCombatFields,
  serializeCombatBody,
  serializeCombatCallout
} from './combatFields'

describe('parseCombatFields', () => {
  it('reads foes, counts, and party', () => {
    const fields = parseCombatFields(
      'Ambush',
      '**Combatants:** [[Goblin]] · [[Guard]] ×2 · party\n\nTelegraph: bite.'
    )
    expect(fields.title).toBe('Ambush')
    expect(fields.includeParty).toBe(true)
    expect(fields.foes).toEqual([
      { name: 'Goblin', count: 1 },
      { name: 'Guard', count: 2 }
    ])
    expect(fields.notes).toBe('Telegraph: bite.')
  })

  it('drops Monster Name stubs and defaults party when roster is only stubs', () => {
    const fields = parseCombatFields('', '**Combatants:** [[Monster Name]] · party')
    expect(fields.foes).toEqual([])
    expect(fields.includeParty).toBe(true)
  })

  it('allows a foes-only roster without party', () => {
    const fields = parseCombatFields('', '**Combatants:** [[Wolf]]')
    expect(fields.includeParty).toBe(false)
    expect(fields.foes).toEqual([{ name: 'Wolf', count: 1 }])
  })
})

describe('serializeCombatBody', () => {
  it('writes combatants and notes', () => {
    const body = serializeCombatBody({
      title: 'Fight',
      includeParty: true,
      foes: [
        { name: 'Goblin', count: 1 },
        { name: 'Ogre', count: 2 }
      ],
      notes: 'Cut if running long.'
    })
    expect(body).toBe('**Combatants:** [[Goblin]] · [[Ogre]] ×2 · party\n\nCut if running long.')
    expect(serializeCombatCallout({ title: 'Fight', includeParty: true, foes: [], notes: '' })).toContain(
      '[!combat] Fight'
    )
    expect(serializeCombatCallout({ title: 'Fight', includeParty: true, foes: [], notes: '' })).toContain(
      '**Combatants:** party'
    )
  })
})
