import { describe, expect, it } from 'vitest'
import {
  isCombatHeading,
  missingCombatantTokens,
  npcNotes,
  parseNightEncounters,
  type CampaignNote
} from './notes'
import { isNpcSheet, parseStatblockYaml } from './statblock'
import { abilityMod, extractRolls, formatMod } from './dice'
import { parseWotcFiles } from './wotcParse'

const notes: CampaignNote[] = [
  { relativePath: 'Party/PC — Mira.md', name: 'PC — Mira.md', stem: 'PC — Mira' },
  { relativePath: 'Bestiary/Wolf.md', name: 'Wolf.md', stem: 'Wolf' },
  { relativePath: 'NPCs/Hale.md', name: 'Hale.md', stem: 'Hale' }
]

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

describe('wotc parse', () => {
  it('parses a WOTC bestiary file as monsters', () => {
    const records = parseWotcFiles([
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
    const folder = join(process.cwd(), 'WOTC')
    if (!existsSync(folder)) return
    const files = readdirSync(folder).filter(
      (name) => /\.md$/i.test(name) && /bestiary|monster manual|ravenloft/i.test(name)
    )
    if (files.length === 0) return
    const records = parseWotcFiles(
      files.map((name) => ({ name, text: readFileSync(join(folder, name), 'utf8') }))
    )
    expect(records.length).toBeGreaterThan(0)
    expect(records.every((record) => record.kind === 'monster')).toBe(true)
    expect(records.every((record) => record.name.length > 0)).toBe(true)
    expect(records.every((record) => typeof record.data.ac === 'number')).toBe(true)
    expect(records.every((record) => typeof record.data.hp === 'number')).toBe(true)
  })

  it('collapses Monster Manual letter files onto one Lookup source', () => {
    const records = parseWotcFiles([
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
