import { describe, expect, it } from 'vitest'
import { FALLBACK_TEMPLATES, fillTemplate } from './sheetTemplates'
import { applyShopInventory, generateShopInventory } from './shopStock'
import {
  adjustPrice,
  applyShopStanding,
  formatCopper,
  parseCopper,
  parseShopStanding
} from './shopStanding'

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

describe('shop standing prices', () => {
  it('parses mixed coin strings', () => {
    expect(parseCopper('10 gp')).toBe(1000)
    expect(parseCopper('1,500 gp')).toBe(150000)
    expect(parseCopper('4 cp')).toBe(4)
    expect(parseCopper('7 sp 5 cp')).toBe(75)
    expect(parseCopper('—')).toBeNull()
    expect(parseCopper('Ask')).toBeNull()
  })

  it('formats copper back to table coin', () => {
    expect(formatCopper(1000)).toBe('10 gp')
    expect(formatCopper(80)).toBe('8 sp')
    expect(formatCopper(75)).toBe('7 sp 5 cp')
    expect(formatCopper(150000)).toBe('1,500 gp')
  })

  it('cuts list when they are liked and marks it up when hated', () => {
    expect(adjustPrice('10 gp', 'liked')).toBe('8 gp')
    expect(adjustPrice('1 gp', 'liked')).toBe('8 sp')
    expect(adjustPrice('5 sp', 'hated')).toBe('7 sp 5 cp')
    expect(adjustPrice('10 gp', 'neutral')).toBe('10 gp')
    expect(adjustPrice('—', 'hated')).toBe('—')
  })

  it('reads and writes Standing on a shop note', () => {
    const blank = fillTemplate(FALLBACK_TEMPLATES.shop, 'shop', 'The Weary Mare')
    expect(parseShopStanding(blank)).toBe('neutral')
    const liked = applyShopStanding(blank, 'liked')
    expect(liked).toMatch(/\|\s*\*\*Standing\*\*\s*\|\s*Liked\s*\|/)
    expect(parseShopStanding(liked)).toBe('liked')
    const hated = applyShopStanding(liked, 'hated')
    expect(parseShopStanding(hated)).toBe('hated')
    expect(hated.match(/\*\*Standing\*\*/g)?.length).toBe(1)
  })

  it('inserts Standing on older shops and keeps it through a reroll', () => {
    const old = fillTemplate(FALLBACK_TEMPLATES.shop, 'shop', 'The Weary Mare').replace(
      /^> \| \*\*Standing\*\*.*\r?\n/m,
      ''
    )
    expect(parseShopStanding(old)).toBe('neutral')
    const withField = applyShopStanding(old, 'hated')
    expect(withField).toMatch(/\|\s*\*\*Standing\*\*\s*\|\s*Hated\s*\|/)
    const rolled = applyShopInventory(withField, generateShopInventory('Tavern', { random: mulberry32(2) }))
    expect(parseShopStanding(rolled)).toBe('hated')
  })
})
