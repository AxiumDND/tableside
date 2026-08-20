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
