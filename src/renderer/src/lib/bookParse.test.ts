import { describe, expect, it } from 'vitest'
import {
  parseBookBestiary,
  parsePhbSpellList,
  parsePhbEquipment,
  parseBookFiles,
  extraSourcesFromRecords
} from './bookParse'

const GOBLIN = `## Goblin
Small humanoid (goblinoid), neutral evil
AC: 15
Initiative: +2
HP: 7 (2d6)
Speed: 30 ft.
STR: 8 (-1)
DEX: 14 (+2)
CON: 10 (+0)
INT: 10 (+0)
WIS: 8 (-1)
CHA: 8 (-1)
Skills: Stealth +6
Senses: darkvision 60 ft.
Languages: Common, Goblin
CR: 1/4
### Traits
Nimble Escape. The goblin can take the Disengage or Hide action as a bonus action.
### Actions
Scimitar. Melee Attack: +4 to hit. Hit: 5 (1d6 + 2) slashing damage.
`

const FIREBALL = `## Fireball
Level 3 Evocation (Sorcerer, Wizard)
Casting Time: 1 action
Range: 150 feet
Components: V, S, M (a tiny ball of bat guano and sulfur)
Duration: Instantaneous
A bright streak flashes to a point you choose. Each creature in a 20-foot sphere makes a Dexterity saving throw.
Using a Higher-Level Spell Slot. The damage increases by 1d6 for each slot level above 3.
`

const LONGSWORD = `## Longsword
Martial Melee Weapon
Damage: 1d8 slashing
Properties: Versatile (1d10)
Weight: 3 lb.
Cost: 15 gp
A versatile blade favored by knights and mercenaries alike.
`

describe('parseBookBestiary', () => {
  it('parses a monster block into a structured SRD record', () => {
    const [goblin, ...rest] = parseBookBestiary(GOBLIN, 'Monster Manual.md')
    expect(rest).toHaveLength(0)
    expect(goblin.name).toBe('Goblin')
    expect(goblin.kind).toBe('monster')
    expect(goblin.source).toBe('monster-manual')
    expect(goblin.sourceLabel).toBe('MM2024')
    expect(goblin.data.size).toBe('Small')
    expect(String(goblin.data.type)).toContain('humanoid')
    expect(goblin.data.ac).toBe(15)
    expect(goblin.data.hp).toBe(7)
    expect(goblin.data.hitDice).toBe('2d6')
    expect(goblin.data.cr).toBe('1/4')
  })

  it('extracts ability scores, traits, and actions', () => {
    const [goblin] = parseBookBestiary(GOBLIN, 'Monster Manual.md')
    const scores = goblin.data.scores as Record<string, number>
    expect(scores.strength).toBe(8)
    expect(scores.dexterity).toBe(14)
    const traits = goblin.data.traits as { name: string }[]
    const actions = goblin.data.actions as { name: string }[]
    expect(traits[0].name).toBe('Nimble Escape')
    expect(actions[0].name).toBe('Scimitar')
  })
})

describe('parsePhbSpellList', () => {
  it('parses a spell with type line, fields, and higher-level rider', () => {
    const [fireball] = parsePhbSpellList(FIREBALL, 'PHB Spells.md')
    expect(fireball.name).toBe('Fireball')
    expect(fireball.kind).toBe('spell')
    expect(fireball.data.level).toBe(3)
    expect(fireball.data.school).toBe('Evocation')
    expect(fireball.data.classes).toEqual(['Sorcerer', 'Wizard'])
    expect(fireball.data.castingTime).toBe('1 action')
    expect(fireball.data.range).toBe('150 feet')
    expect(fireball.data.concentration).toBe(false)
    expect(String(fireball.data.desc)).toContain('bright streak')
    expect(String(fireball.data.higherLevel)).toContain('increases by 1d6')
  })
})

describe('parsePhbEquipment', () => {
  it('parses a weapon with category, damage, and cost', () => {
    const [sword] = parsePhbEquipment(LONGSWORD, 'Equipment.md')
    expect(sword.name).toBe('Longsword')
    expect(sword.kind).toBe('weapon')
    expect(sword.data.damage).toBe('1d8 slashing')
    expect(sword.data.cost).toBe('15 gp')
    expect(sword.summary).toContain('Martial Melee Weapon')
  })
})

describe('parseBookFiles', () => {
  it('dispatches each file to the right parser by content', () => {
    const records = parseBookFiles([
      { name: 'Monster Manual.md', text: GOBLIN },
      { name: 'PHB Spells.md', text: FIREBALL }
    ])
    const kinds = records.map((record) => record.kind)
    expect(kinds).toContain('monster')
    expect(kinds).toContain('spell')
  })

  it('dedupes records that share an id across files', () => {
    const records = parseBookFiles([
      { name: 'Monster Manual.md', text: GOBLIN },
      { name: 'Monster Manual.md', text: GOBLIN }
    ])
    expect(records).toHaveLength(1)
  })
})

describe('extraSourcesFromRecords', () => {
  it('aggregates records into per-source counts and labels', () => {
    const records = parseBookFiles([{ name: 'Monster Manual.md', text: GOBLIN }])
    const sources = extraSourcesFromRecords(records)
    expect(sources).toHaveLength(1)
    expect(sources[0]).toMatchObject({ id: 'monster-manual', label: 'MM2024', count: 1 })
  })
})
