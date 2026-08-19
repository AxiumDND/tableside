import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import spells from '../data/srd/spells.json'

const SCHOOLS = [
  'Abjuration',
  'Conjuration',
  'Divination',
  'Enchantment',
  'Evocation',
  'Illusion',
  'Necromancy',
  'Transmutation'
] as const

function foldStem(name: string): string {
  return name.toLowerCase().replace(/[’‘`]/g, "'").replace(/\s+/g, ' ').replace(/\.[^.]+$/, '').trim()
}

describe('bundled school-of-magic art', () => {
  it('ships a WebP for every SRD spell school', () => {
    const dir = join(process.cwd(), 'resources', 'srd-schools')
    const have = new Set(
      readdirSync(dir)
        .filter((name) => /\.webp$/i.test(name))
        .map(foldStem)
    )
    const used = new Set(spells.map((spell) => String(spell.school ?? '').trim()).filter(Boolean))
    expect([...used].sort()).toEqual([...SCHOOLS].sort())
    const missing = SCHOOLS.filter((school) => !have.has(foldStem(school)))
    expect(missing, `missing school art: ${missing.join(', ')}`).toEqual([])
  })
})
