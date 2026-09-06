import { describe, expect, it } from 'vitest'
import {
  filterQuickConditions,
  lookupConditions,
  quickCalendarNotes,
  quickPartyRows
} from './quickLinks'

describe('quickPartyRows', () => {
  it('lists Party sheets with AC, save DC, and passive perception', () => {
    const rows = quickPartyRows(
      [
        { relativePath: 'Party/PC — Ilya.md', name: 'PC — Ilya.md', stem: 'PC — Ilya' },
        { relativePath: 'Party/Roster.md', name: 'Roster.md', stem: 'Roster' },
        { relativePath: 'NPCs/Mira.md', name: 'Mira.md', stem: 'Mira' }
      ],
      {
        'Party/PC — Ilya.md':
          '| **AC** | 13 |\n| **Spell Save DC** | 14 |\n| **Passive Perception** | 15 |\n'
      }
    )
    expect(rows).toEqual([
      { name: 'Ilya', notePath: 'Party/PC — Ilya.md', ac: '13', saveDc: '14', pp: '15' }
    ])
  })
})

describe('quickCalendarNotes', () => {
  it('keeps Reference notes and calendar-named notes, skips readme', () => {
    const notes = [
      { relativePath: 'Reference/Calendar.md', name: 'Calendar.md', stem: 'Calendar' },
      { relativePath: 'Reference/README.md', name: 'README.md', stem: 'README' },
      { relativePath: 'Sessions/Harvest almanac.md', name: 'Harvest almanac.md', stem: 'Harvest almanac' },
      { relativePath: 'Party/PC — Bren.md', name: 'PC — Bren.md', stem: 'PC — Bren' }
    ]
    expect(quickCalendarNotes(notes).map((note) => note.stem)).toEqual(['Calendar', 'Harvest almanac'])
  })
})

describe('lookupConditions', () => {
  it('returns 5e condition names with descriptions', () => {
    const list = lookupConditions('dnd5e')
    const poisoned = list.find((item) => item.name === 'Poisoned')
    expect(poisoned?.desc).toMatch(/poison/i)
    expect(list.some((item) => item.name === 'Prone')).toBe(true)
  })

  it('filters by name or body', () => {
    const list = [
      { id: 'a', name: 'Poisoned', desc: 'You have Disadvantage on attack rolls.' },
      { id: 'b', name: 'Prone', desc: 'You can only crawl.' }
    ]
    expect(filterQuickConditions(list, 'poi').map((item) => item.name)).toEqual(['Poisoned'])
    expect(filterQuickConditions(list, 'crawl').map((item) => item.name)).toEqual(['Prone'])
  })
})
