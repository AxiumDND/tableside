import { abilityMod } from './dice'
import { pathHasFolder } from '../../../shared/campaignLayout'
import { STATBLOCK_LAYOUT_RE } from '../../../shared/systemPack'

export interface NamedBit {
  name: string
  desc: string
}

export interface ParsedStatblock {
  name: string
  size?: string
  type?: string
  alignment?: string
  ac?: string
  hp?: number
  hitDice?: string
  speed?: string
  stats: number[]
  saves: Record<string, number>
  skills: Record<string, number>
  immunities?: string
  resistances?: string
  vulnerabilities?: string
  conditionImmunities?: string
  senses?: string
  languages?: string
  cr?: string
  initiative?: number
  traits: NamedBit[]
  actions: NamedBit[]
  bonusActions: NamedBit[]
  reactions: NamedBit[]
  legendary: NamedBit[]
  willpower?: number
  maxWillpower?: number
  hunger?: number
}

const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const

function unquote(value: string): string {
  return value.trim().replace(/^["']|["']$/g, '')
}

function parseScalarMap(lines: string[], start: number): { map: Record<string, number>; next: number } {
  const map: Record<string, number> = {}
  let i = start
  while (i < lines.length) {
    const line = lines[i]
    if (!/^\s+-/.test(line) && line.trim() && !/^\s/.test(line)) break
    if (!line.trim()) {
      i += 1
      continue
    }
    const item = /^\s+-\s+([a-z_]+):\s*(.+)$/i.exec(line)
    if (!item) break
    map[item[1].toLowerCase()] = Number(item[2])
    i += 1
  }
  return { map, next: i }
}

function parseNamedList(lines: string[], start: number): { items: NamedBit[]; next: number } {
  const items: NamedBit[] = []
  let i = start
  let current: NamedBit | null = null
  while (i < lines.length) {
    const line = lines[i]
    if (line.trim() && !/^\s/.test(line)) break
    const name = /^\s+-\s+name:\s*(.+)$/.exec(line)
    if (name) {
      current = { name: unquote(name[1]), desc: '' }
      items.push(current)
      i += 1
      continue
    }
    const desc = /^\s+desc:\s*(.+)$/.exec(line)
    if (desc && current) {
      current.desc = unquote(desc[1])
      i += 1
      continue
    }
    if (!line.trim()) {
      i += 1
      continue
    }
    break
  }
  return { items, next: i }
}

export function parseStatblockYaml(raw: string): ParsedStatblock {
  const lines = raw.replace(/\r/g, '').split('\n')
  const block: ParsedStatblock = {
    name: 'Creature',
    stats: [10, 10, 10, 10, 10, 10],
    saves: {},
    skills: {},
    traits: [],
    actions: [],
    bonusActions: [],
    reactions: [],
    legendary: []
  }

  for (let i = 0; i < lines.length; ) {
    const line = lines[i]
    if (!line.trim() || line.trim().startsWith('#')) {
      i += 1
      continue
    }
    const kv = /^([a-z_]+):\s*(.*)$/i.exec(line)
    if (!kv) {
      i += 1
      continue
    }
    const key = kv[1].toLowerCase()
    const value = kv[2].trim()

    if (key === 'stats' && value.startsWith('[')) {
      block.stats = value
        .replace(/[[\]]/g, '')
        .split(',')
        .map((n) => Number(n.trim()))
      i += 1
      continue
    }
    if (key === 'saves' && !value) {
      const parsed = parseScalarMap(lines, i + 1)
      block.saves = parsed.map
      i = parsed.next
      continue
    }
    if ((key === 'skillsaves' || key === 'skills') && !value) {
      const parsed = parseScalarMap(lines, i + 1)
      block.skills = parsed.map
      i = parsed.next
      continue
    }
    if (key === 'traits' && !value) {
      const parsed = parseNamedList(lines, i + 1)
      block.traits = parsed.items
      i = parsed.next
      continue
    }
    if (key === 'actions' && !value) {
      const parsed = parseNamedList(lines, i + 1)
      block.actions = parsed.items
      i = parsed.next
      continue
    }
    if ((key === 'bonus_actions' || key === 'bonusactions') && !value) {
      const parsed = parseNamedList(lines, i + 1)
      block.bonusActions = parsed.items
      i = parsed.next
      continue
    }
    if (key === 'reactions' && !value) {
      const parsed = parseNamedList(lines, i + 1)
      block.reactions = parsed.items
      i = parsed.next
      continue
    }
    if ((key === 'legendary_actions' || key === 'legendaryactions' || key === 'legendary') && !value) {
      const parsed = parseNamedList(lines, i + 1)
      block.legendary = parsed.items
      i = parsed.next
      continue
    }

    const text = unquote(value)
    if (key === 'name') block.name = text
    else if (key === 'size') block.size = text
    else if (key === 'type') block.type = text
    else if (key === 'alignment') block.alignment = text
    else if (key === 'ac') block.ac = text
    else if (key === 'hp') block.hp = Number(text)
    else if (key === 'hit_dice') block.hitDice = text
    else if (key === 'speed') block.speed = text
    else if (key === 'damage_immunities') block.immunities = text
    else if (key === 'damage_resistances') block.resistances = text
    else if (key === 'damage_vulnerabilities') block.vulnerabilities = text
    else if (key === 'condition_immunities') block.conditionImmunities = text
    else if (key === 'senses') block.senses = text
    else if (key === 'languages') block.languages = text
    else if (key === 'cr') block.cr = text
    else if (key === 'initiative' || key === 'perception') {
      block.initiative = Number(text.replace(/^\+/, ''))
    } else if (key === 'willpower') {
      const nums = text.match(/\d+/g)?.map(Number) ?? []
      block.willpower = nums[0]
      block.maxWillpower = nums[1] ?? nums[0]
    } else if (key === 'hunger') {
      block.hunger = Number(text.replace(/[^\d]/g, '')) || 0
    }
    i += 1
  }

  while (block.stats.length < 6) block.stats.push(10)
  return block
}

export function extractStatblock(markdown: string): { block: ParsedStatblock; rest: string } | null {
  const fenced = /```statblock\r?\n([\s\S]*?)```/i.exec(markdown)
  if (fenced) {
    return {
      block: parseStatblockYaml(fenced[1]),
      rest: markdown.replace(fenced[0], '').trim()
    }
  }
  const unfenced = new RegExp(
    `(?:^|\\n)${STATBLOCK_LAYOUT_RE.source}\\r?\\n([\\s\\S]*?)(?=\\n#[a-z]|\\n*$)`,
    'i'
  ).exec(markdown)
  if (unfenced) {
    const layout = /Basic (?:5e|PF2e|V5) Layout/i.exec(unfenced[0])?.[0] ?? 'Basic 5e Layout'
    const raw = `layout: ${layout}\n${unfenced[1]}`
    return {
      block: parseStatblockYaml(raw),
      rest: (markdown.slice(0, unfenced.index) + markdown.slice((unfenced.index ?? 0) + unfenced[0].length)).trim()
    }
  }
  return null
}

export function isNpcSheet(markdown: string, path: string): boolean {
  const stem = (path.replaceAll('\\', '/').split('/').pop() ?? path).replace(/\.[^.]+$/, '')
  if (/roster/i.test(stem)) return false
  if (
    pathHasFolder(path, 'gear') ||
    pathHasFolder(path, 'spells') ||
    pathHasFolder(path, 'places') ||
    pathHasFolder(path, 'factions')
  ) {
    return false
  }
  return (
    /```statblock/i.test(markdown) ||
    STATBLOCK_LAYOUT_RE.test(markdown) ||
    pathHasFolder(path, 'npcs') ||
    pathHasFolder(path, 'party') ||
    /\[!(?:pc|npc|monster|creature|bestiary|player|character|infobox)\]/i.test(markdown)
  )
}

export function extractHook(markdown: string): string {
  const italic = /^\*([^*\n][\s\S]*?)\*$/m.exec(markdown)
  if (italic) return italic[1].trim()
  const afterFacts = markdown.split(/\n(?:Description|Look & voice|Notes|The stakes)\n/i)[0]
  const paras = afterFacts
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 40 && !/\[!(?:pc|npc|monster|place|shop|faction|gear|spell|infobox)\]|^#|Aliases|Ancestry|layout:/i.test(p))
  return paras[0]?.replace(/\s+/g, ' ') ?? ''
}

const FACT_LABELS = ['Aliases', 'Ancestry', 'Gender', 'Age', 'Role', 'Faction', 'Location', 'Status', 'CR']

export function extractFacts(markdown: string): { label: string; value: string }[] {
  const facts: { label: string; value: string }[] = []
  const seen = new Set<string>()

  const table = /\|\s*\*\*([^*]+)\*\*\s*\|\s*([^|]+)\|/g
  let match: RegExpExecArray | null
  while ((match = table.exec(markdown))) {
    const label = match[1].trim()
    if (seen.has(label)) continue
    seen.add(label)
    facts.push({ label, value: match[2].trim() })
  }

  for (const label of FACT_LABELS) {
    if (seen.has(label)) continue
    const line = new RegExp(`^\\*{0,2}${label}\\*{0,2}\\s*[|:·\\t]+\\s*(.+)$`, 'im').exec(markdown)
    if (!line) continue
    seen.add(label)
    facts.push({ label, value: line[1].trim() })
  }
  return facts
}

export function extractTagline(markdown: string): string {
  const heading = /^>\s*###\s+\*(.+)\*\s*$/m.exec(markdown) || /^###\s+\*(.+)\*\s*$/m.exec(markdown)
  if (heading) return heading[1].trim()
  const afterTitle = markdown.replace(/^#.*$/m, '')
  const line = afterTitle
    .split('\n')
    .map((l) => l.replace(/^>\s*/, '').trim())
    .find(
      (l) =>
        /·/.test(l) &&
        !l.startsWith('|') &&
        !/!?\[\[|\.(png|jpe?g|webp|gif|svg)\b/i.test(l) &&
        !/^aliases|ancestry|player|species|class/i.test(l)
    )
  return line ?? ''
}

function formatModMap(map: Record<string, number>): string | undefined {
  const entries = Object.entries(map)
  if (entries.length === 0) return undefined
  return entries.map(([key, mod]) => `${key} ${mod >= 0 ? '+' : ''}${mod}`).join(', ')
}

function parseModMap(text?: string): Record<string, number> {
  const map: Record<string, number> = {}
  if (!text) return map
  const re = /([a-z_]+)\s*([+-]\d+)/gi
  let match: RegExpExecArray | null
  while ((match = re.exec(text))) {
    map[match[1].toLowerCase()] = Number(match[2])
  }
  return map
}

function yamlScalar(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return '""'
  if (/[:#[\]{}&*!|>'"%@`]/.test(trimmed) || /\s/.test(trimmed) || /^-/.test(trimmed)) {
    return JSON.stringify(trimmed)
  }
  return trimmed
}

function yamlModMap(key: string, map: Record<string, number>): string {
  const entries = Object.entries(map)
  if (entries.length === 0) return ''
  return `${key}:\n${entries.map(([name, mod]) => `  - ${name}: ${mod}`).join('\n')}`
}

function yamlNamedList(key: string, items: NamedBit[]): string {
  if (items.length === 0) return ''
  return `${key}:\n${items
    .map((item) => `  - name: ${yamlScalar(item.name)}\n    desc: ${JSON.stringify(item.desc)}`)
    .join('\n')}`
}

export function parsedToBestiaryMarkdown(
  block: ParsedStatblock,
  layout = 'Basic 5e Layout'
): string {
  const name = block.name || 'Monster'
  const size = block.size || 'Medium'
  const type = (block.type || 'creature').replace(/^\w/, (c) => c.toLowerCase())
  const alignment = block.alignment || 'unaligned'
  const cr = block.cr?.trim() || '—'
  const stats = [...block.stats]
  while (stats.length < 6) stats.push(10)

  const yaml: string[] = [
    `layout: ${layout}`,
    `name: ${yamlScalar(name)}`,
    `size: ${yamlScalar(size)}`,
    `type: ${yamlScalar(type)}`,
    `alignment: ${yamlScalar(alignment)}`
  ]
  if (block.ac) yaml.push(`ac: ${block.ac}`)
  if (block.hp != null) yaml.push(`hp: ${block.hp}`)
  if (block.hitDice) yaml.push(`hit_dice: ${block.hitDice.replace(/\s+/g, '')}`)
  if (block.speed) yaml.push(`speed: ${yamlScalar(block.speed)}`)
  yaml.push(`stats: [${stats.slice(0, 6).join(', ')}]`)
  if (block.initiative != null && !Number.isNaN(block.initiative)) {
    yaml.push(`initiative: ${block.initiative}`)
  }
  yaml.push(yamlModMap('saves', block.saves))
  yaml.push(yamlModMap('skillsaves', block.skills))
  if (block.immunities) yaml.push(`damage_immunities: ${JSON.stringify(block.immunities)}`)
  if (block.resistances) yaml.push(`damage_resistances: ${JSON.stringify(block.resistances)}`)
  if (block.vulnerabilities) yaml.push(`damage_vulnerabilities: ${JSON.stringify(block.vulnerabilities)}`)
  if (block.conditionImmunities) {
    yaml.push(`condition_immunities: ${JSON.stringify(block.conditionImmunities)}`)
  }
  if (block.senses) yaml.push(`senses: ${JSON.stringify(block.senses)}`)
  if (block.languages) yaml.push(`languages: ${JSON.stringify(block.languages)}`)
  yaml.push(`cr: ${cr}`)
  yaml.push(yamlNamedList('traits', block.traits))
  yaml.push(yamlNamedList('actions', block.actions))
  yaml.push(yamlNamedList('bonus_actions', block.bonusActions))
  yaml.push(yamlNamedList('reactions', block.reactions))
  yaml.push(yamlNamedList('legendary_actions', block.legendary))

  const typeLine = `${size} ${type} · ${alignment} · CR ${cr}`

  return `# ${name}

[!monster]
![[${name}.webp]]

| | |
|---|---|
| **CR** | ${cr} |
| **Role** |  |
| **Source** | SRD 5.2 |
[!/monster]

\`\`\`statblock
${yaml.filter(Boolean).join('\n')}
\`\`\`

*SRD 5.2 monster. Add notes for this table.*

${typeLine}

## Notes

Add where it appears and how to run it.
`
}

export function parsedToStatBlock(block: ParsedStatblock): import('../../../shared/types').StatBlock {
  return {
    name: block.name,
    size: block.size,
    type: block.type,
    alignment: block.alignment,
    cr: block.cr,
    ac: Number(String(block.ac ?? 10).replace(/[^\d].*$/, '')) || 10,
    hp: Number(block.hp ?? 10),
    hitDice: block.hitDice,
    speed: block.speed,
    scores: {
      strength: block.stats[0],
      dexterity: block.stats[1],
      constitution: block.stats[2],
      intelligence: block.stats[3],
      wisdom: block.stats[4],
      charisma: block.stats[5]
    },
    initiativeBonus: block.initiative ?? abilityMod(block.stats[1] ?? 10),
    saves: formatModMap(block.saves),
    skills: formatModMap(block.skills),
    immunities: block.immunities,
    resistances: block.resistances,
    vulnerabilities: block.vulnerabilities,
    conditionImmunities: block.conditionImmunities,
    senses: block.senses,
    languages: block.languages,
    traits: block.traits,
    actions: block.actions,
    bonusActions: block.bonusActions,
    reactions: block.reactions,
    legendary: block.legendary
  }
}

export function statBlockToParsed(
  block: import('../../../shared/types').StatBlock,
  fallbackName?: string
): ParsedStatblock {
  return {
    name: block.name || fallbackName || 'Creature',
    size: block.size,
    type: block.type,
    alignment: block.alignment,
    ac: block.ac != null ? String(block.ac) : undefined,
    hp: block.hp,
    hitDice: block.hitDice,
    speed: block.speed,
    stats: [
      block.scores?.strength ?? 10,
      block.scores?.dexterity ?? 10,
      block.scores?.constitution ?? 10,
      block.scores?.intelligence ?? 10,
      block.scores?.wisdom ?? 10,
      block.scores?.charisma ?? 10
    ],
    saves: parseModMap(block.saves),
    skills: parseModMap(block.skills),
    immunities: block.immunities,
    resistances: block.resistances,
    vulnerabilities: block.vulnerabilities,
    conditionImmunities: block.conditionImmunities,
    senses: block.senses,
    languages: block.languages,
    cr: block.cr != null ? String(block.cr) : undefined,
    initiative: block.initiativeBonus,
    traits: block.traits ?? [],
    actions: block.actions ?? [],
    bonusActions: block.bonusActions ?? [],
    reactions: block.reactions ?? [],
    legendary: block.legendary ?? []
  }
}

function parsePair(value: string | undefined): { current: number; max: number } | null {
  if (!value) return null
  const nums = value.match(/\d+/g)?.map(Number) ?? []
  if (nums.length >= 2) return { current: nums[0], max: nums[1] }
  if (nums.length === 1) return { current: nums[0], max: nums[0] }
  return null
}

export function fallbackStatblock(path: string, markdown: string): ParsedStatblock {
  const facts = extractFacts(markdown)
  const heading = /^#\s+\*?(.+?)\*?\s*$/m.exec(markdown)
  const name =
    heading?.[1]?.replace(/\*/g, '').trim() ||
    (path.split('/').pop() ?? path).replace(/\.[^.]+$/, '').replace(/^PC\s+[—–-]\s+/i, '')
  const ac = facts.find((f) => /^ac$/i.test(f.label))?.value
  const hp =
    parsePair(facts.find((f) => /^hp$/i.test(f.label))?.value) ??
    parsePair(facts.find((f) => /^health$/i.test(f.label))?.value)
  const will = parsePair(facts.find((f) => /^willpower$/i.test(f.label))?.value)
  const hunger = parsePair(facts.find((f) => /^hunger$/i.test(f.label))?.value)
  const perception = facts.find((f) => /^perception$/i.test(f.label))?.value
  return {
    name,
    ac: ac?.match(/\d+/)?.[0] ?? '10',
    hp: hp?.current ?? 10,
    stats: [10, 10, 10, 10, 10, 10],
    saves: {},
    skills: {},
    traits: [],
    actions: [],
    bonusActions: [],
    reactions: [],
    legendary: [],
    initiative: perception ? Number(perception.replace(/^\+/, '')) : undefined,
    willpower: will?.current,
    maxWillpower: will?.max,
    hunger: hunger?.current
  }
}

export { ABILITIES }
