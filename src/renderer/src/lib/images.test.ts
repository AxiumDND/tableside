import { describe, expect, it } from 'vitest'
import { portraitForNote, portraitSrcForNote, srdItemUrl, srdPortraitUrl, srdSchoolUrl, type CampaignImage } from './images'

const images: CampaignImage[] = [
  {
    relativePath: 'Party/Art/Jasper Alderwick.png',
    name: 'Jasper Alderwick.png',
    title: 'Jasper Alderwick'
  },
  {
    relativePath: 'Bestiary/Art/Ghoul.png',
    name: 'Ghoul.png',
    title: 'Ghoul'
  }
]

describe('portraitForNote', () => {
  it('finds a PC portrait after stripping the PC prefix', () => {
    expect(portraitForNote('Party/PC — Jasper Alderwick.md', images)).toBe(
      'Party/Art/Jasper Alderwick.png'
    )
  })

  it('finds a monster portrait by sheet stem', () => {
    expect(portraitForNote('Bestiary/Ghoul.md', images)).toBe('Bestiary/Art/Ghoul.png')
  })
})

describe('srdPortraitUrl', () => {
  it('builds a tabledm URL from the monster name', () => {
    expect(srdPortraitUrl('Dire Wolf')).toBe('tabledm://srd-portrait/?name=Dire%20Wolf')
  })
})

describe('srdItemUrl', () => {
  it('builds a tabledm URL from the item name', () => {
    expect(srdItemUrl('Potion of Healing')).toBe('tabledm://srd-item/?name=Potion%20of%20Healing')
  })
})

describe('srdSchoolUrl', () => {
  it('builds a tabledm URL from the school name', () => {
    expect(srdSchoolUrl('Evocation')).toBe('tabledm://srd-school/?name=Evocation')
  })
})

describe('portraitSrcForNote', () => {
  it('prefers campaign art over the SRD default', () => {
    expect(portraitSrcForNote('Bestiary/Ghoul.md', images)).toBe(
      'tabledm://file/?path=Bestiary%2FArt%2FGhoul.png'
    )
  })

  it('falls back to the bundled SRD portrait for bestiary notes', () => {
    expect(portraitSrcForNote('Bestiary/Owlbear.md', [])).toBe(
      'tabledm://srd-portrait/?name=Owlbear'
    )
  })

  it('falls back to the bundled SRD item art for gear notes', () => {
    expect(portraitSrcForNote('Gear/Weapons/Longsword.md', [])).toBe(
      'tabledm://srd-item/?name=Longsword'
    )
  })

  it('skips bundled SRD fallbacks when hideBundled is set', () => {
    expect(portraitSrcForNote('Bestiary/Owlbear.md', [], undefined, { hideBundled: true })).toBeNull()
    expect(portraitSrcForNote('Gear/Weapons/Longsword.md', [], undefined, { hideBundled: true })).toBeNull()
  })

  it('skips marked bundled campaign portraits when hideBundled is set', () => {
    const markdown = '---\ntablesidePortrait: bundled-srd\n---\n\n# Ghoul\n'
    expect(
      portraitSrcForNote('Bestiary/Ghoul.md', images, undefined, { hideBundled: true, markdown })
    ).toBeNull()
  })
})
