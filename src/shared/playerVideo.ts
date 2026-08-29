/** Video clip callout — local campaign video on the player screen. */

import { replaceNthCallout, serializeFencedCallout } from './callouts'

const MUTE_LINE = /^(?:mute|muted|silent)\s*:\s*(.*)$/i
const VIDEO_LINE = /^(?:video|clip|file)\s*:\s*(.*)$/i

const VIDEO_EXT = new Set(['.mp4', '.webm', '.mov', '.m4v'])

export function isVideoPath(path: string): boolean {
  const ext = path.slice(path.lastIndexOf('.')).toLowerCase()
  return VIDEO_EXT.has(ext)
}

export { VIDEO_EXT }

function stripWikiPath(value: string): string {
  const trimmed = value.trim()
  const wiki = /^!?\[\[([^\]|\n]+)(?:\|[^\]\n]+)?\]\]$/.exec(trimmed)
  if (wiki?.[1]) return wiki[1].trim()
  const md = /^!\[[^\]]*\]\(\s*<?([^>\s)]+)/.exec(trimmed)
  if (md?.[1]) return md[1].trim()
  return trimmed.replace(/^\[\[|\]\]$/g, '').trim()
}

/** First video embed or `video:` path in the callout. */
export function videoRef(markdown: string): string | null {
  const lines = markdown.replace(/\r/g, '').split('\n')
  for (const line of lines) {
    const field = VIDEO_LINE.exec(line.trim())
    if (field) {
      const value = stripWikiPath(field[1] ?? '')
      if (!value || /^(none|-|off|skip)$/i.test(value)) return null
      return value
    }
  }
  const wiki = /!\[\[([^\]|\n]+)(?:\|[^\]\n]+)?\]\]/.exec(markdown)
  if (wiki?.[1]) {
    const ref = wiki[1].trim()
    if (isVideoPath(ref) || !/\.[a-z0-9]+$/i.test(ref)) return ref
  }
  const md = /!\[[^\]]*\]\(\s*<?([^>\s)]+)/.exec(markdown)
  if (md?.[1]) {
    const ref = md[1].trim()
    if (isVideoPath(ref)) return ref
  }
  // Any wiki embed whose path looks like video
  const all = /!\[\[([^\]|\n]+)(?:\|[^\]\n]+)?\]\]/g
  let match: RegExpExecArray | null
  while ((match = all.exec(markdown))) {
    const ref = match[1]?.trim()
    if (ref && isVideoPath(ref)) return ref
  }
  return null
}

/** Mute video audio. Default false (play clip sound). `mute: true` / `yes` / `on`. */
export function videoMuted(markdown: string): boolean {
  const match = markdown
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => MUTE_LINE.exec(line.trim()))
    .find((item): item is RegExpExecArray => Boolean(item))
  if (!match) return false
  const value = (match[1] ?? '').trim().toLowerCase()
  return /^(1|true|yes|on|mute|muted|silent)$/i.test(value)
}

export interface VideoCalloutFields {
  title?: string
  videoRef: string | null
  muted: boolean
}

export function serializeVideoCallout(fields: VideoCalloutFields): string {
  const title = fields.title?.trim()
  const body: string[] = []
  if (fields.muted) body.push('mute: true')
  if (fields.videoRef?.trim()) {
    const ref = fields.videoRef.trim().replace(/^!\[\[|\]\]$/g, '')
    body.push(`![[${ref}]]`)
  }
  return serializeFencedCallout('video', title, body)
}

export function replaceNthVideoCallout(
  source: string,
  index: number,
  fields: VideoCalloutFields
): string {
  return replaceNthCallout(source, ['video', 'clip', 'film'], index, serializeVideoCallout(fields))
}

export function parseVideoFields(title: string | undefined, markdown: string): VideoCalloutFields {
  return {
    title,
    videoRef: videoRef(markdown),
    muted: videoMuted(markdown)
  }
}
