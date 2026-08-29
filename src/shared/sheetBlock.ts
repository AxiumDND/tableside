/** Sheet header fences (`[!pc]`, `[!npc]`, …) and legacy `[!infobox]`. */

import {
  type CalloutBlock,
  type CalloutKind,
  calloutKind,
  canonicalCalloutType,
  isSheetCallout,
  serializeFencedCallout,
  splitCalloutBlocks
} from './callouts'
import { pathHasFolder } from './campaignLayout'

export type SheetHeaderKind =
  | 'pc'
  | 'npc'
  | 'monster'
  | 'place'
  | 'shop'
  | 'faction'
  | 'gear'
  | 'spell'
  | 'infobox'

/** Prefer folder path when choosing which typed fence to write. */
export function sheetKindFromPath(path: string): SheetHeaderKind {
  if (pathHasFolder(path, 'party')) return 'pc'
  if (pathHasFolder(path, 'npcs')) return 'npc'
  if (pathHasFolder(path, 'bestiary')) return 'monster'
  if (pathHasFolder(path, 'places')) return 'place'
  if (pathHasFolder(path, 'factions')) return 'faction'
  if (pathHasFolder(path, 'gear')) return 'gear'
  if (pathHasFolder(path, 'spells')) return 'spell'
  return 'npc'
}

export function sheetKindForTemplate(
  template: 'player' | 'npc' | 'monster' | 'place' | 'shop' | 'faction' | 'gear' | 'spell' | string
): SheetHeaderKind {
  switch (template) {
    case 'player':
      return 'pc'
    case 'npc':
      return 'npc'
    case 'monster':
      return 'monster'
    case 'place':
      return 'place'
    case 'shop':
      return 'shop'
    case 'faction':
      return 'faction'
    case 'gear':
      return 'gear'
    case 'spell':
      return 'spell'
    default:
      return 'npc'
  }
}

const CLOSE_RE = /^\s*\[!(?:\/([a-z][\w-]*)|end([a-z][\w]*)?)\]\s*$/i
const FENCE_START_RE = /^\s*\[!([a-z][\w-]*)\][+-]?\s*(.*)$/i
const QUOTE_START_RE = /^>\s*\[!([a-z][\w-]*)\][+-]?\s*(.*)$/i

function closeMatches(
  close: RegExpExecArray,
  openType: string,
  openKind: CalloutKind
): boolean {
  if (close[1]) {
    const t = close[1].toLowerCase()
    return t === openType || calloutKind(t) === openKind
  }
  if (close[2] !== undefined) {
    const t = close[2].toLowerCase()
    if (!t) return true
    return t === openType || calloutKind(t) === openKind
  }
  return true
}

/** Line range [from, to) of the first sheet/infobox header, or null. */
export function findSheetHeaderRange(markdown: string): { from: number; to: number } | null {
  const lines = markdown.replace(/\r/g, '').split('\n')
  let i = 0
  while (i < lines.length) {
    const fence = FENCE_START_RE.exec(lines[i] ?? '')
    if (fence && isSheetCallout(calloutKind(fence[1])) && !CLOSE_RE.test(lines[i] ?? '')) {
      const from = i
      const raw = fence[1].toLowerCase()
      const kind = calloutKind(raw)
      const stack: { type: string; kind: CalloutKind }[] = [{ type: raw, kind }]
      i += 1
      while (i < lines.length && stack.length > 0) {
        const line = lines[i] ?? ''
        const close = CLOSE_RE.exec(line)
        const nested = FENCE_START_RE.exec(line)
        if (close && closeMatches(close, stack[stack.length - 1]!.type, stack[stack.length - 1]!.kind)) {
          stack.pop()
          i += 1
          if (stack.length === 0) break
          continue
        }
        if (nested && !CLOSE_RE.test(line) && !/^end/i.test(nested[1])) {
          stack.push({ type: nested[1].toLowerCase(), kind: calloutKind(nested[1]) })
        }
        i += 1
      }
      return { from, to: i }
    }
    const quoted = QUOTE_START_RE.exec(lines[i] ?? '')
    if (quoted && isSheetCallout(calloutKind(quoted[1]))) {
      const from = i
      i += 1
      while (i < lines.length && /^>/.test(lines[i] ?? '')) i += 1
      return { from, to: i }
    }
    i += 1
  }
  return null
}

export function findSheetHeader(markdown: string): CalloutBlock | null {
  for (const part of splitCalloutBlocks(markdown)) {
    if (isSheetCallout(part.kind)) return part
  }
  return null
}

/** Remove the first sheet/infobox header (fenced or legacy quote) from a note. */
export function stripSheetHeader(markdown: string): string {
  const range = findSheetHeaderRange(markdown)
  if (!range) return markdown
  const lines = markdown.replace(/\r/g, '').split('\n')
  let to = range.to
  while (to < lines.length && !(lines[to] ?? '').trim()) to += 1
  return [...lines.slice(0, range.from), ...lines.slice(to)].join('\n')
}

/**
 * Line index just after title + optional sheet header — for lifting statblocks.
 * `lines` must already be split on `\n` with `\r` stripped.
 */
export function afterSheetHeaderIndex(lines: string[]): number {
  let i = 0
  while (i < lines.length && !lines[i].trim()) i += 1
  while (i < lines.length && /^<!--/.test(lines[i].trim())) {
    if (/-->/.test(lines[i])) {
      i += 1
      continue
    }
    i += 1
    while (i < lines.length && !/-->/.test(lines[i])) i += 1
    if (i < lines.length) i += 1
  }
  while (i < lines.length && !lines[i].trim()) i += 1
  if (i < lines.length && /^#\s/.test(lines[i])) i += 1
  while (i < lines.length && !lines[i].trim()) i += 1

  const suffix = lines.slice(i).join('\n')
  const range = findSheetHeaderRange(suffix)
  if (range && range.from === 0) {
    i += range.to
    while (i < lines.length && !lines[i].trim()) i += 1
  }
  return i
}

/** Insert or replace the portrait wiki embed inside the sheet header. */
export function replaceSheetPortrait(markdown: string, fileName: string): string {
  const embed = `![[${fileName}]]`
  const imageWiki = /!\[\[([^\]\n]+\.(?:png|jpe?g|webp|gif|svg|bmp))\]\]/i
  if (imageWiki.test(markdown)) return markdown.replace(imageWiki, embed)

  const header = findSheetHeader(markdown)
  if (header) {
    const kind = (header.kind === 'infobox' ? 'infobox' : header.kind) as SheetHeaderKind
    const type = canonicalCalloutType(kind, header.type ?? kind)
    const body = header.markdown.trim() ? `${embed}\n\n${header.markdown.trim()}` : embed
    const next = serializeFencedCallout(type, header.title, body.split('\n'))
    return replaceFirstSheetHeader(markdown, next)
  }

  if (/>\s*\[!infobox\]/i.test(markdown)) {
    return markdown.replace(/(>\s*\[!infobox\][^\n]*\r?\n)/i, `$1> ${embed}\n>\n`)
  }
  return markdown.replace(/^(# .+\r?\n)/, `$1\n${embed}\n`)
}

function replaceFirstSheetHeader(source: string, replacement: string): string {
  const range = findSheetHeaderRange(source)
  if (!range) return source
  const lines = source.replace(/\r/g, '').split('\n')
  const next = replacement.replace(/\r/g, '').split('\n')
  return [...lines.slice(0, range.from), ...next, ...lines.slice(range.to)].join('\n')
}

/** Build a typed sheet header fence (portrait, tagline, facts table). */
export function serializeSheetHeader(
  kind: SheetHeaderKind,
  fields: {
    title?: string
    imageFile?: string | null
    tagline?: string
    rows?: { label: string; value: string }[]
  }
): string {
  const body: string[] = []
  if (fields.imageFile) body.push(`![[${fields.imageFile}]]`, '')
  if (fields.tagline) {
    body.push(`### *${fields.tagline}*`, '')
  }
  const rows = (fields.rows ?? []).filter((r) => r.value)
  if (rows.length > 0) {
    body.push('| | |', '|---|---|')
    for (const row of rows) {
      body.push(`| **${row.label}** | ${row.value.replace(/\|/g, '\\|')} |`)
    }
  }
  const closeKind = kind === 'infobox' ? 'npc' : kind
  return serializeFencedCallout(
    kind === 'infobox' ? 'npc' : canonicalCalloutType(closeKind, closeKind),
    fields.title,
    body
  )
}
