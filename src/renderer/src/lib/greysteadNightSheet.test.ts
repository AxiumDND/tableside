import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseNightEncounters, type CampaignNote } from './notes'

describe('Greystead Session 1 night sheet', () => {
  it('finds combat encounters nested inside scene blocks', () => {
    const md = readFileSync(
      join(process.cwd(), 'examples/greystead/Sessions/Session 1 — Game Night Sheet.md'),
      'utf8'
    )
    const notes: CampaignNote[] = [
      { relativePath: 'Bestiary/Cultist.md', name: 'Cultist.md', stem: 'Cultist' },
      { relativePath: 'NPCs/Vesper.md', name: 'Vesper.md', stem: 'Vesper' }
    ]
    const encounters = parseNightEncounters(md, 'Sessions/Session 1 — Game Night Sheet.md', notes)
    expect(encounters.map((e) => e.heading)).toEqual([
      'Combat 1 — Ridge lookouts',
      'Combat 2 — the Pale Well'
    ])
    expect(encounters[0].includeParty).toBe(true)
    expect(encounters[0].combatants.map((c) => c.name)).toContain('Cultist')
    expect(encounters[1].combatants.map((c) => c.name)).toEqual(
      expect.arrayContaining(['Vesper', 'Cultist'])
    )
  })
})
