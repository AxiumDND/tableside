import type { PlayerMapToken } from '../../../shared/types'
import { headingId, splitMarkdownSections } from './notes'
import { campaignFileUrl, portraitForNote, resolveImageRef, srdPortraitUrl, type CampaignImage } from './images'
import { DEFAULT_FOG_SIZE } from './mapFog'
import { extractStatblock } from './statblock'

export interface MapPin {
  id: string
  x: number
  y: number
  label: string
  heading: string
}

export type CreatureSpace = 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan'

export interface MapToken {
  id: string
  kind: 'pc' | 'npc' | 'monster'
  source: string
  x: number
  y: number
  space: CreatureSpace
  label: string
  image: string
}

export interface MapNoteData {
  image: string
  pins: MapPin[]
  tokens: MapToken[]
  /** One 5 ft square as a fraction of map width (Medium token diameter). */
  tokenScale: number
  /** Image point the 5 ft grid must pass through (first Scale-map click). */
  gridX: number
  gridY: number
  pinsLocked: boolean
  fog: string
  fogSize: number
}

/**
 * One 5 ft square as a fraction of map width (also the Medium token diameter).
 * Wide enough for a 2-square close-up or a ~125-square dungeon on one image.
 */
export const TOKEN_SCALE_MIN = 0.008
export const TOKEN_SCALE_MAX = 0.5
export const TOKEN_SCALE_DEFAULT = 0.05

export const SPACE_SQUARES: Record<CreatureSpace, number> = {
  tiny: 0.5,
  small: 1,
  medium: 1,
  large: 2,
  huge: 3,
  gargantuan: 4
}

export function parseCreatureSpace(value: string | undefined): CreatureSpace {
  const text = (value ?? '').toLowerCase()
  if (/\bgargantuan\b/.test(text) || text === '4') return 'gargantuan'
  if (/\bhuge\b/.test(text) || text === '3') return 'huge'
  if (/\blarge\b/.test(text) || text === '2') return 'large'
  if (/\btiny\b/.test(text) || text === '0.5' || text === '½') return 'tiny'
  if (/\bsmall\b/.test(text)) return 'small'
  return 'medium'
}

export function creatureSpaceFromMarkdown(markdown: string): CreatureSpace {
  return parseCreatureSpace(extractStatblock(markdown)?.block.size)
}

export function clampTokenScale(value: number): number {
  if (!Number.isFinite(value)) return TOKEN_SCALE_DEFAULT
  return Math.min(TOKEN_SCALE_MAX, Math.max(TOKEN_SCALE_MIN, value))
}

export function tokenDiameter(tokenScale: number, space: CreatureSpace): number {
  return Math.min(0.4, Math.max(0.01, clampTokenScale(tokenScale) * SPACE_SQUARES[space]))
}

const MAP_FENCE = /```map\r?\n([\s\S]*?)```/i

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}

export function isMapNote(markdown: string): boolean {
  return MAP_FENCE.test(markdown)
}

function unquote(value: string): string {
  return value.trim().replace(/^["']|["']$/g, '')
}

function slug(value: string): string {
  return headingId(value) || 'pin'
}

export function nextPinLabel(pins: MapPin[]): string {
  const used = new Set(pins.map((pin) => pin.label.trim().toUpperCase()))
  const tagged = [...pins].reverse().find((pin) => /^[A-Z]+\d+$/i.test(pin.label.trim()))
  const prefix = tagged ? tagged.label.trim().replace(/\d+$/, '').toUpperCase() : 'A'
  let n = 1
  if (tagged) n = Number(tagged.label.trim().match(/\d+$/)?.[0] ?? 0) + 1
  while (used.has(`${prefix}${n}`)) n += 1
  return `${prefix}${n}`
}

export function uniquePinId(items: { id: string }[], seed: string): string {
  const base = slug(seed)
  if (!items.some((item) => item.id === base)) return base
  let n = 2
  while (items.some((item) => item.id === `${base}-${n}`)) n += 1
  return `${base}-${n}`
}

function parsePins(lines: string[], start: number): { pins: MapPin[]; next: number } {
  const pins: MapPin[] = []
  let i = start
  let current: Partial<MapPin> | null = null

  const flush = (): void => {
    if (!current) return
    const label = (current.label ?? current.id ?? nextPinLabel(pins)).trim()
    const id = (current.id ?? slug(label)).trim() || uniquePinId(pins, label)
    pins.push({
      id,
      x: clamp01(current.x ?? 0.5),
      y: clamp01(current.y ?? 0.5),
      label,
      heading: (current.heading ?? '').trim()
    })
    current = null
  }

  while (i < lines.length) {
    const line = lines[i]
    if (line.trim() && !/^\s/.test(line)) break
    const item = /^\s+-\s+(?:id:\s*)?(.*)$/.exec(line)
    if (item && /^\s+-\s+/.test(line)) {
      flush()
      current = {}
      const inline = /^id:\s*(.+)$/i.exec(item[1].trim())
      if (inline) current.id = unquote(inline[1])
      else if (item[1].trim() && !item[1].includes(':')) current.id = unquote(item[1])
      i += 1
      continue
    }
    const kv = /^\s+([a-z_]+):\s*(.*)$/i.exec(line)
    if (kv && current) {
      const key = kv[1].toLowerCase()
      const value = unquote(kv[2])
      if (key === 'id') current.id = value
      else if (key === 'x') current.x = Number(value)
      else if (key === 'y') current.y = Number(value)
      else if (key === 'label') current.label = value
      else if (key === 'heading') current.heading = value
      i += 1
      continue
    }
    if (!line.trim()) {
      i += 1
      continue
    }
    break
  }
  flush()
  return { pins, next: i }
}

function parseTokenKind(value: string): MapToken['kind'] {
  const kind = value.trim().toLowerCase()
  if (kind === 'pc' || kind === 'player' || kind === 'party') return 'pc'
  if (kind === 'monster' || kind === 'bestiary') return 'monster'
  return 'npc'
}

function parseTokens(lines: string[], start: number): { tokens: MapToken[]; next: number } {
  const tokens: MapToken[] = []
  let i = start
  let current: Partial<MapToken> | null = null

  const flush = (): void => {
    if (!current) return
    const label = (current.label ?? current.id ?? 'Token').trim()
    const id = (current.id ?? slug(label)).trim() || uniquePinId(tokens, label)
    tokens.push({
      id,
      kind: current.kind ?? 'npc',
      source: (current.source ?? '').trim(),
      x: clamp01(current.x ?? 0.5),
      y: clamp01(current.y ?? 0.5),
      space: current.space ?? 'medium',
      label,
      image: (current.image ?? '').trim()
    })
    current = null
  }

  while (i < lines.length) {
    const line = lines[i]
    if (line.trim() && !/^\s/.test(line)) break
    const item = /^\s+-\s+(?:id:\s*)?(.*)$/.exec(line)
    if (item && /^\s+-\s+/.test(line)) {
      flush()
      current = {}
      const inline = /^id:\s*(.+)$/i.exec(item[1].trim())
      if (inline) current.id = unquote(inline[1])
      else if (item[1].trim() && !item[1].includes(':')) current.id = unquote(item[1])
      i += 1
      continue
    }
    const kv = /^\s+([a-z_]+):\s*(.*)$/i.exec(line)
    if (kv && current) {
      const key = kv[1].toLowerCase()
      const value = unquote(kv[2])
      if (key === 'id') current.id = value
      else if (key === 'kind') current.kind = parseTokenKind(value)
      else if (key === 'source') current.source = value
      else if (key === 'x') current.x = Number(value)
      else if (key === 'y') current.y = Number(value)
      else if (key === 'space' || key === 'scale') current.space = parseCreatureSpace(value)
      else if (key === 'size' && /[a-z]/i.test(value)) current.space = parseCreatureSpace(value)
      else if (key === 'label') current.label = value
      else if (key === 'image') current.image = value
      i += 1
      continue
    }
    if (!line.trim()) {
      i += 1
      continue
    }
    break
  }
  flush()
  return { tokens, next: i }
}

export function parseMapYaml(raw: string): MapNoteData {
  const lines = raw.replace(/\r/g, '').split('\n')
  const data: MapNoteData = {
    image: '',
    pins: [],
    tokens: [],
    tokenScale: TOKEN_SCALE_DEFAULT,
    gridX: 0,
    gridY: 0,
    pinsLocked: true,
    fog: '',
    fogSize: DEFAULT_FOG_SIZE
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
    const value = unquote(kv[2])
    if (key === 'image') {
      data.image = value.replace(/^\[\[|\]\]$/g, '')
      i += 1
      continue
    }
    if (key === 'pins') {
      if (value === '[]') {
        data.pins = []
        i += 1
        continue
      }
      const parsed = parsePins(lines, i + 1)
      data.pins = parsed.pins
      i = parsed.next
      continue
    }
    if (key === 'tokens') {
      if (value === '[]') {
        data.tokens = []
        i += 1
        continue
      }
      const parsed = parseTokens(lines, i + 1)
      data.tokens = parsed.tokens
      i = parsed.next
      continue
    }
    if (key === 'fog') {
      data.fog = value
      i += 1
      continue
    }
    if (key === 'fogsize') {
      const size = Number(value)
      data.fogSize = Number.isFinite(size) ? Math.max(8, Math.min(256, Math.round(size))) : DEFAULT_FOG_SIZE
      i += 1
      continue
    }
    if (key === 'tokenscale') {
      data.tokenScale = clampTokenScale(Number(value))
      i += 1
      continue
    }
    if (key === 'gridx') {
      data.gridX = clamp01(Number(value))
      i += 1
      continue
    }
    if (key === 'gridy') {
      data.gridY = clamp01(Number(value))
      i += 1
      continue
    }
    if (key === 'pinslocked') {
      data.pinsLocked = !/^(false|no|0)$/i.test(value)
      i += 1
      continue
    }
    i += 1
  }
  return data
}

export function extractMapNote(markdown: string): MapNoteData | null {
  const fenced = MAP_FENCE.exec(markdown)
  if (!fenced) return null
  return parseMapYaml(fenced[1])
}

export function serializeMapYaml(data: MapNoteData): string {
  const lines = [`image: ${data.image || ''}`]
  if (data.pins.length === 0) {
    lines.push('pins: []')
  } else {
    lines.push('pins:')
    for (const pin of data.pins) {
      lines.push(`  - id: ${pin.id}`)
      lines.push(`    x: ${clamp01(pin.x)}`)
      lines.push(`    y: ${clamp01(pin.y)}`)
      lines.push(`    label: ${pin.label}`)
      if (pin.heading) lines.push(`    heading: ${pin.heading}`)
    }
  }
  if ((data.tokens ?? []).length === 0) {
    lines.push('tokens: []')
  } else {
    lines.push('tokens:')
    for (const token of data.tokens) {
      lines.push(`  - id: ${token.id}`)
      lines.push(`    kind: ${token.kind}`)
      if (token.source) lines.push(`    source: ${token.source}`)
      lines.push(`    x: ${clamp01(token.x)}`)
      lines.push(`    y: ${clamp01(token.y)}`)
      if (token.space !== 'medium') lines.push(`    space: ${token.space}`)
      lines.push(`    label: ${token.label}`)
      if (token.image) lines.push(`    image: ${token.image}`)
    }
  }
  lines.push(`tokenScale: ${clampTokenScale(data.tokenScale ?? TOKEN_SCALE_DEFAULT)}`)
  if ((data.gridX ?? 0) !== 0 || (data.gridY ?? 0) !== 0) {
    lines.push(`gridX: ${clamp01(data.gridX ?? 0)}`)
    lines.push(`gridY: ${clamp01(data.gridY ?? 0)}`)
  }
  lines.push(`pinsLocked: ${data.pinsLocked ? 'true' : 'false'}`)
  if (data.fog) {
    lines.push(`fogSize: ${data.fogSize || DEFAULT_FOG_SIZE}`)
    lines.push(`fog: ${data.fog}`)
  }
  return `${lines.join('\n')}\n`
}

export function replaceMapFence(markdown: string, data: MapNoteData): string {
  const block = `\`\`\`map\n${serializeMapYaml(data)}\`\`\``
  if (MAP_FENCE.test(markdown)) return markdown.replace(MAP_FENCE, block)
  const lines = markdown.replace(/\r/g, '').split('\n')
  const headingAt = lines.findIndex((line) => /^#\s+/.test(line))
  if (headingAt === -1) return `${block}\n\n${markdown}`.trim()
  const next = [...lines]
  next.splice(headingAt + 1, 0, '', block)
  return next.join('\n')
}

export function mapOverviewMarkdown(markdown: string): string {
  const withoutFence = markdown.replace(MAP_FENCE, '').trim()
  const sections = splitMarkdownSections(withoutFence)
  const overview = sections.filter((section) => section.level <= 1)
  return overview.map((section) => section.markdown).join('\n\n').trim()
}

export function mapRoomMarkdown(markdown: string, heading: string): string | null {
  if (!heading.trim()) return null
  const want = headingId(heading)
  const withoutFence = markdown.replace(MAP_FENCE, '')
  const sections = splitMarkdownSections(withoutFence)
  const exact = sections.find((section) => headingId(section.heading) === want)
  if (exact) return exact.markdown.trim()
  const loose = sections.find(
    (section) =>
      headingId(section.heading).includes(want) || want.includes(headingId(section.heading))
  )
  return loose?.markdown.trim() ?? null
}

export function mapHeadings(markdown: string): string[] {
  const withoutFence = markdown.replace(MAP_FENCE, '')
  return splitMarkdownSections(withoutFence)
    .filter((section) => section.level === 2 && section.heading)
    .map((section) => section.heading.replace(/^\*+|\*+$/g, '').trim())
}

export function ensureHeading(markdown: string, heading: string): string {
  const name = heading.trim()
  if (!name) return markdown
  if (mapRoomMarkdown(markdown, name)) return markdown
  return `${markdown.trimEnd()}\n\n## ${name}\n\nRoom notes.\n`
}

export function mapImagePath(
  markdown: string,
  notePath: string,
  images: CampaignImage[]
): string | null {
  const data = extractMapNote(markdown)
  if (!data?.image) return null
  return resolveImageRef(data.image, notePath, images)
}

export function tokenPortraitPath(token: MapToken, images: CampaignImage[]): string | null {
  if (token.image) {
    const override = resolveImageRef(token.image, token.source || '', images)
    if (override) return override
  }
  if (token.source) {
    const fromSource = portraitForNote(token.source, images)
    if (fromSource) return fromSource
  }
  if (token.label) {
    const fromLabel = resolveImageRef(token.label, token.source || '', images)
    if (fromLabel) return fromLabel
  }
  return null
}

export function toPlayerMapToken(
  token: MapToken,
  images: CampaignImage[],
  tokenScale: number,
  hideBundled = false
): PlayerMapToken {
  const path = tokenPortraitPath(token, images)
  const imageSrc = path
    ? campaignFileUrl(path)
    : token.kind === 'monster' && !hideBundled
      ? srdPortraitUrl(token.label)
      : null
  return {
    id: token.id,
    x: token.x,
    y: token.y,
    size: tokenDiameter(tokenScale, token.space),
    label: token.label,
    kind: token.kind,
    imageSrc
  }
}
