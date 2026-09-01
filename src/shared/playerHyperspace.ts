/** Hyperspace jump callout — streaks, optional ship, then a planet still. */

import { isAudioPath } from './audio'
import { replaceNthCallout, serializeFencedCallout } from './callouts'

const SHIP_LINE = /^(?:ship|vessel|craft)\s*:\s*(.*)$/i
const PLANET_LINE = /^(?:planet|world|arrival|dest|destination)\s*:\s*(.*)$/i
const ENTER_SOUND_LINE = /^(?:enter|entersound|jumpsound|whoosh)\s*:\s*(.*)$/i
const LOOP_SOUND_LINE = /^(?:loop|ambient|ambience|cruise|insound|in)\s*:\s*(.*)$/i
const EXIT_SOUND_LINE = /^(?:exit|exitsound|arrivesound)\s*:\s*(.*)$/i

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.bmp'])

/** Hold on a starfield before the tunnel. */
export const HYPERSPACE_STARFIELD_MS = 1600
/** Fade in the full streak tunnel (same look as exit). */
export const HYPERSPACE_ENTER_MS = 1200
/** Hold the tunnel before the ship still. */
export const HYPERSPACE_TUNNEL_HOLD_MS = 1600
export const HYPERSPACE_EXIT_SHIP_MS = 0
/** Streaks fade in over the ship, then the planet is revealed. */
export const HYPERSPACE_EXIT_STREAK_MS = 1800
export const HYPERSPACE_REVEAL_MS = 1400
export const HYPERSPACE_ARRIVE_MS = HYPERSPACE_EXIT_STREAK_MS + HYPERSPACE_REVEAL_MS
export const HYPERSPACE_FADE_OUT_MS = 1100
export const HYPERSPACE_LOOP_AT_MS =
  HYPERSPACE_STARFIELD_MS + HYPERSPACE_ENTER_MS + HYPERSPACE_TUNNEL_HOLD_MS

export function isHyperspaceImagePath(path: string): boolean {
  const ext = path.slice(path.lastIndexOf('.')).toLowerCase()
  return IMAGE_EXT.has(ext)
}

function stripWikiPath(value: string): string {
  const trimmed = value.trim()
  const wiki = /^!?\[\[([^\]|\n]+)(?:\|[^\]\n]+)?\]\]$/.exec(trimmed)
  if (wiki?.[1]) return wiki[1].trim()
  const md = /^!\[[^\]]*\]\(\s*<?([^>\s)]+)/.exec(trimmed)
  if (md?.[1]) return md[1].trim()
  return trimmed.replace(/^\[\[|\]\]$/g, '').trim()
}

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

function imageEmbeds(markdown: string): string[] {
  const found: string[] = []
  const wiki = /!\[\[([^\]|\n]+)(?:\|[^\]\n]+)?\]\]/g
  let match: RegExpExecArray | null
  while ((match = wiki.exec(markdown))) {
    const ref = match[1]?.trim()
    if (ref && (isHyperspaceImagePath(ref) || !/\.[a-z0-9]+$/i.test(ref))) found.push(ref)
  }
  const md = /!\[[^\]]*\]\(\s*<?([^>\s)]+)/g
  while ((match = md.exec(markdown))) {
    const ref = match[1]?.trim()
    if (ref && isHyperspaceImagePath(ref) && !found.includes(ref)) found.push(ref)
  }
  return found
}

export function hyperspaceShipRef(markdown: string): string | null {
  const fromField = fieldValue(markdown, SHIP_LINE)
  if (fromField === null) return null
  if (fromField) return fromField
  return imageEmbeds(markdown)[0] ?? null
}

export function hyperspacePlanetRef(markdown: string): string | null {
  const fromField = fieldValue(markdown, PLANET_LINE)
  if (fromField === null) return null
  if (fromField) return fromField
  const embeds = imageEmbeds(markdown)
  if (fieldValue(markdown, SHIP_LINE)) return embeds[0] ?? null
  return embeds[1] ?? null
}

export function hyperspaceEnterSoundRef(markdown: string): string | null {
  return audioField(markdown, ENTER_SOUND_LINE)
}

export function hyperspaceLoopSoundRef(markdown: string): string | null {
  return audioField(markdown, LOOP_SOUND_LINE)
}

export function hyperspaceExitSoundRef(markdown: string): string | null {
  return audioField(markdown, EXIT_SOUND_LINE)
}

function audioField(markdown: string, pattern: RegExp): string | null {
  const fromField = fieldValue(markdown, pattern)
  if (fromField === null || !fromField) return null
  return isAudioPath(fromField) ? fromField : fromField
}

export interface HyperspaceCalloutFields {
  title?: string
  shipRef: string | null
  planetRef: string | null
  enterSoundRef: string | null
  loopSoundRef: string | null
  exitSoundRef: string | null
}

export function serializeHyperspaceCallout(fields: HyperspaceCalloutFields): string {
  const body: string[] = []
  if (fields.shipRef?.trim()) {
    body.push(`ship: ![[${fields.shipRef.trim().replace(/^!\[\[|\]\]$/g, '')}]]`)
  }
  if (fields.planetRef?.trim()) {
    body.push(`planet: ![[${fields.planetRef.trim().replace(/^!\[\[|\]\]$/g, '')}]]`)
  }
  if (fields.enterSoundRef?.trim()) {
    body.push(`enter: ![[${fields.enterSoundRef.trim().replace(/^!\[\[|\]\]$/g, '')}]]`)
  }
  if (fields.loopSoundRef?.trim()) {
    body.push(`loop: ![[${fields.loopSoundRef.trim().replace(/^!\[\[|\]\]$/g, '')}]]`)
  }
  if (fields.exitSoundRef?.trim()) {
    body.push(`exit: ![[${fields.exitSoundRef.trim().replace(/^!\[\[|\]\]$/g, '')}]]`)
  }
  return serializeFencedCallout('hyperspace', fields.title?.trim() || undefined, body)
}

export function replaceNthHyperspaceCallout(
  source: string,
  index: number,
  fields: HyperspaceCalloutFields
): string {
  return replaceNthCallout(
    source,
    ['hyperspace', 'jump', 'lightspeed'],
    index,
    serializeHyperspaceCallout(fields)
  )
}

export function parseHyperspaceFields(
  title: string | undefined,
  markdown: string
): HyperspaceCalloutFields {
  return {
    title,
    shipRef: hyperspaceShipRef(markdown),
    planetRef: hyperspacePlanetRef(markdown),
    enterSoundRef: hyperspaceEnterSoundRef(markdown),
    loopSoundRef: hyperspaceLoopSoundRef(markdown),
    exitSoundRef: hyperspaceExitSoundRef(markdown)
  }
}
