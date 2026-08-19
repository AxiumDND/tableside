import { describe, expect, it } from 'vitest'
import type { SrdRecord } from './srd'
import { gearSubfolderFor, recordToCampaignMarkdown } from './lookupNotes'

function record(partial: Partial<SrdRecord> & Pick<SrdRecord, 'kind'>): SrdRecord {
  return {
    id: 'x',
    name: 'Item',
    searchText: '',
    summary: '',
    data: {},
    ...partial
  }
}

describe('gearSubfolderFor', () => {
  it('sends weapons to Gear/Weapons', () => {
    expect(gearSubfolderFor(record({ kind: 'weapon' }))).toBe('Weapons')
  })

  it('sends armor to Gear/Armor', () => {
    expect(
      gearSubfolderFor(record({ kind: 'gear', data: { category: 'Heavy Armor', 'Armor Class': '18' } }))
    ).toBe('Armor')
  })

  it('sends adventuring gear to Gear/Equipment', () => {
    expect(gearSubfolderFor(record({ kind: 'gear', data: { category: 'Adventuring Gear' } }))).toBe(
      'Equipment'
    )
  })

  it('sends DMG items to Gear/Magic Items', () => {
    expect(
      gearSubfolderFor(
        record({
          kind: 'gear',
          sourceLabel: 'DMG Items',
          data: { category: 'Weapon', Rarity: 'Rare', Damage: '1d8' }
        })
      )
    ).toBe('Magic Items')
  })
})

describe('recordToCampaignMarkdown', () => {
  it('embeds the school emblem on a spell note', () => {
    const markdown = recordToCampaignMarkdown(
      record({
        kind: 'spell',
        name: 'Fireball',
        data: {
          level: 3,
          school: 'Evocation',
          castingTime: 'action',
          range: '150 feet',
          components: 'V, S, M',
          duration: 'instantaneous',
          desc: 'A bright streak flashes.'
        }
      })
    )
    expect(markdown).toContain('![[Evocation.webp]]')
    expect(markdown).toContain('Level 3 Evocation')
  })
})
