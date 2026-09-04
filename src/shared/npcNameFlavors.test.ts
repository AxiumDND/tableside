import { describe, expect, it } from 'vitest'
import {
  NAME_FLAVOR_LISTS,
  NAME_FLAVOR_OPTIONS,
  isNameFlavorId,
  nameListForFlavor,
  systemSupportsNameFlavors
} from './npcNameFlavors'
import { npcNameCatalog, pickNpcNames, nameCombinations, listHasStyleSplits } from './npcNames'

describe('npcNameFlavors', () => {
  it('lists the planned flavor options', () => {
    expect(NAME_FLAVOR_OPTIONS.map((o) => o.id)).toEqual([
      'classic',
      'norse',
      'greek',
      'celtic',
      'roman',
      'arabic',
      'slavic',
      'east-asian'
    ])
  })

  it('keeps classic on the race list and swaps pools for other flavors', () => {
    const elf = npcNameCatalog('dnd5e').lists.find((list) => list.id === 'elf')!
    expect(nameListForFlavor(elf, 'classic')).toBe(elf)
    const norse = nameListForFlavor(elf, 'norse')
    expect(norse.id).toBe('norse')
    expect(norse.givenMasculine).toContain('Bjorn')
    expect(listHasStyleSplits(norse)).toBe(true)
  })

  it('rolls flavor names without depending on race givens', () => {
    const human = npcNameCatalog('dnd5e').lists.find((list) => list.id === 'human')!
    const greek = nameListForFlavor(human, 'greek')
    const pool = nameCombinations(greek, 'feminine')
    expect(pool.some((name) => name.startsWith('Callista'))).toBe(true)
    expect(pickNpcNames(greek, 3, 'any').length).toBe(3)
  })

  it('ships a list for every non-classic flavor', () => {
    for (const option of NAME_FLAVOR_OPTIONS) {
      if (option.id === 'classic') continue
      const list = NAME_FLAVOR_LISTS[option.id]
      expect(list.family?.length ?? 0).toBeGreaterThan(0)
      expect(
        list.givenAny.length + (list.givenFeminine?.length ?? 0) + (list.givenMasculine?.length ?? 0)
      ).toBeGreaterThan(5)
    }
  })

  it('supports flavors on 5e/PF2e only', () => {
    expect(systemSupportsNameFlavors('dnd5e')).toBe(true)
    expect(systemSupportsNameFlavors('pf2e')).toBe(true)
    expect(systemSupportsNameFlavors('v5')).toBe(false)
    expect(isNameFlavorId('norse')).toBe(true)
    expect(isNameFlavorId('klingon')).toBe(false)
  })
})
