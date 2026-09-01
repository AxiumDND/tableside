/** Incoming-call callout — NPC sheet on an iPhone-style player overlay. */

import { isAudioPath } from './audio'
import { replaceNthCallout, serializeFencedCallout } from './callouts'

const NPC_LINE = /^(?:npc|caller|from)\s*:\s*(.*)$/i
const RING_LINE = /^(?:ring|ringtone|tone|sound)\s*:\s*(.*)$/i

export const PHONE_FADE_IN_MS = 1100
export const PHONE_FADE_LEAD_MS = 450
export const PHONE_FADE_OUT_MS = 900

function stripWikiPath(value: string): string {
  const trimmed = value.trim()
  const wiki = /^!?\[\[([^\]|\n]+)(?:\|[^\]\n]+)?\]\]$/.exec(trimmed)
  if (wiki?.[1]) return wiki[1].trim()
  const md = /^!\[[^\]]*\]\(\s*<?([^>\s)]+)/.exec(trimmed)
  if (md?.[1]) return md[1].trim()
  return trimmed.replace(/^\[\[|\]\]$/g, '').trim()
}

/** `undefined` = no field; `null` = explicit none. */
function fieldValue(markdown: string, pattern: RegExp): string | null | undefined {
  const lines = markdown.replace(/\r/g, '').split('\n')
  for (const line of lines) {
    const field = pattern.exec(line.trim())
    if (!field) continue
    const value = stripWikiPath(field[1] ?? '')
    if (!value || /^(none|-|off|skip)$/i.test(value)) return null
    return value
  }
  return undefined
}

function firstNoteWiki(markdown: string): string | null {
  const wiki = /\[\[([^\]|\n]+)(?:\|[^\]\n]+)?\]\]/g
  let match: RegExpExecArray | null
  while ((match = wiki.exec(markdown))) {
    const at = match.index ?? 0
    if (at > 0 && markdown[at - 1] === '!') continue
    const ref = match[1]?.trim()
    if (ref && !isAudioPath(ref)) return ref.split('#')[0]?.trim() || ref
  }
  const linked = /\[([^\]]+)\]\(#note:([^)]+)\)/.exec(markdown)
  if (linked?.[2]) {
    try {
      const path = decodeURIComponent(linked[2])
      const file = path.replaceAll('\\', '/').split('/').pop() ?? path
      return file.replace(/\.md$/i, '').trim() || linked[1]?.trim() || null
    } catch {
      return linked[1]?.trim() || null
    }
  }
  return null
}

function firstAudioEmbed(markdown: string): string | null {
  const wiki = /!\[\[([^\]|\n]+)(?:\|[^\]\n]+)?\]\]/g
  let match: RegExpExecArray | null
  while ((match = wiki.exec(markdown))) {
    const ref = match[1]?.trim()
    if (ref && isAudioPath(ref)) return ref
  }
  return null
}

/** NPC sheet stem/path: `npc:` field, else the first note wikilink. */
export function phoneNpcRef(markdown: string, title?: string): string | null {
  const fromField = fieldValue(markdown, NPC_LINE)
  if (fromField === null) return null
  if (fromField) return fromField
  const wiki = firstNoteWiki(markdown)
  if (wiki) return wiki
  const leftover = title?.trim()
  return leftover || null
}

/** Optional ringtone: `ring:` field, else the first audio embed. */
export function phoneRingRef(markdown: string): string | null {
  const fromField = fieldValue(markdown, RING_LINE)
  if (fromField === null) return null
  if (fromField) return fromField
  return firstAudioEmbed(markdown)
}

export interface PhoneCalloutFields {
  npcRef: string | null
  ringRef: string | null
}

export function serializePhoneCallout(fields: PhoneCalloutFields): string {
  const body: string[] = []
  if (fields.npcRef?.trim()) {
    const ref = fields.npcRef.trim().replace(/^!?\[\[|\]\]$/g, '')
    body.push(`[[${ref}]]`)
  }
  if (fields.ringRef?.trim()) {
    body.push(`ring: ![[${fields.ringRef.trim().replace(/^!\[\[|\]\]$/g, '')}]]`)
  }
  return serializeFencedCallout('phone', undefined, body)
}

export function replaceNthPhoneCallout(
  source: string,
  index: number,
  fields: PhoneCalloutFields
): string {
  return replaceNthCallout(source, ['phone', 'call', 'incoming'], index, serializePhoneCallout(fields))
}

export function parsePhoneFields(title: string | undefined, markdown: string): PhoneCalloutFields {
  return {
    npcRef: phoneNpcRef(markdown, title),
    ringRef: phoneRingRef(markdown)
  }
}
