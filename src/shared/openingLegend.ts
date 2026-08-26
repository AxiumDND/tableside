/** Parchment legend scroll — original user text only. Reuses crawl music timing. */

import {
  CRAWL_FADE_OUT_MS,
  CRAWL_MUSIC_LEAD_MS,
  CRAWL_SYNC_MS,
  crawlMusicRef,
  crawlEndImageRef
} from './openingCrawl'

/** Sample body written into new Classic / Light / Vampire game night sheets. */
export const NIGHTSHEET_LEGEND_SAMPLE = `> [!legend] The Pale Well
> preface: In the year the ridge road failed, when Greystead still trusted its walls.
> It is a quiet season in the uplands. Grain waits at the mill. The watch argues over bandits on the ridge.
>
> A girl named Lira vanishes on the night the well runs cold. The mayor's purse is already on the table, and the town swears it was thieves.
>
> In the caves beneath the pale stone, something older keeps its count. If the rite is not stopped, the ridge will not hold another winter.
>
> A handful of travelers still answer the call. They have one night to learn what the well wants, and reach the caves before the dark closes.`

export const LEGEND_PREFACE_DEFAULT =
  'In the reign of forgotten kings,\nwhen the roads still led to wonder.'

export { CRAWL_FADE_OUT_MS as LEGEND_FADE_OUT_MS, CRAWL_SYNC_MS as LEGEND_SYNC_MS, CRAWL_MUSIC_LEAD_MS as LEGEND_MUSIC_LEAD_MS }

const PREFACE_LINE = /^(?:preface|ago|opening)\s*:\s*(.*)$/i
const MUSIC_LINE = /^(?:music|legend\s*music|theme)\s*:\s*(.*)$/i
const END_LINE = /^(?:end|end\s*image|finale)\s*:\s*(.*)$/i

function stripWikiPath(value: string): string {
  const trimmed = value.trim()
  const wiki = /^!?\[\[([^\]|\n]+)(?:\|[^\]\n]+)?\]\]$/.exec(trimmed)
  if (wiki?.[1]) return wiki[1].trim()
  const md = /^!\[[^\]]*\]\(\s*<?([^>\s)]+)/.exec(trimmed)
  if (md?.[1]) return md[1].trim()
  return trimmed.replace(/^\[\[|\]\]$/g, '').trim()
}

/** First image embed in a legend callout — campaign file or markdown URL. */
export function legendLogoRef(markdown: string): string | null {
  const wiki = /!\[\[([^\]|\n]+)(?:\|[^\]\n]+)?\]\]/.exec(markdown)
  if (wiki?.[1]) return wiki[1].trim()
  const md = /!\[[^\]]*\]\(\s*<?([^>\s)]+)/.exec(markdown)
  if (md?.[1]) return md[1].trim()
  return null
}

export function legendPreface(markdown: string): string | null {
  const match = markdown
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => PREFACE_LINE.exec(line.trim()))
    .find((item): item is RegExpExecArray => Boolean(item))
  if (!match) return LEGEND_PREFACE_DEFAULT
  const value = (match[1] ?? '').trim()
  if (!value || /^(none|-|off|skip)$/i.test(value)) return null
  return value.replace(/\\n/g, '\n')
}

export function legendMusicRef(markdown: string): string | null {
  const match = markdown
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => MUSIC_LINE.exec(line.trim()))
    .find((item): item is RegExpExecArray => Boolean(item))
  if (!match) return crawlMusicRef(markdown)
  const value = stripWikiPath(match[1] ?? '')
  if (!value || /^(none|-|off|skip)$/i.test(value)) return null
  return value
}

export function legendEndImageRef(markdown: string): string | null {
  const match = markdown
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => END_LINE.exec(line.trim()))
    .find((item): item is RegExpExecArray => Boolean(item))
  if (!match) return crawlEndImageRef(markdown)
  const value = stripWikiPath(match[1] ?? '')
  if (!value || /^(none|-|off|skip)$/i.test(value)) return null
  return value
}

export function legendPlainText(markdown: string): string {
  return markdown
    .replace(/\r/g, '')
    .replace(/^(?:preface|ago|opening)\s*:.*$/gim, '')
    .replace(/^(?:music|legend\s*music|theme|crawl\s*music)\s*:.*$/gim, '')
    .replace(/^(?:end|end\s*image|finale)\s*:.*$/gim, '')
    .replace(/!\[\[[^\]]*\]\]/g, '')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/\[\[([^\]|\n]+)(?:\|([^\]\n]+))?\]\]/g, (_m, target: string, label?: string) =>
      (label ?? target).trim()
    )
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_~`]+/g, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export const LEGEND_HOLD_MS = 1500
/** Opening line on parchment before the herald. */
export const LEGEND_PREFACE_MS = 6000
/** Sigil / herald frame before the body. */
export const LEGEND_HERALD_MS = 2500

export function legendMusicStartDelayMs(preface: string | null | undefined): number {
  const line = preface === undefined ? LEGEND_PREFACE_DEFAULT : preface
  const prefaceMs = line ? LEGEND_PREFACE_MS : 0
  return Math.max(0, LEGEND_HOLD_MS + prefaceMs - CRAWL_MUSIC_LEAD_MS)
}

export function legendBodyDurationMs(): number {
  return Math.max(0, CRAWL_SYNC_MS - CRAWL_MUSIC_LEAD_MS - LEGEND_HERALD_MS)
}

export function legendDurationMs(_title?: string | undefined, _body?: string): number {
  return legendBodyDurationMs()
}

export interface LegendCalloutFields {
  title?: string
  preface: string | null
  logoRef: string | null
  endImageRef: string | null
  musicRef: string | null
  body: string
}

export function serializeLegendCallout(fields: LegendCalloutFields): string {
  const title = fields.title?.trim()
  const lines = [`> [!legend]${title ? ` ${title}` : ''}`]
  if (fields.preface == null) lines.push('> preface: none')
  else lines.push(`> preface: ${fields.preface.replace(/\r/g, '').replace(/\n+/g, ' ').trim()}`)
  if (fields.musicRef?.trim()) {
    lines.push(`> music: ${fields.musicRef.trim().replace(/^\[\[|\]\]$/g, '')}`)
  }
  if (fields.logoRef?.trim()) {
    const ref = fields.logoRef.trim().replace(/^!\[\[|\]\]$/g, '')
    lines.push(`> ![[${ref}]]`)
  }
  if (fields.endImageRef?.trim()) {
    const ref = fields.endImageRef.trim().replace(/^!\[\[|\]\]$/g, '')
    lines.push(`> end: ![[${ref}]]`)
  }
  const body = fields.body.replace(/\r/g, '').trim()
  if (body) {
    lines.push('>')
    for (const line of body.split('\n')) {
      lines.push(line.trim() === '' ? '>' : `> ${line}`)
    }
  }
  return lines.join('\n')
}

const LEGEND_START = /^>\s*\[!(?:legend|tale|chronicle)\][+-]?\s*(.*)$/i

/** Replace the nth legend/tale/chronicle callout in a note. */
export function replaceNthLegendCallout(source: string, index: number, fields: LegendCalloutFields): string {
  const lines = source.replace(/\r/g, '').split('\n')
  let i = 0
  let seen = 0
  while (i < lines.length) {
    if (!LEGEND_START.test(lines[i] ?? '')) {
      i += 1
      continue
    }
    const from = i
    i += 1
    while (i < lines.length && /^>/.test(lines[i] ?? '')) i += 1
    if (seen === index) {
      const next = serializeLegendCallout(fields).split('\n')
      const out = [...lines.slice(0, from), ...next, ...lines.slice(i)].join('\n')
      return source.endsWith('\n') && !out.endsWith('\n') ? `${out}\n` : out
    }
    seen += 1
  }
  return source
}
