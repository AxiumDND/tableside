import { describe, expect, it } from 'vitest'
import {
  applyNpcSpecies,
  givenNamesFor,
  npcNameCatalog,
  pickNpcNames,
  nameCombinations
} from './npcNames'

function seqRng(values: number[]): () => number {
  let i = 0
  return () => {
    const value = values[i] ?? 0
    i += 1
    return value
  }
}

describe('npcNameCatalog', () => {
  it('labels the picker by system pack', () => {
    expect(npcNameCatalog('dnd5e').pickerLabel).toBe('Race')
    expect(npcNameCatalog('pf2e').pickerLabel).toBe('Ancestry')
    expect(npcNameCatalog('v5').pickerLabel).toBe('Name tradition')
  })

  it('includes Leshy on Pathfinder nights and name traditions on Vampire nights', () => {
    expect(npcNameCatalog('pf2e').lists.some((list) => list.id === 'leshy')).toBe(true)
    expect(npcNameCatalog('v5').lists.some((list) => list.id === 'english')).toBe(true)
    expect(npcNameCatalog('dnd5e').lists.map((list) => list.id)).toContain('dragonborn')
  })
})

describe('pickNpcNames', () => {
  const catalog = npcNameCatalog('dnd5e')
  const elf = catalog.lists.find((list) => list.id === 'elf')!

  it('returns the requested count', () => {
    expect(pickNpcNames(elf, 5, 'any').length).toBe(5)
  })

  it('does not repeat until the combination pool is exhausted', () => {
    const pool = nameCombinations(elf, 'any')
    const rolled = pickNpcNames(elf, pool.length, 'any', seqRng(pool.map(() => 0)))
    expect(new Set(rolled).size).toBe(pool.length)
  })

  it('uses the feminine given list when asked', () => {
    const feminine = givenNamesFor(elf, 'feminine')
    const rolled = pickNpcNames(elf, 8, 'feminine', seqRng([0, 0, 0, 0, 0, 0, 0, 0]))
    expect(rolled.every((name) => feminine.some((given) => name.startsWith(given)))).toBe(true)
  })
})

describe('applyNpcSpecies', () => {
  it('fills an existing Species row', () => {
    const next = applyNpcSpecies('| **Role** | Guide |\n| **Species** |  |\n', 'Elf')
    expect(next).toContain('| **Species** | Elf |')
  })

  it('inserts Species after Role when the row is missing', () => {
    const next = applyNpcSpecies('| **Role** | Guide |\n| **Faction** | None |\n', 'Dwarf')
    expect(next).toContain('| **Role** | Guide |\n| **Species** | Dwarf |')
  })
})
