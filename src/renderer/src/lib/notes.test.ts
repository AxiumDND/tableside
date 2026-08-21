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
  const infobox = '# Blue Water Inn\n\n> [!infobox]+\n> ### *Warm rooms*\n'

  it('treats Party and NPC notes as creature sheets', () => {
    expect(isNpcSheet(infobox, 'NPCs/Hale.md')).toBe(true)
    expect(isNpcSheet('```statblock\nname: Wolf\n```', 'Bestiary/Wolf.md')).toBe(true)
  })

  it('does not treat Places, Factions, Gear, or Spells as creature sheets', () => {
    expect(isNpcSheet(infobox, 'Places/Blue Water Inn.md')).toBe(false)
    expect(isNpcSheet(infobox, 'Locations/Vallaki.md')).toBe(false)
    expect(isNpcSheet(infobox, 'Factions/Keepers of the Feather.md')).toBe(false)
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
        name: 'Ravenloft Horrors Bestiary.md',
        text: `# Ravenloft Horrors Bestiary

## Boneless
Medium Undead, Chaotic Evil
AC: 12
Initiative: +2 (12)
HP: 22 (4d8 + 4)
Speed: 30 ft.
STR: 15 (+2)
DEX: 14 (+2)
CON: 12 (+1)
INT: 1 (-5)
WIS: 10 (+0)
CHA: 1 (-5)
Skills: Stealth +4
Resistances: Bludgeoning
Immunities: Poison; Exhaustion, Poisoned
Senses: Darkvision 60 ft.; Passive Perception 10
Languages: Understands Common but can't speak
CR: 1 (XP 200; PB +2)

Flayed skins that smother the living.

### Traits

Compression. The boneless can move through a space as narrow as 1 inch.

### Actions

Smother. Melee Attack Roll: +4, reach 5 ft. Hit: 7 (2d4 + 2) Bludgeoning damage.
`
      }
    ])
    expect(records).toHaveLength(1)
    expect(records[0]?.kind).toBe('monster')
    expect(records[0]?.name).toBe('Boneless')
    expect(records[0]?.sourceLabel).toBe('Ravenloft')
    expect(records[0]?.data.ac).toBe(12)
    expect(records[0]?.data.hp).toBe(22)
    expect(records[0]?.data.cr).toBe(1)
    expect((records[0]?.data.scores as { strength?: number } | undefined)?.strength).toBe(15)
    expect(records[0]?.data.immunities).toBe('Poison')
    expect(records[0]?.data.conditionImmunities).toBe('Exhaustion, Poisoned')
    const actions = records[0]?.data.actions as { name: string }[] | undefined
    expect(actions?.[0]?.name).toBe('Smother')
  })

  it('parses the local Ravenloft bestiary dump when present', async () => {
    const { existsSync, readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const path = join(process.cwd(), 'WOTC', 'Ravenloft Horrors Bestiary.md')
    if (!existsSync(path)) return
    const records = parseWotcFiles([{ name: 'Ravenloft Horrors Bestiary.md', text: readFileSync(path, 'utf8') }])
    expect(records.length).toBe(51)
    expect(records.every((record) => record.kind === 'monster')).toBe(true)
    const loup = records.find((record) => record.name === 'Loup Garou')
    expect(loup?.data.ac).toBe(17)
    expect(loup?.data.hp).toBe(187)
    const legendary = loup?.data.legendary as { name: string }[] | undefined
    expect(legendary?.some((bit) => bit.name === 'Mauling Charge')).toBe(true)
  })

  it('parses the local Monster Manual A dump when present', async () => {
    const { existsSync, readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const path = join(process.cwd(), 'WOTC', 'Monster Manual A.md')
    if (!existsSync(path)) return
    const records = parseWotcFiles([{ name: 'Monster Manual A.md', text: readFileSync(path, 'utf8') }])
    expect(records.length).toBe(19)
    expect(records.every((record) => record.kind === 'monster')).toBe(true)
    expect(records[0]?.sourceLabel).toBe('MM2024')
    expect(records[0]?.source).toBe('monster-manual')
    const aboleth = records.find((record) => record.name === 'Aboleth')
    expect(aboleth?.data.ac).toBe(17)
    expect(aboleth?.data.hp).toBe(150)
  })

  it('parses the local Monster Manual B dump when present', async () => {
    const { existsSync, readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const path = join(process.cwd(), 'WOTC', 'Monster Manual B.md')
    if (!existsSync(path)) return
    const records = parseWotcFiles([{ name: 'Monster Manual B.md', text: readFileSync(path, 'utf8') }])
    expect(records.length).toBe(46)
    expect(records.every((record) => record.kind === 'monster')).toBe(true)
    expect(records[0]?.sourceLabel).toBe('MM2024')
    expect(records[0]?.source).toBe('monster-manual')
    const beholder = records.find((record) => record.name === 'Beholder')
    expect(beholder?.data.ac).toBe(18)
    expect(beholder?.data.hp).toBe(190)
    const blob = records.find((record) => record.name === 'Blob of Annihilation')
    expect(blob?.data.cr).toBe(23)
  })

  it('parses the local Monster Manual C dump when present', async () => {
    const { existsSync, readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const path = join(process.cwd(), 'WOTC', 'Monster Manual C.md')
    if (!existsSync(path)) return
    const records = parseWotcFiles([{ name: 'Monster Manual C.md', text: readFileSync(path, 'utf8') }])
    expect(records.length).toBe(31)
    expect(records.every((record) => record.kind === 'monster')).toBe(true)
    expect(records[0]?.sourceLabel).toBe('MM2024')
    expect(records[0]?.source).toBe('monster-manual')
    const cambion = records.find((record) => record.name === 'Cambion')
    expect(cambion?.data.ac).toBe(19)
    expect(cambion?.data.hp).toBe(105)
    const colossus = records.find((record) => record.name === 'Colossus')
    expect(colossus?.data.cr).toBe(25)
  })

  it('parses the local Monster Manual D dump when present', async () => {
    const { existsSync, readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const path = join(process.cwd(), 'WOTC', 'Monster Manual D.md')
    if (!existsSync(path)) return
    const records = parseWotcFiles([{ name: 'Monster Manual D.md', text: readFileSync(path, 'utf8') }])
    expect(records.length).toBe(18)
    expect(records.every((record) => record.kind === 'monster')).toBe(true)
    expect(records[0]?.source).toBe('monster-manual')
    const dao = records.find((record) => record.name === 'Dao')
    expect(dao?.data.ac).toBe(18)
    expect(dao?.data.hp).toBe(200)
    const demilich = records.find((record) => record.name === 'Demilich')
    expect(demilich?.data.cr).toBe(18)
  })

  it('parses the local Monster Manual E dump when present', async () => {
    const { existsSync, readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const path = join(process.cwd(), 'WOTC', 'Monster Manual E.md')
    if (!existsSync(path)) return
    const records = parseWotcFiles([{ name: 'Monster Manual E.md', text: readFileSync(path, 'utf8') }])
    expect(records.length).toBe(8)
    expect(records.every((record) => record.kind === 'monster')).toBe(true)
    expect(records[0]?.source).toBe('monster-manual')
    const earth = records.find((record) => record.name === 'Earth Elemental')
    expect(earth?.data.ac).toBe(17)
    expect(earth?.data.hp).toBe(147)
    const empyrean = records.find((record) => record.name === 'Empyrean')
    expect(empyrean?.data.cr).toBe(23)
  })

  it('parses the local Monster Manual F dump when present', async () => {
    const { existsSync, readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const path = join(process.cwd(), 'WOTC', 'Monster Manual F.md')
    if (!existsSync(path)) return
    const records = parseWotcFiles([{ name: 'Monster Manual F.md', text: readFileSync(path, 'utf8') }])
    expect(records.length).toBe(13)
    expect(records.every((record) => record.kind === 'monster')).toBe(true)
    expect(records[0]?.source).toBe('monster-manual')
    const adult = records.find((record) => record.name === 'Faerie Dragon Adult')
    expect(adult?.data.ac).toBe(15)
    expect(adult?.data.hp).toBe(35)
    const necrohulk = records.find((record) => record.name === 'Violet Fungus Necrohulk')
    expect(necrohulk?.data.cr).toBe(7)
  })

  it('parses the local Monster Manual G dump when present', async () => {
    const { existsSync, readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const path = join(process.cwd(), 'WOTC', 'Monster Manual G.md')
    if (!existsSync(path)) return
    const records = parseWotcFiles([{ name: 'Monster Manual G.md', text: readFileSync(path, 'utf8') }])
    expect(records.length).toBe(47)
    expect(records.every((record) => record.kind === 'monster')).toBe(true)
    expect(records[0]?.source).toBe('monster-manual')
    const galeb = records.find((record) => record.name === 'Galeb Duhr')
    expect(galeb?.data.ac).toBe(16)
    expect(galeb?.data.hp).toBe(123)
    const ancient = records.find((record) => record.name === 'Ancient Gold Dragon')
    expect(ancient?.data.cr).toBe(24)
  })

  it('parses the local Monster Manual H dump when present', async () => {
    const { existsSync, readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const path = join(process.cwd(), 'WOTC', 'Monster Manual H.md')
    if (!existsSync(path)) return
    const records = parseWotcFiles([{ name: 'Monster Manual H.md', text: readFileSync(path, 'utf8') }])
    expect(records.length).toBe(14)
    expect(records.every((record) => record.kind === 'monster')).toBe(true)
    expect(records[0]?.source).toBe('monster-manual')
    const half = records.find((record) => record.name === 'Half-Dragon')
    expect(half?.data.ac).toBe(18)
    expect(half?.data.hp).toBe(105)
    const hydra = records.find((record) => record.name === 'Hydra')
    expect(hydra?.data.cr).toBe(8)
  })

  it('parses the local Monster Manual I dump when present', async () => {
    const { existsSync, readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const path = join(process.cwd(), 'WOTC', 'Monster Manual I.md')
    if (!existsSync(path)) return
    const records = parseWotcFiles([{ name: 'Monster Manual I.md', text: readFileSync(path, 'utf8') }])
    expect(records.length).toBe(6)
    expect(records.every((record) => record.kind === 'monster')).toBe(true)
    expect(records[0]?.source).toBe('monster-manual')
    const ice = records.find((record) => record.name === 'Ice Devil')
    expect(ice?.data.ac).toBe(18)
    expect(ice?.data.hp).toBe(228)
    const golem = records.find((record) => record.name === 'Iron Golem')
    expect(golem?.data.cr).toBe(16)
  })

  it('parses the local Monster Manual J dump when present', async () => {
    const { existsSync, readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const path = join(process.cwd(), 'WOTC', 'Monster Manual J.md')
    if (!existsSync(path)) return
    const records = parseWotcFiles([{ name: 'Monster Manual J.md', text: readFileSync(path, 'utf8') }])
    expect(records.length).toBe(1)
    expect(records[0]?.kind).toBe('monster')
    expect(records[0]?.source).toBe('monster-manual')
    const jackal = records.find((record) => record.name === 'Jackalwere')
    expect(jackal?.data.ac).toBe(12)
    expect(jackal?.data.hp).toBe(18)
    expect(jackal?.data.cr).toBe('1/2')
  })

  it('parses the local Monster Manual K dump when present', async () => {
    const { existsSync, readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const path = join(process.cwd(), 'WOTC', 'Monster Manual K.md')
    if (!existsSync(path)) return
    const records = parseWotcFiles([{ name: 'Monster Manual K.md', text: readFileSync(path, 'utf8') }])
    expect(records.length).toBe(10)
    expect(records.every((record) => record.kind === 'monster')).toBe(true)
    expect(records[0]?.source).toBe('monster-manual')
    const kenku = records.find((record) => record.name === 'Kenku')
    expect(kenku?.data.ac).toBe(13)
    expect(kenku?.data.hp).toBe(13)
    const kraken = records.find((record) => record.name === 'Kraken')
    expect(kraken?.data.cr).toBe(23)
  })

  it('parses the local Monster Manual L dump when present', async () => {
    const { existsSync, readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const path = join(process.cwd(), 'WOTC', 'Monster Manual L.md')
    if (!existsSync(path)) return
    const records = parseWotcFiles([{ name: 'Monster Manual L.md', text: readFileSync(path, 'utf8') }])
    expect(records.length).toBe(8)
    expect(records.every((record) => record.kind === 'monster')).toBe(true)
    expect(records[0]?.source).toBe('monster-manual')
    const lamia = records.find((record) => record.name === 'Lamia')
    expect(lamia?.data.ac).toBe(13)
    expect(lamia?.data.hp).toBe(97)
    const lich = records.find((record) => record.name === 'Lich')
    expect(lich?.data.cr).toBe(21)
  })

  it('parses the local Monster Manual M dump when present', async () => {
    const { existsSync, readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const path = join(process.cwd(), 'WOTC', 'Monster Manual M.md')
    if (!existsSync(path)) return
    const records = parseWotcFiles([{ name: 'Monster Manual M.md', text: readFileSync(path, 'utf8') }])
    expect(records.length).toBe(35)
    expect(records.every((record) => record.kind === 'monster')).toBe(true)
    expect(records[0]?.source).toBe('monster-manual')
    const apprentice = records.find((record) => record.name === 'Mage Apprentice')
    expect(apprentice?.data.ac).toBe(15)
    expect(apprentice?.data.hp).toBe(49)
    const marilith = records.find((record) => record.name === 'Marilith')
    expect(marilith?.data.cr).toBe(16)
  })

  it('parses the local Monster Manual N dump when present', async () => {
    const { existsSync, readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const path = join(process.cwd(), 'WOTC', 'Monster Manual N.md')
    if (!existsSync(path)) return
    const records = parseWotcFiles([{ name: 'Monster Manual N.md', text: readFileSync(path, 'utf8') }])
    expect(records.length).toBe(7)
    expect(records.every((record) => record.kind === 'monster')).toBe(true)
    expect(records[0]?.source).toBe('monster-manual')
    const nalf = records.find((record) => record.name === 'Nalfeshnee')
    expect(nalf?.data.ac).toBe(18)
    expect(nalf?.data.hp).toBe(184)
    const nyca = records.find((record) => record.name === 'Nycaloth')
    expect(nyca?.data.cr).toBe(9)
  })

  it('parses the local Monster Manual O dump when present', async () => {
    const { existsSync, readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const path = join(process.cwd(), 'WOTC', 'Monster Manual O.md')
    if (!existsSync(path)) return
    const records = parseWotcFiles([{ name: 'Monster Manual O.md', text: readFileSync(path, 'utf8') }])
    expect(records.length).toBe(7)
    expect(records.every((record) => record.kind === 'monster')).toBe(true)
    expect(records[0]?.source).toBe('monster-manual')
    const jelly = records.find((record) => record.name === 'Ochre Jelly')
    expect(jelly?.data.ac).toBe(8)
    expect(jelly?.data.hp).toBe(52)
    const primeval = records.find((record) => record.name === 'Primeval Owlbear')
    expect(primeval?.data.cr).toBe(7)
  })

  it('parses the local Monster Manual P dump when present', async () => {
    const { existsSync, readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const path = join(process.cwd(), 'WOTC', 'Monster Manual P.md')
    if (!existsSync(path)) return
    const records = parseWotcFiles([{ name: 'Monster Manual P.md', text: readFileSync(path, 'utf8') }])
    expect(records.length).toBe(20)
    expect(records.every((record) => record.kind === 'monster')).toBe(true)
    expect(records[0]?.source).toBe('monster-manual')
    const pegasus = records.find((record) => record.name === 'Pegasus')
    expect(pegasus?.data.ac).toBe(12)
    expect(pegasus?.data.hp).toBe(59)
    const pit = records.find((record) => record.name === 'Pit Fiend')
    expect(pit?.data.cr).toBe(20)
  })

  it('parses the local Monster Manual Q dump when present', async () => {
    const { existsSync, readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const path = join(process.cwd(), 'WOTC', 'Monster Manual Q.md')
    if (!existsSync(path)) return
    const records = parseWotcFiles([{ name: 'Monster Manual Q.md', text: readFileSync(path, 'utf8') }])
    expect(records.length).toBe(3)
    expect(records.every((record) => record.kind === 'monster')).toBe(true)
    expect(records[0]?.source).toBe('monster-manual')
    const quaggoth = records.find((record) => record.name === 'Quaggoth')
    expect(quaggoth?.data.ac).toBe(13)
    expect(quaggoth?.data.hp).toBe(45)
    const quasit = records.find((record) => record.name === 'Quasit')
    expect(quasit?.data.cr).toBe(1)
  })

  it('parses the local Monster Manual R dump when present', async () => {
    const { existsSync, readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const path = join(process.cwd(), 'WOTC', 'Monster Manual R.md')
    if (!existsSync(path)) return
    const records = parseWotcFiles([{ name: 'Monster Manual R.md', text: readFileSync(path, 'utf8') }])
    expect(records.length).toBe(13)
    expect(records.every((record) => record.kind === 'monster')).toBe(true)
    expect(records[0]?.source).toBe('monster-manual')
    const rakshasa = records.find((record) => record.name === 'Rakshasa')
    expect(rakshasa?.data.ac).toBe(17)
    expect(rakshasa?.data.hp).toBe(221)
    const ancient = records.find((record) => record.name === 'Ancient Red Dragon')
    expect(ancient?.data.cr).toBe(24)
  })

  it('parses the local Monster Manual S dump when present', async () => {
    const { existsSync, readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const path = join(process.cwd(), 'WOTC', 'Monster Manual S.md')
    if (!existsSync(path)) return
    const records = parseWotcFiles([{ name: 'Monster Manual S.md', text: readFileSync(path, 'utf8') }])
    expect(records.length).toBe(50)
    expect(records.every((record) => record.kind === 'monster')).toBe(true)
    expect(records[0]?.source).toBe('monster-manual')
    const warrior = records.find((record) => record.name === 'Sahuagin Warrior')
    expect(warrior?.data.ac).toBe(12)
    expect(warrior?.data.hp).toBe(22)
    const solar = records.find((record) => record.name === 'Solar')
    expect(solar?.data.cr).toBe(21)
  })

  it('parses the local Monster Manual T dump when present', async () => {
    const { existsSync, readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const path = join(process.cwd(), 'WOTC', 'Monster Manual T.md')
    if (!existsSync(path)) return
    const records = parseWotcFiles([{ name: 'Monster Manual T.md', text: readFileSync(path, 'utf8') }])
    expect(records.length).toBe(9)
    expect(records.every((record) => record.kind === 'monster')).toBe(true)
    expect(records[0]?.source).toBe('monster-manual')
    const tarrasque = records.find((record) => record.name === 'Tarrasque')
    expect(tarrasque?.data.ac).toBe(25)
    expect(tarrasque?.data.hp).toBe(697)
    expect(tarrasque?.data.cr).toBe(30)
  })

  it('parses the local Monster Manual U dump when present', async () => {
    const { existsSync, readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const path = join(process.cwd(), 'WOTC', 'Monster Manual U.md')
    if (!existsSync(path)) return
    const records = parseWotcFiles([{ name: 'Monster Manual U.md', text: readFileSync(path, 'utf8') }])
    expect(records.length).toBe(3)
    expect(records.every((record) => record.kind === 'monster')).toBe(true)
    expect(records[0]?.source).toBe('monster-manual')
    const ultroloth = records.find((record) => record.name === 'Ultroloth')
    expect(ultroloth?.data.ac).toBe(19)
    expect(ultroloth?.data.hp).toBe(221)
    expect(ultroloth?.data.cr).toBe(13)
  })

  it('parses the local Monster Manual V dump when present', async () => {
    const { existsSync, readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const path = join(process.cwd(), 'WOTC', 'Monster Manual V.md')
    if (!existsSync(path)) return
    const records = parseWotcFiles([{ name: 'Monster Manual V.md', text: readFileSync(path, 'utf8') }])
    expect(records.length).toBe(6)
    expect(records.every((record) => record.kind === 'monster')).toBe(true)
    expect(records[0]?.source).toBe('monster-manual')
    const familiar = records.find((record) => record.name === 'Vampire Familiar')
    expect(familiar?.data.ac).toBe(15)
    expect(familiar?.data.hp).toBe(65)
    const umbral = records.find((record) => record.name === 'Vampire Umbral Lord')
    expect(umbral?.data.cr).toBe(15)
  })

  it('parses the local Monster Manual W dump when present', async () => {
    const { existsSync, readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const path = join(process.cwd(), 'WOTC', 'Monster Manual W.md')
    if (!existsSync(path)) return
    const records = parseWotcFiles([{ name: 'Monster Manual W.md', text: readFileSync(path, 'utf8') }])
    expect(records.length).toBe(21)
    expect(records.every((record) => record.kind === 'monster')).toBe(true)
    expect(records[0]?.source).toBe('monster-manual')
    const infantry = records.find((record) => record.name === 'Warrior Infantry')
    expect(infantry?.data.ac).toBe(13)
    expect(infantry?.data.hp).toBe(9)
    const ancient = records.find((record) => record.name === 'Ancient White Dragon')
    expect(ancient?.data.cr).toBe(20)
  })

  it('parses the local Monster Manual X dump when present', async () => {
    const { existsSync, readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const path = join(process.cwd(), 'WOTC', 'Monster Manual X.md')
    if (!existsSync(path)) return
    const records = parseWotcFiles([{ name: 'Monster Manual X.md', text: readFileSync(path, 'utf8') }])
    expect(records.length).toBe(1)
    expect(records.every((record) => record.kind === 'monster')).toBe(true)
    expect(records[0]?.source).toBe('monster-manual')
    const xorn = records.find((record) => record.name === 'Xorn')
    expect(xorn?.data.ac).toBe(19)
    expect(xorn?.data.hp).toBe(84)
    expect(xorn?.data.cr).toBe(5)
  })

  it('parses the local Monster Manual Y dump when present', async () => {
    const { existsSync, readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const path = join(process.cwd(), 'WOTC', 'Monster Manual Y.md')
    if (!existsSync(path)) return
    const records = parseWotcFiles([{ name: 'Monster Manual Y.md', text: readFileSync(path, 'utf8') }])
    expect(records.length).toBe(8)
    expect(records.every((record) => record.kind === 'monster')).toBe(true)
    expect(records[0]?.source).toBe('monster-manual')
    const yeti = records.find((record) => record.name === 'Yeti')
    expect(yeti?.data.ac).toBe(12)
    expect(yeti?.data.hp).toBe(51)
    const yochlol = records.find((record) => record.name === 'Yochlol')
    expect(yochlol?.data.cr).toBe(10)
  })

  it('parses the local Monster Manual Z dump when present', async () => {
    const { existsSync, readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const path = join(process.cwd(), 'WOTC', 'Monster Manual Z.md')
    if (!existsSync(path)) return
    const records = parseWotcFiles([{ name: 'Monster Manual Z.md', text: readFileSync(path, 'utf8') }])
    expect(records.length).toBe(3)
    expect(records.every((record) => record.kind === 'monster')).toBe(true)
    expect(records[0]?.source).toBe('monster-manual')
    const zombie = records.find((record) => record.name === 'Zombie')
    expect(zombie?.data.ac).toBe(8)
    expect(zombie?.data.hp).toBe(15)
    const beholder = records.find((record) => record.name === 'Beholder Zombie')
    expect(beholder?.data.cr).toBe(5)
  })

  it('collapses Monster Manual letter files onto one Lookup source', async () => {
    const { existsSync, readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const files = [
      'Monster Manual A.md',
      'Monster Manual B.md',
      'Monster Manual C.md',
      'Monster Manual D.md',
      'Monster Manual E.md',
      'Monster Manual F.md',
      'Monster Manual G.md',
      'Monster Manual H.md',
      'Monster Manual I.md',
      'Monster Manual J.md',
      'Monster Manual K.md',
      'Monster Manual L.md',
      'Monster Manual M.md',
      'Monster Manual N.md',
      'Monster Manual O.md',
      'Monster Manual P.md',
      'Monster Manual Q.md',
      'Monster Manual R.md',
      'Monster Manual S.md',
      'Monster Manual T.md',
      'Monster Manual U.md',
      'Monster Manual V.md',
      'Monster Manual W.md',
      'Monster Manual X.md',
      'Monster Manual Y.md',
      'Monster Manual Z.md'
    ]
      .map((name) => ({ name, path: join(process.cwd(), 'WOTC', name) }))
      .filter((file) => existsSync(file.path))
    if (files.length < 2) return
    const records = parseWotcFiles(
      files.map((file) => ({ name: file.name, text: readFileSync(file.path, 'utf8') }))
    )
    expect(new Set(records.map((record) => record.source))).toEqual(new Set(['monster-manual']))
    expect(records.some((record) => record.name === 'Aboleth')).toBe(true)
    expect(records.some((record) => record.name === 'Balor')).toBe(true)
    expect(records.some((record) => record.name === 'Cambion')).toBe(true)
    expect(records.some((record) => record.name === 'Dao')).toBe(true)
    expect(records.some((record) => record.name === 'Earth Elemental')).toBe(true)
    expect(records.some((record) => record.name === 'Flumph')).toBe(true)
    expect(records.some((record) => record.name === 'Galeb Duhr')).toBe(true)
    expect(records.some((record) => record.name === 'Hydra')).toBe(true)
    expect(records.some((record) => record.name === 'Ice Devil')).toBe(true)
    expect(records.some((record) => record.name === 'Jackalwere')).toBe(true)
    expect(records.some((record) => record.name === 'Kenku')).toBe(true)
    expect(records.some((record) => record.name === 'Lamia')).toBe(true)
    expect(records.some((record) => record.name === 'Mimic')).toBe(true)
    expect(records.some((record) => record.name === 'Nothic')).toBe(true)
    expect(records.some((record) => record.name === 'Otyugh')).toBe(true)
    expect(records.some((record) => record.name === 'Pegasus')).toBe(true)
    expect(records.some((record) => record.name === 'Quasit')).toBe(true)
    expect(records.some((record) => record.name === 'Rakshasa')).toBe(true)
    expect(records.some((record) => record.name === 'Sahuagin Warrior')).toBe(true)
    expect(records.some((record) => record.name === 'Tarrasque')).toBe(true)
    expect(records.some((record) => record.name === 'Unicorn')).toBe(true)
    expect(records.some((record) => record.name === 'Vampire')).toBe(true)
    expect(records.some((record) => record.name === 'Wight')).toBe(true)
    expect(records.some((record) => record.name === 'Xorn')).toBe(true)
    expect(records.some((record) => record.name === 'Yeti')).toBe(true)
    expect(records.some((record) => record.name === 'Zombie')).toBe(true)
  })
})
