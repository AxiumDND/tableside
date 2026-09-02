/**
 * D&D Beyond character-sheet links stored on Party notes.
 *
 * Tableside does not import stats from Beyond. The live sheet is the official
 * web page, opened in a browser from the Party folder or the PC sheet.
 */

const CHARACTER_PATH =
  /^(?:\/profile\/[^/]+)?\/characters\/(\d+)(?:-[a-z0-9-]+)?(?:\/[A-Za-z0-9_-]+)?\/?$/i

export type DndBeyondCharacter = {
  characterId: string
  canonicalUrl: string
  suggestedName: string
}

export function isDndBeyondFactLabel(label: string): boolean {
  return /^(?:d\s*&\s*d\s*beyond|dnd\s*beyond|beyond)$/i.test(label.trim())
}

function titleFromSlug(slug: string): string {
  const words = slug
    .split('-')
    .map((part) => part.trim())
    .filter((part) => part && !/^\d+$/.test(part))
  if (words.length === 0) return ''
  return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

function fromPathname(pathname: string, slug: string): DndBeyondCharacter | null {
  const match = CHARACTER_PATH.exec(pathname)
  if (!match) return null
  const characterId = match[1]
  return {
    characterId,
    canonicalUrl: `https://www.dndbeyond.com/characters/${characterId}`,
    suggestedName: titleFromSlug(slug)
  }
}

/**
 * Accept a character URL, a ddb.ac short link, or a bare character id.
 * Rejects anything that is not a D&D Beyond character sheet.
 */
export function parseDndBeyondCharacterUrl(raw: unknown): DndBeyondCharacter | null {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  // Reject control characters that can smuggle payloads into a pasted URL.
  // eslint-disable-next-line no-control-regex
  if (!trimmed || /[\u0000-\u001f\u007f]/.test(trimmed)) return null

  if (/^\d{2,}$/.test(trimmed)) {
    return {
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

export function dndBeyondUrlFromMarkdown(markdown: string): string | null {
  const table = /\|\s*\*\*([^*]+)\*\*\s*\|\s*([^|]+)\|/g
  let match: RegExpExecArray | null
  while ((match = table.exec(markdown))) {
    if (!isDndBeyondFactLabel(match[1])) continue
    const parsed = parseDndBeyondCharacterUrl(match[2].trim())
    if (parsed) return parsed.canonicalUrl
  }

  const bare = /https?:\/\/(?:www\.)?(?:dndbeyond\.com|ddb\.ac)\/[^\s)<>]+/gi
  while ((match = bare.exec(markdown))) {
    const parsed = parseDndBeyondCharacterUrl(match[0].replace(/[.,;]+$/, ''))
    if (parsed) return parsed.canonicalUrl
  }
  return null
}

const BEYOND_ROW = /^\|\s*\*\*(?:D\s*&\s*D\s*Beyond|Dnd\s*Beyond|Beyond)\*\*\s*\|.*\|$/im

/** Insert or replace the D&D Beyond row in a `[!pc]` infobox table. */
export function applyDndBeyondUrl(markdown: string, rawUrl: string): string | null {
  const parsed = parseDndBeyondCharacterUrl(rawUrl)
  if (!parsed) return null
  const row = `| **D&D Beyond** | ${parsed.canonicalUrl} |`
  if (BEYOND_ROW.test(markdown)) {
    return markdown.replace(BEYOND_ROW, row)
  }
  if (/^\|[-:| ]+\|\s*$/m.test(markdown)) {
    return markdown.replace(/^(\|[-:| ]+\|\s*)$/m, `$1\n${row}`)
  }
  const fence = /\[!pc\][^\n]*\n/i.exec(markdown)
  if (fence) {
    const insertAt = (fence.index ?? 0) + fence[0].length
    const block = `\n| | |\n|---|---|\n${row}\n`
    return `${markdown.slice(0, insertAt)}${block}${markdown.slice(insertAt)}`
  }
  return `${markdown.trimEnd()}\n\n| | |\n|---|---|\n${row}\n`
}
