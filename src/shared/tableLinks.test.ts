import { describe, expect, it } from 'vitest'
import { isAllowedExternalUrl } from './externalLinks'
import { TABLE_LINK_CATEGORIES } from './tableLinks'

describe('TABLE_LINK_CATEGORIES', () => {
  it('lists every curated link under a category with safe https URLs', () => {
    expect(TABLE_LINK_CATEGORIES.length).toBeGreaterThanOrEqual(4)
    for (const category of TABLE_LINK_CATEGORIES) {
      expect(category.title.length).toBeGreaterThan(0)
      expect(category.links.length).toBeGreaterThan(0)
      for (const link of category.links) {
        expect(link.title.length).toBeGreaterThan(0)
        expect(link.blurb.length).toBeGreaterThan(0)
        expect(isAllowedExternalUrl(link.url)).toBe(true)
      }
    }
  })

  it('includes the starter set of GM sites', () => {
    const titles = TABLE_LINK_CATEGORIES.flatMap((category) => category.links.map((link) => link.title))
    expect(titles).toEqual(
      expect.arrayContaining([
        'D&D Beyond',
        'Inkarnate',
        'Sly Flourish',
        'Donjon',
        'Fantasy Name Generators',
        'Auto Roll Tables'
      ])
    )
  })
})
