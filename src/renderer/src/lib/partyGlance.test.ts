import { describe, expect, it } from 'vitest'
import {
  glanceStatsFromSheet,
  partyGlanceLinks,
  partyGlanceRemainder,
  partyGlanceRows,
  appendPartyCompanionLink,
  removePartyGlanceLink
} from './partyGlance'

const BREN = `
# *Bren Oak*

[!pc]
| | |
|---|---|
| **Player** | Sam |
| **Species** | Human |
| **Class** | Fighter 5 |
| **AC** | 18 |
| **HP** | 44 |
[!/pc]

\`\`\`statblock
name: Bren Oak
ac: 12
hp: 9
\`\`\`
`

const KINDRED = `
| **Clan** | Ventrue |
| **Predator** | Alleycat |
| **Health** | 7 / 7 |
`

const PF2 = `
| **Ancestry** | Elf |
| **Class** | Ranger 1 |
| **AC** | 16 |
| **HP** | 20 |
`

describe('glanceStatsFromSheet', () => {
  it('reads Species, Class, AC, and HP from a PC infobox', () => {
    expect(glanceStatsFromSheet(BREN)).toEqual({
      race: 'Human',
      className: 'Fighter 5',
      ac: '18',
      hp: '44'
    })
  })

  it('falls back to statblock ac/hp when the infobox omits them', () => {
    expect(glanceStatsFromSheet('```statblock\nac: 13\nhp: 27\n```')).toEqual({
      race: '',
      className: '',
      ac: '13',
      hp: '27'
    })
  })

  it('uses Clan, Predator, and Health on a Vampire sheet', () => {
    expect(glanceStatsFromSheet(KINDRED)).toEqual({
      race: 'Ventrue',
      className: 'Alleycat',
      ac: '7 / 7',
      hp: '7 / 7'
    })
  })

  it('uses Ancestry on a PF2e sheet', () => {
    expect(glanceStatsFromSheet(PF2).race).toBe('Elf')
  })
})

describe('partyGlanceLinks', () => {
  it('collects wikilinks in order and skips nested callout bodies', () => {
    const block = [
      '- [[PC — Bren Oak|Bren Oak]]',
      '- [[Mira]] — guide',
      '',
      '[!note] Focus tonight',
      '- [[Secret NPC]]',
      '[!/note]'
    ].join('\n')
    expect(partyGlanceLinks(block)).toEqual([
      { target: 'PC — Bren Oak', alias: 'Bren Oak' },
      { target: 'Mira', alias: 'Mira' }
    ])
  })

  it('collects already-rendered note links', () => {
    expect(partyGlanceLinks('- [Ash](#note:NPCs%2FAsh.md)\n')).toEqual([{ target: 'Ash', alias: 'Ash' }])
  })
})

describe('partyGlanceRemainder', () => {
  it('drops top-level roster links and keeps nested focus notes', () => {
    const block = ['- [[Ash]]', '', '[!note] Focus tonight', 'The well.', '[!/note]'].join('\n')
    expect(partyGlanceRemainder(block)).toContain('Focus tonight')
    expect(partyGlanceRemainder(block)).toContain('The well.')
    expect(partyGlanceRemainder(block)).not.toContain('[[Ash]]')
  })
})

describe('partyGlanceRows', () => {
  it('resolves Party and NPC sheets in link order', () => {
    const notes = [
      { relativePath: 'Party/PC — Bren Oak.md', name: 'PC — Bren Oak.md', stem: 'PC — Bren Oak' },
      { relativePath: 'NPCs/Mira.md', name: 'Mira.md', stem: 'Mira' },
      { relativePath: 'Bestiary/Wolf.md', name: 'Wolf.md', stem: 'Wolf' }
    ]
    const rows = partyGlanceRows(
      '- [[Bren Oak]]\n- [[Mira]]\n- [[Wolf]]\n',
      'Sessions/Night.md',
      notes,
      {
        'Party/PC — Bren Oak.md': BREN,
        'NPCs/Mira.md': '| **Role** | Guide |\n| **AC** | 12 |\n| **HP** | 9 |'
      }
    )
    expect(rows.map((row) => row.name)).toEqual(['Bren Oak', 'Mira'])
    expect(rows[0]).toMatchObject({ race: 'Human', className: 'Fighter 5', ac: '18', hp: '44' })
    expect(rows[1]).toMatchObject({ className: 'Guide', ac: '12', hp: '9', companion: true })
    expect(rows[0].companion).toBe(false)
  })
})

describe('appendPartyCompanionLink', () => {
  it('inserts an NPC wikilink before nested callouts and drops the stub', () => {
    const block = ['- [[PC — Bren Oak|Bren Oak]]', '', '- [[NPC Name]] — why they travel', '', '[!note] Focus tonight', 'The well.', '[!/note]'].join('\n')
    const next = appendPartyCompanionLink(block, 'Mira')
    expect(next).toContain('- [[Mira]]')
    expect(next).not.toContain('[[NPC Name]]')
    expect(next.indexOf('[[Mira]]')).toBeLessThan(next.indexOf('[!note]'))
    expect(appendPartyCompanionLink(next, 'Mira')).toBe(next)
  })
})

describe('removePartyGlanceLink', () => {
  it('removes a top-level companion line and keeps nested notes', () => {
    const block = ['- [[Ash]]', '- [[Mira]]', '', '[!note] Focus tonight', '- [[Secret]]', '[!/note]'].join('\n')
    const next = removePartyGlanceLink(block, 'Mira')
    expect(next).toContain('[[Ash]]')
    expect(next).not.toContain('[[Mira]]')
    expect(next).toContain('[[Secret]]')
  })
})
