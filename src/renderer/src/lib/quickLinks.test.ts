import { describe, expect, it } from 'vitest'
import {
  DND5E_QUICK_SKILLS,
  filterQuickConditions,
  filterQuickNpcs,
  filterQuickSkills,
  lookupConditions,
  lookupSkills,
  quickCalendarNotes,
  quickNpcRows,
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

describe('quickNpcRows', () => {
  it('lists NPC sheets with portrait URLs when Art matches', () => {
    const rows = quickNpcRows(
      [
        { relativePath: 'NPCs/Mira.md', name: 'Mira.md', stem: 'Mira' },
        { relativePath: 'NPCs/README.md', name: 'README.md', stem: 'README' },
        { relativePath: 'Party/PC — Ilya.md', name: 'PC — Ilya.md', stem: 'PC — Ilya' }
      ],
      [{ relativePath: 'NPCs/Art/Mira.webp', name: 'Mira.webp', title: 'Mira' }]
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]?.name).toBe('Mira')
    expect(rows[0]?.imageSrc).toContain('NPCs%2FArt%2FMira.webp')
    expect(filterQuickNpcs(rows, 'mi').map((row) => row.name)).toEqual(['Mira'])
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

describe('lookupSkills', () => {
  it('lists all 18 standard 5e skills with ability and used-for blurbs', () => {
    const list = lookupSkills('dnd5e')
    expect(list).toHaveLength(18)
    expect(list.map((item) => item.name)).toEqual(DND5E_QUICK_SKILLS.map((item) => item.name))
    expect(list[0]).toMatchObject({ name: 'Acrobatics', ability: 'Dex' })
    expect(list[0]?.usedFor.length).toBeGreaterThan(10)
    expect(list.at(-1)).toMatchObject({ name: 'Survival', ability: 'Wis' })
    for (const item of list) {
      expect(item.usedFor.trim().length).toBeGreaterThan(0)
      expect(['Str', 'Dex', 'Con', 'Int', 'Wis', 'Cha']).toContain(item.ability)
    }
  })

  it('defaults unknown systems to 5e and stubs other packs', () => {
    expect(lookupSkills(undefined)).toHaveLength(18)
    expect(lookupSkills('pf2e')).toEqual([])
    expect(lookupSkills('v5')).toEqual([])
  })

  it('filters by name, ability, or used-for text', () => {
    const list = lookupSkills('dnd5e')
    expect(filterQuickSkills(list, 'stea').map((item) => item.name)).toEqual(['Stealth'])
    expect(filterQuickSkills(list, 'dex').every((item) => item.ability === 'Dex')).toBe(true)
    expect(filterQuickSkills(list, 'forage').map((item) => item.name)).toEqual(['Survival'])
  })
})
