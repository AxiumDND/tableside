import {
  calloutKind,
  canonicalCalloutType,
  closeMatches,
  type CalloutBlock,
  type CalloutKind,
  type CalloutLineRange,
  parseClose,
  parseFenceStart,
  parseQuoteStart,
  serializeFencedCallout,
  splitCalloutBlocks
} from './callouts'
import { treasureBlockBodyLines, type CampaignCurrency } from './currencies'

export interface IndexedBlock {
  key: string
  range: CalloutLineRange
  block: CalloutBlock
}

export type BlockIndex = Map<string, IndexedBlock>

/** Serialize a parsed callout block back to fenced markdown. */
export function serializeCalloutBlock(block: CalloutBlock): string {
  if (block.kind === 'prose') return block.markdown
  const type = block.type ?? canonicalCalloutType(block.kind, block.kind)
  const bodyLines = block.markdown ? block.markdown.split('\n') : []
  return serializeFencedCallout(type, block.title, bodyLines)
}

const INSERTABLE_KINDS: CalloutKind[] = [
  'text',
  'abstract',
  'links',
  'scene',
  'readaloud',
  'gmonly',
  'combat',
  'treasure',
  'legend',
  'crawl',
  'gallery',
  'video',
  'party',
  'note'
]

/** Document-level blocks that must not nest inside a scene. */
const FORBIDDEN_IN_SCENE: ReadonlySet<CalloutKind> = new Set(['scene', 'legend', 'crawl', 'party'])

export function insertableBlockKinds(): CalloutKind[] {
  return INSERTABLE_KINDS
}

/** Kinds allowed when inserting next to a block nested under `parentKind`. */
export function insertableBlockKindsForParent(parentKind?: CalloutKind | null): CalloutKind[] {
  if (parentKind === 'scene') {
    return INSERTABLE_KINDS.filter((kind) => !FORBIDDEN_IN_SCENE.has(kind))
  }
  return INSERTABLE_KINDS
}

export function defaultBlockTemplate(kind: CalloutKind, currencies?: CampaignCurrency[]): string {
  switch (kind) {
    case 'text':
      return serializeFencedCallout('text', '', [
        'Plain notes, bullets, or reminders for this beat.',
        '',
        '- '
      ])
    case 'abstract':
      return serializeFencedCallout('abstract', 'Tonight at a glance', [
        'Opening → next beats → the fight → fallout.'
      ])
    case 'links':
      return serializeFencedCallout('links', '', [])
    case 'scene':
      return serializeFencedCallout('scene', 'Scene — name the beat', [
        '![[Scene art.webp]]',
        '',
        'What could happen here.',
        '',
        '[!readaloud]',
        'Optional spoken text.',
        '[!/readaloud]'
      ])
    case 'readaloud':
      return serializeFencedCallout('readaloud', '', ['Spoken text for the table.'])
    case 'gmonly':
      return serializeFencedCallout('gmonly', 'Only you', ['Hidden truth or rigged outcome.'])
    case 'combat':
      return serializeFencedCallout('combat', 'Combat — name the encounter', [
        '**Combatants:** party'
      ])
    case 'treasure':
      return serializeFencedCallout('treasure', 'Cache — name the find', treasureBlockBodyLines(currencies))
    case 'legend':
      return serializeFencedCallout('legend', 'Campfire chronicle', [
        'look: mist',
        '',
        'Scroll text the player sees.'
      ])
    case 'crawl':
      return serializeFencedCallout('crawl', 'Opening crawl', ['Crawl text the player sees.'])
    case 'gallery':
      return serializeFencedCallout('gallery', 'Gallery', ['interval: 8s', '![[Slide 1.webp]]'])
    case 'video':
      return serializeFencedCallout('video', 'Video clip', ['video: Handouts/clip.mp4'])
    case 'party':
      return serializeFencedCallout('party', '', ['- [[PC Name]]'])
    case 'note':
      return serializeFencedCallout('note', 'Note', [''])
    default:
      return serializeFencedCallout('note', 'Note', [''])
  }
}

function spliceLines(source: string, range: CalloutLineRange, replacement: string): string {
  const lines = source.replace(/\r/g, '').split('\n')
  const next = replacement.replace(/\r/g, '').split('\n')
  const out = [...lines.slice(0, range.from), ...next, ...lines.slice(range.to)].join('\n')
  return source.endsWith('\n') && !out.endsWith('\n') ? `${out}\n` : out
}

function collectTopLevelCalloutRanges(
  lines: string[],
  from: number,
  to: number
): Array<{ range: CalloutLineRange; block: CalloutBlock }> {
  const out: Array<{ range: CalloutLineRange; block: CalloutBlock }> = []
  let i = from

  while (i < to) {
    const fence = parseFenceStart(lines[i] ?? '')
    if (fence) {
      const start = i
      const kind = calloutKind(fence.type)
      const body: string[] = []
      const stack: { type: string; kind: CalloutKind }[] = [{ type: fence.type, kind }]
      i += 1
      while (i < to && stack.length > 0) {
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
        range: { from: start, to: i },
        block: {
          kind,
          type: fence.type,
          title: fence.title || undefined,
          markdown: body.join('\n').replace(/^\n+|\n+$/g, '')
        }
      })
      continue
    }

    const quoted = parseQuoteStart(lines[i] ?? '')
    if (quoted) {
      const start = i
      i += 1
      const body: string[] = []
      while (i < to && /^>/.test(lines[i] ?? '')) {
        body.push((lines[i] ?? '').replace(/^>\s?/, ''))
        i += 1
      }
      out.push({
        range: { from: start, to: i },
        block: {
          kind: calloutKind(quoted.type),
          type: quoted.type,
          title: quoted.title || undefined,
          markdown: body.join('\n').replace(/^\n+|\n+$/g, '')
        }
      })
      continue
    }

    i += 1
  }

  return out
}

function indexCalloutsInSpan(
  lines: string[],
  from: number,
  to: number,
  keyPrefix: string,
  map: BlockIndex
): void {
  const topLevel = collectTopLevelCalloutRanges(lines, from, to)
  topLevel.forEach((item, index) => {
    const key = keyPrefix ? `${keyPrefix}:${index}` : String(index)
    map.set(key, { key, range: item.range, block: item.block })
    if (item.range.to > item.range.from + 1) {
      indexCalloutsInSpan(lines, item.range.from + 1, item.range.to, key, map)
    }
  })
}

function sectionSpans(lines: string[]): Array<{ from: number; to: number }> {
  const starts: number[] = [0]
  for (let i = 0; i < lines.length; i += 1) {
    if (/^#{1,2}\s+/.test(lines[i] ?? '')) {
      if (i > 0 || starts.length === 0) starts.push(i)
    }
  }
  if (starts[0] !== 0) starts.unshift(0)
  const unique = [...new Set(starts)].sort((a, b) => a - b)
  return unique.map((from, index) => ({
    from,
    to: unique[index + 1] ?? lines.length
  }))
}

/** Build a map of block keys to source ranges for a game night sheet. Keys: `section:block[:nested…]`. */
export function buildBlockIndex(source: string): BlockIndex {
  const map: BlockIndex = new Map()
  const lines = source.replace(/\r/g, '').split('\n')
  sectionSpans(lines).forEach((span, sectionIndex) => {
    indexCalloutsInSpan(lines, span.from, span.to, String(sectionIndex), map)
  })
  return map
}

export function blockKeyFromPath(sectionIndex: number, path: number[]): string {
  if (path.length === 0) return String(sectionIndex)
  return [String(sectionIndex), ...path.map(String)].join(':')
}

function joinCalloutParts(parts: CalloutBlock[]): string {
  return parts
    .map((part) => (part.kind === 'prose' ? part.markdown : serializeCalloutBlock(part)))
    .filter((chunk) => chunk.trim())
    .join('\n\n')
}

/** Map a callout-only path index to a splitCalloutBlocks part index (skips prose). */
function partIndexForCallout(parts: CalloutBlock[], calloutIndex: number): number | null {
  let seen = 0
  for (let i = 0; i < parts.length; i += 1) {
    if (parts[i]!.kind === 'prose') continue
    if (seen === calloutIndex) return i
    seen += 1
  }
  return null
}

export function replaceCalloutAtPath(markdown: string, path: number[], replacement: string): string {
  if (path.length === 0) return markdown
  const parts = splitCalloutBlocks(markdown)
  const calloutIndex = path[0]
  if (calloutIndex == null || calloutIndex < 0) return markdown
  const idx = partIndexForCallout(parts, calloutIndex)
  if (idx == null) return markdown
  if (path.length === 1) {
    parts[idx] = splitCalloutBlocks(replacement).find((p) => p.kind !== 'prose') ?? {
      kind: 'note',
      markdown: replacement
    }
    return joinCalloutParts(parts)
  }
  const part = parts[idx]!
  const nested = replaceCalloutAtPath(part.markdown, path.slice(1), replacement)
  parts[idx] = { ...part, markdown: nested }
  return joinCalloutParts(parts)
}

export function insertCalloutAtPath(
  markdown: string,
  path: number[],
  position: 'above' | 'below',
  template: string
): string {
  const parts = splitCalloutBlocks(markdown)
  const calloutIndex = path.length === 0 ? 0 : path[path.length - 1] ?? 0
  const partIdx = partIndexForCallout(parts, calloutIndex)
  const anchor = partIdx == null ? parts.length : partIdx
  const insertAt = position === 'above' ? anchor : anchor + 1
  const newBlock = splitCalloutBlocks(template).find((part) => part.kind !== 'prose') ?? {
    kind: 'note' as CalloutKind,
    markdown: template
  }
  const nextParts = [...parts.slice(0, insertAt), newBlock, ...parts.slice(insertAt)]
  return joinCalloutParts(nextParts)
}

/** Replace a block anywhere in the document by its index key (`section:block:…`). */
export function replaceBlockByKey(source: string, index: BlockIndex, key: string, replacement: string): string {
  const ref = index.get(key)
  if (!ref) return source
  const parts = key.split(':').map(Number)
  if (parts.length <= 2) {
    return spliceLines(source, ref.range, replacement)
  }
  const parentKey = parts.slice(0, -1).join(':')
  const parent = index.get(parentKey)
  if (!parent) return source
  const childIndex = parts[parts.length - 1]!
  const newBody = replaceCalloutAtPath(parent.block.markdown, [childIndex], replacement)
  const newParent = serializeCalloutBlock({ ...parent.block, markdown: newBody })
  return replaceBlockByKey(source, index, parentKey, newParent)
}

/** Insert a new block above or below a keyed block. */
export function insertBlockByKey(
  source: string,
  index: BlockIndex,
  key: string,
  position: 'above' | 'below',
  template: string
): { markdown: string; newKey: string } {
  const ref = index.get(key)
  if (!ref) return { markdown: source, newKey: key }
  const parts = key.split(':').map(Number)

  if (parts.length <= 2) {
    const lines = source.replace(/\r/g, '').split('\n')
    const insertAt = position === 'above' ? ref.range.from : ref.range.to
    const blockLines = template.replace(/\r/g, '').split('\n')
    const needsGap = insertAt > 0 && lines[insertAt - 1]?.trim() && lines[insertAt]?.trim()
    const markdown = [
      ...lines.slice(0, insertAt),
      ...(needsGap ? [''] : []),
      ...blockLines,
      '',
      ...lines.slice(insertAt)
    ].join('\n')
    const sectionIdx = parts[0] ?? 0
    const blockIdx = parts[parts.length - 1] ?? 0
    const newBlockIdx = position === 'above' ? blockIdx : blockIdx + 1
    return { markdown, newKey: `${sectionIdx}:${newBlockIdx}` }
  }

  const parentKey = parts.slice(0, -1).join(':')
  const parent = index.get(parentKey)
  if (!parent) return { markdown: source, newKey: key }
  const childIndex = parts[parts.length - 1]!
  const newParentBody = insertCalloutAtPath(parent.block.markdown, [childIndex], position, template)
  const newParent = serializeCalloutBlock({ ...parent.block, markdown: newParentBody })
  const markdown = replaceBlockByKey(source, index, parentKey, newParent)
  const newChildIndex = position === 'above' ? childIndex : childIndex + 1
  const newKey = [...parts.slice(0, -1), newChildIndex].join(':')
  return { markdown, newKey }
}

function removeCalloutAtPath(markdown: string, path: number[]): string {
  if (path.length === 0) return markdown
  const parts = splitCalloutBlocks(markdown)
  const calloutIndex = path[0]
  if (calloutIndex == null || calloutIndex < 0) return markdown
  const idx = partIndexForCallout(parts, calloutIndex)
  if (idx == null) return markdown
  if (path.length === 1) {
    return joinCalloutParts([...parts.slice(0, idx), ...parts.slice(idx + 1)])
  }
  const part = parts[idx]!
  const nested = removeCalloutAtPath(part.markdown, path.slice(1))
  parts[idx] = { ...part, markdown: nested }
  return joinCalloutParts(parts)
}

/** Delete a block by its index key (`section:block:…`). */
export function deleteBlockByKey(source: string, index: BlockIndex, key: string): string {
  const ref = index.get(key)
  if (!ref) return source
  const parts = key.split(':').map(Number)
  if (parts.length <= 2) {
    const lines = source.replace(/\r/g, '').split('\n')
    let from = ref.range.from
    let to = ref.range.to
    while (to < lines.length && !(lines[to] ?? '').trim()) to += 1
    if (from > 0 && !(lines[from - 1] ?? '').trim() && (to >= lines.length || !(lines[to] ?? '').trim())) {
      from -= 1
    }
    const out = [...lines.slice(0, from), ...lines.slice(to)].join('\n')
    return source.endsWith('\n') && !out.endsWith('\n') ? `${out}\n` : out
  }
  const parentKey = parts.slice(0, -1).join(':')
  const parent = index.get(parentKey)
  if (!parent) return source
  const childIndex = parts[parts.length - 1]!
  const newBody = removeCalloutAtPath(parent.block.markdown, [childIndex])
  const newParent = serializeCalloutBlock({ ...parent.block, markdown: newBody })
  return replaceBlockByKey(source, index, parentKey, newParent)
}
