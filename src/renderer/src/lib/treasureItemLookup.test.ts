import { describe, expect, it } from 'vitest'
import type { CampaignNote } from './notes'
import type { SrdRecord } from './srd'
import {
  isMagicGearPath,
  isMagicTreasureRecord,
  searchTreasureItems,
  treasureItemLine
} from './treasureItemLookup'

function note(relativePath: string, stem?: string): CampaignNote {
  const name = relativePath.replaceAll('\\', '/').split('/').pop() ?? relativePath
  const base = name.replace(/\.[^.]+$/, '')
  return { relativePath, name, stem: stem ?? base }
}

function record(partial: Partial<SrdRecord> & Pick<SrdRecord, 'kind' | 'name'>): SrdRecord {
  return {
    id: partial.id ?? `id-${partial.name}`,
    searchText: partial.name,
    summary: partial.summary ?? '',
    data: {},
    ...partial
  }
}

describe('isMagicGearPath', () => {
  it('detects Magic Items folders', () => {
    expect(isMagicGearPath('Gear/Magic Items/Cloak.md')).toBe(true)
    expect(isMagicGearPath('Gear/Weapons/Longsword.md')).toBe(false)
    expect(isMagicGearPath('Magic Items/Ring.md')).toBe(true)
  })
})

describe('isMagicTreasureRecord', () => {
  it('classifies by gear subfolder rules', () => {
    expect(isMagicTreasureRecord(record({ kind: 'weapon', name: 'Longsword' }))).toBe(false)
    expect(
      isMagicTreasureRecord(
        record({
          kind: 'gear',
          name: 'Bag of Holding',
          sourceLabel: 'DMG Items',
          data: { category: 'Wondrous Item', Rarity: 'Uncommon' }
        })
      )
    ).toBe(true)
  })
})

describe('treasureItemLine', () => {
  it('adds attunement hint for magic records', () => {
    expect(
      treasureItemLine({
        id: '1',
        name: 'Cloak',
        summary: '',
        magic: true,
        record: record({
          kind: 'gear',
          name: 'Cloak',
          data: { Attunement: 'Requires Attunement' }
        })
      })
    ).toBe('[[Cloak]] (attunement)')
  })

  it('leaves mundane lines as a plain wikilink', () => {
    expect(
      treasureItemLine({
        id: '1',
        name: 'Rope',
        summary: '',
        magic: false,
        record: record({ kind: 'gear', name: 'Rope' })
      })
    ).toBe('[[Rope]]')
  })
})

describe('searchTreasureItems', () => {
  it('lists campaign gear notes when the query is empty', () => {
    const hits = searchTreasureItems('', [
      note('Gear/Weapons/Longsword.md'),
      note('Gear/Magic Items/Ring of Protection.md'),
      note('Sessions/Night.md')
    ])
    expect(hits.map((h) => h.name)).toEqual(['Longsword', 'Ring of Protection'])
    expect(hits.find((h) => h.name === 'Ring of Protection')?.magic).toBe(true)
    expect(hits.find((h) => h.name === 'Longsword')?.magic).toBe(false)
  })

  it('prefers an existing campaign note over a matching SRD name', () => {
    const hits = searchTreasureItems('longsword', [note('Gear/Weapons/Longsword.md')])
    const hit = hits.find((h) => h.name === 'Longsword')
    expect(hit?.notePath).toBe('Gear/Weapons/Longsword.md')
    expect(hit?.record?.kind).toBe('weapon')
  })

  it('ranks an exact name match first', () => {
    const hits = searchTreasureItems('rope', [])
    expect(hits[0]?.name.toLowerCase()).toBe('rope')
  })
})
