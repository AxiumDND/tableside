import { headingId } from './notes'

export type NoteHeading = {
  id: string
  text: string
  level: number
}

/** H1–H3 headings in a note, used for the Links jump list. */
export function headingsFrom(markdown: string): NoteHeading[] {
  return markdown
    .split('\n')
    .map((line) => {
      const match = /^(#{1,3})\s+(.+)$/.exec(line.trim())
      if (!match) return null
      const text = match[2].replace(/[#*_`]/g, '').trim()
      return {
        id: headingId(text),
        text,
        level: match[1].length
      }
    })
    .filter((heading): heading is NoteHeading => Boolean(heading))
}
