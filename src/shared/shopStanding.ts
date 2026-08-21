export type ShopStanding = 'liked' | 'neutral' | 'hated'

export const SHOP_STANDINGS: {
  id: ShopStanding
  label: string
  rate: number
  blurb: string
}[] = [
  { id: 'liked', label: 'Liked', rate: 0.8, blurb: '20% off list' },
  { id: 'neutral', label: 'Neutral', rate: 1, blurb: 'list price' },
  { id: 'hated', label: 'Hated', rate: 1.5, blurb: 'half again' }
]

const COPPER: Record<string, number> = { pp: 1000, gp: 100, ep: 50, sp: 10, cp: 1 }

export function standingMeta(id: ShopStanding) {
  return SHOP_STANDINGS.find((row) => row.id === id) ?? SHOP_STANDINGS[1]
}

export function parseShopStanding(markdown: string): ShopStanding {
  const row = /\|\s*\*\*Standing\*\*\s*\|\s*([^|]+)\|/i.exec(markdown)
  const value = row?.[1]?.trim() ?? ''
  if (!value || /liked\s*\/\s*neutral/i.test(value)) return 'neutral'
  if (/hate|hostil|unfriend|ban(?:ned)?|barred|enemy/i.test(value)) return 'hated'
  if (/like|friend|favour|favor|welcome|loved|favou?red/i.test(value)) return 'liked'
  return 'neutral'
}

export function applyShopStanding(markdown: string, standing: ShopStanding): string {
  const label = standingMeta(standing).label
  if (/\|\s*\*\*Standing\*\*\s*\|/i.test(markdown)) {
    return markdown.replace(/(\|\s*\*\*Standing\*\*\s*\|\s*)([^|]*)(\|)/i, `$1${label} $3`)
  }
  for (const field of ['Attitude', 'Type']) {
    const re = new RegExp(`^([ \\t>]*)\\|\\s*\\*\\*${field}\\*\\*\\s*\\|[^|\\n]*\\|[^\\n]*\\r?\\n`, 'im')
    const hit = re.exec(markdown)
    if (hit) {
      return markdown.replace(hit[0], `${hit[0]}${hit[1]}| **Standing** | ${label} |\n`)
    }
  }
  return markdown
}

export function parseCopper(text: string): number | null {
  const folded = text.trim().toLowerCase().replace(/,/g, '')
  if (!folded || folded === '—' || folded === '-' || folded === 'ask') return null
  let total = 0
  let matched = false
  const re = /(\d+(?:\.\d+)?)\s*(pp|gp|ep|sp|cp)\b/g
  let match: RegExpExecArray | null
  while ((match = re.exec(folded))) {
    matched = true
    total += Number(match[1]) * (COPPER[match[2]] ?? 0)
  }
  return matched ? total : null
}

export function formatCopper(cp: number): string {
  const whole = Math.max(0, Math.round(cp))
  if (whole <= 0) return '1 cp'
  const gp = Math.floor(whole / 100)
  const rest = whole % 100
  const sp = Math.floor(rest / 10)
  const copper = rest % 10
  const parts: string[] = []
  if (gp) parts.push(`${gp.toLocaleString('en-US')} gp`)
  if (sp) parts.push(`${sp} sp`)
  if (copper) parts.push(`${copper} cp`)
  return parts.join(' ')
}

export function adjustPrice(text: string, standing: ShopStanding): string {
  const copper = parseCopper(text)
  if (copper == null) return text
  const rate = standingMeta(standing).rate
  if (rate === 1) return text.trim()
  return formatCopper(copper * rate)
}
