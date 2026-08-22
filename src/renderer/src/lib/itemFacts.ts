export const ITEM_FIELD_LABELS = [
  'Damage',
  'Properties',
  'Mastery',
  'Armor Class',
  'Strength',
  'Stealth',
  'Don',
  'Ability',
  'Utilize',
  'Craft',
  'Variants',
  'Type',
  'Weight',
  'Cost',
  'Carrying Capacity',
  'Rarity',
  'Attunement',
  'Casting Time',
  'Range',
  'Components',
  'Duration'
]

const PLACEHOLDER_VALUES = new Set([
  'settlement / site / wilderness / dungeon',
  'tavern / armorer / stables / weapons / store / apothecary',
  'inn / stall / forge / temple',
  'guild / church / house / cult',
  'wary / helpful / greedy',
  'liked / neutral / hated',
  'unknown / friendly / hostile',
  'patron / informant / obstacle',
  'pressure / boss / minion',
  'faction name',
  'map name',
  'npc name',
  'place name',
  'shop name',
  'item name',
  'character name'
])

export function cleanWikiText(value: string): string {
  return value.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_all, name: string, alias?: string) => alias || name).trim()
}

export function isPlaceholderSheetValue(value: string): boolean {
  const cleaned = cleanWikiText(value)
  if (!cleaned) return true
  return PLACEHOLDER_VALUES.has(cleaned.toLowerCase())
}

export function isPlaceholderTagline(value: string): boolean {
  const folded = value.trim().toLowerCase()
  if (!folded) return true
  return /what this .+ is in one line|what they (sell|want) in one line|one-line tagline/.test(folded)
}

export function extraItemFacts(markdown: string): { label: string; value: string }[] {
  const facts: { label: string; value: string }[] = []
  const seen = new Set<string>()
  const pattern = new RegExp(
    `(?:^|\\s)(${ITEM_FIELD_LABELS.join('|')}):\\s*([^\\n]+?)(?=\\s+(?:${ITEM_FIELD_LABELS.join('|')}):|\\s*$)`,
    'gi'
  )
  let match: RegExpExecArray | null
  while ((match = pattern.exec(markdown.replace(/\r/g, '')))) {
    const label = match[1].replace(/\b\w/g, (c) => c.toUpperCase())
    const value = match[2].trim()
    if (!value || seen.has(label)) continue
    seen.add(label)
    facts.push({ label, value })
  }
  return facts
}
