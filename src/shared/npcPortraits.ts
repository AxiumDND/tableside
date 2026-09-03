import type { NameStyle } from './npcNames'

/** Bundled quick-create portrait folders under resources/npc-portraits/{race}/{gender}/. */
export const NPC_PORTRAIT_RACES = [
  'human',
  'elf',
  'dwarf',
  'halfling',
  'gnome',
  'goblin',
  'orc',
  'tiefling',
  'dragonborn',
  'leshy',
  'other'
] as const

export type NpcPortraitRace = (typeof NPC_PORTRAIT_RACES)[number]

export type NpcPortraitGender = 'feminine' | 'masculine'

export const NPC_PORTRAIT_PICK_COUNT = 4
export const NPC_PORTRAITS_PER_STYLE = 8

export type NpcPortraitRef = {
  race: string
  gender: NpcPortraitGender
  id: string
}

export function portraitRaceForList(listId: string): string {
  return NPC_PORTRAIT_RACES.includes(listId as NpcPortraitRace) ? listId : 'other'
}

export function resolvePortraitGender(style: NameStyle, rng: () => number = Math.random): NpcPortraitGender {
  if (style === 'feminine') return 'feminine'
  if (style === 'masculine') return 'masculine'
  return rng() < 0.5 ? 'feminine' : 'masculine'
}

export function npcPortraitFileStem(id: string): string {
  const n = Number(id)
  if (Number.isFinite(n) && n >= 1) return String(Math.min(NPC_PORTRAITS_PER_STYLE, Math.max(1, Math.round(n)))).padStart(2, '0')
  const trimmed = id.trim()
  return trimmed || '01'
}

export function npcPortraitUrl(ref: NpcPortraitRef): string {
  const params = new URLSearchParams({
    race: ref.race,
    gender: ref.gender,
    id: npcPortraitFileStem(ref.id)
  })
  return `tabledm://npc-portrait/?${params.toString()}`
}

export function pickNpcPortraitRefs(
  race: string,
  style: NameStyle,
  count = NPC_PORTRAIT_PICK_COUNT,
  exclude: NpcPortraitRef[] = [],
  rng: () => number = Math.random
): NpcPortraitRef[] {
  const bucket = portraitRaceForList(race)
  const excludeKeys = new Set(exclude.map((ref) => `${ref.race}/${ref.gender}/${ref.id}`))
  const genders: NpcPortraitGender[] =
    style === 'feminine' ? ['feminine'] : style === 'masculine' ? ['masculine'] : ['feminine', 'masculine']
  const pool: NpcPortraitRef[] = []
  for (const gender of genders) {
    for (let i = 1; i <= NPC_PORTRAITS_PER_STYLE; i += 1) {
      pool.push({ race: bucket, gender, id: String(i).padStart(2, '0') })
    }
  }
  const shuffled = [...pool]
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = shuffled[i]!
    shuffled[i] = shuffled[j]!
    shuffled[j] = tmp
  }
  const out: NpcPortraitRef[] = []
  for (const ref of shuffled) {
    const key = `${ref.race}/${ref.gender}/${ref.id}`
    if (excludeKeys.has(key) || out.some((item) => `${item.race}/${item.gender}/${item.id}` === key)) continue
    out.push(ref)
    if (out.length >= count) break
  }
  return out
}
