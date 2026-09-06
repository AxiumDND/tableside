import { canonicalFolder } from '../../../shared/campaignLayout'
import { allPartyNotes, sheetDisplayName, type CampaignNote } from './notes'
import { glanceStatsFromSheet } from './partyGlance'
import { packLookupRecords } from './systemLookup'

export type QuickPartyRow = {
  name: string
  notePath: string
  ac: string
  saveDc: string
  pp: string
}

export type QuickCondition = {
  id: string
  name: string
  desc: string
}

const CALENDAR_STEM = /calendar|almanac|datebook|date book/i

export function quickPartyRows(notes: CampaignNote[], sheets: Record<string, string>): QuickPartyRow[] {
  return allPartyNotes(notes).map((note) => {
    const stats = glanceStatsFromSheet(sheets[note.relativePath] ?? '')
    return {
      name: sheetDisplayName(note.stem),
      notePath: note.relativePath,
      ac: stats.ac,
      saveDc: stats.saveDc,
      pp: stats.pp
    }
  })
}

export function isReferenceNotePath(path: string): boolean {
  return path
    .replaceAll('\\', '/')
    .split('/')
    .some((part) => canonicalFolder(part) === 'reference')
}

/** Notes the Calendar menu can open: anything in Reference/, or a stem that looks like a calendar. */
export function quickCalendarNotes(notes: CampaignNote[]): CampaignNote[] {
  return notes
    .filter((note) => {
      if (/^(readme|index)$/i.test(note.stem)) return false
      return isReferenceNotePath(note.relativePath) || CALENDAR_STEM.test(note.stem)
    })
    .sort((a, b) => sheetDisplayName(a.stem).localeCompare(sheetDisplayName(b.stem)))
}

export function lookupConditions(system?: string | null): QuickCondition[] {
  return packLookupRecords(system)
    .filter((record) => record.kind === 'condition')
    .map((record) => ({
      id: record.id,
      name: record.name,
      desc: String(record.data.desc ?? record.summary ?? '').trim()
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }))
}

export function filterQuickConditions(list: QuickCondition[], query: string): QuickCondition[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return list
  return list.filter(
    (item) => item.name.toLowerCase().includes(needle) || item.desc.toLowerCase().includes(needle)
  )
}
