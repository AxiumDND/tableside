import { describe, expect, it } from 'vitest'
import {
  APOTHECARY_GOODS,
  ARMORER_GOODS,
  AXIUM_GOODS,
  FORGE_GOODS,
  MARKET_GOODS,
  STABLE_GOODS,
  STORE_GOODS,
  TEMPLE_GOODS,
  TRADE_GOODS,
  WEAPON_GOODS,
  axiumCategory,
  goodsForShopType,
  tradeGoodByName
} from './tradeGoods'
import { SHOP_CATALOGS } from './shopCatalogs'

describe('Axium trade goods', () => {
  it('has unique names and ids', () => {
    const names = AXIUM_GOODS.map((item) => item.name)
    const ids = AXIUM_GOODS.map((item) => item.id)
    expect(new Set(names).size).toBe(names.length)
    expect(new Set(ids).size).toBe(ids.length)
    expect(TRADE_GOODS.length).toBeGreaterThan(0)
    expect(TEMPLE_GOODS.length).toBeGreaterThan(0)
    expect(ARMORER_GOODS.length).toBeGreaterThan(0)
    expect(WEAPON_GOODS.length).toBeGreaterThan(0)
    expect(STABLE_GOODS.length).toBeGreaterThan(0)
    expect(STORE_GOODS.length).toBeGreaterThan(0)
    expect(APOTHECARY_GOODS.length).toBeGreaterThan(0)
    expect(FORGE_GOODS.length).toBeGreaterThan(0)
    expect(MARKET_GOODS.length).toBeGreaterThan(0)
  })

  it('prices mead above small ale and bread cheap', () => {
    expect(tradeGoodByName('Small Ale (mug)')?.price).toBe('4 cp')
    expect(tradeGoodByName('Hearth Bread (loaf)')?.price).toBe('2 cp')
    expect(tradeGoodByName('Mead (horn)')?.price).toBe('8 cp')
    expect(tradeGoodByName('Hard Cheese (wedge)')?.price).toBe('1 sp')
  })

  it('uses only catalog names on the tavern board', () => {
    const tavern = SHOP_CATALOGS.Tavern
    for (const row of [...(tavern.always ?? []), ...tavern.stock]) {
      if (!row.link) continue
      if (row.name === 'Rations (1 day)') continue
      expect(tradeGoodByName(row.name), row.name).toBeTruthy()
    }
  })

  it('stocks temple goods and priced hospice work', () => {
    expect(tradeGoodByName('Mercy Balm')?.price).toBe('2 gp')
    expect(tradeGoodByName('Votive Candle')?.group).toBe('Offering')
    const temple = SHOP_CATALOGS.Temple
    expect(temple.services.some((line) => /wash and bind/i.test(line))).toBe(true)
    for (const row of [...(temple.always ?? []), ...temple.stock]) {
      if (!row.link) continue
      if (/holy water|healer's kit|potion of healing|antitoxin/i.test(row.name)) continue
      expect(tradeGoodByName(row.name), row.name).toBeTruthy()
    }
  })

  it('gives each remaining shop type its own goods, not tavern food', () => {
    expect(tradeGoodByName('Leather Straps (set)')?.price).toBe('5 sp')
    expect(tradeGoodByName('Shop Whetstone')?.price).toBe('1 sp')
    expect(tradeGoodByName('Riding Horse')?.price).toBe('75 gp')
    expect(tradeGoodByName('Wound Salve')?.price).toBe('2 gp')
    expect(tradeGoodByName('Nails (20)')?.price).toBe('5 sp')
    expect(tradeGoodByName('Lucky Charm')?.price).toBe('5 sp')
    expect(axiumCategory('Fitting')).toBe('Armorer Goods')
    expect(axiumCategory('Herb')).toBe('Apothecary Goods')
    expect(goodsForShopType('Armorer').some((item) => item.name === 'Mead (horn)')).toBe(false)
    expect(goodsForShopType('Armorer').some((item) => item.name === 'Leather Straps (set)')).toBe(true)
    expect(goodsForShopType('Apothecary').some((item) => item.name === 'Wound Salve')).toBe(true)
    expect(goodsForShopType('Stables').some((item) => item.name === 'Riding Horse')).toBe(true)
    expect(goodsForShopType('Market').some((item) => item.name === 'Lucky Charm')).toBe(true)
    expect(goodsForShopType('Market').some((item) => item.name === 'Hearth Bread (loaf)')).toBe(true)
  })

  it('links Axium goods on every shop board', () => {
    for (const catalog of Object.values(SHOP_CATALOGS)) {
      for (const row of [...(catalog.always ?? []), ...catalog.stock]) {
        if (!row.link) continue
        if (tradeGoodByName(row.name)) continue
        expect(row.link, `${catalog.id}:${row.name}`).toBe(true)
      }
      expect(catalog.services.some((line) => /\d+\s*(cp|sp|gp)|half the list|haggle|credit/i.test(line))).toBe(
        true
      )
    }
  })
})
