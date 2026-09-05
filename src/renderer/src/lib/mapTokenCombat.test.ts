import { describe, expect, it } from 'vitest'
import type { Combatant } from '../../../shared/types'
import {
  combatOverlaySignature,
  combatantForToken,
  mapTokenSourceId,
  tokenOverlayTags
} from './mapTokenCombat'

function foe(partial: Partial<Combatant> & { id: string; name: string }): Combatant {
  return {
    kind: 'monster',
    initiative: 10,
    hp: 20,
    maxHp: 20,
    ac: 13,
    ...partial
  }
}

describe('mapTokenSourceId', () => {
  it('disambiguates a sheet token by token id', () => {
    expect(mapTokenSourceId({ id: 'wolf-2', source: 'Bestiary/Wolf.md' })).toBe(
      'Bestiary/Wolf.md#wolf-2'
    )
  })

  it('falls back when the token has no sheet', () => {
    expect(mapTokenSourceId({ id: 'ghost', source: '' })).toBe('token:ghost')
  })
})

describe('combatantForToken', () => {
  const wolf = foe({
    id: 'c1',
    name: 'Wolf',
    sourceId: 'Bestiary/Wolf.md#wolf-2',
    conditions: ['poisoned']
  })
  const party = foe({
    id: 'pc1',
    name: 'Bren',
    kind: 'pc',
    sourceId: 'Party/PC — Bren Oak.md'
  })

  it('prefers combatantId, then the token sourceId, then a unique sheet row', () => {
    expect(combatantForToken([wolf], { id: 'wolf-2', source: 'Bestiary/Wolf.md', combatantId: 'c1' })?.id).toBe(
      'c1'
    )
    expect(combatantForToken([wolf], { id: 'wolf-2', source: 'Bestiary/Wolf.md' })?.id).toBe('c1')
    expect(combatantForToken([party], { id: 'bren', source: 'Party/PC — Bren Oak.md' })?.id).toBe('pc1')
  })

  it('does not guess when two combatants share a sheet', () => {
    const a = foe({ id: 'a', name: 'Wolf 1', sourceId: 'Bestiary/Wolf.md#a' })
    const b = foe({ id: 'b', name: 'Wolf 2', sourceId: 'Bestiary/Wolf.md#b' })
    expect(combatantForToken([a, b], { id: 'c', source: 'Bestiary/Wolf.md' })).toBeUndefined()
  })
})

describe('tokenOverlayTags', () => {
  it('shows toggleable and HP-derived conditions without vitals', () => {
    const tags = tokenOverlayTags(
      { id: 'wolf', source: 'Bestiary/Wolf.md', combatantId: 'c1' },
      [
        foe({
          id: 'c1',
          name: 'Wolf',
          hp: 4,
          maxHp: 20,
          conditions: ['poisoned']
        })
      ]
    ).map((tag) => tag.label)
    expect(tags).toContain('Bloodied')
    expect(tags).toContain('Poisoned')
    expect(tags.some((label) => /hp|wp|hunger/i.test(label))).toBe(false)
  })
})

describe('combatOverlaySignature', () => {
  it('changes when conditions change', () => {
    const a = [foe({ id: 'c1', name: 'Wolf' })]
    const b = [foe({ id: 'c1', name: 'Wolf', conditions: ['prone'] })]
    expect(combatOverlaySignature(a)).not.toBe(combatOverlaySignature(b))
  })
})
