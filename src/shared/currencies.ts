/** Campaign coin denominations used by Treasure blocks and game settings. */

export interface CampaignCurrency {
  /** Stable id within the campaign (slug). */
  id: string
  /** Display name in settings, e.g. Platinum. */
  label: string
  /** Short form in treasure lines, e.g. pp. */
  abbr: string
}

/** Classic D&D stack — platinum through copper. */
export const DEFAULT_CURRENCIES: readonly CampaignCurrency[] = [
  { id: 'platinum', label: 'Platinum', abbr: 'pp' },
  { id: 'gold', label: 'Gold', abbr: 'gp' },
  { id: 'silver', label: 'Silver', abbr: 'sp' },
  { id: 'copper', label: 'Copper', abbr: 'cp' }
]

function slugify(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Normalize stored or UI currency lists; falls back to defaults when empty/invalid. */
export function normalizeCurrencies(raw: unknown): CampaignCurrency[] {
  if (!Array.isArray(raw) || raw.length === 0) return [...DEFAULT_CURRENCIES]
  const seen = new Set<string>()
  const out: CampaignCurrency[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    const label = typeof row.label === 'string' ? row.label.trim() : ''
    const abbrRaw = typeof row.abbr === 'string' ? row.abbr.trim() : ''
    const idRaw = typeof row.id === 'string' ? row.id.trim() : ''
    if (!label && !abbrRaw) continue
    const abbr = (abbrRaw || label.slice(0, 2)).toLowerCase().replace(/\s+/g, '')
    let id = slugify(idRaw || label || abbr)
    if (!id) continue
    if (seen.has(id)) {
      let n = 2
      while (seen.has(`${id}-${n}`)) n += 1
      id = `${id}-${n}`
    }
    seen.add(id)
    out.push({ id, label: label || abbr.toUpperCase(), abbr: abbr || id.slice(0, 2) })
  }
  return out.length > 0 ? out : [...DEFAULT_CURRENCIES]
}

/** Coin line for a new treasure block body, e.g. `**Coin:** … pp · … gp · … sp · … cp`. */
export function formatTreasureCoinLine(currencies: CampaignCurrency[] = [...DEFAULT_CURRENCIES]): string {
  const list = currencies.length > 0 ? currencies : [...DEFAULT_CURRENCIES]
  return `**Coin:** ${list.map((c) => `… ${c.abbr}`).join(' · ')}`
}

/** Full default body lines for a treasure callout. */
export function treasureBlockBodyLines(currencies?: CampaignCurrency[]): string[] {
  const list = currencies && currencies.length > 0 ? currencies : [...DEFAULT_CURRENCIES]
  return [
    formatTreasureCoinLine(list),
    '**Mundane:**',
    '**Magic:**',
    '**Hidden:**',
    '**Notes:**'
  ]
}
