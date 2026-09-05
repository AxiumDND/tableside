/** Perspective title crawl — original user text only. No licensed copy or fonts. User may attach their own crawl music. */

import { replaceNthCallout, serializeFencedCallout } from './callouts'

/** Sample body written into new Sci-fi game night sheets. Rewrite it for the table. */
export const NIGHTSHEET_CRAWL_SAMPLE = `[!crawl] The Siege of Kestrel
preface: In an age before memory, beyond the rim of charted stars.
It is a time of unrest. Relay stations along the outer belt have gone dark, and no courier has returned from the ice docks in a month.

A single packet-ship breaks the silence. It carries a last warning, sealed under a dead captain’s mark, and a chart that names Kestrel as the next world to fall.

On the home docks, house banners still fly. Grain ships wait in queue. The watch argues over whose fleet will sail, while the yards burn through the last of the ready hulls.

In the deep, the siege engines are already moving. If Kestrel’s orbital ring is taken, the inner worlds will have no shield and no time.

A handful of crews still answer the call. They have one night to steal the packet, learn who sold the belt, and reach the ring before the dark closes.
[!/crawl]`

/** Original far-off line. Do not ship licensed crawl copy. */
export const CRAWL_PREFACE_DEFAULT = 'In an age before memory,\nbeyond the rim of charted stars.'

/** First image embed in a crawl callout — campaign file or markdown URL. */
export function crawlLogoRef(markdown: string): string | null {
  const wiki = /!\[\[([^\]|\n]+)(?:\|[^\]\n]+)?\]\]/.exec(markdown)
  if (wiki?.[1]) return wiki[1].trim()
  const md = /!\[[^\]]*\]\(\s*<?([^>\s)]+)/.exec(markdown)
  if (md?.[1]) return md[1].trim()
  return null
}

const PREFACE_LINE = /^(?:preface|ago)\s*:\s*(.*)$/i
const MUSIC_LINE = /^(?:music|crawl\s*music|theme)\s*:\s*(.*)$/i
const END_LINE = /^(?:end|end\s*image|finale)\s*:\s*(.*)$/i

function stripWikiPath(value: string): string {
  const trimmed = value.trim()
  const wiki = /^!?\[\[([^\]|\n]+)(?:\|[^\]\n]+)?\]\]$/.exec(trimmed)
  if (wiki?.[1]) return wiki[1].trim()
  const md = /^!\[[^\]]*\]\(\s*<?([^>\s)]+)/.exec(trimmed)
  if (md?.[1]) return md[1].trim()
  return trimmed.replace(/^\[\[|\]\]$/g, '').trim()
}

/** `preface:` / `ago:` line, or the default. `none` skips the far-off card. */
export function crawlPreface(markdown: string): string | null {
  const match = markdown
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => PREFACE_LINE.exec(line.trim()))
    .find((item): item is RegExpExecArray => Boolean(item))
  if (!match) return CRAWL_PREFACE_DEFAULT
  const value = (match[1] ?? '').trim()
  if (!value || /^(none|-|off|skip)$/i.test(value)) return null
  return value.replace(/\\n/g, '\n')
}

/** Optional crawl music path under Audio/ (overrides the mood playlist while the crawl runs). */
export function crawlMusicRef(markdown: string): string | null {
  const match = markdown
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => MUSIC_LINE.exec(line.trim()))
    .find((item): item is RegExpExecArray => Boolean(item))
  if (!match) return null
  const value = stripWikiPath(match[1] ?? '')
  if (!value || /^(none|-|off|skip)$/i.test(value)) return null
  return value
}

/** Optional closing still that fades in when the crawl ends (planet, ship, etc.). */
export function crawlEndImageRef(markdown: string): string | null {
  const match = markdown
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => END_LINE.exec(line.trim()))
    .find((item): item is RegExpExecArray => Boolean(item))
  if (!match) return null
  const value = stripWikiPath(match[1] ?? '')
  if (!value || /^(none|-|off|skip)$/i.test(value)) return null
  return value
}

export function crawlPlainText(markdown: string): string {
  return markdown
    .replace(/\r/g, '')
    .replace(/^(?:preface|ago)\s*:.*$/gim, '')
    .replace(/^(?:music|crawl\s*music|theme)\s*:.*$/gim, '')
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

export const CRAWL_HOLD_MS = 2000
/** Far-off card after the starfield hold, before the emblem. */
export const CRAWL_PREFACE_MS = 8000
/** Generic emblem after the far-off card, before the crawl. */
export const CRAWL_LOGO_MS = 2500
/** Fade to black when the crawl ends or the DM stops early. Matches mood crossfade. */
export const CRAWL_FADE_OUT_MS = 5000
/** Crawl theme starts this long before the emblem (silence through hold + far-off line). */
export const CRAWL_MUSIC_LEAD_MS = 500
/** Timed crawl from when crawl music starts (1:32). Longer tracks fade out here. */
export const CRAWL_SYNC_MS = 92_000

/** Delay from Play until crawl music should start (mood fades immediately). */
export function crawlMusicStartDelayMs(preface: string | null | undefined): number {
  const line = preface === undefined ? CRAWL_PREFACE_DEFAULT : preface
  const prefaceMs = line ? CRAWL_PREFACE_MS : 0
  return Math.max(0, CRAWL_HOLD_MS + prefaceMs - CRAWL_MUSIC_LEAD_MS)
}

/** Scroll length so logo + crawl finish exactly at CRAWL_SYNC_MS after music starts. */
export function crawlScrollDurationMs(): number {
  return Math.max(0, CRAWL_SYNC_MS - CRAWL_MUSIC_LEAD_MS - CRAWL_LOGO_MS)
}

export function crawlWordCount(title: string | undefined, body: string): number {
  return `${title ?? ''} ${body}`
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

export interface CrawlCalloutFields {
  title?: string
  preface: string | null
  logoRef: string | null
  endImageRef: string | null
  musicRef: string | null
  body: string
}

export function serializeCrawlCallout(fields: CrawlCalloutFields): string {
  const title = fields.title?.trim()
  const body: string[] = []
  if (fields.preface == null) body.push('preface: none')
  else body.push(`preface: ${fields.preface.replace(/\r/g, '').replace(/\n+/g, ' ').trim()}`)
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
  return serializeFencedCallout('crawl', title, body)
}

/** Replace the nth crawl/opening callout in a note. */
export function replaceNthCrawlCallout(source: string, index: number, fields: CrawlCalloutFields): string {
  return replaceNthCallout(source, ['crawl', 'opening'], index, serializeCrawlCallout(fields))
}

/** Scroll time synced to crawl music (1:32 from audio start), then the picture fades to black. */
export function crawlDurationMs(_title?: string | undefined, _body?: string): number {
  return crawlScrollDurationMs()
}

/** When the closing still begins after hold, far-off line, emblem, and scroll. */
export function crawlEndStillAtMs(preface?: string | null): number {
  const line = preface === undefined ? CRAWL_PREFACE_DEFAULT : preface
  const prefaceMs = line ? CRAWL_PREFACE_MS : 0
  return CRAWL_HOLD_MS + prefaceMs + CRAWL_LOGO_MS + crawlDurationMs()
}
