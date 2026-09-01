import { wikiLinkForSheet } from '../../../shared/sheetTemplates'
import { maskFencedCalloutBodies } from '../../../shared/callouts'
import { pathHasFolder } from '../../../shared/campaignLayout'
import { IMAGE_EXT } from '../../../shared/imageExt'
import {
  foldName,
  isPartyFolderPath,
  parseWiki,
  resolveNoteRef,
  sheetDisplayName,
  type CampaignNote
} from './notes'

export type PartyGlanceRow = {
  name: string
  notePath: string
  stem: string
  companion: boolean
  race: string
  className: string
  ac: string
  hp: string
}

const INFOBOX_ROW = /^\s*\|\s*\*\*(.+?)\*\*\s*\|\s*(.*?)\s*\|\s*$/

export function infoboxFields(markdown: string): Record<string, string> {
  const fields: Record<string, string> = {}
  for (const line of markdown.replace(/\r/g, '').split('\n')) {
    const match = INFOBOX_ROW.exec(line)
    if (!match) continue
    const label = match[1].replace(/\s+/g, ' ').trim().toLowerCase()
    const value = match[2].replace(/!\[\[[^\]]*\]\]/g, '').replace(/\[\[[^\]|]+\|([^\]]+)\]\]/g, '$1').replace(/\[\[([^\]]+)\]\]/g, '$1').trim()
    if (label && value) fields[label] = value
  }
  return fields
}

function yamlStat(markdown: string, key: 'ac' | 'hp'): string {
  const match = new RegExp(`^${key}:\\s*(.+)$`, 'im').exec(markdown)
  return match?.[1]?.trim().replace(/^["']|["']$/g, '') ?? ''
}

function pickField(fields: Record<string, string>, keys: string[]): string {
  for (const key of keys) {
    const value = fields[key]
    if (value) return value
  }
  return ''
}

export function glanceStatsFromSheet(markdown: string): { race: string; className: string; ac: string; hp: string } {
  const fields = infoboxFields(markdown)
  const race = pickField(fields, ['species', 'ancestry', 'clan'])
  const className = pickField(fields, ['class', 'role', 'predator'])
  const ac = pickField(fields, ['ac']) || yamlStat(markdown, 'ac') || pickField(fields, ['health'])
  const hp = pickField(fields, ['hp']) || yamlStat(markdown, 'hp') || pickField(fields, ['health'])
  return { race, className, ac, hp }
}

export function partyGlanceLinks(blockMarkdown: string): { target: string; alias: string }[] {
  const masked = maskFencedCalloutBodies(blockMarkdown)
  const seen = new Set<string>()
  const out: { target: string; alias: string }[] = []

  const add = (target: string, alias: string) => {
    if (!target) return
    const ext = `.${target.split('.').pop()?.toLowerCase() ?? ''}`
    if (IMAGE_EXT.has(ext)) return
    const key = foldName(target)
    if (!key || seen.has(key)) return
    seen.add(key)
    out.push({ target, alias: alias || target })
  }

  const wikiRe = /(^|[^!])\[\[([^\]\n]+)\]\]/g
  let match: RegExpExecArray | null
  while ((match = wikiRe.exec(masked))) {
    const parsed = parseWiki(match[2] ?? '')
    add(parsed.target, parsed.alias)
  }

  const noteRe = /\[([^\]]+)\]\(#note:([^)]+)\)/g
  while ((match = noteRe.exec(masked))) {
    const path = decodeURIComponent(match[2] ?? '').replaceAll('\\', '/')
    const stem = path.split('/').pop()?.replace(/\.[^.]+$/, '') ?? ''
    add(stem || (match[1] ?? ''), match[1] ?? stem)
  }

  return out
}

export function partyGlanceRemainder(blockMarkdown: string): string {
  const original = blockMarkdown.replace(/\r/g, '').split('\n')
  const masked = maskFencedCalloutBodies(blockMarkdown).split('\n')
  const kept: string[] = []
  for (let i = 0; i < original.length; i += 1) {
    const line = original[i] ?? ''
    const visible = masked[i] ?? ''
    if (!visible.trim()) {
      kept.push(line)
      continue
    }
    if (/^\s*[-*+]\s+.*\[\[[^\]]+\]\]/.test(visible)) continue
    if (/^\s*\[\[[^\]]+\]\]/.test(visible)) continue
    if (/^\s*[-*+]\s+.*\(#note:/.test(visible)) continue
    if (/^\s*\[[^\]]+\]\(#note:/.test(visible)) continue
    kept.push(line)
  }
  return kept.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

export function isPartyGlanceSheet(note: CampaignNote): boolean {
  if (/roster/i.test(note.stem)) return false
  const path = note.relativePath.replaceAll('\\', '/')
  return isPartyFolderPath(path) || pathHasFolder(path, 'npcs')
}

export function partyGlanceRows(
  blockMarkdown: string,
  fromPath: string,
  notes: CampaignNote[],
  sheets: Record<string, string>
): PartyGlanceRow[] {
  const rows: PartyGlanceRow[] = []
  for (const link of partyGlanceLinks(blockMarkdown)) {
    const note = resolveNoteRef(link.target, fromPath, notes)
    if (!note || !isPartyGlanceSheet(note)) continue
    const stats = glanceStatsFromSheet(sheets[note.relativePath] ?? '')
    rows.push({
      name: link.alias || sheetDisplayName(note.stem),
      notePath: note.relativePath,
      stem: note.stem,
      companion: pathHasFolder(note.relativePath, 'npcs'),
      ...stats
    })
  }
  return rows
}

function lineHasGlanceTarget(line: string, stem: string): boolean {
  const key = foldName(stem)
  if (!key) return false
  const wikiRe = /(^|[^!])\[\[([^\]\n]+)\]\]/g
  let match: RegExpExecArray | null
  while ((match = wikiRe.exec(line))) {
    const parsed = parseWiki(match[2] ?? '')
    if (foldName(parsed.target) === key || foldName(parsed.alias) === key) return true
  }
  const noteRe = /\[([^\]]+)\]\(#note:([^)]+)\)/g
  while ((match = noteRe.exec(line))) {
    const path = decodeURIComponent(match[2] ?? '').replaceAll('\\', '/')
    const lineStem = path.split('/').pop()?.replace(/\.[^.]+$/, '') ?? ''
    if (foldName(lineStem) === key || foldName(match[1] ?? '') === key) return true
  }
  return false
}

/** Drop the blank-template companion stub when a real NPC is linked. */
function stripPlaceholderCompanion(markdown: string): string {
  return markdown
    .replace(/\r/g, '')
    .split('\n')
    .filter((line) => !/^\s*[-*+]\s+\[\[NPC Name\]\]/.test(line))
    .join('\n')
}

export function partyBlockHasLink(blockMarkdown: string, stem: string): boolean {
  const key = foldName(stem)
  if (!key) return false
  return partyGlanceLinks(blockMarkdown).some(
    (link) => foldName(link.target) === key || foldName(link.alias) === key
  )
}

/** Append `- [[NPC]]` before nested callouts. No-op if that sheet is already listed. */
export function appendPartyCompanionLink(blockMarkdown: string, stem: string): string {
  const trimmed = stem.trim()
  if (!trimmed) return blockMarkdown
  if (partyBlockHasLink(blockMarkdown, trimmed)) return blockMarkdown
  const line = `- ${wikiLinkForSheet(trimmed)}`
  const cleaned = stripPlaceholderCompanion(blockMarkdown).replace(/\r/g, '')
  const lines = cleaned.split('\n')
  let insertAt = lines.length
  for (let i = 0; i < lines.length; i += 1) {
    if (/^\s*\[![a-z]/i.test(lines[i] ?? '')) {
      insertAt = i
      break
    }
  }
  const before = lines.slice(0, insertAt)
  const after = lines.slice(insertAt)
  while (before.length > 0 && !(before[before.length - 1] ?? '').trim()) before.pop()
  const next = [...before, line]
  if (after.some((entry) => entry.trim())) {
    if (next.length > 0 && next[next.length - 1]?.trim()) next.push('')
    next.push(...after)
  }
  return next.join('\n').replace(/\n{3,}/g, '\n\n').replace(/^\n+|\n+$/g, '')
}

/** Remove a top-level roster wikilink line (not nested callout bodies). */
export function removePartyGlanceLink(blockMarkdown: string, stem: string): string {
  const original = blockMarkdown.replace(/\r/g, '').split('\n')
  const masked = maskFencedCalloutBodies(blockMarkdown).split('\n')
  const kept: string[] = []
  for (let i = 0; i < original.length; i += 1) {
    const line = original[i] ?? ''
    const visible = masked[i] ?? ''
    if (visible.trim() && lineHasGlanceTarget(visible, stem)) continue
    kept.push(line)
  }
  return kept.join('\n').replace(/\n{3,}/g, '\n\n').replace(/^\n+|\n+$/g, '')
}
