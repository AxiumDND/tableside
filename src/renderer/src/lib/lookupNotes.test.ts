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
    expect(markdown).toContain('### *Level 3 Evocation')
    expect(markdown).toContain('| **Casting Time** | Action |')
    expect(markdown).toContain('| **Range** | 150 feet |')
    expect(markdown).not.toMatch(/^Casting Time:/m)
  })

  it('puts gear stats in an infobox table', () => {
    const markdown = recordToCampaignMarkdown(
      record({
        kind: 'gear',
        name: 'Acid',
        data: {
          category: 'Adventuring Gear',
          Weight: '1 lb.',
          Cost: '25 GP',
          desc: 'When you take the Attack action, you can replace one attack with throwing a vial of Acid.'
        }
      })
    )
    expect(markdown).toContain('![[Acid.webp]]')
    expect(markdown).toContain('### *Adventuring Gear*')
    expect(markdown).toContain('| **Weight** | 1 lb. |')
    expect(markdown).toContain('| **Cost** | 25 GP |')
    expect(markdown).not.toMatch(/^Weight:/m)
    expect(markdown).not.toMatch(/^Cost:/m)
  })

  it('puts a monster portrait and statblock above notes', () => {
    const markdown = recordToCampaignMarkdown(
      record({
        kind: 'monster',
        name: 'Ghoul',
        data: {
          name: 'Ghoul',
          size: 'Medium',
          type: 'undead',
          alignment: 'chaotic evil',
          ac: 12,
          hp: 22,
          speed: '30 ft.',
          strength: 13,
          dexterity: 15,
          constitution: 10,
          intelligence: 7,
          wisdom: 10,
          charisma: 6
        }
      })
    )
    expect(markdown).toContain('![[Ghoul.webp]]')
    expect(markdown.indexOf('```statblock')).toBeLessThan(markdown.indexOf('## Notes'))
  })
})
