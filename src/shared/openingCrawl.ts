/** Perspective title crawl — original user text only. No licensed copy or fonts. User may attach their own crawl music. */

/** Sample body written into new Sci-fi game night sheets. Rewrite it for the table. */
export const NIGHTSHEET_CRAWL_SAMPLE = `> [!crawl] The Siege of Kestrel
> preface: In an age before memory, beyond the rim of charted stars.
> It is a time of unrest. Relay stations along the outer belt have gone dark, and no courier has returned from the ice docks in a month.
>
> A single packet-ship breaks the silence. It carries a last warning, sealed under a dead captain’s mark, and a chart that names Kestrel as the next world to fall.
>
> On the home docks, house banners still fly. Grain ships wait in queue. The watch argues over whose fleet will sail, while the yards burn through the last of the ready hulls.
>
> In the deep, the siege engines are already moving. If Kestrel’s orbital ring is taken, the inner worlds will have no shield and no time.
>
> A handful of crews still answer the call. They have one night to steal the packet, learn who sold the belt, and reach the ring before the dark closes.`

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
  const value = (match[1] ?? '').trim().replace(/^\[\[|\]\]$/g, '').replace(/^!\[\[|\]\]$/g, '')
  if (!value || /^(none|-|off|skip)$/i.test(value)) return null
  return value
}

export function crawlPlainText(markdown: string): string {
  return markdown
    .replace(/\r/g, '')
    .replace(/^(?:preface|ago)\s*:.*$/gim, '')
    .replace(/^(?:music|crawl\s*music|theme)\s*:.*$/gim, '')
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

const BASE_SECONDS = 8
const SECONDS_PER_WORD = 0.35
const MIN_SECONDS = 20
const MAX_SECONDS = 90

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
  musicRef: string | null
  body: string
}

export function serializeCrawlCallout(fields: CrawlCalloutFields): string {
  const title = fields.title?.trim()
  const lines = [`> [!crawl]${title ? ` ${title}` : ''}`]
  if (fields.preface == null) lines.push('> preface: none')
  else lines.push(`> preface: ${fields.preface.replace(/\r/g, '').replace(/\n+/g, ' ').trim()}`)
  if (fields.musicRef?.trim()) {
    lines.push(`> music: ${fields.musicRef.trim().replace(/^\[\[|\]\]$/g, '')}`)
  }
  if (fields.logoRef?.trim()) {
    const ref = fields.logoRef.trim().replace(/^!\[\[|\]\]$/g, '')
    lines.push(`> ![[${ref}]]`)
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

const CRAWL_START = /^>\s*\[!(?:crawl|opening)\][+-]?\s*(.*)$/i

/** Replace the nth crawl/opening callout in a note. */
export function replaceNthCrawlCallout(source: string, index: number, fields: CrawlCalloutFields): string {
  const lines = source.replace(/\r/g, '').split('\n')
  let i = 0
  let seen = 0
  while (i < lines.length) {
    if (!CRAWL_START.test(lines[i] ?? '')) {
      i += 1
      continue
    }
    const from = i
    i += 1
    while (i < lines.length && /^>/.test(lines[i] ?? '')) i += 1
    if (seen === index) {
      const next = serializeCrawlCallout(fields).split('\n')
      const out = [...lines.slice(0, from), ...next, ...lines.slice(i)].join('\n')
      return source.endsWith('\n') && !out.endsWith('\n') ? `${out}\n` : out
    }
    seen += 1
  }
  return source
}

/** Scroll time from word count, then the picture fades to black. */
export function crawlDurationMs(title: string | undefined, body: string): number {
  const seconds = Math.min(MAX_SECONDS, Math.max(MIN_SECONDS, BASE_SECONDS + crawlWordCount(title, body) * SECONDS_PER_WORD))
  return Math.round(seconds * 1000)
}
