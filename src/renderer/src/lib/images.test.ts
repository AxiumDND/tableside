import { describe, expect, it } from 'vitest'
import { portraitForNote, portraitSrcForNote, srdPortraitUrl, type CampaignImage } from './images'

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
})
