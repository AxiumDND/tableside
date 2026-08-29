import type { CampaignLibraryFolder } from '../../../shared/campaignLayout'
import { serializeSheetHeader } from '../../../shared/sheetBlock'
import { layoutIdForSource } from '../../../shared/systemPack'
import type { SrdRecord } from './srd'
import { srdMonsterToBestiaryMarkdown } from './srd'

const ITEM_FIELDS = [
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
  'Attunement'
] as const

function fieldValue(data: Record<string, unknown>, key: string): string {
  const value = data[key] ?? data[key.toLowerCase()]
  if (typeof value !== 'string') return ''
  const text = value.trim()
  if (!text || text.includes('[object')) return ''
  return text
}

function pretty(value: string): string {
  if (value === 'action') return 'Action'
  if (value === 'instantaneous') return 'Instantaneous'
  return value
}

function sourceLine(record: SrdRecord): string {
  const label = record.sourceLabel || (record.source === 'srd' ? 'SRD 5.2.1' : '')
  return label ? `\n*From ${label}. Edit this campaign copy.*\n` : ''
}

function sheetHeaderMarkdown(
  kind: 'spell' | 'gear',
  imageFile: string | null,
  tagline: string,
  fields: { label: string; value: string }[]
): string {
  return serializeSheetHeader(kind, {
    imageFile,
    tagline,
    rows: fields
  })
}

function spellMarkdown(record: SrdRecord): string {
  const data = record.data
  const level = Number(data.level ?? 0)
  const school = String(data.school ?? '').trim()
  const classes = Array.isArray(data.classes) ? (data.classes as string[]).join(', ') : ''
  const typeLine =
    level === 0
      ? [school, 'Cantrip', classes ? `(${classes})` : ''].filter(Boolean).join(' ')
      : [`Level ${level}`, school, classes ? `(${classes})` : ''].filter(Boolean).join(' ')
  const casting = pretty(String(data.castingTime || '').trim())
  const range = String(data.range || '').trim()
  const components = String(data.components || '').trim()
  let duration = pretty(String(data.duration || '').trim())
  if (data.concentration && duration && !/concentration/i.test(duration)) {
    duration = `${duration} (Concentration)`
  }
  let castingValue = ''
  if (data.ritual && casting && !/ritual/i.test(casting)) castingValue = `${casting} (Ritual)`
  else if (casting) castingValue = casting
  const lines = [
    `# ${record.name}`,
    '',
    sheetHeaderMarkdown('spell', school ? `${school}.webp` : null, typeLine, [
      { label: 'Casting Time', value: castingValue },
      { label: 'Range', value: range },
      { label: 'Components', value: components },
      { label: 'Duration', value: duration }
    ])
  ]
  const desc = String(data.desc ?? '').trim()
  if (desc) lines.push('', desc)
  const higher = String(data.higherLevel ?? '').trim()
  if (higher) {
    lines.push('', /using a higher-level/i.test(higher) ? higher : `Using a Higher-Level Spell Slot. ${higher}`)
  }
  return `${lines.join('\n')}\n${sourceLine(record)}`
}

function itemMarkdown(record: SrdRecord): string {
  const data = record.data
  const category = fieldValue(data, 'category') || String(data.category ?? '').trim()
  const tagline = category && !category.includes('[object') ? category : ''
  const fields = ITEM_FIELDS.map((label) => ({ label, value: fieldValue(data, label) })).filter((field) => field.value)
  const lines = [
    `# ${record.name}`,
    '',
    sheetHeaderMarkdown('gear', `${record.name}.webp`, tagline, fields)
  ]
  const desc = String(data.desc ?? '').trim()
  if (desc) lines.push('', desc)
  return `${lines.join('\n')}\n${sourceLine(record)}`
}

export function libraryFolderFor(record: SrdRecord): CampaignLibraryFolder | null {
  if (record.kind === 'monster') return 'bestiary'
  if (record.kind === 'spell') return 'spells'
  if (record.kind === 'weapon' || record.kind === 'gear') return 'gear'
  return null
}

export function gearSubfolderFor(record: SrdRecord): string | undefined {
  if (libraryFolderFor(record) !== 'gear') return undefined
  const category = String(record.data.category ?? '').trim()
  const rarity = fieldValue(record.data, 'Rarity')
  const attunement = fieldValue(record.data, 'Attunement')
  const source = record.sourceLabel ?? ''
  if (
    /dmg items/i.test(source) ||
    rarity ||
    attunement ||
    /^(Wondrous Item|Potion|Ring|Rod|Staff|Wand|Scroll)\b/i.test(category)
  ) {
    return 'Magic Items'
  }
  if (record.source === 'axium' || /trade goods|temple goods/i.test(category)) return 'Trade Goods'
  if (record.kind === 'weapon' || /weapon/i.test(category)) return 'Weapons'
  if (/armor|armour/i.test(category) || fieldValue(record.data, 'Armor Class')) return 'Armor'
  return 'Equipment'
}

export function recordToCampaignMarkdown(record: SrdRecord): string {
  if (record.kind === 'monster') return srdMonsterToBestiaryMarkdown(record.data, layoutIdForSource(record.source))
  if (record.kind === 'spell') return spellMarkdown(record)
  return itemMarkdown(record)
}
