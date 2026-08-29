import type { SrdKind, SrdRecord } from './srd'
import type { AbilityScores } from '../../../shared/types'

const TYPE_LINE =
  /^(?:([A-Za-z]+)\s+)?Cantrip\s+\((.+)\)\s*$|^Level\s+(\d+)\s+([A-Za-z]+)\s+\((.+)\)\s*$/
const SECTION = /^Spells\s+\([A-Z0-9]\)$/i
const FIELD = /^(?:[-*]\s+)?(?:\*\*)?(Casting Time|Range|Components|Duration)(?:\*\*)?:\s*(.*)$/i
const HIGHER = /^(?:\*\*)?Using a Higher-Level Spell Slot\.(?:\*\*)?\s*/i
const HEADING = /^#{1,3}\s+(.+)$/

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function sourceIdFromName(fileName: string): string {
  const stem = fileName.replace(/\.[^.]+$/, '')
  if (/monster\s*manual|\bmm\b/i.test(stem)) return 'monster-manual'
  if (/ravenloft/i.test(stem)) return 'ravenloft'
  return slug(stem) || 'book'
}

function sourceLabelFromName(fileName: string): string {
  const stem = fileName.replace(/\.[^.]+$/, '')
  if (/equipment|gear/i.test(stem)) return 'PHB Gear'
  if (/magic item/i.test(stem) || /dungeon master/i.test(stem)) return 'DMG Items'
  if (/player'?s?\s*handbook|phb/i.test(stem) && /spell/i.test(stem)) return 'PHB 2024'
  if (/ravenloft/i.test(stem)) return 'Ravenloft'
  if (/monster\s*manual|\bmm\b/i.test(stem)) return 'MM2024'
  if (/bestiary|beastry/i.test(stem)) return 'Bestiary'
  return stem.replace(/\s+/g, ' ').trim() || 'Book'
}

function isTypeLine(line: string): boolean {
  return TYPE_LINE.test(line)
}

function nextNonEmpty(lines: string[], start: number): number {
  let i = start
  while (i < lines.length && !lines[i].trim()) i += 1
  return i
}

function looksLikeSpellList(fileName: string, text: string): boolean {
  if (/spell/i.test(fileName)) return true
  return /Casting Time:/i.test(text) && /Level \s*\d+/i.test(text) && TYPE_LINE.test(text)
}

function looksLikeEquipment(fileName: string, text: string): boolean {
  if (/equipment|gear/i.test(fileName)) return true
  return /^## /m.test(text) && /^(Damage|Armor Class|Cost):/m.test(text)
}

function looksLikeMagicItems(fileName: string, text: string): boolean {
  if (/magic item/i.test(fileName) || /dungeon master/i.test(fileName)) return true
  return /^## /m.test(text) && /^Rarity:/m.test(text)
}

function looksLikeBestiary(fileName: string, text: string): boolean {
  if (/bestiary|beastry|monster\s*manual|\bmm\b|ravenloft/i.test(fileName)) return true
  const types = text.match(/^(Tiny|Small|Medium|Large|Huge|Gargantuan)\b.+,/gm)
  return Boolean(types && types.length >= 3 && /^(AC|HP):/m.test(text) && /^(CR|Challenge):/m.test(text))
}

const EQUIPMENT_FIELD =
  /^(Damage|Properties|Mastery|Weight|Cost|Armor Class|Strength|Stealth|Don|Ability|Utilize|Craft|Variants|Carrying Capacity|Speed|Crew|Passengers|Cargo \(Tons\)|AC|HP|Damage Threshold|Rarity|Attunement):\s*(.*)$/i

function equipmentKind(category: string, fields: Record<string, string>): SrdKind {
  if (fields.Damage || /weapon/i.test(category)) return 'weapon'
  if (category === 'Rule' || category === 'Lifestyle') return 'rule'
  return 'gear'
}

export function parsePhbEquipment(text: string, fileName: string): SrdRecord[] {
  const source = sourceIdFromName(fileName)
  const sourceLabel = sourceLabelFromName(fileName)
  const blocks = text.replace(/\r\n/g, '\n').split(/^## /m).slice(1)
  const records: SrdRecord[] = []

  for (const block of blocks) {
    const lines = block.split('\n').map((line) => line.trim())
    const name = lines[0]?.replace(/^#+\s*/, '').trim()
    if (!name) continue
    let category = ''
    const fields: Record<string, string> = {}
    const body: string[] = []
    let startedBody = false

    for (const line of lines.slice(1)) {
      if (!line) {
        if (Object.keys(fields).length > 0 || category) startedBody = true
        continue
      }
      const field = EQUIPMENT_FIELD.exec(line)
      if (field && !startedBody) {
        fields[field[1]] = field[2]
        continue
      }
      if (
        !category &&
        !startedBody &&
        !field &&
        !line.startsWith('|') &&
        (line.length <= 90 ||
          /^(Wondrous Item|Armor|Weapon|Potion|Ring|Rod|Staff|Wand|Scroll|Simple|Martial|Light|Medium|Heavy)\b/i.test(
            line
          ))
      ) {
        category = line
        continue
      }
      startedBody = true
      body.push(line)
    }

    const desc = body.join('\n').replace(/\n{3,}/g, '\n\n').trim()
    const kind = equipmentKind(category, fields)
    const summary = [category, fields.Damage, fields['Armor Class'], fields.Cost, fields.Weight]
      .filter(Boolean)
      .join(' · ')

    records.push({
      id: `${source}_${slug(name)}`,
      name,
      kind,
      searchText: [name, category, desc, ...Object.values(fields), sourceLabel].filter(Boolean).join(' '),
      summary: summary || sourceLabel,
      source,
      sourceLabel,
      data: {
        name,
        category,
        desc,
        ...fields,
        damage: fields.Damage,
        properties: fields.Properties,
        cost: fields.Cost,
        weight: fields.Weight
      }
    })
  }

  return records
}

export function parsePhbMagicItems(text: string, fileName: string): SrdRecord[] {
  return parsePhbEquipment(text, fileName).map((record) => {
    const rarity = String(record.data.Rarity ?? '')
    const attunement = String(record.data.Attunement ?? '')
    const category = String(record.data.category ?? '')
    return {
      ...record,
      kind: 'gear' as const,
      summary: [category, rarity, attunement].filter(Boolean).join(' · ') || record.summary
    }
  })
}

const SIZE_LINE =
  /^(Tiny|Small|Medium|Large|Huge|Gargantuan)(?: or (?:Tiny|Small|Medium|Large|Huge|Gargantuan))?(?: Swarm of Tiny \w+)? .+,/
const MONSTER_FIELD =
  /^(Habitat|Treasure|AC|Initiative|HP|Speed|STR|DEX|CON|INT|WIS|CHA|Skills|Senses|Languages|CR|Challenge|Gear|Resistances|Immunities|Vulnerabilities):\s*(.*)$/i
const CONDITION_WORD =
  /^(Blinded|Charmed|Deafened|Exhaustion|Frightened|Grappled|Incapacitated|Invisible|Paralyzed|Petrified|Poisoned|Prone|Restrained|Stunned|Unconscious)$/i
const ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const
const ABILITY_NAMES: Record<(typeof ABILITY_KEYS)[number], keyof AbilityScores> = {
  str: 'strength',
  dex: 'dexterity',
  con: 'constitution',
  int: 'intelligence',
  wis: 'wisdom',
  cha: 'charisma'
}

function parseSigned(value: string): number | undefined {
  const match = /^([+\-−–]?\d+)/.exec(value.trim())
  if (!match) return undefined
  return Number(match[1].replace(/[−–]/g, '-'))
}

function parseAbilityScore(value: string): { score: number; mod?: number; save?: number } | null {
  const match = /^(\d+)\s*\(\s*([+\-−–]?\d+)(?:\s*,\s*save\s+([+\-−–]?\d+))?\s*\)/.exec(value.trim())
  if (match) {
    return {
      score: Number(match[1]),
      mod: Number(match[2].replace(/[−–]/g, '-')),
      save: match[3] != null ? Number(match[3].replace(/[−–]/g, '-')) : undefined
    }
  }
  const score = Number(value.trim())
  return Number.isFinite(score) ? { score } : null
}

function parseHp(value: string): { hp?: number; hitDice?: string } {
  const match = /^(\d+)\s*(?:\((.+)\))?/.exec(value.trim())
  if (!match) return {}
  return { hp: Number(match[1]), hitDice: match[2]?.replace(/\s+/g, '') }
}

function parseCr(value: string): number | string {
  const lead = /^(?:(\d+\/\d+)|(\d+))/.exec(value.trim())
  if (!lead) return value.trim()
  return lead[1] ?? Number(lead[2])
}

function splitImmunities(value: string): { immunities?: string; conditionImmunities?: string } {
  const trimmed = value.trim()
  if (!trimmed) return {}
  if (trimmed.includes(';')) {
    const [damage, conditions] = trimmed.split(';').map((part) => part.trim())
    return { immunities: damage || undefined, conditionImmunities: conditions || undefined }
  }
  const parts = trimmed.split(',').map((part) => part.trim()).filter(Boolean)
  if (parts.length && parts.every((part) => CONDITION_WORD.test(part))) {
    return { conditionImmunities: trimmed }
  }
  return { immunities: trimmed }
}

function parseNamedBits(lines: string[]): { name: string; desc: string }[] {
  const bits: { name: string; desc: string }[] = []
  for (const line of lines) {
    const named = /^([A-Z][^.]{0,80}?)\.\s+(.+)$/.exec(line)
    if (named) {
      bits.push({ name: named[1].trim(), desc: named[2].trim() })
      continue
    }
    if (bits.length) bits[bits.length - 1].desc += ` ${line}`
  }
  return bits
}

function monsterSummary(fields: Record<string, string>, size: string, type: string, cr: number | string): string {
  const ac = fields.AC
  const hp = fields.HP?.match(/^\d+/)?.[0]
  return [size, type, cr !== '' ? `CR ${cr}` : null, ac ? `AC ${ac}` : null, hp ? `HP ${hp}` : null]
    .filter(Boolean)
    .join(' · ')
}

export function parseBookBestiary(text: string, fileName: string): SrdRecord[] {
  const source = sourceIdFromName(fileName)
  const sourceLabel = sourceLabelFromName(fileName)
  const blocks = text.replace(/\r\n/g, '\n').split(/^## /m).slice(1)
  const records: SrdRecord[] = []

  for (const block of blocks) {
    const lines = block.split('\n').map((line) => line.trim())
    const name = lines[0]?.replace(/^#+\s*/, '').trim()
    if (!name) continue
    const typeAt = lines.findIndex((line, index) => index > 0 && SIZE_LINE.test(line))
    const typeLine = typeAt >= 0 ? lines[typeAt] : ''
    const comma = typeLine.lastIndexOf(',')
    const left = comma === -1 ? typeLine : typeLine.slice(0, comma).trim()
    const alignment = comma === -1 ? '' : typeLine.slice(comma + 1).trim()
    const sizeMatch = left.match(/^(Tiny|Small|Medium|Large|Huge|Gargantuan)(?: or (?:Tiny|Small|Medium|Large|Huge|Gargantuan))?/)
    const size = sizeMatch?.[0] ?? ''
    const type = left.slice(size.length).trim()

    const fields: Record<string, string> = {}
    const body: string[] = []
    const sections: Record<string, string[]> = {
      traits: [],
      actions: [],
      'bonus actions': [],
      reactions: [],
      'legendary actions': [],
      'lair actions': []
    }
    let section = ''

    for (const line of lines.slice(Math.max(typeAt, 0) + 1)) {
      if (!line) continue
      const heading = /^###\s+(.+)$/.exec(line)
      if (heading) {
        section = heading[1].trim().toLowerCase()
        continue
      }
      const field = MONSTER_FIELD.exec(line)
      if (field && !section) {
        fields[field[1]] = field[2]
        continue
      }
      if (section && sections[section]) {
        sections[section].push(line)
        continue
      }
      body.push(line)
    }

    const scores: AbilityScores = {}
    const modifiers: AbilityScores = {}
    const saveParts: string[] = []
    for (const key of ABILITY_KEYS) {
      const parsed = parseAbilityScore(fields[key.toUpperCase()] ?? '')
      if (!parsed) continue
      scores[ABILITY_NAMES[key]] = parsed.score
      if (parsed.mod != null) modifiers[ABILITY_NAMES[key]] = parsed.mod
      if (parsed.save != null && parsed.save !== parsed.mod) {
        saveParts.push(`${key[0].toUpperCase()}${key.slice(1)} ${parsed.save >= 0 ? '+' : ''}${parsed.save}`)
      }
    }

    const hpParsed = parseHp(fields.HP ?? '')
    const cr = fields.CR || fields.Challenge ? parseCr(fields.CR || fields.Challenge) : ''
    const split = splitImmunities(fields.Immunities ?? '')
    const desc = body.join('\n').replace(/\n{3,}/g, '\n\n').trim()
    const traits = parseNamedBits(sections.traits)
    const actions = parseNamedBits(sections.actions)
    const bonusActions = parseNamedBits(sections['bonus actions'])
    const reactions = parseNamedBits(sections.reactions)
    const legendary = parseNamedBits(sections['legendary actions'])
    const lair = parseNamedBits(sections['lair actions'])

    records.push({
      id: `${source}_${slug(name)}`,
      name,
      kind: 'monster',
      searchText: [name, type, alignment, desc, fields.Habitat, sourceLabel].filter(Boolean).join(' '),
      summary: monsterSummary(fields, size, type, cr),
      source,
      sourceLabel,
      data: {
        name,
        size,
        type,
        alignment,
        cr: cr === '' ? undefined : cr,
        ac: Number(fields.AC) || undefined,
        hp: hpParsed.hp,
        hitDice: hpParsed.hitDice,
        speed: fields.Speed,
        scores,
        modifiers,
        initiativeBonus: parseSigned(fields.Initiative ?? ''),
        saves: saveParts.join(', ') || undefined,
        skills: fields.Skills,
        senses: fields.Senses,
        languages: fields.Languages,
        immunities: split.immunities,
        conditionImmunities: split.conditionImmunities,
        resistances: fields.Resistances,
        vulnerabilities: fields.Vulnerabilities,
        habitat: fields.Habitat,
        treasure: fields.Treasure,
        gear: fields.Gear,
        desc,
        traits,
        actions,
        bonusActions,
        reactions,
        legendary,
        lair
      }
    })
  }

  return records
}

function isArtistCredit(line: string): boolean {
  const words = line.split(/\s+/).filter(Boolean)
  if (words.length === 1) {
    return (
      line.length >= 6 &&
      /^[A-Z]+$/.test(line) &&
      !/^(CONCENTRATION|INSTANTANEOUS|UNALIGNED|CONSTRUCT|HUMANOID|UNDEAD)$/.test(line)
    )
  }
  if (words.length < 2 || words.length > 4 || line.length > 42) return false
  if (/^(AC|HP|CR|DC|STR|DEX|CON|INT|WIS|CHA)\b/.test(line)) return false
  return words.every((word) => /^[A-Z][A-Z.'’-]*$/.test(word) || /^[A-Z]\.$/.test(word))
}

function isArtCaption(line: string, prevArtist: boolean): boolean {
  if (/Affected by the Spell/i.test(line)) return true
  if (!prevArtist) return false
  if (line.length > 180) return false
  return !/\b(AC|HP|DC|damage|saving throw|spell slot|Hit Points|creature|target|duration)\b/i.test(line)
}

function isJunkLine(line: string, prevArtist: boolean): boolean {
  return isArtistCredit(line) || isArtCaption(line, prevArtist)
}

function isCompactLine(line: string): boolean {
  if (/\t/.test(line)) return true
  if (/^(AC|HP|Speed|Mod|STR|DEX|CON|INT|WIS|CHA|Immunities|Senses|Languages|CR|Actions)\b/.test(line)) {
    return true
  }
  return line.length < 70 && !/[.!?]$/.test(line)
}

function joinSpellBody(lines: string[]): string {
  if (lines.length === 0) return ''
  let text = lines[0]
  for (let i = 1; i < lines.length; i += 1) {
    const tight = isCompactLine(lines[i]) && isCompactLine(lines[i - 1])
    text += tight ? '\n' : '\n\n'
    text += lines[i]
  }
  return text
}

function parseTypeLine(line: string): { level: number; school: string; classes: string[] } | null {
  const cantrip = /^(?:([A-Za-z]+)\s+)?Cantrip\s+\((.+)\)\s*$/.exec(line)
  if (cantrip) {
    return {
      level: 0,
      school: cantrip[1] ?? '',
      classes: cantrip[2].split(',').map((part) => part.trim()).filter(Boolean)
    }
  }
  const leveled = /^Level\s+(\d+)\s+([A-Za-z]+)\s+\((.+)\)\s*$/.exec(line)
  if (leveled) {
    return {
      level: Number(leveled[1]),
      school: leveled[2],
      classes: leveled[3].split(',').map((part) => part.trim()).filter(Boolean)
    }
  }
  return null
}

function spellSummary(level: number, school: string, castingTime: string, range: string): string {
  const tier = level === 0 ? 'Cantrip' : `Level ${level}`
  return [tier, school, castingTime, range].filter(Boolean).join(' · ')
}

export function parsePhbSpellList(text: string, fileName: string): SrdRecord[] {
  const source = sourceIdFromName(fileName)
  const sourceLabel = sourceLabelFromName(fileName)
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const records: SrdRecord[] = []

  const starts: number[] = []
  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i].trim()
    const heading = HEADING.exec(raw)
    const name = heading?.[1]?.trim() ?? raw
    if (!name || raw.startsWith('# ') || SECTION.test(name) || FIELD.test(name) || isTypeLine(name)) {
      continue
    }
    const typeAt = nextNonEmpty(lines, i + 1)
    if (typeAt < lines.length && isTypeLine(lines[typeAt].trim())) starts.push(i)
  }

  for (let s = 0; s < starts.length; s += 1) {
    const nameAt = starts[s]
    const rawName = lines[nameAt].trim()
    const name = (HEADING.exec(rawName)?.[1] ?? rawName).trim()
    const typeAt = nextNonEmpty(lines, nameAt + 1)
    const typed = parseTypeLine(lines[typeAt].trim())
    if (!typed) continue

    const end = s + 1 < starts.length ? starts[s + 1] : lines.length
    let castingTime = ''
    let range = ''
    let components = ''
    let duration = ''
    const body: string[] = []

    let prevArtist = false
    for (let i = typeAt + 1; i < end; i += 1) {
      const line = lines[i].trim()
      if (!line || SECTION.test(line)) continue
      const field = FIELD.exec(line)
      if (field) {
        const key = field[1].toLowerCase()
        if (key === 'casting time') castingTime = field[2]
        else if (key === 'range') range = field[2]
        else if (key === 'components') components = field[2]
        else if (key === 'duration') duration = field[2]
        prevArtist = false
        continue
      }
      if (isJunkLine(line, prevArtist)) {
        prevArtist = isArtistCredit(line)
        continue
      }
      prevArtist = false
      body.push(line)
    }

    const higherIndex = body.findIndex((line) => HIGHER.test(line))
    const descLines = higherIndex === -1 ? body : body.slice(0, higherIndex)
    const higherLines = higherIndex === -1 ? [] : body.slice(higherIndex)
    const desc = joinSpellBody(descLines)
    const higherLevel = joinSpellBody(higherLines).replace(HIGHER, '')

    records.push({
      id: `${source}_${slug(name)}`,
      name,
      kind: 'spell',
      searchText: [name, typed.school, desc, typed.classes.join(' '), sourceLabel].filter(Boolean).join(' '),
      summary: spellSummary(typed.level, typed.school, castingTime, range),
      source,
      sourceLabel,
      data: {
        id: `${source}_${slug(name)}`,
        name,
        kind: 'spell',
        level: typed.level,
        school: typed.school,
        castingTime,
        range,
        components,
        duration,
        concentration: /concentration/i.test(duration),
        ritual: /ritual/i.test(castingTime),
        desc,
        higherLevel,
        classes: typed.classes
      }
    })
  }

  return records
}

function parseGenericBook(text: string, fileName: string): SrdRecord[] {
  const source = sourceIdFromName(fileName)
  const sourceLabel = sourceLabelFromName(fileName)
  const blocks = text
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)

  const records: SrdRecord[] = []
  for (const block of blocks) {
    const lines = block.split('\n')
    const heading = lines[0].replace(/^#+\s*/, '').trim()
    if (!heading || heading.length > 80 || SECTION.test(heading)) continue
    const desc = lines.slice(1).join('\n').trim()
    if (!desc) continue
    records.push({
      id: `${source}_${slug(heading)}`,
      name: heading,
      kind: 'book',
      searchText: `${heading} ${desc} ${sourceLabel}`,
      summary: sourceLabel,
      source,
      sourceLabel,
      data: { name: heading, desc }
    })
  }
  return records
}

export function parseBookFiles(files: { name: string; text: string }[]): SrdRecord[] {
  const records: SrdRecord[] = []
  const seen = new Set<string>()
  for (const file of files) {
    const parsed = looksLikeBestiary(file.name, file.text)
      ? parseBookBestiary(file.text, file.name)
      : looksLikeSpellList(file.name, file.text)
        ? parsePhbSpellList(file.text, file.name)
        : looksLikeEquipment(file.name, file.text)
          ? parsePhbEquipment(file.text, file.name)
          : looksLikeMagicItems(file.name, file.text)
            ? parsePhbMagicItems(file.text, file.name)
            : parseGenericBook(file.text, file.name)
    for (const record of parsed) {
      if (seen.has(record.id)) continue
      seen.add(record.id)
      records.push(record)
    }
  }
  return records
}

export function extraSourcesFromRecords(records: SrdRecord[]): { id: string; label: string; kind: SrdKind; count: number }[] {
  const map = new Map<string, { id: string; label: string; kind: SrdKind; count: number }>()
  for (const record of records) {
    if (!record.source) continue
    const current = map.get(record.source)
    if (current) {
      current.count += 1
      continue
    }
    map.set(record.source, {
      id: record.source,
      label: record.sourceLabel ?? record.source,
      kind: record.kind,
      count: 1
    })
  }
  return [...map.values()]
}
