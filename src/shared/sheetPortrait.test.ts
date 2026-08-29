import { describe, expect, it } from 'vitest'
import { setSheetPortraitEmbed, sheetAcceptsPortrait } from './sheetPortrait'

describe('setSheetPortraitEmbed', () => {
  it('replaces a fenced sheet portrait file', () => {
    const src = `# *Jasper*\n\n[!pc]\n![[Character Name.png]]\n\n### *tagline*\n[!/pc]\n`
    expect(setSheetPortraitEmbed(src, 'Jasper.webp')).toContain('![[Jasper.webp]]')
    expect(setSheetPortraitEmbed(src, 'Jasper.webp')).not.toContain('Character Name.png')
  })

  it('inserts into a sheet header that has no image yet', () => {
    const src = `# NPC\n\n[!npc]\n### *Who*\n[!/npc]\n`
    const out = setSheetPortraitEmbed(src, 'Alenka.webp')
    expect(out).toContain('[!npc]')
    expect(out).toContain('![[Alenka.webp]]')
    expect(out).toContain('[!/npc]')
  })

  it('still updates a legacy quote infobox', () => {
    const src = `# NPC\n\n> [!infobox]+\n> ### Who\n`
    const out = setSheetPortraitEmbed(src, 'Alenka.webp')
    expect(out).toMatch(/!\[\[Alenka\.webp\]\]/)
  })

  it('adds a portrait under the heading when there is no sheet header', () => {
    const src = `# Ghoul\n\n*Hungry.*\n`
    expect(setSheetPortraitEmbed(src, 'Ghoul.webp')).toBe('# Ghoul\n\n![[Ghoul.webp]]\n\n*Hungry.*\n')
  })
})

describe('sheetAcceptsPortrait', () => {
  it('is true for creature, gear, spell, place, shop, and faction sheets', () => {
    expect(sheetAcceptsPortrait('player')).toBe(true)
    expect(sheetAcceptsPortrait('npc')).toBe(true)
    expect(sheetAcceptsPortrait('monster')).toBe(true)
    expect(sheetAcceptsPortrait('gear')).toBe(true)
    expect(sheetAcceptsPortrait('spell')).toBe(true)
    expect(sheetAcceptsPortrait('place')).toBe(true)
    expect(sheetAcceptsPortrait('shop')).toBe(true)
    expect(sheetAcceptsPortrait('faction')).toBe(true)
    expect(sheetAcceptsPortrait('map')).toBe(false)
    expect(sheetAcceptsPortrait('nightsheet')).toBe(false)
  })
})
