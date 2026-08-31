import {
  bestiaryNotes,
  foldName,
  npcNotes,
  sheetDisplayName,
  type CampaignNote
} from './notes'
import { searchSrd, type SrdRecord } from './srd'

export type CombatantHitKind = 'npc' | 'monster'

export type CombatantHit = {
  id: string
  name: string
  summary: string
  kind: CombatantHitKind
  /** Present for SRD/book monsters that may need ensuring into Bestiary. */
  record?: SrdRecord
  notePath?: string
}

/** Lower is better. Exact name beats prefix beats contains; campaign notes break ties. */
export function combatantHitRank(hit: CombatantHit, query: string): number {
  const q = foldName(query)
  if (!q) return hit.notePath ? 0 : 1
  const name = foldName(hit.name)
  let rank = 50
  if (name === q) rank = 0
  else if (name.startsWith(q)) rank = 10
  else if (name.split(/\s+/).some((word) => word.startsWith(q))) rank = 20
  else if (name.includes(q)) rank = 30
  else rank = 40
  if (!hit.notePath) rank += 1
  return rank
}

export function searchCombatants(query: string, notes: CampaignNote[]): CombatantHit[] {
  const q = query.trim().toLowerCase()
  const npcs = npcNotes(notes)
  const bestiary = bestiaryNotes(notes)

  const noteHits: CombatantHit[] = []
  for (const note of [...npcs, ...bestiary]) {
    const name = sheetDisplayName(note.stem)
    if (q && !name.toLowerCase().includes(q) && !foldName(name).includes(foldName(q))) continue
    const kind: CombatantHitKind = bestiary.some((b) => b.relativePath === note.relativePath)
      ? 'monster'
      : 'npc'
    noteHits.push({
      id: `note:${note.relativePath}`,
      name,
      summary: note.relativePath.replaceAll('\\', '/'),
      kind,
      notePath: note.relativePath
    })
  }

  const recordHits: CombatantHit[] = []
  const srdOrder = new Map<string, number>()
  if (q) {
    let order = 0
    for (const record of searchSrd(query, 'monster')) {
      const key = foldName(record.name)
      if (!srdOrder.has(key)) srdOrder.set(key, order)
      order += 1
      recordHits.push({
        id: `srd:${record.id}`,
        name: record.name,
        summary: record.summary || record.sourceLabel || 'Monster',
        kind: 'monster',
        record
      })
    }
  }

  const byName = new Map<string, CombatantHit>()
  for (const hit of [...noteHits, ...recordHits]) {
    const key = foldName(hit.name)
    const existing = byName.get(key)
    if (!existing) {
      byName.set(key, hit)
      continue
    }
    if (existing.notePath && hit.record) {
      byName.set(key, {
        ...existing,
        record: hit.record,
        summary: existing.summary || hit.summary
      })
      continue
    }
    if (!existing.notePath && hit.notePath) {
      byName.set(key, { ...hit, record: existing.record ?? hit.record })
    }
  }

  const out = [...byName.values()]
  out.sort((a, b) => {
    const rankDiff = combatantHitRank(a, query) - combatantHitRank(b, query)
    if (rankDiff !== 0) return rankDiff
    const aOrder = srdOrder.get(foldName(a.name)) ?? 9999
    const bOrder = srdOrder.get(foldName(b.name)) ?? 9999
    if (aOrder !== bOrder) return aOrder - bOrder
    return a.name.localeCompare(b.name, 'en', { sensitivity: 'base' })
  })
  return out.slice(0, 60)
}
