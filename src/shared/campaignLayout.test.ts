import { describe, expect, it } from 'vitest'
import {
  folderMatchesCanonical,
  folderOrderIndex,
  folderRevealsOpenFile,
  folderUsesArt,
  gearSectionIndex,
  campaignTreeGroup,
  artFolderRelativePath,
  isArtFolderName,
  isGearFolderName,
  adjacentCampaignFile
} from './campaignLayout'
import type { CampaignTreeNode } from './types'

describe('gear folders', () => {
  it('treats a root Equipment or Magic Items folder as Gear', () => {
    expect(isGearFolderName('Gear')).toBe(true)
    expect(isGearFolderName('Equipment')).toBe(true)
    expect(isGearFolderName('Magic Items')).toBe(true)
    expect(folderMatchesCanonical('Equipment', 'gear')).toBe(true)
    expect(isGearFolderName('Weapons')).toBe(false)
  })

  it('orders Gear subsections Weapons, Armor, Equipment, Trade Goods, Magic Items', () => {
    const names = ['Magic Items', 'Weapons', 'Art', 'Trade Goods', 'Equipment', 'Armor']
    names.sort((a, b) => {
      const ga = gearSectionIndex(a)
      const gb = gearSectionIndex(b)
      if (ga !== gb) return ga - gb
      return a.localeCompare(b)
    })
    expect(names).toEqual(['Weapons', 'Armor', 'Equipment', 'Trade Goods', 'Magic Items', 'Art'])
  })

  it('keeps top-level Gear in the standard folder order', () => {
    expect(folderOrderIndex('Gear')).toBeLessThan(folderOrderIndex('Maps'))
    expect(folderOrderIndex('Weapons')).toBe(99)
  })
})

describe('Art folders', () => {
  it('recognizes Art by name', () => {
    expect(isArtFolderName('Art')).toBe(true)
    expect(isArtFolderName('art')).toBe(true)
    expect(isArtFolderName('Bestiary')).toBe(false)
  })

  it('does not auto-reveal Art even when the open file is inside it', () => {
    expect(folderRevealsOpenFile('Bestiary', 'Bestiary', 'Bestiary/Ghoul.md')).toBe(true)
    expect(folderRevealsOpenFile('Bestiary/Art', 'Art', 'Bestiary/Art/Ghoul.webp')).toBe(false)
    expect(folderRevealsOpenFile('Bestiary', 'Bestiary', 'Bestiary/Art/Ghoul.webp')).toBe(true)
  })

  it('resolves the Art sidecar for a notes folder', () => {
    expect(artFolderRelativePath('Bestiary')).toBe('Bestiary/Art')
    expect(artFolderRelativePath('Bestiary/Art')).toBe('Bestiary/Art')
    expect(artFolderRelativePath('Gear/Weapons')).toBe('Gear/Weapons/Art')
    expect(artFolderRelativePath('')).toBe('Art')
  })

  it('offers Add art on sheet folders and Art, not Gear root or Maps/Print', () => {
    expect(folderUsesArt('Bestiary')).toBe(true)
    expect(folderUsesArt('Bestiary/Art')).toBe(true)
    expect(folderUsesArt('Spells')).toBe(true)
    expect(folderUsesArt('Places')).toBe(true)
    expect(folderUsesArt('Locations')).toBe(true)
    expect(folderUsesArt('Factions')).toBe(true)
    expect(folderUsesArt('Gear/Weapons')).toBe(true)
    expect(folderUsesArt('Gear')).toBe(false)
    expect(folderUsesArt('Maps/Print')).toBe(false)
    expect(folderUsesArt('Templates')).toBe(false)
  })

  it('treats Locations / World as Places', () => {
    expect(folderMatchesCanonical('Places', 'places')).toBe(true)
    expect(folderMatchesCanonical('Locations', 'places')).toBe(true)
    expect(folderMatchesCanonical('World', 'places')).toBe(true)
    expect(folderOrderIndex('Places')).toBeLessThan(folderOrderIndex('Maps'))
    expect(folderOrderIndex('Factions')).toBeLessThan(folderOrderIndex('Maps'))
  })

  it('sorts notes before Art folders', () => {
    const names = ['Art', 'Ghoul.md', 'NPCs']
    const types: Array<'dir' | 'file'> = ['dir', 'file', 'dir']
    const order = names
      .map((name, i) => ({ name, type: types[i] }))
      .sort(
        (a, b) =>
          campaignTreeGroup(a.type, a.name) - campaignTreeGroup(b.type, b.name) ||
          a.name.localeCompare(b.name)
      )
      .map((node) => node.name)
    expect(order).toEqual(['NPCs', 'Ghoul.md', 'Art'])
  })
})

describe('adjacentCampaignFile', () => {
  const tree: CampaignTreeNode[] = [
    {
      name: 'Bestiary',
      relativePath: 'Bestiary',
      type: 'dir',
      children: [
        {
          name: 'Art',
          relativePath: 'Bestiary/Art',
          type: 'dir',
          children: [
            { name: 'Dire Wolf.webp', relativePath: 'Bestiary/Art/Dire Wolf.webp', type: 'file', ext: '.webp' }
          ]
        },
        { name: 'Dire Wolf.md', relativePath: 'Bestiary/Dire Wolf.md', type: 'file', ext: '.md' },
        { name: 'Ghoul.md', relativePath: 'Bestiary/Ghoul.md', type: 'file', ext: '.md' }
      ]
    }
  ]

  it('moves to the next file in the same folder', () => {
    expect(adjacentCampaignFile(tree, 'Bestiary/Dire Wolf.md', 1)?.relativePath).toBe('Bestiary/Ghoul.md')
  })

  it('does not walk into Art or wrap past the last file', () => {
    expect(adjacentCampaignFile(tree, 'Bestiary/Ghoul.md', 1)).toBeNull()
    expect(adjacentCampaignFile(tree, 'Bestiary/Dire Wolf.md', -1)).toBeNull()
  })
})
