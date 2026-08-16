import { describe, expect, it } from 'vitest'
import {
  isCombatHeading,
  missingCombatantTokens,
  npcNotes,
  parseNightEncounters,
  type CampaignNote
} from './notes'
import { parseStatblockYaml } from './statblock'
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
})

describe('campaign note lists', () => {
  it('lists npc sheets separately from party and bestiary', () => {
    expect(npcNotes(notes).map((n) => n.stem)).toEqual(['Hale'])
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
  it('parses a minimal spell list file', () => {
    const records = parseWotcFiles([
      {
        name: 'Players Handbook 2024 Spell List.md',
        text: `# Spells

## Acid Splash
Evocation Cantrip (Sorcerer, Wizard)
Casting Time: Action
Range: 60 feet
Components: V, S
Duration: Instantaneous

You create an acidic bubble.
`
      }
    ])
    expect(records.length).toBeGreaterThan(0)
    expect(records[0]?.name).toBe('Acid Splash')
    expect(records[0]?.kind).toBe('spell')
  })
})
