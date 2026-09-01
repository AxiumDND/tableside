import { stripSheetHeader } from '../../../shared/sheetBlock'
import { cleanWikiText, extraItemFacts, isPlaceholderSheetValue, isPlaceholderTagline } from './itemFacts'
import {
  campaignFileUrl,
  IMAGE_EXT,
  portraitSrcForNote,
  resolveImageRef,
  type CampaignImage
} from './images'
import { sheetDisplayName } from './notes'
import { extractFacts, extractTagline } from './statblock'

export type NotePreview = {
  title: string
  tagline: string
  facts: { label: string; value: string }[]
  blurb: string
  imageUrl: string | null
}

const PLACEHOLDER_ART = /^(character name|npc name|monster name|item name|place name|shop name|faction name)(\.[a-z0-9]+)?$/i

export function firstSheetImageRef(markdown: string): string | null {
  const wiki = /!\[\[([^\]\n]+)\]\]/.exec(markdown)
  if (wiki) {
    const raw = wiki[1].split('|')[0].trim()
    const base = (raw.split('/').pop() ?? raw).trim()
    if (!base || PLACEHOLDER_ART.test(base)) return null
    return raw
  }
  const md = /!\[[^\]]*\]\(([^)]+)\)/.exec(markdown)
  if (!md) return null
  const raw = md[1].trim().replace(/^<|>$/g, '')
  if (!raw || /^https?:/i.test(raw) || raw.startsWith('tabledm://')) return raw.startsWith('tabledm://') ? raw : null
  return raw
}

/** Resolve a sheet portrait for hover previews. */
export function notePreviewImageUrl(
  notePath: string,
  markdown: string,
  images: CampaignImage[] = []
): string | null {
  const ref = firstSheetImageRef(markdown)
  if (ref?.startsWith('tabledm://')) return ref
  if (ref) {
    const found = resolveImageRef(ref, notePath, images)
    if (found) return campaignFileUrl(found)
    const file = (ref.split('/').pop() ?? ref).trim()
    const ext = `.${(file.split('.').pop() ?? '').toLowerCase()}`
    if (file && IMAGE_EXT.has(ext)) {
      const folder = notePath.replaceAll('\\', '/').replace(/\/[^/]+$/, '')
      return campaignFileUrl(folder ? `${folder}/Art/${file}` : `Art/${file}`)
    }
  }
  return portraitSrcForNote(notePath, images)
}

function titleFrom(path: string, markdown: string): string {
  const heading = /^#\s+\*?(.+?)\*?\s*$/m.exec(markdown)
  if (heading) {
    const text = heading[1].replace(/\*/g, '').trim()
    if (text && !/!\[\[|\]\]|\.(png|jpe?g|webp|gif|svg)\b/i.test(text)) return text
  }
  return sheetDisplayName(path)
}

function blurbFrom(markdown: string): string {
  const body = stripSheetHeader(markdown)
    .replace(/^#\s+\*?.*$/m, '')
    .replace(/^(?:>\s*)?!?\[\[[^\]]+\]\]\s*$/gm, '')
    .replace(/!\[\[.*?\]\]/g, '')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/^\|.*\|\s*$/gm, '')
    .replace(/^[-| :]+\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  const para = body
    .split(/\n\s*\n/)
    .map((chunk) => chunk.replace(/\s+/g, ' ').trim())
    .find((chunk) => chunk && !/^[-*]\s/.test(chunk) && !/^\*\*/.test(chunk))
  if (!para) return ''
  return para.length > 220 ? `${para.slice(0, 217).trim()}…` : para
}

/** Compact summary of a campaign note for hover previews. */
export function notePreviewFromMarkdown(path: string, markdown: string): NotePreview {
  const title = titleFrom(path, markdown)
  const rawTagline = extractTagline(markdown)
  const tagline = isPlaceholderTagline(rawTagline) ? '' : cleanWikiText(rawTagline)
  const tableFacts = extractFacts(markdown)
    .map((fact) => ({ ...fact, value: cleanWikiText(fact.value) }))
    .filter((fact) => fact.value && !isPlaceholderSheetValue(fact.value))
  const lineFacts = extraItemFacts(markdown)
    .map((fact) => ({ ...fact, value: cleanWikiText(fact.value) }))
    .filter((fact) => fact.value && !isPlaceholderSheetValue(fact.value))
  const facts = [
    ...tableFacts,
    ...lineFacts.filter(
      (fact) => !tableFacts.some((row) => row.label.toLowerCase() === fact.label.toLowerCase())
    )
  ].slice(0, 6)
  return { title, tagline, facts, blurb: blurbFrom(markdown), imageUrl: null }
}
