import { describe, expect, it } from 'vitest'
import {
  combatantLabel,
  isCombatHeading,
  missingCombatantTokens,
  npcNotes,
  parseNightEncounters,
  pcCombatName,
  splitCalloutBlocks,
  splitLeadingSceneArt,
  type CampaignNote
} from './notes'
import { isNpcSheet, parseStatblockYaml } from './statblock'
import { abilityMod, extractRolls, formatMod } from './dice'
import { parseBookFiles } from './bookParse'

const notes: CampaignNote[] = [
  { relativePath: 'Party/PC — Mira.md', name: 'PC — Mira.md', stem: 'PC — Mira' },
  { relativePath: 'Bestiary/Wolf.md', name: 'Wolf.md', stem: 'Wolf' },
  { relativePath: 'NPCs/Hale.md', name: 'Hale.md', stem: 'Hale' }
]

describe('pc combat names', () => {
  it('uses the first name for initiative labels', () => {
    expect(pcCombatName('Party/PC — Torren Vale.md')).toBe('Torren')
    expect(pcCombatName('PC — Sister Calda')).toBe('Sister')
    expect(pcCombatName('Torren Vale, Human Ranger')).toBe('Torren')
    expect(pcCombatName('Nessa Pike — Rogue 1')).toBe('Nessa')
    expect(pcCombatName('Mira')).toBe('Mira')
  })

  it('labels PC combatants with the first name from the sheet stem', () => {
    expect(combatantLabel('pc', 'PC — Torren Vale', 'Torren Vale, Human Ranger 1')).toBe('Torren')
    expect(combatantLabel('monster', 'Wolf', 'Dire Wolf')).toBe('Wolf')
  })
})

describe('night sheet parsing', () => {
  it('detects combat headings', () => {
    expect(isCombatHeading('⚔️ Combat 1 — the door')).toBe(true)
    expect(isCombatHeading('Encounter — ambush')).toBe(true)
    expect(isCombatHeading('🕯 The passage (no combat)')).toBe(false)
    expect(isCombatHeading('Aftermath')).toBe(false)
  })

  it('parses combatants with counts and party', () => {
    const md = `## ⚔️ Combat 1
**Combatants:** [[Wolf]] ×2 · [[Hale]] · party
`
    const encounters = parseNightEncounters(md, 'Sessions/Night.md', notes)
    expect(encounters).toHaveLength(1)
    expect(encounters[0].includeParty).toBe(true)
    expect(encounters[0].combatants.map((c) => c.name)).toEqual(expect.arrayContaining(['Wolf', 'Hale']))
    expect(encounters[0].combatants.find((c) => c.name === 'Wolf')?.count).toBe(2)
  })

  it('lists missing combatant tokens', () => {
    const md = `**Combatants:** [[Wolf]] · [[Missing Beast]] · party`
    expect(missingCombatantTokens(md, 'Sessions/Night.md', notes)).toEqual(['Missing Beast'])
  })

  it('does not treat the night-sheet how-to as an encounter', () => {
    const md = `# session test — Game Night Sheet

> [!gmonly] What this page does
> - **Add to initiative** on a ⚔️ / Combat heading loads the **Combatants:** line (\`party\` = every PC).

## 1. The characters
`
    expect(parseNightEncounters(md, 'Sessions/Night.md', notes)).toHaveLength(0)
    expect(missingCombatantTokens(md, 'Sessions/Night.md', notes)).toEqual([])
  })

  it('parses combat inside a fenced scene block', () => {
    const md = [
      '## 2. Scenes',
      '',
      '[!scene] The mill fight',
      '## ⚔️ Combat 1 — the mill',
      '**Combatants:** [[Wolf]] ×2 · party',
      '[!/scene]',
      ''
    ].join('\n')
    const encounters = parseNightEncounters(md, 'Sessions/Night.md', notes)
    expect(encounters).toHaveLength(1)
    expect(encounters[0].heading).toBe('⚔️ Combat 1 — the mill')
    expect(encounters[0].combatants.find((c) => c.name === 'Wolf')?.count).toBe(2)
  })

  it('parses a fenced combat block nested in a scene', () => {
    const md = [
      '[!scene] The mill fight',
      '[!combat] Combat 1 — the mill',
      '**Combatants:** [[Wolf]] ×2 · party',
      '[!/combat]',
      '[!/scene]',
      ''
    ].join('\n')
    const encounters = parseNightEncounters(md, 'Sessions/Night.md', notes)
    expect(encounters).toHaveLength(1)
    expect(encounters[0].heading).toBe('Combat 1 — the mill')
    expect(encounters[0].includeParty).toBe(true)
    expect(encounters[0].combatants.find((c) => c.name === 'Wolf')?.count).toBe(2)
  })

  it('parses a top-level combat block', () => {
    const md = [
      '[!combat] Ambush',
      '**Combatants:** [[Hale]] · party',
      '[!/combat]',
      ''
    ].join('\n')
    const encounters = parseNightEncounters(md, 'Sessions/Night.md', notes)
    expect(encounters).toHaveLength(1)
    expect(encounters[0].heading).toBe('Ambush')
    expect(encounters[0].combatants.map((c) => c.name)).toContain('Hale')
  })

  it('parses combat inside a legacy quoted scene block', () => {
    const md = [
      '## 2. Scenes',
      '',
      '> [!scene] The mill fight',
      '> ## ⚔️ Combat 1 — the mill',
      '> **Combatants:** [[Wolf]] ×2 · party',
      ''
    ].join('\n')
    const encounters = parseNightEncounters(md, 'Sessions/Night.md', notes)
    expect(encounters).toHaveLength(1)
    expect(encounters[0].heading).toBe('⚔️ Combat 1 — the mill')
  })
})

describe('opening crawl callouts', () => {
  it('parses crawl and opening aliases', () => {
    const crawl = splitCalloutBlocks(`> [!crawl] The Siege of Kestrel
> It is a time of unrest.
>
> The outer colonies have gone silent.
`).find((part) => part.kind === 'crawl')
    expect(crawl).toMatchObject({
      kind: 'crawl',
      type: 'crawl',
      title: 'The Siege of Kestrel',
      markdown: 'It is a time of unrest.\n\nThe outer colonies have gone silent.'
    })

    const opening = splitCalloutBlocks('> [!opening]\n> A courier ship leaves the docks.\n')
    expect(opening[0]?.kind).toBe('crawl')
    expect(opening[0]?.type).toBe('opening')
    expect(opening[0]?.markdown).toBe('A courier ship leaves the docks.')
  })
})

describe('opening legend callouts', () => {
  it('parses legend, tale, and chronicle aliases', () => {
    const legend = splitCalloutBlocks(`> [!legend] The Pale Well
> The well runs cold.
`).find((part) => part.kind === 'legend')
    expect(legend).toMatchObject({
      kind: 'legend',
      type: 'legend',
      title: 'The Pale Well',
      markdown: 'The well runs cold.'
    })

    expect(splitCalloutBlocks('> [!tale]\n> Once upon a ridge.\n')[0]?.kind).toBe('legend')
    expect(splitCalloutBlocks('> [!chronicle] Year of the Well\n> Go.\n')[0]?.kind).toBe('legend')
  })
})

describe('gallery and video callouts', () => {
  it('parses gallery and video aliases', () => {
    expect(splitCalloutBlocks('> [!gallery] Faces\n> ![[A.png]]\n')[0]?.kind).toBe('gallery')
    expect(splitCalloutBlocks('> [!slides]\n> ![[A.png]]\n')[0]?.kind).toBe('gallery')
    expect(splitCalloutBlocks('> [!video] Intro\n> ![[Clip.mp4]]\n')[0]?.kind).toBe('video')
    expect(splitCalloutBlocks('> [!film]\n> ![[Clip.mp4]]\n')[0]?.kind).toBe('video')
  })
})

describe('scene callouts', () => {
  it('parses a scene and leaves nested read-aloud for the body', () => {
    const parts = splitCalloutBlocks(
      [
        '> [!scene] Opening — the Grey Mare',
        '> ![[The Grey Mare.webp]]',
        '>',
        "> Marta wants them upstairs before Kell's men see them.",
        '>',
        '> > [!readaloud]',
        '> > Rain hammers the shutters.',
        '>',
        '> - Map: [[The Grey Mare]]'
      ].join('\n')
    ).filter((part) => part.kind !== 'prose' || part.markdown.trim())
    expect(parts).toHaveLength(1)
    expect(parts[0]).toMatchObject({
      kind: 'scene',
      type: 'scene',
      title: 'Opening — the Grey Mare'
    })
    expect(parts[0]?.markdown).toContain('![[The Grey Mare.webp]]')
    expect(parts[0]?.markdown).toContain('> [!readaloud]')
    expect(parts[0]?.markdown).toContain('Rain hammers the shutters.')
    const nested = splitCalloutBlocks(parts[0]?.markdown ?? '')
    expect(nested.some((part) => part.kind === 'readaloud')).toBe(true)
  })

  it('splits leading scene art for a right-side frame', () => {
    const wiki = splitLeadingSceneArt('![[The Grey Mare.webp]]\n\nRain on the shutters.\n')
    expect(wiki).toEqual({
      artSrc: 'The Grey Mare.webp',
      artLabel: 'The Grey Mare.webp',
      body: 'Rain on the shutters.\n'
    })

    const prepared = splitLeadingSceneArt(
      '![The Grey Mare](<tabledm://file/?path=Places%2FArt%2FThe%20Grey%20Mare.webp>)\n\nWho wants what.\n'
    )
    expect(prepared.artSrc).toContain('tabledm://file/')
    expect(prepared.artLabel).toBe('The Grey Mare')
    expect(prepared.body).toBe('Who wants what.\n')

    const missing = splitLeadingSceneArt('*[missing image: Scene art.webp]*\n\nFirst thing they see.\n')
    expect(missing).toEqual({
      artSrc: null,
      artLabel: 'Scene art.webp',
      body: 'First thing they see.\n'
    })

    expect(splitLeadingSceneArt('No art here.\n')).toEqual({
      artSrc: null,
      artLabel: null,
      body: 'No art here.\n'
    })
  })
})

describe('campaign note lists', () => {
  it('lists npc sheets separately from party and bestiary', () => {
    expect(npcNotes(notes).map((n) => n.stem)).toEqual(['Hale'])
  })
})

describe('isNpcSheet', () => {
  const infobox = '# The Grey Mare\n\n> [!infobox]+\n> ### *Warm rooms*\n'

  it('treats Party and NPC notes as creature sheets', () => {
    expect(isNpcSheet(infobox, 'NPCs/Hale.md')).toBe(true)
    expect(isNpcSheet('```statblock\nname: Wolf\n```', 'Bestiary/Wolf.md')).toBe(true)
  })

  it('does not treat Places, Factions, Gear, or Spells as creature sheets', () => {
    expect(isNpcSheet(infobox, 'Places/The Grey Mare.md')).toBe(false)
    expect(isNpcSheet(infobox, 'Locations/Greystead.md')).toBe(false)
    expect(isNpcSheet(infobox, 'Factions/The Pale Well.md')).toBe(false)
    expect(isNpcSheet(infobox, 'Gear/Magic Items/Ring.md')).toBe(false)
  })
})

describe('statblock yaml', () => {
  it('parses core fields and actions', () => {
    const block = parseStatblockYaml(`name: Wolf
ac: 13
hp: 11
stats: [12, 15, 12, 3, 12, 6]
actions:
  - name: Bite
    desc: "+4 to hit. Hit: 5 (1d6+2) piercing."
`)
    expect(block.name).toBe('Wolf')
    expect(block.ac).toBe('13')
    expect(block.hp).toBe(11)
    expect(block.stats[1]).toBe(15)
    expect(block.actions[0]?.name).toBe('Bite')
  })
})

describe('dice helpers', () => {
  it('formats mods and ability scores', () => {
    expect(formatMod(3)).toBe('+3')
    expect(formatMod(-1)).toBe('-1')
    expect(abilityMod(14)).toBe(2)
    expect(abilityMod(9)).toBe(-1)
  })

  it('extracts attack and damage dice', () => {
    const found = extractRolls('+5 to hit, Hit: 10 (2d6+3) piercing. DC 15 Wisdom')
    expect(found.some((f) => f.label === 'To hit')).toBe(true)
    expect(found.some((f) => f.expr === '2d6+3')).toBe(true)
    expect(found.some((f) => /Save DC 15/.test(f.label))).toBe(true)
  })
})

describe('book parse', () => {
  it('parses a book bestiary file as monsters', () => {
    const records = parseBookFiles([
      {
        name: 'Campaign Bestiary.md',
        text: `# Campaign Bestiary

## Ash Husk
Medium Undead, Neutral Evil
AC: 11
Initiative: +1 (11)
HP: 18 (4d8)
Speed: 25 ft.
STR: 12 (+1)
DEX: 12 (+1)
CON: 11 (+0)
INT: 4 (-3)
WIS: 10 (+0)
CHA: 5 (-3)
Skills: Stealth +3
Resistances: Necrotic
Immunities: Poison; Exhaustion, Poisoned
Senses: Darkvision 60 ft.; Passive Perception 10
Languages: Understands Common but can't speak
CR: 1/4 (XP 50; PB +2)

Crumbling remains that still walk.

### Traits

Hollow Step. The husk ignores difficult terrain made of rubble.

### Actions

Grasp. Melee Attack Roll: +3, reach 5 ft. Hit: 5 (1d6+2) Necrotic damage.
`
      }
    ])
    expect(records).toHaveLength(1)
    expect(records[0]?.kind).toBe('monster')
    expect(records[0]?.name).toBe('Ash Husk')
    expect(records[0]?.sourceLabel).toBe('Bestiary')
    expect(records[0]?.data.ac).toBe(11)
    expect(records[0]?.data.hp).toBe(18)
    expect(records[0]?.data.cr).toBe('1/4')
    expect((records[0]?.data.scores as { strength?: number } | undefined)?.strength).toBe(12)
    expect(records[0]?.data.immunities).toBe('Poison')
    expect(records[0]?.data.conditionImmunities).toBe('Exhaustion, Poisoned')
    const actions = records[0]?.data.actions as { name: string }[] | undefined
    expect(actions?.[0]?.name).toBe('Grasp')
  })

  it('parses local book dumps when present without asserting official names or stats', async () => {
    const { existsSync, readdirSync, readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const folder = join(process.cwd(), 'Additional Books')
    if (!existsSync(folder)) return
    const files = readdirSync(folder).filter(
      (name) => /\.md$/i.test(name) && /bestiary|monster manual|ravenloft/i.test(name)
    )
    if (files.length === 0) return
    const records = parseBookFiles(
      files.map((name) => ({ name, text: readFileSync(join(folder, name), 'utf8') }))
    )
    expect(records.length).toBeGreaterThan(0)
    expect(records.every((record) => record.kind === 'monster')).toBe(true)
    expect(records.every((record) => record.name.length > 0)).toBe(true)
    expect(records.every((record) => typeof record.data.ac === 'number')).toBe(true)
    expect(records.every((record) => typeof record.data.hp === 'number')).toBe(true)
  })

  it('collapses Monster Manual letter files onto one Lookup source', () => {
    const records = parseBookFiles([
      {
        name: 'Monster Manual A.md',
        text: `# Campaign Bestiary A

## Ash Husk
Medium Undead, Neutral Evil
AC: 11
HP: 18 (4d8)
CR: 1/4 (XP 50; PB +2)
`
      },
      {
        name: 'Monster Manual B.md',
        text: `# Campaign Bestiary B

## Bone Wisp
Small Undead, Neutral
AC: 12
HP: 9 (2d6 + 2)
CR: 1/8 (XP 25; PB +2)
`
      }
    ])
    expect(new Set(records.map((record) => record.source))).toEqual(new Set(['monster-manual']))
    expect(records.map((record) => record.name).sort()).toEqual(['Ash Husk', 'Bone Wisp'])
  })
})
