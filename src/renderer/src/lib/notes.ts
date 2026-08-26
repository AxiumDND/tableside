import type { CampaignTreeNode } from '../../../shared/types'
import { IMAGE_EXT, type CampaignImage } from './images'
import { pathHasFolder } from '../../../shared/campaignLayout'

export interface CampaignNote {
  relativePath: string
  name: string
  stem: string
}

export interface EncounterCombatantRef {
  notePath: string
  name: string
  count: number
  kind: 'pc' | 'npc' | 'monster'
}

export interface NightEncounter {
  id: string
  heading: string
  includeParty: boolean
  combatants: EncounterCombatantRef[]
}

export function flattenNotes(nodes: CampaignTreeNode[]): CampaignNote[] {
  const out: CampaignNote[] = []
  const walk = (list: CampaignTreeNode[]): void => {
    for (const node of list) {
      if (node.type === 'file' && (node.ext === '.md' || node.ext === '.markdown' || node.ext === '.txt')) {
        const stem = node.name.replace(/\.[^.]+$/, '')
        out.push({ relativePath: node.relativePath, name: node.name, stem })
      }
      if (node.children) walk(node.children)
    }
  }
  walk(nodes)
  return out
}

export function foldName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[—–−]/g, '-')
    .replace(/^pc\s*[-—–]+\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function sheetDisplayName(pathOrStem: string): string {
  const base = (pathOrStem.replaceAll('\\', '/').split('/').pop() ?? pathOrStem).replace(/\.[^.]+$/, '')
  return base.replace(/^pc\s*[—–-]\s*/i, '').trim()
}

export function combatantLabel(kind: EncounterCombatantRef['kind'], stem: string, blockName: string): string {
  const sheet = sheetDisplayName(stem)
  if (kind === 'pc') return blockName.trim() || sheet
  return sheet || blockName.trim()
}

export function sameCombatantName(a: string, b: string): boolean {
  const left = foldName(a)
  const right = foldName(b)
  if (!left || !right) return false
  if (left === right) return true
  const leftCore = foldName(a.replace(/\s+\d+$/, ''))
  const rightCore = foldName(b.replace(/\s+\d+$/, ''))
  return left.includes(`(${right})`) || right.includes(`(${left})`) || left.includes(`(${rightCore})`) || right.includes(`(${leftCore})`)
}

export function headingId(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export function parseWiki(raw: string): { target: string; alias: string } {
  const [left, alias] = raw.split('|')
  const target = (left ?? '').split('#')[0].trim()
  return { target, alias: (alias ?? target).trim() }
}

function parentDir(path: string): string {
  const i = path.replaceAll('\\', '/').lastIndexOf('/')
  return i === -1 ? '' : path.slice(0, i)
}

export function campaignFolderOf(notePath: string): string {
  const parts = notePath.replaceAll('\\', '/').split('/').filter(Boolean)
  const idx = parts.findIndex(
    (p) =>
      pathHasFolder(p, 'party') ||
      pathHasFolder(p, 'npcs') ||
      pathHasFolder(p, 'bestiary') ||
      /^(sessions|maps|handouts|reference|archive|assets|templates)$/i.test(p)
  )
  if (idx > 0) return parts.slice(0, idx).join('/')
  return ''
}

export function isPartyFolderPath(path: string): boolean {
  return pathHasFolder(path, 'party')
}

export function resolveNoteRef(ref: string, fromPath: string, notes: CampaignNote[]): CampaignNote | null {
  const target = foldName(ref.split('|')[0].split('#')[0].trim())
  if (!target) return null

  const exact = notes.find((n) => foldName(n.stem) === target)
  if (exact) return exact

  const fromDir = parentDir(fromPath)
  const beside = notes.find((n) => foldName(n.stem) === target && parentDir(n.relativePath) === fromDir)
  if (beside) return beside

  const scoped = notes.filter((n) => {
    const stem = foldName(n.stem)
    return stem.includes(target) || target.includes(stem)
  })
  if (scoped.length === 0) return null
  if (scoped.length === 1) return scoped[0]

  const root = campaignFolderOf(fromPath)
  const local = scoped.filter((n) => n.relativePath.replaceAll('\\', '/').startsWith(root ? `${root}/` : ''))
  const sheets = (local.length ? local : scoped).filter(
    (n) => pathHasFolder(n.relativePath, 'npcs') || pathHasFolder(n.relativePath, 'party') || pathHasFolder(n.relativePath, 'bestiary')
  )
  return sheets[0] ?? local[0] ?? scoped[0]
}

export function partyNotes(fromPath: string, notes: CampaignNote[]): CampaignNote[] {
  const root = campaignFolderOf(fromPath)
  return notes.filter((n) => {
    const path = n.relativePath.replaceAll('\\', '/')
    if (root && !path.startsWith(`${root}/`)) return false
    if (/roster/i.test(n.stem)) return false
    return isPartyFolderPath(path)
  })
}

export function allPartyNotes(notes: CampaignNote[]): CampaignNote[] {
  return notes
    .filter((n) => isPartyFolderPath(n.relativePath) && !/roster/i.test(n.stem))
    .sort((a, b) => sheetDisplayName(a.stem).localeCompare(sheetDisplayName(b.stem)))
}

export function bestiaryNotes(notes: CampaignNote[]): CampaignNote[] {
  return notes
    .filter((n) => pathHasFolder(n.relativePath, 'bestiary') && !/^(bestiary|index|readme)$/i.test(n.stem))
    .sort((a, b) => sheetDisplayName(a.stem).localeCompare(sheetDisplayName(b.stem)))
}

export function npcNotes(notes: CampaignNote[]): CampaignNote[] {
  return notes
    .filter((n) => pathHasFolder(n.relativePath, 'npcs') && !/^(npcs|index|readme|roster)$/i.test(n.stem))
    .sort((a, b) => sheetDisplayName(a.stem).localeCompare(sheetDisplayName(b.stem)))
}

function kindForNote(note: CampaignNote): EncounterCombatantRef['kind'] {
  if (isPartyFolderPath(note.relativePath) || /^pc\s/i.test(note.stem)) return 'pc'
  if (pathHasFolder(note.relativePath, 'bestiary')) return 'monster'
  return 'npc'
}

function parseCount(text: string): { name: string; count: number } {
  const match = /^(.*?)\s*[×x]\s*(\d+)\s*$/.exec(text.trim())
  if (match) return { name: match[1].trim(), count: Number(match[2]) || 1 }
  return { name: text.trim(), count: 1 }
}

const SKIP_TABLE_LABELS =
  /^(attacks?|recharge|auras?|legendary|ac|hp|speed|role|player|species|class|background|alignment|save dc|traits?)$/i

function combatantFromQuery(
  query: string,
  fromPath: string,
  notes: CampaignNote[]
): EncounterCombatantRef | null {
  const { name, count } = parseCount(query)
  if (!name || /^party$/i.test(name)) return null
  const wiki = /\[\[([^\]\n]+)\]\]/.exec(name)
  const lookup = wiki ? parseWiki(wiki[1]).target : name.replace(/\*+/g, '').trim()
  const note = resolveNoteRef(lookup, fromPath, notes)
  if (!note) return null
  return { notePath: note.relativePath, name: note.stem, count, kind: kindForNote(note) }
}

export function isCombatHeading(heading: string): boolean {
  if (/no combat/i.test(heading)) return false
  return /combat|⚔️|⚔|encounter/i.test(heading)
}

/** A roster line such as `**Combatants:** [[Wolf]] · party`, not a mention inside a callout. */
export function combatantsRosterLine(markdown: string): string | null {
  for (const line of markdown.replace(/\r/g, '').split('\n')) {
    if (/^\s*>/.test(line)) continue
    const match = /^\s*(?:\*\*)?Combatants:(?:\*\*)?\s*(.+)$/i.exec(line)
    if (match) return match[1].trim()
  }
  return null
}

/** Pull a leading scene art embed so it can sit in a right-side frame like PC/NPC portraits. */
export function splitLeadingSceneArt(markdown: string): {
  artSrc: string | null
  artLabel: string | null
  body: string
} {
  const lines = markdown.replace(/\r/g, '').split('\n')
  let start = 0
  while (start < lines.length && !lines[start].trim()) start += 1
  if (start >= lines.length) return { artSrc: null, artLabel: null, body: markdown }

  const line = lines[start].trim()
  const takeRest = (): string =>
    [...lines.slice(0, start), ...lines.slice(start + 1)].join('\n').replace(/^\n+/, '')

  const mdImg = /^!\[([^\]]*)\]\(\s*<?([^)>\s]+)>?\s*\)$/.exec(line)
  if (mdImg) {
    return { artSrc: mdImg[2], artLabel: mdImg[1].trim() || null, body: takeRest() }
  }

  const wiki = /^!\[\[([^\]\n]+)\]\]$/.exec(line)
  if (wiki) {
    const label = wiki[1].split('|')[0]?.trim() || wiki[1].trim()
    return { artSrc: wiki[1].trim(), artLabel: label, body: takeRest() }
  }

  const missing = /^\*\[missing image:\s*([^\]]+)\]\*$/i.exec(line)
  if (missing) {
    return { artSrc: null, artLabel: missing[1].trim(), body: takeRest() }
  }

  return { artSrc: null, artLabel: null, body: markdown }
}

export interface NoteSection {
  heading: string
  level: number
  id: string
  markdown: string
}

export function splitMarkdownSections(markdown: string): NoteSection[] {
  const lines = markdown.replace(/\r/g, '').split('\n')
  const raw: { heading: string; level: number; lines: string[] }[] = []
  let heading = ''
  let level = 0
  let buf: string[] = []

  const push = (): void => {
    if (heading || buf.some((line) => line.trim())) {
      raw.push({ heading, level, lines: buf })
    }
  }

  for (const line of lines) {
    const match = /^(#{1,2})\s+(.+)$/.exec(line)
    if (match) {
      push()
      heading = match[2].trim()
      level = match[1].length
      buf = [line]
      continue
    }
    buf.push(line)
  }
  push()

  return raw.map((section) => ({
    heading: section.heading,
    level: section.level,
    id: section.heading ? headingId(section.heading) : '',
    markdown: section.lines.join('\n')
  }))
}

export function splitCombatCardContent(markdown: string): { card: string; rest: string } {
  const lines = markdown.replace(/\r/g, '').split('\n')
  let lastKeep = 0
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    if (i === 0 && /^#{1,2}\s+/.test(line)) {
      lastKeep = 0
      continue
    }
    if (!line.trim()) continue
    if (combatantsRosterLine(line)) {
      lastKeep = i
      continue
    }
    break
  }
  const card = lines.slice(0, lastKeep + 1).join('\n').trimEnd()
  const rest = lines.slice(lastKeep + 1).join('\n').replace(/^\n+/, '')
  return { card, rest }
}

const CALLOUT_START = /^>\s*\[!(?!infobox)([a-z][\w-]*)\][+-]?\s*(.*)$/i

export type CalloutKind =
  | 'prose'
  | 'readaloud'
  | 'gmonly'
  | 'crawl'
  | 'legend'
  | 'gallery'
  | 'video'
  | 'scene'
  | 'tip'
  | 'warning'
  | 'example'
  | 'abstract'
  | 'note'
  | 'danger'
  | 'success'
  | 'info'
  | 'other'

export interface CalloutBlock {
  kind: CalloutKind
  type?: string
  markdown: string
  title?: string
}

function calloutKind(type: string): CalloutKind {
  const folded = type.toLowerCase()
  if (/^read[-_]?aloud$/.test(folded) || folded === 'flavor') return 'readaloud'
  if (/^gm[-_]?only$/.test(folded) || folded === 'secret') return 'gmonly'
  if (folded === 'crawl' || folded === 'opening') return 'crawl'
  if (folded === 'legend' || folded === 'tale' || folded === 'chronicle') return 'legend'
  if (folded === 'gallery' || folded === 'slides' || folded === 'sequence') return 'gallery'
  if (folded === 'video' || folded === 'clip' || folded === 'film') return 'video'
  if (folded === 'scene' || folded === 'beat') return 'scene'
  if (
    folded === 'tip' ||
    folded === 'warning' ||
    folded === 'example' ||
    folded === 'abstract' ||
    folded === 'note' ||
    folded === 'danger' ||
    folded === 'success' ||
    folded === 'info'
  ) {
    return folded
  }
  return 'other'
}

export function splitCalloutBlocks(markdown: string): CalloutBlock[] {
  const lines = markdown.replace(/\r/g, '').split('\n')
  const out: CalloutBlock[] = []
  let buf: string[] = []
  let i = 0

  const flushProse = (): void => {
    if (buf.length === 0) return
    out.push({ kind: 'prose', markdown: buf.join('\n') })
    buf = []
  }

  while (i < lines.length) {
    const start = CALLOUT_START.exec(lines[i])
    if (!start) {
      buf.push(lines[i])
      i += 1
      continue
    }
    const kind = calloutKind(start[1])
    flushProse()
    const title = start[2].trim()
    const body: string[] = []
    i += 1
    while (i < lines.length && /^>/.test(lines[i])) {
      body.push(lines[i].replace(/^>\s?/, ''))
      i += 1
    }
    out.push({
      kind,
      type: start[1].toLowerCase(),
      title: title || undefined,
      markdown: body.join('\n').replace(/^\n+|\n+$/g, '')
    })
  }
  flushProse()
  return out
}

export function splitReadAloudBlocks(markdown: string): CalloutBlock[] {
  return splitCalloutBlocks(markdown)
}

export function encounterSectionId(heading: string, scope?: string): string {
  return headingId(scope ? `${scope} — ${heading}` : heading)
}

function splitEncounterSections(markdown: string): { heading: string; body: string }[] {
  const lines = markdown.replace(/\r/g, '').split('\n')
  const sections: { heading: string; body: string }[] = []
  let heading = ''
  let body: string[] = []

  const push = (): void => {
    if (heading || body.some((l) => l.trim())) {
      sections.push({ heading, body: body.join('\n') })
    }
  }

  for (const line of lines) {
    const match = /^(#{1,2})\s+(.+)$/.exec(line)
    if (match) {
      push()
      heading = match[2].trim()
      body = []
      continue
    }
    body.push(line)
  }
  push()
  return sections
}

function encounterFromSection(
  section: { heading: string; body: string },
  notePath: string,
  notes: CampaignNote[],
  scope?: string
): NightEncounter | null {
  const combatantsLine = combatantsRosterLine(section.body)
  const combatHeading = isCombatHeading(section.heading)
  if (!combatantsLine && !combatHeading) return null

  const found: EncounterCombatantRef[] = []
  const seen = new Set<string>()
  const add = (ref: EncounterCombatantRef | null): void => {
    if (!ref || seen.has(ref.notePath)) return
    seen.add(ref.notePath)
    found.push(ref)
  }

  let includeParty = combatHeading
  if (combatantsLine) {
    includeParty = /\bparty\b/i.test(combatantsLine)
    for (const token of combatantsLine.split(/\s*[·|,;]\s*/)) {
      if (/^party$/i.test(token.trim())) {
        includeParty = true
        continue
      }
      add(combatantFromQuery(token, notePath, notes))
    }
  }

  if (found.length === 0) {
    const wiki = section.body.matchAll(/\[\[([^\]\n]+)\]\]/g)
    for (const match of wiki) {
      const target = parseWiki(match[1]).target
      if (IMAGE_EXT.has(`.${target.split('.').pop()?.toLowerCase() ?? ''}`)) continue
      const note = resolveNoteRef(target, notePath, notes)
      if (!note) continue
      if (
        !pathHasFolder(note.relativePath, 'npcs') &&
        !pathHasFolder(note.relativePath, 'party') &&
        !pathHasFolder(note.relativePath, 'bestiary')
      )
        continue
      add({
        notePath: note.relativePath,
        name: note.stem,
        count: 1,
        kind: kindForNote(note)
      })
    }

    const table = section.body.matchAll(/\|\s*\*\*([^*|]+)\*\*\s*\|/g)
    for (const match of table) {
      const label = match[1].trim()
      if (SKIP_TABLE_LABELS.test(label.split(/[×x]/)[0].trim())) continue
      add(combatantFromQuery(label, notePath, notes))
    }
  }

  if (found.length === 0 && !includeParty) return null
  return {
    id: encounterSectionId(section.heading, scope),
    heading: section.heading,
    includeParty,
    combatants: found
  }
}

export function parseNightEncounters(
  markdown: string,
  notePath: string,
  notes: CampaignNote[]
): NightEncounter[] {
  const encounters: NightEncounter[] = []
  for (const section of splitEncounterSections(markdown)) {
    const encounter = encounterFromSection(section, notePath, notes)
    if (encounter) encounters.push(encounter)
  }
  for (const part of splitCalloutBlocks(markdown)) {
    if (part.kind !== 'scene' || !part.title?.trim()) continue
    for (const section of splitEncounterSections(part.markdown)) {
      const encounter = encounterFromSection(section, notePath, notes, part.title.trim())
      if (encounter) encounters.push(encounter)
    }
  }
  return encounters
}

export function missingCombatantTokens(
  sectionMarkdown: string,
  notePath: string,
  notes: CampaignNote[]
): string[] {
  const combatantsLine = combatantsRosterLine(sectionMarkdown)
  if (!combatantsLine) return []
  const missing: string[] = []
  for (const token of combatantsLine.split(/\s*[·|,;]\s*/)) {
    const raw = token.trim()
    if (!raw || /^party$/i.test(raw)) continue
    if (combatantFromQuery(raw, notePath, notes)) continue
    const wiki = /\[\[([^\]\n]+)\]\]/.exec(raw)
    const label = wiki ? parseWiki(wiki[1]).target : raw.replace(/\*+/g, '').trim()
    if (label) missing.push(label)
  }
  return missing
}

export function linkWikiNotes(markdown: string, notePath: string, notes: CampaignNote[]): string {
  return markdown.replace(/(^|[^!])\[\[([^\]\n]+)\]\]/g, (all, prefix: string, raw: string) => {
    const { target, alias } = parseWiki(raw)
    if (!target) return all
    const ext = `.${target.split('.').pop()?.toLowerCase() ?? ''}`
    if (IMAGE_EXT.has(ext)) return all
    const note = resolveNoteRef(target, notePath, notes)
    if (!note) return `${prefix}${alias}`
    return `${prefix}[${alias}](#note:${encodeURIComponent(note.relativePath)})`
  })
}

export function childText(node: unknown): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(childText).join('')
  if (typeof node === 'object' && node && 'props' in node) {
    return childText((node as { props?: { children?: unknown } }).props?.children)
  }
  return ''
}
