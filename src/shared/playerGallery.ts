/** Image gallery callout — sequence of stills on the player screen. */

import { replaceNthCallout, serializeFencedCallout } from './callouts'

const INTERVAL_LINE = /^(?:interval|auto|delay|seconds)\s*:\s*(.*)$/i

function stripWikiPath(value: string): string {
  const trimmed = value.trim()
  const wiki = /^!?\[\[([^\]|\n]+)(?:\|[^\]\n]+)?\]\]$/.exec(trimmed)
  if (wiki?.[1]) return wiki[1].trim()
  const md = /^!\[[^\]]*\]\(\s*<?([^>\s)]+)/.exec(trimmed)
  if (md?.[1]) return md[1].trim()
  return trimmed.replace(/^\[\[|\]\]$/g, '').trim()
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

export interface GalleryCalloutFields {
  title?: string
  intervalSec: number | null
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
    imageRefs: galleryImageRefs(markdown)
  }
}

/** Drop interval lines (for any future plain-text use). */
export function galleryPlainBody(markdown: string): string {
  return markdown
    .replace(/\r/g, '')
    .replace(/^(?:interval|auto|delay|seconds)\s*:.*$/gim, '')
    .replace(/!\[\[[^\]]*\]\]/g, '')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .trim()
}

export { stripWikiPath as galleryStripWikiPath }
