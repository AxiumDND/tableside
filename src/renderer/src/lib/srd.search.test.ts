import { describe, expect, it } from 'vitest'
import { searchSrd, srdCounts } from './srd'

describe('searchSrd filters', () => {
  it('lists every monster when the Monsters chip is selected', () => {
    const results = searchSrd('', 'monster')
    expect(results.length).toBe(srdCounts.monsters)
    expect(results.every((record) => record.kind === 'monster')).toBe(true)
  })

  it('lists armor separately from weapons and adventuring gear', () => {
    const names = searchSrd('', 'armor').map((record) => record.name)
    expect(names).toEqual(expect.arrayContaining(['Breastplate', 'Plate Armor', 'Shield']))
    expect(names).not.toContain('Longsword')
    expect(names).not.toContain('Backpack')
  })

  it('lists magic items separately from mundane gear', () => {
    const names = searchSrd('', 'magic').map((record) => record.name)
    expect(names).toEqual(expect.arrayContaining(['Potion of Healing', 'Spell Scroll', 'Ioun Stone']))
    expect(names).not.toContain('Backpack')
    expect(names).not.toContain('Longsword')
  })

  it('keeps the All chip to a short starter list', () => {
    expect(searchSrd('', 'all').length).toBeLessThanOrEqual(12)
  })

  it('lists Axium trade goods on the Trade Goods chip', () => {
    const results = searchSrd('', 'trade')
    const names = results.map((record) => record.name)
    expect(names).toEqual(expect.arrayContaining(['Mead (horn)', 'Hearth Bread (loaf)', 'Small Ale (mug)']))
    expect(names).not.toContain('Votive Candle')
    expect(results.every((record) => record.source === 'axium')).toBe(true)
  })

  it('lists Axium temple goods on the Temple Goods chip', () => {
    const results = searchSrd('', 'temple')
    const names = results.map((record) => record.name)
    expect(names).toEqual(expect.arrayContaining(['Votive Candle', 'Mercy Balm', 'Prayer Beads']))
    expect(names).not.toContain('Mead (horn)')
    expect(results.every((record) => record.source === 'axium')).toBe(true)
  })

  it('lists Axium shop catalogs on their own chips', () => {
    expect(searchSrd('', 'armorer').map((record) => record.name)).toEqual(
      expect.arrayContaining(['Leather Straps (set)', 'Armor Oil (flask)'])
    )
    expect(searchSrd('', 'arms').map((record) => record.name)).toEqual(
      expect.arrayContaining(['Shop Whetstone', 'Bowstring (spare)'])
    )
    expect(searchSrd('', 'stables').map((record) => record.name)).toEqual(
      expect.arrayContaining(['Riding Horse', 'Hay Bale'])
    )
    expect(searchSrd('', 'store').map((record) => record.name)).toEqual(
      expect.arrayContaining(['Tallow Candles (5)', 'Twine Ball'])
    )
    expect(searchSrd('', 'apothecary').map((record) => record.name)).toEqual(
      expect.arrayContaining(['Wound Salve', 'Dried Feverfew'])
    )
    expect(searchSrd('', 'forge').map((record) => record.name)).toEqual(
      expect.arrayContaining(['Nails (20)', 'Charcoal Sack'])
    )
    expect(searchSrd('', 'market').map((record) => record.name)).toEqual(
      expect.arrayContaining(['Lucky Charm', 'Roast Nuts (paper)'])
    )
    expect(searchSrd('', 'armorer').some((record) => record.name === 'Mead (horn)')).toBe(false)
    expect(searchSrd('', 'apothecary').every((record) => record.source === 'axium')).toBe(true)
  })

  it('finds mead by name', () => {
    const hits = searchSrd('mead', 'trade')
    expect(hits.some((record) => record.name === 'Mead (horn)')).toBe(true)
  })

  it('lists each SRD weapon once without object placeholders', () => {
    const results = searchSrd('', 'weapon').filter((record) => record.source === 'srd')
    const names = results.map((record) => record.name.toLowerCase())
    expect(new Set(names).size).toBe(names.length)
    expect(results.some((record) => record.summary.includes('[object Object]'))).toBe(false)
    const greataxe = results.find((record) => record.name === 'Greataxe')
    expect(greataxe?.summary).toMatch(/1d12 Slashing/)
    expect(greataxe?.summary).toMatch(/Heavy/)
  })
})
