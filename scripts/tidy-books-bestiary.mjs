import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs'
import { basename, extname } from 'node:path'

const args = process.argv.slice(2).filter((arg) => !arg.startsWith('--'))
const src = args[0] ?? 'Additional Books/Ravenloft horrors within Beastry.txt'
const dest = args[1] ?? 'Additional Books/Ravenloft Horrors Bestiary.md'
const removeSrc = process.argv.includes('--remove-src')
const bookTitle = basename(dest, extname(dest))

const SIZE = 'Tiny|Small|Medium|Large|Huge|Gargantuan'
const TYPE_LINE = new RegExp(
  `^(${SIZE})(?: or (?:${SIZE}))?(?: Swarm of Tiny [A-Za-z]+)? [A-Za-z].+,\\s*.+$`
)
const ABILITY = /^(STR|DEX|CON|INT|WIS|CHA)\s+(\d+)\s+([+\-−–]?\d+)\s+([+\-−–]?\d+)$/i
const SECTION =
  /^(Traits|Actions|Bonus Actions|Reactions|Legendary Actions|Lair Actions)$/i
const FIELD_PREFIX =
  /^(AC|HP|Speed|Skills|Senses|Languages|CR|Challenge|Gear|Resistances|Immunities|Vulnerabilities|Habitat)\b/i

function foldDash(value) {
  return value.replace(/[−–]/g, '-')
}

function isArtist(line) {
  const words = line.split(/\s+/).filter(Boolean)
  if (words.length < 2 || words.length > 4) return false
  if (/^(Madam|Lord|Lady|Count|Baron|Doctor|Sir|Saint)\b/i.test(words[0])) return false
  if (
    /\b(Plants?|Horrors?|Tree|Stalkers?|Insects?|Emissaries|Heads?|Swarms?|Wanderers?|Speakers?|Things?|Monsters?|Lairs?|Dragons?|Devils?|Bandits?)\b/i.test(
      line
    )
  ) {
    return false
  }
  const titled = (word) => /^[A-ZÀ-Ÿ][a-zà-ÿ'’\-]+$/.test(word) || /^[A-Z]\.$/.test(word)
  const lower = (word) => /^[a-zà-ÿ'’\-]+$/.test(word)
  return words.every((word, i) => titled(word) || (i > 0 && lower(word)))
}

function isCaption(line) {
  if (/^Front to Back:/i.test(line) || /^Left to Right:/i.test(line)) return true
  if (/^[a-z]/.test(line)) return true
  if (/^(A |An |The )/.test(line) && line.length < 80 && !/\.$/.test(line)) return true
  return false
}

function isJunkLore(line) {
  if (!line) return true
  if (/^Mod\s+Save$/i.test(line) || /^Ability\s+Score\s+Mod\s+Save$/i.test(line)) return true
  if (isArtist(line) || isCaption(line)) return true
  if (/^[A-Z]{3,8}$/.test(line) && line.length < 9) return true
  if (/^Ravenloft horrors/i.test(line) || /^Monsters\s+\([A-Z]\)$/i.test(line)) return true
  if (TYPE_LINE.test(line) || SECTION.test(line) || FIELD_PREFIX.test(line)) return true
  if (ABILITY.test(line)) return true
  return false
}

function parseType(line) {
  const comma = line.lastIndexOf(',')
  const left = comma === -1 ? line : line.slice(0, comma).trim()
  const alignment = comma === -1 ? '' : line.slice(comma + 1).trim()
  const sizeMatch = left.match(new RegExp(`^(${SIZE})(?: or (?:${SIZE}))?`))
  const size = sizeMatch?.[0] ?? ''
  const type = left.slice(size.length).trim()
  return { size, type, alignment }
}

function parseHabitat(line) {
  const match = /Habitat:\s*(.+?)(?:;?\s*Treasure:\s*(.*))?$/i.exec(line)
  if (!match) return null
  return { habitat: match[1].replace(/;+$/, '').trim(), treasure: (match[2] ?? '').trim() }
}

function parseNamedBits(body) {
  const bits = []
  for (const line of body) {
    const named = /^([A-Z][^.]{0,80}?)\.\s+(.+)$/.exec(line)
    if (named) {
      bits.push({ name: named[1].trim(), desc: named[2].trim() })
      continue
    }
    if (bits.length) bits[bits.length - 1].desc += ` ${line}`
    else bits.push({ name: 'Special', desc: line })
  }
  return bits
}

function formatTable(rows) {
  if (rows.length === 0) return []
  const cols = Math.max(...rows.map((row) => row.length), 1)
  const padded = rows.map((row) => {
    const next = [...row]
    while (next.length < cols) next.push('')
    return next
  })
  const header = `| ${padded[0].join(' | ')} |`
  const rule = `| ${padded[0].map(() => '---').join(' | ')} |`
  const body = padded.slice(1).map((row) => `| ${row.join(' | ')} |`)
  return [header, rule, ...body]
}

function tidyLore(rawLines, monsterName) {
  const out = []
  let table = []
  const flushTable = () => {
    if (!table.length) return
    if (out.length && out[out.length - 1] !== '') out.push('')
    out.push(...formatTable(table), '')
    table = []
  }
  for (const raw of rawLines) {
    const line = raw.trim()
    if (line === monsterName) continue
    if (isJunkLore(line) && !/\t/.test(raw) && !/^\d+\s/.test(line)) continue
    if (/\t/.test(raw) || /^\d+[dD]\d+\b/.test(line)) {
      table.push(raw.split(/\t/).map((cell) => cell.trim()))
      continue
    }
    flushTable()
    if (!line) {
      if (out.length && out[out.length - 1] !== '') out.push('')
      continue
    }
    out.push(line)
  }
  flushTable()
  while (out.length && out[0] === '') out.shift()
  while (out.length && out[out.length - 1] === '') out.pop()
  return out
}

function looksLikeBreak(line) {
  if (!line || SECTION.test(line) || FIELD_PREFIX.test(line) || ABILITY.test(line)) return false
  if (TYPE_LINE.test(line) || /[:.]/.test(line)) return false
  if (line.length > 70 || /^\d/.test(line) || /\t/.test(line)) return false
  return /^[A-ZÀ-Ÿ]/.test(line) && line.split(/\s+/).length <= 8
}

function scoreLine(key, fields) {
  const score = fields.scores[key]
  if (score == null) return null
  const mod = fields.mods[key]
  const save = fields.saves[key]
  const modText = mod >= 0 ? `+${mod}` : String(mod)
  if (save != null && save !== mod) {
    const saveText = save >= 0 ? `+${save}` : String(save)
    return `${key.toUpperCase()}: ${score} (${modText}, save ${saveText})`
  }
  return `${key.toUpperCase()}: ${score} (${modText})`
}

function emitMonster(monster) {
  const typeLine = `${monster.size} ${monster.type}, ${monster.alignment}`.replace(/\s+,/, ',')
  const linesOut = [`## ${monster.name}`, typeLine]
  const { fields } = monster
  if (fields.habitat) linesOut.push(`Habitat: ${fields.habitat}`)
  if (fields.treasure) linesOut.push(`Treasure: ${fields.treasure}`)
  if (fields.ac) linesOut.push(`AC: ${fields.ac}`)
  if (fields.initiative) linesOut.push(`Initiative: ${fields.initiative}`)
  if (fields.hp) linesOut.push(fields.hitDice ? `HP: ${fields.hp} (${fields.hitDice})` : `HP: ${fields.hp}`)
  if (fields.speed) linesOut.push(`Speed: ${fields.speed}`)
  for (const key of ['str', 'dex', 'con', 'int', 'wis', 'cha']) {
    const line = scoreLine(key, fields)
    if (line) linesOut.push(line)
  }
  if (fields.skills) linesOut.push(`Skills: ${fields.skills}`)
  if (fields.vulnerabilities) linesOut.push(`Vulnerabilities: ${fields.vulnerabilities}`)
  if (fields.resistances) linesOut.push(`Resistances: ${fields.resistances}`)
  if (fields.immunities) linesOut.push(`Immunities: ${fields.immunities}`)
  if (fields.gear) linesOut.push(`Gear: ${fields.gear}`)
  if (fields.senses) linesOut.push(`Senses: ${fields.senses}`)
  if (fields.languages) linesOut.push(`Languages: ${fields.languages}`)
  if (fields.cr) linesOut.push(`CR: ${fields.cr}`)
  if (monster.lore.length) linesOut.push('', ...monster.lore)
  for (const [section, bits] of Object.entries(monster.sections)) {
    if (!bits.length) continue
    linesOut.push('', `### ${section}`)
    for (const bit of bits) linesOut.push('', `${bit.name}. ${bit.desc}`)
  }
  return linesOut.join('\n')
}

function sectionName(line) {
  const lower = line.toLowerCase()
  if (lower === 'bonus actions') return 'Bonus Actions'
  if (lower === 'legendary actions') return 'Legendary Actions'
  if (lower === 'lair actions') return 'Lair Actions'
  if (lower === 'traits') return 'Traits'
  if (lower === 'actions') return 'Actions'
  if (lower === 'reactions') return 'Reactions'
  return line
}

const text = readFileSync(src, 'utf8').replace(/\r\n/g, '\n')
const lines = text.split('\n')
const typeAts = []
for (let i = 0; i < lines.length; i += 1) {
  if (TYPE_LINE.test(lines[i].trim())) typeAts.push(i)
}

function nameIndex(typeAt) {
  let i = typeAt - 1
  while (i >= 0 && !lines[i].trim()) i -= 1
  return i
}

const monsters = []
let loreCursor = 0
for (let n = 0; n < typeAts.length; n += 1) {
  const typeAt = typeAts[n]
  const nameAt = nameIndex(typeAt)
  const name = lines[nameAt]?.trim() ?? `Monster ${n + 1}`
  const nextNameAt = n + 1 < typeAts.length ? nameIndex(typeAts[n + 1]) : lines.length
  const typed = parseType(lines[typeAt].trim())
  const fields = {
    ac: '',
    initiative: '',
    hp: '',
    hitDice: '',
    speed: '',
    scores: {},
    mods: {},
    saves: {},
    skills: '',
    senses: '',
    languages: '',
    cr: '',
    gear: '',
    resistances: '',
    immunities: '',
    vulnerabilities: '',
    habitat: '',
    treasure: ''
  }
  const sections = {
    Traits: [],
    Actions: [],
    'Bonus Actions': [],
    Reactions: [],
    'Legendary Actions': [],
    'Lair Actions': []
  }
  let section = null
  let blockEnd = nextNameAt
  for (let i = typeAt + 1; i < nextNameAt; i += 1) {
    const line = foldDash(lines[i].trim())
    if (!line || /^Mod\s+Save$/i.test(line) || /^Ability\s+Score\s+Mod\s+Save$/i.test(line)) continue
    if (fields.cr && section && looksLikeBreak(line)) {
      blockEnd = i
      break
    }
    const habitat = parseHabitat(line)
    if (habitat) {
      fields.habitat = habitat.habitat
      fields.treasure = habitat.treasure
      continue
    }
    const ac = /^AC\s+(\d+)(?:\s+Initiative\s+(.+))?$/i.exec(line)
    if (ac) {
      fields.ac = ac[1]
      fields.initiative = (ac[2] ?? '').trim()
      continue
    }
    const hp = /^HP\s+(\d+)\s*(?:\((.+)\))?$/i.exec(line)
    if (hp) {
      fields.hp = hp[1]
      fields.hitDice = hp[2] ?? ''
      continue
    }
    const speed = /^Speed\s+(.+)$/i.exec(line)
    if (speed) {
      fields.speed = speed[1]
      continue
    }
    const ability = ABILITY.exec(line)
    if (ability) {
      const key = ability[1].toLowerCase()
      fields.scores[key] = Number(ability[2])
      fields.mods[key] = Number(ability[3])
      fields.saves[key] = Number(ability[4])
      continue
    }
    if (SECTION.test(line)) {
      section = sectionName(line)
      continue
    }
    const tagged =
      /^(Skills|Senses|Languages|Gear|Resistances|Immunities|Vulnerabilities)\s+(.+)$/i.exec(line)
    if (tagged && !section) {
      fields[tagged[1].toLowerCase()] = tagged[2]
      continue
    }
    const cr = /^(?:CR|Challenge)\s+(.+)$/i.exec(line)
    if (cr && !section) {
      fields.cr = cr[1]
      continue
    }
    if (section && sections[section]) sections[section].push(line)
  }

  const prelude = lines.slice(loreCursor, nameAt)
  loreCursor = Math.max(blockEnd, typeAt + 1)
  for (const raw of prelude) {
    const habitat = parseHabitat(foldDash(raw.trim()))
    if (!habitat) continue
    if (!fields.habitat) fields.habitat = habitat.habitat
    if (!fields.treasure) fields.treasure = habitat.treasure
  }

  monsters.push({
    name,
    ...typed,
    fields,
    lore: tidyLore(prelude, name),
    sections: Object.fromEntries(
      Object.entries(sections).map(([key, value]) => [key, parseNamedBits(value)])
    )
  })
}

const md = `# ${bookTitle}\n\n${monsters.map(emitMonster).join('\n\n')}\n`
writeFileSync(dest, md, 'utf8')
console.log(JSON.stringify({ count: monsters.length, names: monsters.map((monster) => monster.name) }, null, 2))
if (removeSrc && src !== dest && existsSync(src)) {
  unlinkSync(src)
  console.log('removed', src)
}
