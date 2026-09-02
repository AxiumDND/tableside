/**
 * Web-sheet links stored on Party, NPC, and Bestiary notes.
 *
 * Tableside does not import stats from the remote page. The live page is shown
 * in the note pane when the DM pastes a supported character or monster URL.
 */

const CHARACTER_PATH =
  /^(?:\/profile\/[^/]+)?\/characters\/(\d+)(?:-[a-z0-9-]+)?(?:\/[A-Za-z0-9_-]+)?\/?$/i
const MONSTER_PATH = /^\/(?:homebrew\/)?monsters\/([A-Za-z0-9][A-Za-z0-9_-]*)(?:\/[A-Za-z0-9_-]+)?\/?$/i
const SHEET_FENCE = /\[!(?:pc|npc|monster|creature|bestiary|player|character|infobox)\][^\n]*\n/i

export type WebSheetLink = {
  kind: 'character' | 'monster'
  characterId: string
  canonicalUrl: string
  suggestedName: string
}

export type WebSheetRef = WebSheetLink

export function isWebSheetFactLabel(label: string): boolean {
  const n = label.trim()
  if (/^(?:beyond|web\s*sheet|live\s*sheet|sheet\s*link)$/i.test(n)) return true
  const compact = n.replace(/[\s*]/g, '').toLowerCase()
  return compact === `d&d${'beyond'}` || compact === `dnd${'beyond'}`
}

function titleFromSlug(slug: string): string {
  const words = slug
    .split('-')
    .map((part) => part.trim())
    .filter((part) => part && !/^\d+$/.test(part))
  if (words.length === 0) return ''
  return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

function fromPathname(pathname: string, slug: string): WebSheetLink | null {
  const character = CHARACTER_PATH.exec(pathname)
  if (character) {
    const characterId = character[1]
    return {
      kind: 'character',
      characterId,
      canonicalUrl: `https://www.dndbeyond.com/characters/${characterId}`,
      suggestedName: titleFromSlug(slug)
    }
  }

  const monster = MONSTER_PATH.exec(pathname)
  if (!monster) return null
  const page = monster[1]
  const homebrew = /\/homebrew\/monsters\//i.test(pathname)
  return {
    kind: 'monster',
    characterId: page,
    canonicalUrl: homebrew
      ? `https://www.dndbeyond.com/homebrew/monsters/${page}`
      : `https://www.dndbeyond.com/monsters/${page}`,
    suggestedName: titleFromSlug(page)
  }
}

/**
 * Accept a character URL, monster page, ddb.ac short link, or a bare character id.
 * Rejects anything that is not a supported character or monster page.
 */
export function parseWebSheetUrl(raw: unknown): WebSheetLink | null {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  // Reject control characters that can smuggle payloads into a pasted URL.
  // eslint-disable-next-line no-control-regex
  if (!trimmed || /[\u0000-\u001f\u007f]/.test(trimmed)) return null

  if (/^\d{2,}$/.test(trimmed)) {
    return {
      kind: 'character',
      characterId: trimmed,
      canonicalUrl: `https://www.dndbeyond.com/characters/${trimmed}`,
      suggestedName: ''
    }
  }

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return null
  }

  const protocol = parsed.protocol.toLowerCase()
  if (protocol !== 'http:' && protocol !== 'https:') return null

  const host = parsed.hostname.replace(/^www\./i, '').toLowerCase()
  if (host !== 'dndbeyond.com' && host !== 'ddb.ac') return null

  const slug = parsed.pathname.split('/').pop() ?? ''
  return fromPathname(parsed.pathname.replace(/\/+$/, '') || '/', slug)
}

export function webSheetUrlFromMarkdown(markdown: string): string | null {
  const table = /\|\s*\*\*([^*]+)\*\*\s*\|\s*([^|]+)\|/g
  let match: RegExpExecArray | null
  while ((match = table.exec(markdown))) {
    if (!isWebSheetFactLabel(match[1])) continue
    const parsed = parseWebSheetUrl(match[2].trim())
    if (parsed) return parsed.canonicalUrl
  }

  const bare = /https?:\/\/(?:www\.)?(?:dndbeyond\.com|ddb\.ac)\/[^\s)<>]+/gi
  while ((match = bare.exec(markdown))) {
    const parsed = parseWebSheetUrl(match[0].replace(/[.,;]+$/, ''))
    if (parsed) return parsed.canonicalUrl
  }
  return null
}

/** Insert or replace the web-sheet row on a PC, NPC, or monster sheet. */
export function applyWebSheetUrl(markdown: string, rawUrl: string): string | null {
  const parsed = parseWebSheetUrl(rawUrl)
  if (!parsed) return null
  const row = `| **Web sheet** | ${parsed.canonicalUrl} |`
  const replaced = markdown.replace(/^\|\s*\*\*([^*]+)\*\*\s*\|.*\|$/gim, (line, label: string) =>
    isWebSheetFactLabel(label) ? row : line
  )
  if (replaced !== markdown) return replaced
  if (/^\|[-:| ]+\|\s*$/m.test(markdown)) {
    return markdown.replace(/^(\|[-:| ]+\|\s*)$/m, `$1\n${row}`)
  }
  const fence = SHEET_FENCE.exec(markdown)
  if (fence) {
    const insertAt = (fence.index ?? 0) + fence[0].length
    const block = `\n| | |\n|---|---|\n${row}\n`
    return `${markdown.slice(0, insertAt)}${block}${markdown.slice(insertAt)}`
  }
  return `${markdown.trimEnd()}\n\n| | |\n|---|---|\n${row}\n`
}
