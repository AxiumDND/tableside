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
