/** Image gallery callout — sequence of stills on the player screen. */

import { replaceNthCallout, serializeFencedCallout } from './callouts'

const INTERVAL_LINE = /^(?:interval|auto|delay|seconds)\s*:\s*(.*)$/i
const LOOP_LINE = /^(?:loop|repeat|cycle)\s*:\s*(.*)$/i
const SHOW_TITLE_LINE = /^(?:show[-_]?title|title[-_]?on[-_]?player|player[-_]?title)\s*:\s*(.*)$/i

function stripWikiPath(value: string): string {
  const trimmed = value.trim()
  const wiki = /^!?\[\[([^\]|\n]+)(?:\|[^\]\n]+)?\]\]$/.exec(trimmed)
  if (wiki?.[1]) return wiki[1].trim()
  const md = /^!\[[^\]]*\]\(\s*<?([^>\s)]+)/.exec(trimmed)
  if (md?.[1]) return md[1].trim()
  return trimmed.replace(/^\[\[|\]\]$/g, '').trim()
}

function parseBoolFlag(raw: string, defaultValue: boolean): boolean {
  const value = raw.trim().toLowerCase()
  if (!value) return defaultValue
  if (/^(0|false|no|off|never|manual|skip|-)$/i.test(value)) return false
  if (/^(1|true|yes|on|always|loop|repeat)$/i.test(value)) return true
  return defaultValue
}

/** All image embeds in gallery markdown, in order. */
export function galleryImageRefs(markdown: string): string[] {
  const refs: string[] = []
  const text = markdown.replace(/\r/g, '')
  const wiki = /!\[\[([^\]|\n]+)(?:\|[^\]\n]+)?\]\]/g
  let match: RegExpExecArray | null
  while ((match = wiki.exec(text))) {
    const ref = match[1]?.trim()
    if (ref) refs.push(ref)
  }
  const md = /!\[[^\]]*\]\(\s*<?([^>\s)]+)/g
  while ((match = md.exec(text))) {
    const ref = match[1]?.trim()
    if (ref) refs.push(ref)
  }
  return refs
}

/**
 * Auto-advance interval in seconds. `null` / 0 = manual only.
 * Parses `interval: 8`, `interval: 8s`, `auto: 5`, or `manual` / `none`.
 */
export function galleryIntervalSec(markdown: string): number | null {
  const match = markdown
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => INTERVAL_LINE.exec(line.trim()))
    .find((item): item is RegExpExecArray => Boolean(item))
  if (!match) return null
  const value = (match[1] ?? '').trim().toLowerCase()
  if (!value || /^(none|off|manual|skip|-)$/i.test(value)) return null
  const num = Number.parseFloat(value.replace(/s(ec(onds?)?)?$/i, '').trim())
  if (!Number.isFinite(num) || num <= 0) return null
  return Math.min(120, Math.max(1, Math.round(num)))
}

/** Loop slides when advancing. Default true when the line is omitted. */
export function galleryLoops(markdown: string): boolean {
  const match = markdown
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => LOOP_LINE.exec(line.trim()))
    .find((item): item is RegExpExecArray => Boolean(item))
  if (!match) return true
  return parseBoolFlag(match[1] ?? '', true)
}

/** Show gallery title on the player screen. Default false when omitted. */
export function galleryShowTitle(markdown: string): boolean {
  const match = markdown
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => SHOW_TITLE_LINE.exec(line.trim()))
    .find((item): item is RegExpExecArray => Boolean(item))
  if (!match) return false
  return parseBoolFlag(match[1] ?? '', false)
}

export interface GalleryCalloutFields {
  title?: string
  intervalSec: number | null
  loop: boolean
  showTitle: boolean
  imageRefs: string[]
}

export function serializeGalleryCallout(fields: GalleryCalloutFields): string {
  const title = fields.title?.trim()
  const body: string[] = []
  if (fields.intervalSec == null || fields.intervalSec <= 0) {
    body.push('interval: manual')
  } else {
    body.push(`interval: ${fields.intervalSec}s`)
  }
  if (!fields.loop) body.push('loop: false')
  if (fields.showTitle) body.push('showTitle: true')
  for (const ref of fields.imageRefs) {
    const clean = ref.trim().replace(/^!\[\[|\]\]$/g, '')
    if (clean) body.push(`![[${clean}]]`)
  }
  return serializeFencedCallout('gallery', title, body)
}

export function replaceNthGalleryCallout(
  source: string,
  index: number,
  fields: GalleryCalloutFields
): string {
  return replaceNthCallout(source, ['gallery', 'slides', 'sequence'], index, serializeGalleryCallout(fields))
}

export function parseGalleryFields(title: string | undefined, markdown: string): GalleryCalloutFields {
  return {
    title,
    intervalSec: galleryIntervalSec(markdown),
    loop: galleryLoops(markdown),
    showTitle: galleryShowTitle(markdown),
    imageRefs: galleryImageRefs(markdown)
  }
}

/** Drop field lines and embeds (for any future plain-text use). */
export function galleryPlainBody(markdown: string): string {
  return markdown
    .replace(/\r/g, '')
    .replace(/^(?:interval|auto|delay|seconds)\s*:.*$/gim, '')
    .replace(/^(?:loop|repeat|cycle)\s*:.*$/gim, '')
    .replace(/^(?:show[-_]?title|title[-_]?on[-_]?player|player[-_]?title)\s*:.*$/gim, '')
    .replace(/!\[\[[^\]]*\]\]/g, '')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .trim()
}

export { stripWikiPath as galleryStripWikiPath }
