import { describe, expect, it } from 'vitest'
import type { CampaignNote } from './notes'
import { searchCombatants } from './combatantLookup'

function note(relativePath: string, stem?: string): CampaignNote {
  const name = relativePath.replaceAll('\\', '/').split('/').pop() ?? relativePath
  const base = name.replace(/\.[^.]+$/, '')
  return { relativePath, name, stem: stem ?? base }
}

describe('searchCombatants', () => {
  it('lists campaign NPC and bestiary notes when the query is empty', () => {
    const hits = searchCombatants('', [
      note('NPCs/Mayor.md'),
      note('Bestiary/Wolf.md'),
      note('Gear/Weapons/Longsword.md')
    ])
    expect(hits.map((h) => h.name).sort()).toEqual(['Mayor', 'Wolf'])
    expect(hits.find((h) => h.name === 'Mayor')?.kind).toBe('npc')
    expect(hits.find((h) => h.name === 'Wolf')?.kind).toBe('monster')
  })

  it('ranks an exact name match ahead of a longer prefix match', () => {
    const hits = searchCombatants('wolf', [
      note('Bestiary/Wolf.md'),
      note('Bestiary/Wolf Spider.md')
    ])
    expect(hits[0]?.name).toBe('Wolf')
    expect(hits[0]?.notePath).toBe('Bestiary/Wolf.md')
  })

  it('prefers an existing bestiary note over a matching SRD name', () => {
    const hits = searchCombatants('aboleth', [note('Bestiary/Aboleth.md')])
    const hit = hits.find((h) => h.name === 'Aboleth')
    expect(hit?.notePath).toBe('Bestiary/Aboleth.md')
    expect(hit?.kind).toBe('monster')
  })
})
