import { pathHasFolder } from './campaignLayout'
import { splitCalloutBlocks, type CalloutKind } from './callouts'
import { looksLikeShopNote, stripShopStockSection } from './shopStock'
import { stripSheetHeader } from './sheetBlock'
import type { PlayerHandout } from './types'

export type { PlayerHandout }
export type PlayerHandoutFact = { label: string; value: string }

const PLACEHOLDER_VALUES = new Set([
  'character name',
  'npc name',
  'monster name',
  'spell name',
  'item name',
  'place name',
  'shop name',
  'faction name',
  'map name',
  'session name',
  'one-line tagline — role at the table',
  'who they are in one line',
  'what this place is in one line',
  'what they sell in one line',
  'what they want in one line',
  'adventuring gear',
  'level 1 evocation (wizard)'
])

const PLAYER_SAFE_CALLOUTS: ReadonlySet<CalloutKind> = new Set([
  'prose',
  'readaloud',
  'note',
  'tip',
  'warning',
  'example',
  'abstract',
  'info',
  'success',
  'danger',
  'text',
  'other',
  'gear',
  'spell',
  'place',
  'shop',
  'faction'
])

function looksLikeEmbed(text: string): boolean {
  return /!\[\[|\]\]|\.(png|jpe?g|webp|gif|svg)\b/i.test(text)
}

export function headingTitleFromNote(path: string, markdown: string): string {
  const heading = /^#\s+\*?(.+?)\*?\s*$/m.exec(markdown)
  if (heading) {
    const text = heading[1].replace(/\*/g, '').trim()
    if (text && !looksLikeEmbed(text)) return text
  }
  return (path.split(/[/\\]/).pop() ?? path).replace(/\.[^.]+$/, '')
}

function isPlaceholder(value: string): boolean {
  const folded = value.trim().toLowerCase()
  return !folded || PLACEHOLDER_VALUES.has(folded) || /^_+$/.test(folded) || folded === '—' || folded === '-'
}

/** Markdown → readable plain text for the TV (no HTML renderer on player). */
export function markdownToPlayerPlain(markdown: string): string {
  return markdown
    .replace(/\r/g, '')
    .replace(/!\[\[([^\]]+)\]\]/g, '')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^\|.*\|\s*$/gm, '')
    .replace(/^[-| :]+\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Drop GM-only / secret callouts (unless includeSecrets), keep player-facing prose.
 * Nested secrets inside other callouts are removed by re-splitting each kept body.
 */
export function playerSafeNoteBody(markdown: string, includeSecrets = false): string {
  const blocks = splitCalloutBlocks(markdown)
  const parts: string[] = []
  for (const block of blocks) {
    if (block.kind === 'gmonly') {
      if (!includeSecrets) continue
      const plain = markdownToPlayerPlain(block.markdown)
      if (!plain) continue
      parts.push(block.title ? `${block.title}\n${plain}` : plain)
      continue
    }
    if (
      block.kind === 'crawl' ||
      block.kind === 'legend' ||
      block.kind === 'gallery' ||
      block.kind === 'video' ||
      block.kind === 'combat' ||
      block.kind === 'treasure' ||
      block.kind === 'party' ||
      block.kind === 'pc' ||
      block.kind === 'npc' ||
      block.kind === 'monster' ||
      block.kind === 'infobox' ||
      block.kind === 'scene' ||
      block.kind === 'links'
    ) {
      continue
    }
    if (!PLAYER_SAFE_CALLOUTS.has(block.kind) && block.kind !== 'prose') continue
    const inner = includeSecrets ? block.markdown : stripNestedGmonly(block.markdown)
    const plain = markdownToPlayerPlain(inner)
    if (!plain) continue
    if (block.kind === 'readaloud' && block.title) {
      parts.push(plain)
    } else if (block.title && block.kind !== 'prose') {
      parts.push(`${block.title}\n${plain}`)
    } else {
      parts.push(plain)
    }
  }
  return parts.join('\n\n').trim()
}

function stripNestedGmonly(markdown: string): string {
  return splitCalloutBlocks(markdown)
    .filter((block) => block.kind !== 'gmonly')
    .map((block) => {
      if (block.kind === 'prose') return block.markdown
      const open = block.type ? `[!${block.type}]${block.title ? ` ${block.title}` : ''}` : ''
      const close = block.type ? `[!/${block.type.split(/\s+/)[0]}]` : ''
      return [open, block.markdown, close].filter(Boolean).join('\n')
    })
    .join('\n\n')
}

export function noteHasGmSecrets(markdown: string): boolean {
  return splitCalloutBlocks(markdown).some((block) => block.kind === 'gmonly')
}

function extractTagline(markdown: string): string {
  const match = /^#{2,3}\s+\*?(.+?)\*?\s*$/m.exec(markdown)
  if (!match) return ''
  const text = match[1].replace(/\*/g, '').trim()
  return isPlaceholder(text) ? '' : text
}

function extractTableFacts(markdown: string): PlayerHandoutFact[] {
  const facts: PlayerHandoutFact[] = []
  for (const line of markdown.split('\n')) {
    const match = /^\|\s*\*\*(.+?)\*\*\s*\|\s*(.*?)\s*\|\s*$/.exec(line.trim())
    if (!match) continue
    const label = match[1].trim()
    const value = match[2].replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, '$1').trim()
    if (!label || isPlaceholder(value) || !value) continue
    if (label.toLowerCase() === 'standing') continue
    facts.push({ label, value })
  }
  return facts
}

const LINE_FACT =
  /^(Weight|Cost|Rarity|Attunement|Damage|Properties|Type|School|Level|Range|Components|Duration|Casting Time|Armor Class|Category)\s*:\s*(.+)$/im

function extractLineFacts(markdown: string): PlayerHandoutFact[] {
  const facts: PlayerHandoutFact[] = []
  for (const line of markdown.split('\n')) {
    const match = LINE_FACT.exec(line.trim())
    if (!match) continue
    const label = match[1].trim()
    const value = match[2].trim()
    if (!value || isPlaceholder(value)) continue
    facts.push({ label, value })
  }
  return facts
}

function itemNotesBody(markdown: string): string {
  let text = stripSheetHeader(markdown)
    .replace(/^#\s+\*?.*$/m, '')
    .replace(/^(?:>\s*)?!?\[\[[^\]]+\]\]\s*$/gm, '')
    .replace(/!\[\[.*?\]\]/g, '')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/^\|.*\|\s*$/gm, '')
    .replace(/^[-| :]+\s*$/gm, '')
    .trim()

  text = text
    .replace(
      /^(?:Weight|Cost|Rarity|Attunement|Damage|Properties|Type|School|Level|Range|Components|Duration|Casting Time|Armor Class|Category):\s*.+$/gim,
      ''
    )
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  const lines = text.split('\n')
  const body: string[] = []
  let skippedCategory = false
  for (const line of lines) {
    const trimmed = line.trim()
    if (
      !skippedCategory &&
      trimmed &&
      !trimmed.includes(':') &&
      !/[.!?]/u.test(trimmed) &&
      !trimmed.startsWith('*') &&
      !trimmed.startsWith('#') &&
      !trimmed.startsWith('|') &&
      !trimmed.startsWith('>') &&
      !trimmed.startsWith('[!') &&
      trimmed.length < 80
    ) {
      skippedCategory = true
      continue
    }
    body.push(line)
  }
  return body.join('\n').trim()
}

function gazetteerBody(markdown: string): string {
  return stripSheetHeader(markdown)
    .replace(/^#\s+\*?.*$/m, '')
    .replace(/^(?:>\s*)?!?\[\[[^\]]+\]\]\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** True when this path is a Gear / Spells / Places / Factions sheet we can hand out. */
export function isHandoutSheetPath(path: string): boolean {
  return (
    pathHasFolder(path, 'gear') ||
    pathHasFolder(path, 'spells') ||
    pathHasFolder(path, 'places') ||
    pathHasFolder(path, 'factions')
  )
}

export function buildPlayerHandout(
  path: string,
  markdown: string,
  options?: { includeSecrets?: boolean }
): PlayerHandout | null {
  if (!isHandoutSheetPath(path)) return null
  const includeSecrets = Boolean(options?.includeSecrets)
  const title = headingTitleFromNote(path, markdown)
  if (!title || isPlaceholder(title)) return null

  const isPlace = pathHasFolder(path, 'places')
  const isFaction = pathHasFolder(path, 'factions')
  const isGazetteer = isPlace || isFaction
  const isShop = isPlace && looksLikeShopNote(markdown)

  const tagline = extractTagline(markdown)
  const tableFacts = extractTableFacts(markdown).filter((fact) => !(isShop && fact.label.toLowerCase() === 'standing'))
  const lineFacts = isGazetteer ? [] : extractLineFacts(markdown)
  const facts = [
    ...tableFacts,
    ...lineFacts.filter((fact) => !tableFacts.some((row) => row.label.toLowerCase() === fact.label.toLowerCase()))
  ]

  const rawNotes = isGazetteer
    ? gazetteerBody(isShop ? stripShopStockSection(markdown) : markdown)
    : itemNotesBody(markdown)
  const body = playerSafeNoteBody(rawNotes, includeSecrets)

  const subtitle = tagline || undefined
  if (!subtitle && facts.length === 0 && !body) {
    return { title, includeSecrets: includeSecrets || undefined }
  }

  return {
    title,
    subtitle,
    facts: facts.length > 0 ? facts : undefined,
    body: body || undefined,
    includeSecrets: includeSecrets || undefined
  }
}
