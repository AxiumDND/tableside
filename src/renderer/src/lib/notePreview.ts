import { stripSheetHeader } from '../../../shared/sheetBlock'
import { cleanWikiText, extraItemFacts, isPlaceholderSheetValue, isPlaceholderTagline } from './itemFacts'
import { sheetDisplayName } from './notes'
import { extractFacts, extractTagline } from './statblock'

export type NotePreview = {
  title: string
  tagline: string
  facts: { label: string; value: string }[]
  blurb: string
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
  return { title, tagline, facts, blurb: blurbFrom(markdown) }
}
