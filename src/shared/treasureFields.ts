import {
  DEFAULT_CURRENCIES,
  normalizeCurrencies,
  type CampaignCurrency
} from './currencies'
import { serializeFencedCallout } from './callouts'

export type TreasureFields = {
  title: string
  /** Amount keyed by currency abbr (lowercase). */
  coins: Record<string, string>
  mundane: string[]
  magic: string[]
  hidden: string
  notes: string
}

function emptyCoins(currencies: CampaignCurrency[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const c of currencies) out[c.abbr.toLowerCase()] = ''
  return out
}

export function emptyTreasureFields(
  currencies: CampaignCurrency[] = [...DEFAULT_CURRENCIES],
  title = ''
): TreasureFields {
  return {
    title,
    coins: emptyCoins(normalizeCurrencies(currencies)),
    mundane: [],
    magic: [],
    hidden: '',
    notes: ''
  }
}

function isPlaceholderItem(value: string): boolean {
  const t = value.trim()
  if (!t || /^(?:…|\.\.\.)$/.test(t)) return true
  // Accidental section headers that leaked into item lists.
  if (/^\*\*[A-Za-z][^*]*:\*\*$/.test(t)) return true
  // Default treasure template stubs — hide in edit/read lists.
  if (/^\[\[Item Name\]\]$/i.test(t) || /^Item Name$/i.test(t)) return true
  if (/^\[\[Magic Item\]\](?:\s*\([^)]*\))?(?:\s*[—–-].*)?$/i.test(t)) return true
  return false
}

function splitItems(raw: string): string[] {
  const trimmed = raw.trim()
  if (!trimmed) return []

  const mergeLinkContinuations = (lines: string[]): string[] => {
    const out: string[] = []
    for (const line of lines) {
      const cleaned = line.replace(/^\s*[-*]\s+/, '').trim()
      if (!cleaned || isPlaceholderItem(cleaned)) continue
      // Wiki/markdown link broken across lines: `[Name]` then `(#note:…)`
      if (out.length > 0 && /^\(/.test(cleaned) && /\[[^\]]+\]\s*$/.test(out[out.length - 1]!)) {
        out[out.length - 1] = `${out[out.length - 1]}${cleaned}`
        continue
      }
      out.push(cleaned)
    }
    // Restore after rejoin so split `[Name]` / `(#note:…)` becomes `[[Name]]`.
    return out.map(restoreTreasureWikilinks).filter((item) => !isPlaceholderItem(item))
  }

  if (/^[-*]\s+/m.test(trimmed) || trimmed.includes('\n')) {
    return mergeLinkContinuations(trimmed.split('\n'))
  }

  return trimmed
    .split(/\s*·\s*/)
    .map((part) => restoreTreasureWikilinks(part.trim()))
    .filter((part) => part && !isPlaceholderItem(part))
}

/** Turn prepared `[Label](#note:…)` links back into `[[Label]]` for editing. */
export function restoreTreasureWikilinks(text: string): string {
  return text.replace(/\[([^\]]+)\]\(#note:[^)]+\)/g, '[[$1]]')
}

function parseLabeledSection(body: string, label: string): string {
  // Match labels only at line start so a leaked `- **Magic:**` item cannot open a section.
  // Use [ \t]* (not \s*) after the label so an empty section does not swallow the
  // newline before the next `**Label:**` and pull that header into the value.
  const re = new RegExp(
    `(?:^|\\n)[ \\t]*\\*\\*${label}:\\*\\*[ \\t]*([\\s\\S]*?)(?=\\n[ \\t]*\\*\\*[A-Za-z][^*]*:\\*\\*|$)`,
    'i'
  )
  const match = re.exec(body)
  return match?.[1]?.trim() ?? ''
}

/** Parse coin amounts like `12 pp · 40 gp · … sp` into abbr → amount. */
export function parseCoinLine(
  line: string,
  currencies: CampaignCurrency[] = [...DEFAULT_CURRENCIES]
): Record<string, string> {
  const coins = emptyCoins(normalizeCurrencies(currencies))
  const abbrs = Object.keys(coins)
  if (abbrs.length === 0) return coins
  const escaped = abbrs.map((a) => a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
  const tokenRe = new RegExp(`(?:(\\d+(?:[.,]\\d+)?)|…|\\.\\.\\.)\\s*(${escaped})\\b`, 'gi')
  let match: RegExpExecArray | null
  while ((match = tokenRe.exec(line)) !== null) {
    const amount = match[1] ?? ''
    const abbr = match[2]!.toLowerCase()
    if (abbr in coins) coins[abbr] = amount === '…' || amount === '...' ? '' : amount
  }
  return coins
}

function isPlaceholderHidden(value: string): boolean {
  const t = value.replace(/\s+/g, ' ').trim()
  if (!t || /^(?:…|\.\.\.)$/.test(t)) return true
  // Default template text from new treasure blocks.
  if (/^perception\s*\/\s*investigation\s*dc\s*(?:…|\.\.\.)?$/i.test(t)) return true
  if (/^(?:perception|investigation)\s*dc\s*(?:…|\.\.\.)$/i.test(t)) return true
  return false
}

export function parseTreasureFields(
  title: string | undefined,
  body: string,
  currencies?: CampaignCurrency[]
): TreasureFields {
  const list = normalizeCurrencies(currencies)
  const source = restoreTreasureWikilinks(body)
  const coinRaw = parseLabeledSection(source, 'Coin')
  const mundaneRaw = parseLabeledSection(source, 'Mundane')
  const magicRaw = parseLabeledSection(source, 'Magic')
  const hiddenRaw = parseLabeledSection(source, 'Hidden')
  const notesRaw = parseLabeledSection(source, 'Notes')
  const hidden = hiddenRaw.replace(/\n+/g, ' ').trim()
  return {
    title: title ?? '',
    coins: parseCoinLine(coinRaw || source, list),
    mundane: splitItems(mundaneRaw),
    magic: splitItems(magicRaw),
    hidden: isPlaceholderHidden(hidden) ? '' : hidden,
    notes: notesRaw.trim()
  }
}

function formatCoinLine(coins: Record<string, string>, currencies: CampaignCurrency[]): string {
  const list = normalizeCurrencies(currencies)
  return `**Coin:** ${list
    .map((c) => {
      const amount = (coins[c.abbr.toLowerCase()] ?? '').trim()
      return `${amount || '…'} ${c.abbr}`
    })
    .join(' · ')}`
}

function formatItemSection(label: string, items: string[]): string {
  const clean = items.map((item) => item.trim()).filter(Boolean)
  if (clean.length === 0) return `**${label}:**`
  return [`**${label}:**`, ...clean.map((item) => `- ${item}`)].join('\n')
}

export function serializeTreasureBody(
  fields: TreasureFields,
  currencies?: CampaignCurrency[]
): string {
  const list = normalizeCurrencies(currencies)
  const lines = [
    formatCoinLine(fields.coins, list),
    formatItemSection('Mundane', fields.mundane),
    formatItemSection('Magic', fields.magic),
    `**Hidden:** ${fields.hidden.trim()}`,
    fields.notes.trim() ? `**Notes:**\n${fields.notes.trim()}` : '**Notes:**'
  ]
  return lines.join('\n')
}

export function serializeTreasureCallout(
  fields: TreasureFields,
  currencies?: CampaignCurrency[]
): string {
  return serializeFencedCallout(
    'treasure',
    fields.title.trim() || undefined,
    serializeTreasureBody(fields, currencies).split('\n')
  )
}
