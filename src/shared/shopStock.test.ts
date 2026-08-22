import { describe, expect, it } from 'vitest'
import { FALLBACK_TEMPLATES, fillTemplate } from './sheetTemplates'
import { SHOP_CATALOGS } from './shopCatalogs'
import {
  applyShopInventory,
  applyShopStock,
  generateShopInventory,
  looksLikeShopNote,
  parseShopStock,
  resolveShopCatalog,
  shopHandPickOffers,
  shopTypeFromMarkdown,
  stripShopStockSection
} from './shopStock'
import { stockArtForTemplate } from './stockArt'

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

describe('shop stock', () => {
  it('has a catalog for every shop-type picture', () => {
    for (const item of stockArtForTemplate('shop')) {
      expect(SHOP_CATALOGS[item.id], item.id).toBeTruthy()
    }
  })

  it('rolls tavern food instead of weapons', () => {
    const inv = generateShopInventory('Tavern', { random: mulberry32(3) })
    expect(inv.type).toBe('Tavern')
    expect(inv.stock.some((row) => /ale/i.test(row.name))).toBe(true)
    expect(inv.stock.some((row) => /bread/i.test(row.name))).toBe(true)
    expect(inv.stock.some((row) => row.link && /ale|bread|stew|mead/i.test(row.name))).toBe(true)
    expect(inv.stock.some((row) => /longsword/i.test(row.name))).toBe(false)
    expect(inv.services.length).toBeGreaterThan(0)
  })

  it('wikilinks SRD weapons and armor', () => {
    const weapons = generateShopInventory('Weapons', { random: mulberry32(8) })
    expect(weapons.stock.some((row) => row.link)).toBe(true)
    const armor = generateShopInventory('Armorer', { random: mulberry32(8) })
    expect(armor.stock.some((row) => /armor|shield/i.test(row.name))).toBe(true)
  })

  it('resolves art ids, aliases, and placeholder types', () => {
    expect(resolveShopCatalog('Stables').id).toBe('Stables')
    expect(resolveShopCatalog('Armor').id).toBe('Armorer')
    expect(resolveShopCatalog('Tavern / armorer / stables', 'The Grey Mare').id).toBe('General Store')
    expect(resolveShopCatalog('Tavern / armorer / stables', 'Stables').id).toBe('Stables')
    expect(resolveShopCatalog('', 'Mystery stall').id).toBe('General Store')
  })

  it('writes Type, Stock, and Services into the shop template', () => {
    const blank = fillTemplate(FALLBACK_TEMPLATES.shop, 'shop', 'The Weary Mare')
    const next = applyShopInventory(blank, generateShopInventory('Tavern', { random: mulberry32(1) }))
    expect(shopTypeFromMarkdown(next)).toBe('Tavern')
    expect(next).toContain('| **Type** | Tavern')
    expect(next).toMatch(/\| \[\[Hearth Bread \(loaf\)\]\] \|/)
    expect(next).toContain('[[Small Ale (mug)]]')
    expect(next).toContain('## Stock')
    expect(next).toContain('## Services')
    expect(next).toContain('[!gmonly]')
    expect(next).not.toContain('[[Item Name]]')
    expect(next).not.toContain('What they sell in one line')
    expect(looksLikeShopNote(next)).toBe(true)
  })

  it('lets you remove a row and add a hand-picked item', () => {
    const blank = fillTemplate(FALLBACK_TEMPLATES.shop, 'shop', 'The Weary Mare')
    const rolled = applyShopInventory(blank, generateShopInventory('Tavern', { random: mulberry32(1) }))
    const stock = parseShopStock(rolled)
    expect(stock.some((row) => row.name === 'Hearth Bread (loaf)')).toBe(true)
    const withoutBread = stock.filter((row) => row.name !== 'Hearth Bread (loaf)')
    const trimmed = applyShopStock(rolled, withoutBread)
    expect(parseShopStock(trimmed).some((row) => row.name === 'Hearth Bread (loaf)')).toBe(false)
    expect(trimmed).toContain('## Services')
    const mead = shopHandPickOffers('Tavern').find((row) => row.name === 'Mead (horn)')
    expect(mead).toBeTruthy()
    const added = applyShopStock(trimmed, [...parseShopStock(trimmed), mead!])
    expect(parseShopStock(added).some((row) => row.name === 'Mead (horn)')).toBe(true)
    expect(stripShopStockSection(added)).not.toContain('## Stock')
    expect(stripShopStockSection(added)).toContain('## Services')
  })

  it('offers type-specific goods when adding stock', () => {
    const armorer = shopHandPickOffers('Armorer')
    expect(armorer.some((row) => row.name === 'Leather Straps (set)')).toBe(true)
    expect(armorer.some((row) => row.name === 'Mead (horn)')).toBe(false)
    const stables = shopHandPickOffers('Stables')
    expect(stables.some((row) => row.name === 'Riding Horse')).toBe(true)
    expect(stables.some((row) => row.name === 'Mead (horn)')).toBe(false)
    const apothecary = shopHandPickOffers('Apothecary')
    expect(apothecary.some((row) => row.name === 'Wound Salve')).toBe(true)
    expect(apothecary.some((row) => row.name === 'Hearth Bread (loaf)')).toBe(false)
  })
})
