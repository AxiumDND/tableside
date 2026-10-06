import { canonicalFolder } from '../../../shared/campaignLayout'
import { parseSystemId } from '../../../shared/systemPack'
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

export type QuickSkillAbility = 'Str' | 'Dex' | 'Con' | 'Int' | 'Wis' | 'Cha'

export type QuickSkill = {
  id: string
  name: string
  ability: QuickSkillAbility
  usedFor: string
}

/** Standard D&D 5e skills with short original table blurbs (not PHB text). */
export const DND5E_QUICK_SKILLS: readonly QuickSkill[] = [
  {
    id: 'acrobatics',
    name: 'Acrobatics',
    ability: 'Dex',
    usedFor: 'Keep your footing, tumble clear, or stick a landing under pressure.'
  },
  {
    id: 'animal-handling',
    name: 'Animal Handling',
    ability: 'Wis',
    usedFor: 'Calm, read, or guide a beast without spooking it.'
  },
  {
    id: 'arcana',
    name: 'Arcana',
    ability: 'Int',
    usedFor: 'Recall magic lore, symbols, rituals, or planar oddities.'
  },
  {
    id: 'athletics',
    name: 'Athletics',
    ability: 'Str',
    usedFor: 'Climb, jump, swim, shove, or win a grapple contest.'
  },
  {
    id: 'deception',
    name: 'Deception',
    ability: 'Cha',
    usedFor: 'Lie convincingly, bluff, or sell a false story.'
  },
  {
    id: 'history',
    name: 'History',
    ability: 'Int',
    usedFor: 'Recall past events, rulers, wars, or famous sites.'
  },
  {
    id: 'insight',
    name: 'Insight',
    ability: 'Wis',
    usedFor: 'Read motives, spot a tell, or sense when something is off.'
  },
  {
    id: 'intimidation',
    name: 'Intimidation',
    ability: 'Cha',
    usedFor: 'Cow someone with threats, presence, or hard stares.'
  },
  {
    id: 'investigation',
    name: 'Investigation',
    ability: 'Int',
    usedFor: 'Piece together clues, search methodically, or deduce what happened.'
  },
  {
    id: 'medicine',
    name: 'Medicine',
    ability: 'Wis',
    usedFor: 'Stabilize the dying, diagnose injury, or treat a wound in the field.'
  },
  {
    id: 'nature',
    name: 'Nature',
    ability: 'Int',
    usedFor: 'Know plants, weather, terrain, or natural creatures.'
  },
  {
    id: 'perception',
    name: 'Perception',
    ability: 'Wis',
    usedFor: 'Notice a sound, spot a hidden threat, or catch a detail at a glance.'
  },
  {
    id: 'performance',
    name: 'Performance',
    ability: 'Cha',
    usedFor: 'Entertain a crowd, act a part, or hold attention with art.'
  },
  {
    id: 'persuasion',
    name: 'Persuasion',
    ability: 'Cha',
    usedFor: 'Negotiate, appeal to reason, or win someone over in good faith.'
  },
  {
    id: 'religion',
    name: 'Religion',
    ability: 'Int',
    usedFor: 'Recall gods, rites, holy symbols, or cult practices.'
  },
  {
    id: 'sleight-of-hand',
    name: 'Sleight of Hand',
    ability: 'Dex',
    usedFor: 'Pick a pocket, plant an item, or hide something in plain sight.'
  },
  {
    id: 'stealth',
    name: 'Stealth',
    ability: 'Dex',
    usedFor: 'Sneak, hide, or slip past notice without being seen or heard.'
  },
  {
    id: 'survival',
    name: 'Survival',
    ability: 'Wis',
    usedFor: 'Track, forage, navigate wilds, or judge outdoor hazards.'
  }
] as const

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

/** D&D 5e skill glance list; empty for other system packs. */
export function lookupSkills(system?: string | null): QuickSkill[] {
  if (parseSystemId(system) !== 'dnd5e') return []
  return [...DND5E_QUICK_SKILLS]
}

export function filterQuickSkills(list: QuickSkill[], query: string): QuickSkill[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return list
  return list.filter(
    (item) =>
      item.name.toLowerCase().includes(needle) ||
      item.ability.toLowerCase().includes(needle) ||
      item.usedFor.toLowerCase().includes(needle)
  )
}
