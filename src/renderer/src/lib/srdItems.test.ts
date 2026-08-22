import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import items from '../data/srd/items.json'
import weapons from '../data/srd/weapons.json'

function foldStem(name: string): string {
  return name
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[—–−]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/\.[^.]+$/, '')
    .trim()
}

function uniqueNames(records: { name: string }[]): string[] {
  const seen = new Set<string>()
  const names: string[] = []
  for (const record of records) {
    const folded = foldStem(record.name)
    if (seen.has(folded)) continue
    seen.add(folded)
    names.push(record.name)
  }
  return names
}

describe('bundled SRD item art', () => {
  it('folds curly apostrophes to match ASCII filenames', () => {
    expect(foldStem("Alchemist’s Supplies")).toBe(foldStem("Alchemist's Supplies"))
    expect(foldStem("Thieves’ Tools")).toBe(foldStem("Thieves' Tools"))
    expect(foldStem("Clothes, Traveler’s")).toBe(foldStem("Clothes, Traveler's"))
  })

  it('ships an image for every unique SRD weapon, armor, gear, and magic item', () => {
    const dir = join(process.cwd(), 'resources', 'srd-items')
    const files = readdirSync(dir).filter((name) => /\.(png|webp|jpe?g)$/i.test(name))
    const have = new Set(files.map(foldStem))
    const needed = uniqueNames([...weapons, ...items])
    const missing = needed.filter((name) => !have.has(foldStem(name)))
    expect(missing, `missing item art: ${missing.join(', ')}`).toEqual([])
    expect(
      files.filter((name) => !name.toLowerCase().endsWith('.webp')),
      'item art should be WebP'
    ).toEqual([])
  })
})
