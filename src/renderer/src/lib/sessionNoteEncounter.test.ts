import { describe, expect, it } from 'vitest'
import { collectEncounterAddItems } from './sessionNoteEncounter'
import type { CampaignNote, NightEncounter } from './notes'

const NOTES: CampaignNote[] = [
  { relativePath: 'Party/PC — Bren.md', name: 'PC — Bren.md', stem: 'PC — Bren' },
  { relativePath: 'Bestiary/Wolf.md', name: 'Wolf.md', stem: 'Wolf' }
]

const WOLF = ['# Wolf', '', '```statblock', 'name: Wolf', 'hp: 11', '```', ''].join('\n')
const BREN = ['# Bren', '', '```statblock', 'name: Bren Oak', 'hp: 12', '```', ''].join('\n')

describe('collectEncounterAddItems', () => {
  it('expands counted monsters and appends missing party sheets', async () => {
    const encounter: NightEncounter = {
      id: 'ambush',
      heading: 'Ambush',
      includeParty: true,
      combatants: [{ notePath: 'Bestiary/Wolf.md', name: 'Wolf', count: 2, kind: 'monster' }]
    }
    const files: Record<string, string> = {
      'Bestiary/Wolf.md': WOLF,
      'Party/PC — Bren.md': BREN
    }
    const items = await collectEncounterAddItems(
      encounter,
      'Sessions/Night.md',
      NOTES,
      async (path) => files[path] ?? ''
    )
    expect(items.map((item) => ({ name: item.name, sourceId: item.sourceId, kind: item.kind }))).toEqual([
      { name: 'Wolf 1', sourceId: 'Bestiary/Wolf.md#1', kind: 'monster' },
      { name: 'Wolf 2', sourceId: 'Bestiary/Wolf.md#2', kind: 'monster' },
      { name: 'Bren', sourceId: 'Party/PC — Bren.md', kind: 'pc' }
    ])
  })

  it('does not duplicate a party sheet already listed in the encounter', async () => {
    const encounter: NightEncounter = {
      id: 'talk',
      heading: 'Talk',
      includeParty: true,
      combatants: [{ notePath: 'Party/PC — Bren.md', name: 'PC — Bren', count: 1, kind: 'pc' }]
    }
    const items = await collectEncounterAddItems(
      encounter,
      'Sessions/Night.md',
      NOTES,
      async () => BREN
    )
    expect(items).toHaveLength(1)
    expect(items[0]?.sourceId).toBe('Party/PC — Bren.md')
  })
})
