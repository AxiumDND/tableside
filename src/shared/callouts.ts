/** Fenced and legacy Obsidian-style callout parsing for Tableside notes. */

export type CalloutKind =
  | 'prose'
  | 'readaloud'
  | 'gmonly'
  | 'crawl'
  | 'legend'
  | 'gallery'
  | 'video'
  | 'scene'
  | 'combat'
  | 'party'
  | 'pc'
  | 'npc'
  | 'monster'
  | 'place'
  | 'shop'
  | 'faction'
  | 'gear'
  | 'spell'
  | 'infobox'
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

/** Drop `//` line comments and `<!-- -->` so they never reach the reader or parser. */
export function stripAuthorComments(markdown: string): string {
  const withoutHtml = markdown.replace(/<!--[\s\S]*?-->/g, '')
  return withoutHtml
    .replace(/\r/g, '')
    .split('\n')
    .filter((line) => !/^\s*\/\//.test(line))
    .join('\n')
}

export function calloutKind(type: string): CalloutKind {
  const folded = type.toLowerCase()
  if (/^read[-_]?aloud$/.test(folded) || folded === 'flavor') return 'readaloud'
  if (/^gm[-_]?only$/.test(folded) || folded === 'secret') return 'gmonly'
  if (folded === 'crawl' || folded === 'opening') return 'crawl'
  if (folded === 'legend' || folded === 'tale' || folded === 'chronicle') return 'legend'
  if (folded === 'gallery' || folded === 'slides' || folded === 'sequence') return 'gallery'
  if (folded === 'video' || folded === 'clip' || folded === 'film') return 'video'
  if (folded === 'scene' || folded === 'beat') return 'scene'
  if (folded === 'combat' || folded === 'encounter' || folded === 'fight') return 'combat'
  if (folded === 'party' || folded === 'roster' || folded === 'pcs') return 'party'
  if (folded === 'pc' || folded === 'player' || folded === 'character') return 'pc'
  if (folded === 'npc') return 'npc'
  if (folded === 'monster' || folded === 'creature' || folded === 'bestiary') return 'monster'
  if (folded === 'place' || folded === 'location' || folded === 'site') return 'place'
  if (folded === 'shop' || folded === 'inn' || folded === 'store') return 'shop'
  if (folded === 'faction') return 'faction'
  if (folded === 'gear' || folded === 'item' || folded === 'equipment') return 'gear'
  if (folded === 'spell') return 'spell'
  if (folded === 'infobox') return 'infobox'
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

export const SHEET_CALLOUT_KINDS: ReadonlySet<CalloutKind> = new Set([
  'pc',
  'npc',
  'monster',
  'place',
  'shop',
  'faction',
  'gear',
  'spell',
  'infobox'
])

export function isSheetCallout(kind: CalloutKind): boolean {
  return SHEET_CALLOUT_KINDS.has(kind)
}

/** Canonical type name used when writing `[!/type]` closes. */
export function canonicalCalloutType(kind: CalloutKind, rawType: string): string {
  switch (kind) {
    case 'readaloud':
      return 'readaloud'
    case 'gmonly':
      return 'gmonly'
    case 'crawl':
      return 'crawl'
    case 'legend':
      return 'legend'
    case 'gallery':
      return 'gallery'
    case 'video':
      return 'video'
    case 'scene':
      return 'scene'
    case 'combat':
      return 'combat'
    case 'party':
      return 'party'
    case 'pc':
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
    case 'infobox':
      return 'infobox'
    case 'prose':
    case 'other':
      return rawType.toLowerCase()
    default:
      return kind
  }
}

const CALLOUT_CLOSE = /^\s*\[!(?:\/([a-z][\w-]*)|end([a-z][\w]*)?)\]\s*$/i
const CALLOUT_FENCE_START = /^\s*\[!([a-z][\w-]*)\][+-]?\s*(.*)$/i
const CALLOUT_QUOTE_START = /^>\s*\[!([a-z][\w-]*)\][+-]?\s*(.*)$/i

function parseClose(line: string): { bare: boolean; type?: string } | null {
  const match = CALLOUT_CLOSE.exec(line)
  if (!match) return null
  if (match[1]) return { bare: false, type: match[1].toLowerCase() }
  if (match[2] !== undefined) {
    const t = match[2].toLowerCase()
    return t ? { bare: false, type: t } : { bare: true }
  }
  return { bare: true }
}

function parseFenceStart(line: string): { type: string; title: string } | null {
  if (parseClose(line)) return null
  const match = CALLOUT_FENCE_START.exec(line)
  if (!match) return null
  const type = match[1].toLowerCase()
  if (type === 'end' || type.startsWith('end')) return null
  return { type, title: match[2].trim() }
}

function parseQuoteStart(line: string): { type: string; title: string } | null {
  const match = CALLOUT_QUOTE_START.exec(line)
  if (!match) return null
  return { type: match[1].toLowerCase(), title: match[2].trim() }
}

function closeMatches(
  close: { bare: boolean; type?: string },
  openType: string,
  openKind: CalloutKind
): boolean {
  if (close.bare) return true
  if (!close.type) return false
  if (close.type === openType) return true
  return calloutKind(close.type) === openKind
}

/**
 * Split markdown into prose and callout blocks.
 * Supports fenced `[!type]…[!/type]` (with nesting) and legacy `> [!type]` quote blocks.
 */
export function splitCalloutBlocks(markdown: string): CalloutBlock[] {
  const lines = stripAuthorComments(markdown).split('\n')
  const out: CalloutBlock[] = []
  let buf: string[] = []
  let i = 0

  const flushProse = (): void => {
    if (buf.length === 0) return
    out.push({ kind: 'prose', markdown: buf.join('\n') })
    buf = []
  }

  while (i < lines.length) {
    const fence = parseFenceStart(lines[i] ?? '')
    if (fence) {
      flushProse()
      const kind = calloutKind(fence.type)
      const body: string[] = []
      const stack: { type: string; kind: CalloutKind }[] = [{ type: fence.type, kind }]
      i += 1
      while (i < lines.length && stack.length > 0) {
        const line = lines[i] ?? ''
        const close = parseClose(line)
        const nested = parseFenceStart(line)
        if (close) {
          const top = stack[stack.length - 1]!
          if (closeMatches(close, top.type, top.kind)) {
            stack.pop()
            if (stack.length === 0) {
              i += 1
              break
            }
            body.push(line)
            i += 1
            continue
          }
          body.push(line)
          i += 1
          continue
        }
        if (nested) {
          stack.push({ type: nested.type, kind: calloutKind(nested.type) })
          body.push(line)
          i += 1
          continue
        }
        body.push(line)
        i += 1
      }
      out.push({
        kind,
        type: fence.type,
        title: fence.title || undefined,
        markdown: body.join('\n').replace(/^\n+|\n+$/g, '')
      })
      continue
    }

    const quoted = parseQuoteStart(lines[i] ?? '')
    if (quoted) {
      flushProse()
      const kind = calloutKind(quoted.type)
      const body: string[] = []
      i += 1
      while (i < lines.length && /^>/.test(lines[i] ?? '')) {
        body.push((lines[i] ?? '').replace(/^>\s?/, ''))
        i += 1
      }
      out.push({
        kind,
        type: quoted.type,
        title: quoted.title || undefined,
        markdown: body.join('\n').replace(/^\n+|\n+$/g, '')
      })
      continue
    }

    buf.push(lines[i] ?? '')
    i += 1
  }
  flushProse()
  return out
}

/** Write a fenced callout (no `>` prefixes). Body lines are written as-is. */
export function serializeFencedCallout(
  type: string,
  title: string | undefined,
  bodyLines: string[]
): string {
  const head = `[!${type}]${title?.trim() ? ` ${title.trim()}` : ''}`
  const close = `[!/${canonicalCalloutType(calloutKind(type), type)}]`
  if (bodyLines.length === 0) return `${head}\n${close}`
  return `${head}\n${bodyLines.join('\n')}\n${close}`
}

/**
 * Blank out interiors of fenced callouts (keep line count) so document-level
 * heading scans do not double-count combat inside `[!scene]` blocks.
 */
export function maskFencedCalloutBodies(markdown: string): string {
  const lines = markdown.replace(/\r/g, '').split('\n')
  const out = [...lines]
  let i = 0
  while (i < lines.length) {
    const fence = parseFenceStart(lines[i] ?? '')
    if (!fence) {
      i += 1
      continue
    }
    const kind = calloutKind(fence.type)
    const stack: { type: string; kind: CalloutKind }[] = [{ type: fence.type, kind }]
    i += 1
    while (i < lines.length && stack.length > 0) {
      const line = lines[i] ?? ''
      const close = parseClose(line)
      const nested = parseFenceStart(line)
      if (close && closeMatches(close, stack[stack.length - 1]!.type, stack[stack.length - 1]!.kind)) {
        stack.pop()
        if (stack.length === 0) {
          i += 1
          break
        }
        out[i] = ''
        i += 1
        continue
      }
      if (nested) {
        stack.push({ type: nested.type, kind: calloutKind(nested.type) })
      }
      out[i] = ''
      i += 1
    }
  }
  return out.join('\n')
}

export interface CalloutLineRange {
  from: number
  to: number
}

/**
 * Line range [from, to) of the nth callout whose raw type is in `types`
 * (aliases like crawl|opening). Supports fenced and legacy quote forms.
 */
export function findNthCalloutRange(
  source: string,
  types: string[],
  index: number
): CalloutLineRange | null {
  const wanted = new Set(types.map((t) => t.toLowerCase()))
  const lines = source.replace(/\r/g, '').split('\n')
  let i = 0
  let seen = 0

  const skipFence = (startType: string, startKind: CalloutKind, from: number): number => {
    const stack: { type: string; kind: CalloutKind }[] = [{ type: startType, kind: startKind }]
    let j = from + 1
    while (j < lines.length && stack.length > 0) {
      const line = lines[j] ?? ''
      const close = parseClose(line)
      const nested = parseFenceStart(line)
      if (close && closeMatches(close, stack[stack.length - 1]!.type, stack[stack.length - 1]!.kind)) {
        stack.pop()
        j += 1
        if (stack.length === 0) break
        continue
      }
      if (nested) {
        stack.push({ type: nested.type, kind: calloutKind(nested.type) })
      }
      j += 1
    }
    return j
  }

  while (i < lines.length) {
    const fence = parseFenceStart(lines[i] ?? '')
    if (fence) {
      const from = i
      const kind = calloutKind(fence.type)
      const to = skipFence(fence.type, kind, from)
      if (wanted.has(fence.type)) {
        if (seen === index) return { from, to }
        seen += 1
      }
      i = to
      continue
    }

    const quoted = parseQuoteStart(lines[i] ?? '')
    if (quoted) {
      const from = i
      i += 1
      while (i < lines.length && /^>/.test(lines[i] ?? '')) i += 1
      if (wanted.has(quoted.type)) {
        if (seen === index) return { from, to: i }
        seen += 1
      }
      continue
    }

    i += 1
  }
  return null
}

export function replaceNthCallout(
  source: string,
  types: string[],
  index: number,
  replacement: string
): string {
  const range = findNthCalloutRange(source, types, index)
  if (!range) return source
  const lines = source.replace(/\r/g, '').split('\n')
  const next = replacement.replace(/\r/g, '').split('\n')
  const out = [...lines.slice(0, range.from), ...next, ...lines.slice(range.to)].join('\n')
  return source.endsWith('\n') && !out.endsWith('\n') ? `${out}\n` : out
}
