import { serializeFencedCallout } from './callouts'

export type CombatFoe = {
  /** Display / wikilink stem (without [[ ]]). */
  name: string
  count: number
}

export type CombatFields = {
  title: string
  includeParty: boolean
  foes: CombatFoe[]
  /** Everything after the Combatants line (telegraph, tables, notes). */
  notes: string
}

function parseCountToken(text: string): { name: string; count: number } {
  const match = /^(.*?)\s*[×x]\s*(\d+)\s*$/.exec(text.trim())
  if (match) return { name: match[1].trim(), count: Math.max(1, Number(match[2]) || 1) }
  return { name: text.trim(), count: 1 }
}

function isStubFoe(name: string): boolean {
  const t = name.replace(/^\[\[|\]\]$/g, '').trim()
  return !t || /^monster name$/i.test(t) || /^npc name$/i.test(t)
}

function foeFromToken(raw: string): CombatFoe | null {
  const token = raw.trim()
  if (!token || /^party$/i.test(token)) return null
  const { name: counted, count } = parseCountToken(token)
  const wiki = /\[\[([^\]\n]+)\]\]/.exec(counted)
  const name = (wiki ? wiki[1].split('|')[0] : counted.replace(/\*+/g, '')).trim()
  if (isStubFoe(name)) return null
  return { name, count }
}

function combatantsLineValue(body: string): string | null {
  for (const line of body.replace(/\r/g, '').split('\n')) {
    if (/^\s*>/.test(line)) continue
    const match = /^\s*(?:\*\*)?Combatants:(?:\*\*)?\s*(.*)$/i.exec(line)
    if (match) return match[1].trim()
  }
  return null
}

function notesAfterCombatants(body: string): string {
  const lines = body.replace(/\r/g, '').split('\n')
  let combatIdx = -1
  for (let i = 0; i < lines.length; i += 1) {
    if (/^\s*(?:\*\*)?Combatants:(?:\*\*)?/i.test(lines[i]!)) {
      combatIdx = i
      break
    }
  }
  if (combatIdx === -1) return body.trim()
  return lines
    .slice(combatIdx + 1)
    .join('\n')
    .replace(/^\n+/, '')
    .trim()
}

export function emptyCombatFields(title = ''): CombatFields {
  return {
    title,
    includeParty: true,
    foes: [],
    notes: ''
  }
}

export function parseCombatFields(title: string | undefined, body: string): CombatFields {
  const roster = combatantsLineValue(body)
  const foes: CombatFoe[] = []
  let includeParty = true
  if (roster != null) {
    includeParty = /\bparty\b/i.test(roster)
    for (const part of roster.split(/\s*·\s*/)) {
      const foe = foeFromToken(part)
      if (!foe) continue
      const existing = foes.find((f) => f.name.toLowerCase() === foe.name.toLowerCase())
      if (existing) existing.count += foe.count
      else foes.push(foe)
    }
  }
  return {
    title: title ?? '',
    includeParty,
    foes,
    notes: notesAfterCombatants(body)
  }
}

export function formatCombatantsLine(fields: CombatFields): string {
  const parts: string[] = []
  for (const foe of fields.foes) {
    const name = foe.name.trim()
    if (!name || isStubFoe(name)) continue
    const count = Math.max(1, foe.count || 1)
    parts.push(count > 1 ? `[[${name}]] ×${count}` : `[[${name}]]`)
  }
  if (fields.includeParty) parts.push('party')
  return `**Combatants:** ${parts.join(' · ') || 'party'}`
}

export function serializeCombatBody(fields: CombatFields): string {
  const line = formatCombatantsLine({
    ...fields,
    // Always keep a Combatants line; default to party if nothing else.
    includeParty: fields.includeParty || fields.foes.length === 0
  })
  const notes = fields.notes.trim()
  return notes ? `${line}\n\n${notes}` : line
}

export function serializeCombatCallout(fields: CombatFields): string {
  return serializeFencedCallout(
    'combat',
    fields.title.trim() || undefined,
    serializeCombatBody(fields).split('\n')
  )
}
