import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  STOCK_ART,
  foldStockArtName,
  matchStockArt,
  stockArtForTemplate,
  stockArtUrl
} from './stockArt'

describe('stock place and faction art', () => {
  it('ships a WebP for every catalog entry', () => {
    const dir = join(process.cwd(), 'resources', 'stock-art')
    const have = new Set(
      readdirSync(dir)
        .filter((name) => /\.webp$/i.test(name))
        .map(foldStockArtName)
    )
    const missing = STOCK_ART.filter((item) => !have.has(foldStockArtName(item.id))).map((item) => item.id)
    expect(missing, `missing stock art: ${missing.join(', ')}`).toEqual([])
  })

  it('lists places for shops and factions separately', () => {
    expect(stockArtForTemplate('place').every((item) => item.group === 'place')).toBe(true)
    expect(stockArtForTemplate('shop').map((item) => item.id)).toEqual([
      'Tavern',
      'Armorer',
      'Stables',
      'Weapons',
      'General Store',
      'Apothecary',
      'Forge',
      'Market',
      'Temple'
    ])
    expect(stockArtForTemplate('shop').some((item) => item.id === 'Dungeon')).toBe(false)
    expect(stockArtForTemplate('faction').some((item) => item.id === 'Thieves Guild')).toBe(true)
    expect(stockArtForTemplate('player')).toEqual([])
  })

  it('matches titles and aliases', () => {
    expect(matchStockArt('Tavern', 'place')?.id).toBe('Inn')
    expect(matchStockArt('Tavern', 'shop')?.id).toBe('Tavern')
    expect(matchStockArt('Armor', 'shop')?.id).toBe('Armorer')
    expect(matchStockArt('Stables', 'shop')?.id).toBe('Stables')
    expect(matchStockArt("Thieves' Guild", 'faction')?.id).toBe('Thieves Guild')
    expect(matchStockArt('Dungeon')?.id).toBe('Dungeon')
    expect(matchStockArt('Blue Water Inn', 'place')).toBeNull()
  })

  it('builds a tabledm URL', () => {
    expect(stockArtUrl('Thieves Guild')).toBe('tabledm://stock-art/?name=Thieves%20Guild')
  })
})
