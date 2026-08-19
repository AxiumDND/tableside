import { describe, expect, it } from 'vitest'
import { setSheetPortraitEmbed, sheetAcceptsPortrait } from './sheetPortrait'

describe('setSheetPortraitEmbed', () => {
  it('replaces the infobox portrait file', () => {
    const src = `# *Jasper*\n\n> [!infobox]+\n> ![[Character Name.png]]\n>\n> ### tagline\n`
    expect(setSheetPortraitEmbed(src, 'Jasper.webp')).toContain('![[Jasper.webp]]')
    expect(setSheetPortraitEmbed(src, 'Jasper.webp')).not.toContain('Character Name.png')
  })

  it('inserts into an infobox that has no image yet', () => {
    const src = `# NPC\n\n> [!infobox]+\n> ### Who\n`
    const out = setSheetPortraitEmbed(src, 'Alenka.webp')
    expect(out).toMatch(/\[!infobox\][^\n]*\n> !\[\[Alenka\.webp\]\]/)
  })

  it('adds a portrait under the heading when there is no infobox', () => {
    const src = `# Ghoul\n\n*Hungry.*\n`
    expect(setSheetPortraitEmbed(src, 'Ghoul.webp')).toBe('# Ghoul\n\n![[Ghoul.webp]]\n\n*Hungry.*\n')
  })
})

describe('sheetAcceptsPortrait', () => {
  it('is true for player, NPC, and monster sheets', () => {
    expect(sheetAcceptsPortrait('player')).toBe(true)
    expect(sheetAcceptsPortrait('npc')).toBe(true)
    expect(sheetAcceptsPortrait('monster')).toBe(true)
    expect(sheetAcceptsPortrait('map')).toBe(false)
  })
})
