import { describe, expect, it } from 'vitest'
import { isAllowedExternalUrl } from './externalLinks'
import { TABLE_LINK_CATEGORIES } from './tableLinks'

describe('TABLE_LINK_CATEGORIES', () => {
  it('covers the DM-prep categories with safe https URLs and unique ids', () => {
    expect(TABLE_LINK_CATEGORIES.map((category) => category.id)).toEqual([
      'official',
      'maps',
      'art',
      'advice',
      'generators',
      'music',
      'tables'
    ])
    const ids = new Set<string>()
    let linkCount = 0
    for (const category of TABLE_LINK_CATEGORIES) {
      expect(category.title.length).toBeGreaterThan(0)
      expect(category.links.length).toBeGreaterThan(0)
      for (const link of category.links) {
        linkCount += 1
        expect(link.title.length).toBeGreaterThan(0)
        expect(link.blurb.length).toBeGreaterThan(0)
        expect(isAllowedExternalUrl(link.url)).toBe(true)
        expect(ids.has(link.id)).toBe(false)
        ids.add(link.id)
      }
    }
    expect(linkCount).toBeGreaterThanOrEqual(20)
  })

  it('keeps the original starter sites and adds prep coverage', () => {
    const titles = TABLE_LINK_CATEGORIES.flatMap((category) => category.links.map((link) => link.title))
    expect(titles).toEqual(
      expect.arrayContaining([
        'D&D Beyond',
        'Inkarnate',
        'Sly Flourish',
        'Donjon',
        'Fantasy Name Generators',
        'Auto Roll Tables',
        'Open5e',
        'Dungeon Scrawl',
        'Tabletop Audio',
        'Kobold Fight Club',
        'Forgotten Adventures'
      ])
    )
  })
})
