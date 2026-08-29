import { afterSheetHeaderIndex } from './sheetBlock'

const STATBLOCK_FENCE = /```statblock\r?\n[\s\S]*?```/i
const COMBAT_HEADING =
  /\n##[^\n]*(?:Combat|Stat block)[^\n]*\n(?:\s*\*\*Combatants:\*\*[^\n]*\n)?(?:\s*>\s*\[!gmonly\][^\n]*\n(?:>[^\n]*\n)*)?\s*$/i

/** Index just after the title and optional sheet header — where the statblock should sit. */
export function sheetPreambleEnd(markdown: string): number {
  const text = markdown.replace(/\r/g, '')
  const lines = text.split('\n')
  const i = afterSheetHeaderIndex(lines)
  const rebuilt = lines.slice(0, i).join('\n')
  if (!markdown.includes('\r\n')) return rebuilt.length
  const nlCount = rebuilt.split('\n').length - 1
  return rebuilt.length + nlCount
}

/** Move the first `statblock` fence to sit under the title/portrait sheet header. */
export function liftStatblockToTop(markdown: string): string {
  const match = STATBLOCK_FENCE.exec(markdown)
  if (!match || match.index == null) return markdown
  const block = match[0].trim()
  let without = `${markdown.slice(0, match.index)}${markdown.slice(match.index + match[0].length)}`
  without = without.replace(COMBAT_HEADING, '\n')
  without = without.replace(/\n\*\*Combatants:\*\*[^\n]*\n/gi, '\n')
  without = without.replace(/\n##[^\n]*(?:Combat|Stat block)[^\n]*\n/gi, '\n')

  const insertAt = sheetPreambleEnd(without)
  const afterPre = without.slice(insertAt).replace(/^\s+/, '')
  if (afterPre.startsWith('```statblock')) {
    return without.replace(/\n{3,}/g, '\n\n')
  }

  const head = without.slice(0, insertAt).replace(/[ \t]+$/g, '').replace(/\n+$/, '')
  const tail = without.slice(insertAt).replace(/^\s+/, '\n\n')
  return `${head}\n\n${block}\n${tail}`.replace(/\n{3,}/g, '\n\n')
}
