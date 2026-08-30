/** Parchment legend scroll — original user text only. Reuses crawl music timing. */

import { replaceNthCallout, serializeFencedCallout } from './callouts'
import {
  CRAWL_FADE_OUT_MS,
  CRAWL_MUSIC_LEAD_MS,
  CRAWL_SYNC_MS,
  crawlMusicRef,
  crawlEndImageRef
} from './openingCrawl'

/** Sample body written into new Classic / Light / Vampire game night sheets. */
export const NIGHTSHEET_LEGEND_SAMPLE = `[!legend] The Pale Well
It is a quiet season in the uplands. Grain waits at the mill. The watch argues over bandits on the ridge.

A girl named Lira vanishes on the night the well runs cold. The mayor's purse is already on the table, and the town swears it was thieves.

In the caves beneath the pale stone, something older keeps its count. If the rite is not stopped, the ridge will not hold another winter.

A handful of travelers still answer the call. They have one night to learn what the well wants, and reach the caves before the dark closes.
[!/legend]`

/** Kept for older notes / crawl-style fields; the player chronicle no longer shows an opening line. */
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
  if (!match) return null
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

/** Brief mist hold before the scroll rises. */
export const LEGEND_HOLD_MS = 1200
/** @deprecated Opening line no longer plays; kept for older imports. */
export const LEGEND_PREFACE_MS = 0
/** @deprecated Herald / sigil no longer plays; kept for older imports. */
export const LEGEND_HERALD_MS = 0

export function legendMusicStartDelayMs(_preface?: string | null): number {
  return Math.max(0, LEGEND_HOLD_MS - CRAWL_MUSIC_LEAD_MS)
}

export function legendBodyDurationMs(): number {
  return Math.max(0, CRAWL_SYNC_MS - CRAWL_MUSIC_LEAD_MS)
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
  const body: string[] = []
  if (fields.preface?.trim()) {
    body.push(`preface: ${fields.preface.replace(/\r/g, '').replace(/\n+/g, ' ').trim()}`)
  }
  if (fields.musicRef?.trim()) {
    body.push(`music: ${fields.musicRef.trim().replace(/^\[\[|\]\]$/g, '')}`)
  }
  if (fields.logoRef?.trim()) {
    const ref = fields.logoRef.trim().replace(/^!\[\[|\]\]$/g, '')
    body.push(`![[${ref}]]`)
  }
  if (fields.endImageRef?.trim()) {
    const ref = fields.endImageRef.trim().replace(/^!\[\[|\]\]$/g, '')
    body.push(`end: ![[${ref}]]`)
  }
  const text = fields.body.replace(/\r/g, '').trim()
  if (text) {
    body.push('')
    body.push(...text.split('\n'))
  }
  return serializeFencedCallout('legend', title, body)
}

/** Replace the nth legend/tale/chronicle callout in a note. */
export function replaceNthLegendCallout(source: string, index: number, fields: LegendCalloutFields): string {
  return replaceNthCallout(source, ['legend', 'tale', 'chronicle'], index, serializeLegendCallout(fields))
}
