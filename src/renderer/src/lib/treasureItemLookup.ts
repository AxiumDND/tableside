import { pathHasFolder } from '../../../shared/campaignLayout'
import { gearSubfolderFor } from './lookupNotes'
import { foldName, type CampaignNote } from './notes'
import { searchSrd, type SrdRecord } from './srd'

export type TreasureItemHit = {
  id: string
  name: string
  summary: string
  magic: boolean
  /** Present when the hit comes from (or is backed by) an SRD/book record. */
  record?: SrdRecord
  /** Present when a campaign Gear note already exists. */
  notePath?: string
}

/** True when a campaign note path lives under a Magic Items gear section. */
export function isMagicGearPath(relativePath: string): boolean {
  const parts = relativePath.replaceAll('\\', '/').split('/')
  return parts.some((part) => {
    const folded = part
      .toLowerCase()
      .replace(/['’]/g, '')
      .replace(/&/g, 'and')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    return folded === 'magic items' || folded === 'magic item'
  })
}

export function isMagicTreasureRecord(record: SrdRecord): boolean {
  return gearSubfolderFor(record) === 'Magic Items'
}

export function gearNotesFromIndex(notes: CampaignNote[]): CampaignNote[] {
  return notes.filter((note) => pathHasFolder(note.relativePath, 'gear'))
}

function attunementHint(record: SrdRecord): string {
  const raw = String(record.data.Attunement ?? record.data.attunement ?? '').trim()
  if (!raw) return ''
  if (/^no\b/i.test(raw)) return ''
  if (/^yes\b/i.test(raw) || /^requires?\b/i.test(raw)) return '(attunement)'
  return `(${raw})`
}

/** Line to append into Mundane or Magic lists. */
export function treasureItemLine(hit: TreasureItemHit): string {
  const link = `[[${hit.name}]]`
  if (!hit.magic || !hit.record) return link
  const hint = attunementHint(hit.record)
  return hint ? `${link} ${hint}` : link
}

/** Lower is better. Exact name beats prefix beats contains; campaign notes break ties. */
export function treasureHitRank(hit: TreasureItemHit, query: string): number {
  const q = foldName(query)
  if (!q) return hit.notePath ? 0 : 1
  const name = foldName(hit.name)
  let rank = 50
  if (name === q) rank = 0
  else if (name.startsWith(q)) rank = 10
  else if (name.split(/\s+/).some((word) => word.startsWith(q))) rank = 20
  else if (name.includes(q)) rank = 30
  else rank = 40
  // Prefer an existing Gear note over a pure lookup hit at the same match quality.
  if (!hit.notePath) rank += 1
  return rank
}

export function searchTreasureItems(query: string, gearNotes: CampaignNote[]): TreasureItemHit[] {
  const q = query.trim().toLowerCase()
  const gear = gearNotesFromIndex(gearNotes)

  const noteHits: TreasureItemHit[] = []
  for (const note of gear) {
    const name = note.stem
    if (q && !name.toLowerCase().includes(q) && !foldName(name).includes(foldName(q))) continue
    noteHits.push({
      id: `note:${note.relativePath}`,
      name,
      summary: note.relativePath.replaceAll('\\', '/'),
      magic: isMagicGearPath(note.relativePath),
      notePath: note.relativePath
    })
  }

  const recordHits: TreasureItemHit[] = []
  // Preserve MiniSearch order as a fallback when names are equally relevant.
  const srdOrder = new Map<string, number>()
  if (q) {
    let order = 0
    for (const record of searchSrd(query, 'all')) {
      if (record.kind !== 'weapon' && record.kind !== 'gear') continue
      const key = foldName(record.name)
      if (!srdOrder.has(key)) srdOrder.set(key, order)
      order += 1
      recordHits.push({
        id: `srd:${record.id}`,
        name: record.name,
        summary: record.summary || record.sourceLabel || '',
        magic: isMagicTreasureRecord(record),
        record
      })
    }
  }

  const byName = new Map<string, TreasureItemHit>()
  // Prefer campaign notes when names collide with SRD/book.
  for (const hit of [...noteHits, ...recordHits]) {
    const key = foldName(hit.name)
    const existing = byName.get(key)
    if (!existing) {
      byName.set(key, hit)
      continue
    }
    if (existing.notePath && hit.record) {
      byName.set(key, { ...existing, record: hit.record, summary: existing.summary || hit.summary })
      continue
    }
    if (!existing.notePath && hit.notePath) {
      byName.set(key, { ...hit, record: existing.record ?? hit.record })
    }
  }

  const out = [...byName.values()]
  out.sort((a, b) => {
    const rankDiff = treasureHitRank(a, query) - treasureHitRank(b, query)
    if (rankDiff !== 0) return rankDiff
    const aOrder = srdOrder.get(foldName(a.name)) ?? 9999
    const bOrder = srdOrder.get(foldName(b.name)) ?? 9999
    if (aOrder !== bOrder) return aOrder - bOrder
    return a.name.localeCompare(b.name, 'en', { sensitivity: 'base' })
  })
  return out.slice(0, 60)
}
