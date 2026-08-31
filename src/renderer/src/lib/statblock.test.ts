import { describe, expect, it } from 'vitest'
import {
  parseStatblockYaml,
  extractStatblock,
  isNpcSheet,
  extractFacts,
  parsedToStatBlock
} from './statblock'

const YAML = `layout: Basic 5e Layout
name: Dire Wolf
size: Large
type: beast
alignment: unaligned
ac: 14
hp: 37
hit_dice: 5d10 + 10
speed: 50 ft.
stats: [17, 15, 15, 3, 12, 7]
initiative: 2
saves:
  - dex: 3
  - con: 2
skills:
  - perception: 5
  - stealth: 4
senses: passive Perception 15
languages: —
cr: 1
traits:
  - name: Pack Tactics
    desc: Advantage on attacks when an ally is within 5 feet.
actions:
  - name: Bite
    desc: Melee attack, 2d6 + 3 piercing damage.
`

describe('parseStatblockYaml', () => {
  it('parses scalars, stats, scalar maps, and named lists', () => {
    const block = parseStatblockYaml(YAML)
    expect(block.name).toBe('Dire Wolf')
    expect(block.size).toBe('Large')
    expect(block.type).toBe('beast')
    expect(block.ac).toBe('14')
    expect(block.hp).toBe(37)
    expect(block.hitDice).toBe('5d10 + 10')
    expect(block.stats).toEqual([17, 15, 15, 3, 12, 7])
    expect(block.initiative).toBe(2)
    expect(block.saves).toMatchObject({ dex: 3, con: 2 })
    expect(block.skills).toMatchObject({ perception: 5, stealth: 4 })
    expect(block.cr).toBe('1')
    expect(block.traits[0]).toMatchObject({ name: 'Pack Tactics' })
    expect(block.actions[0]).toMatchObject({ name: 'Bite' })
  })

  it('pads missing ability scores to six entries', () => {
    const block = parseStatblockYaml('name: Blob\nstats: [12, 8]\n')
    expect(block.stats).toHaveLength(6)
    expect(block.stats.slice(2)).toEqual([10, 10, 10, 10])
  })
})

describe('extractStatblock', () => {
  it('extracts a fenced statblock and returns the remaining markdown', () => {
    const markdown = `# Dire Wolf\n\nIntro prose.\n\n\`\`\`statblock\n${YAML}\`\`\`\n\n## Notes\nTail text.`
    const result = extractStatblock(markdown)
    expect(result).not.toBeNull()
    expect(result!.block.name).toBe('Dire Wolf')
    expect(result!.rest).not.toContain('```statblock')
    expect(result!.rest).toContain('Tail text.')
  })

  it('returns null when there is no statblock', () => {
    expect(extractStatblock('# Just a place\n\nNo creature here.')).toBeNull()
  })
})

describe('isNpcSheet', () => {
  it('treats a fenced statblock as an NPC/creature sheet', () => {
    expect(isNpcSheet('```statblock\nname: X\n```', 'Sessions/Note.md')).toBe(true)
  })

  it('treats an NPC callout in the NPCs folder as a sheet', () => {
    expect(isNpcSheet('[!npc]\nA shady fence.', 'NPCs/Bob.md')).toBe(true)
  })

  it('excludes gear and spell sheets even with statblock-like text', () => {
    expect(isNpcSheet('Damage: 1d8', 'Gear/Longsword.md')).toBe(false)
    expect(isNpcSheet('Level 1 spell', 'Spells/Bless.md')).toBe(false)
  })
})

describe('extractFacts', () => {
  it('reads bold table rows into label/value pairs', () => {
    const markdown = `# Bob\n\n| **Aliases** | The Knife |\n| **Role** | Fence |\n`
    const facts = extractFacts(markdown)
    expect(facts).toEqual([
      { label: 'Aliases', value: 'The Knife' },
      { label: 'Role', value: 'Fence' }
    ])
  })
})

describe('parsedToStatBlock', () => {
  it('maps parsed ability array into a named score object', () => {
    const stat = parsedToStatBlock(parseStatblockYaml(YAML))
    expect(stat.name).toBe('Dire Wolf')
    expect(stat.ac).toBe(14)
    expect(stat.scores?.strength).toBe(17)
    expect(stat.scores?.dexterity).toBe(15)
    expect(stat.initiativeBonus).toBe(2)
  })
})
