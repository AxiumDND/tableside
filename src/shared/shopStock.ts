import { SHOP_CATALOGS, type ShopCatalog, type ShopStockOffer } from './shopCatalogs'
import { matchStockArt } from './stockArt'
import { goodsForShopType, tradeGoodByName } from './tradeGoods'

export type ShopInventory = {
  type: string
  tagline: string
  stock: ShopStockOffer[]
  services: string[]
}

export type ShopRollOptions = {
  random?: () => number
}

const PLACEHOLDER_TYPE = /\/|\binn \/ stall\b|\btavern \/ armorer\b/i

export function looksLikeShopNote(markdown: string): boolean {
  if (/\|\s*\*\*Proprietor\*\*/i.test(markdown) || /^## Stock\b/im.test(markdown)) return true
  return shopTypeFromMarkdown(markdown) != null
}

export function shopTypeFromMarkdown(markdown: string): string | null {
  const row = /\|\s*\*\*Type\*\*\s*\|\s*([^|]+)\|/i.exec(markdown)
  const value = row?.[1]?.trim() ?? ''
  if (!value || PLACEHOLDER_TYPE.test(value)) return null
  return value
}

export function resolveShopCatalog(value: string, fallbackTitle = ''): ShopCatalog {
  const direct = catalogFromName(value)
  if (direct) return direct
  const fromTitle = catalogFromName(fallbackTitle)
  if (fromTitle) return fromTitle
  return SHOP_CATALOGS['General Store']
}

function catalogFromName(value: string): ShopCatalog | null {
  const folded = value.trim()
  if (!folded || PLACEHOLDER_TYPE.test(folded)) return null
  if (SHOP_CATALOGS[folded]) return SHOP_CATALOGS[folded]
  const hit = matchStockArt(folded, 'shop')
  if (hit && SHOP_CATALOGS[hit.id]) return SHOP_CATALOGS[hit.id]
  const titleHit = Object.values(SHOP_CATALOGS).find(
    (catalog) => catalog.title.toLowerCase() === folded.toLowerCase()
  )
  return titleHit ?? null
}

function randomInt(random: () => number, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1))
}

function pickWeighted(pool: ShopStockOffer[], count: number, random: () => number): ShopStockOffer[] {
  const remaining = [...pool]
  const out: ShopStockOffer[] = []
  for (let i = 0; i < count && remaining.length > 0; i += 1) {
    const total = remaining.reduce((sum, row) => sum + (row.weight ?? 1), 0)
    let roll = random() * total
    let index = remaining.length - 1
    for (let j = 0; j < remaining.length; j += 1) {
      roll -= remaining[j].weight ?? 1
      if (roll <= 0) {
        index = j
        break
      }
    }
    out.push(remaining[index])
    remaining.splice(index, 1)
  }
  return out
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const next = [...items]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

function uniqueOffers(rows: ShopStockOffer[]): ShopStockOffer[] {
  const seen = new Set<string>()
  const out: ShopStockOffer[] = []
  for (const row of rows) {
    const key = row.name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(row)
  }
  return out
}

export function generateShopInventory(type: string, options: ShopRollOptions = {}): ShopInventory {
  const random = options.random ?? Math.random
  const catalog = resolveShopCatalog(type)
  const extraCount = randomInt(random, catalog.pick.min, catalog.pick.max)
  const stock = uniqueOffers([...(catalog.always ?? []), ...pickWeighted(catalog.stock, extraCount, random)])
  const serviceCount = Math.min(catalog.services.length, randomInt(random, 2, 3))
  const services = shuffle(catalog.services, random).slice(0, serviceCount)
  return { type: catalog.title, tagline: catalog.tagline, stock, services }
}

function cell(value: string): string {
  return value.replace(/\|/g, '\\|')
}

function stockItemCell(row: ShopStockOffer): string {
  return row.link ? `[[${row.name}]]` : cell(row.name)
}

export function shopStockTable(stock: ShopStockOffer[]): string {
  const lines = ['| Item | Price | Notes |', '|---|---|---|']
  for (const row of stock) {
    lines.push(`| ${stockItemCell(row)} | ${cell(row.price)} | ${cell(row.notes ?? '')} |`)
  }
  return lines.join('\n')
}

export function shopServicesList(services: string[]): string {
  return services.map((line) => `- ${line}`).join('\n')
}

function replaceHeadingSection(markdown: string, heading: string, body: string): string {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(
    `^## ${escaped}[^\\n]*\\r?\\n(?:(?!\\r?\\n## |\\r?\\n>\\s*\\[!)[\\s\\S])*`,
    'm'
  )
  const block = `## ${heading}\n\n${body.trim()}\n`
  if (re.test(markdown)) return markdown.replace(re, block)
  return `${markdown.trimEnd()}\n\n${block}`
}

export function setShopTypeFields(markdown: string, catalog: ShopCatalog, replaceTagline = false): string {
  let body = markdown.replace(/(\|\s*\*\*Type\*\*\s*\|\s*)([^|]*)(\|)/i, `$1${catalog.title} $3`)
  if (replaceTagline) {
    body = body.replace(/^>\s*###\s+\*.+\*\s*$/m, `> ### *${catalog.tagline}*`)
  }
  return body
}

function shouldReplaceTagline(markdown: string, catalog: ShopCatalog): boolean {
  const heading = /^>\s*###\s+\*(.+)\*\s*$/m.exec(markdown)
  if (!heading) return false
  const text = heading[1].trim()
  if (/what they sell in one line/i.test(text)) return true
  return Object.values(SHOP_CATALOGS).some((item) => item.tagline === text) || text === catalog.tagline
}

export function applyShopInventory(markdown: string, inventory: ShopInventory): string {
  const catalog = resolveShopCatalog(inventory.type)
  let body = setShopTypeFields(markdown, catalog, shouldReplaceTagline(markdown, catalog))
  body = replaceHeadingSection(body, 'Stock', shopStockTable(inventory.stock))
  body = replaceHeadingSection(body, 'Services', shopServicesList(inventory.services))
  return body.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n'
}

function parseTableRow(line: string): string[] | null {
  const trimmed = line.trim()
  if (!trimmed.startsWith('|')) return null
  const inner = trimmed.replace(/^\|/, '').replace(/\|$/, '')
  return inner.split(/(?<!\\)\|/).map((cell) => cell.trim().replace(/\\\|/g, '|'))
}

export function parseShopStock(markdown: string): ShopStockOffer[] {
  const match = markdown.match(/^## Stock[^\n]*\r?\n((?:(?!\r?\n## |\r?\n>\s*\[!)[\s\S])*)/m)
  if (!match) return []
  const rows: ShopStockOffer[] = []
  for (const line of match[1].split('\n')) {
    const cells = parseTableRow(line)
    if (!cells || cells.length < 2) continue
    const item = cells[0]
    if (!item || /^item$/i.test(item) || /^:?-+:?$/.test(item.replace(/\s/g, ''))) continue
    const wiki = /^\[\[([^\]|]+)(?:\|[^\]]+)?\]\]$/.exec(item)
    const name = (wiki?.[1] ?? item).trim()
    if (!name) continue
    rows.push({
      name,
      price: cells[1]?.trim() ?? '',
      notes: cells[2]?.trim() ?? '',
      link: Boolean(wiki) || Boolean(tradeGoodByName(name))
    })
  }
  return rows
}

export function applyShopStock(markdown: string, stock: ShopStockOffer[]): string {
  return replaceHeadingSection(markdown, 'Stock', shopStockTable(stock)).replace(/\n{3,}/g, '\n\n').trimEnd() + '\n'
}

export function stripShopStockSection(markdown: string): string {
  return markdown
    .replace(/^## Stock[^\n]*\r?\n(?:(?!\r?\n## |\r?\n>\s*\[!)[\s\S])*/m, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function shopHandPickOffers(type: string): ShopStockOffer[] {
  const catalog = resolveShopCatalog(type)
  const fromShop = uniqueOffers([...(catalog.always ?? []), ...catalog.stock])
  const extras = goodsForShopType(catalog.title).map((item) => ({
    name: item.name,
    price: item.price,
    link: true,
    weight: item.rarity
  }))
  return uniqueOffers([...fromShop, ...extras])
}
