import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import monsters from '../data/srd/monsters.json'

function foldPortraitStem(name: string): string {
  return name
    .toLowerCase()
    .replace(/[—–−]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/\.[^.]+$/, '')
    .trim()
}

describe('bundled SRD portraits', () => {
  it('ships an image for every SRD monster', () => {
    const dir = join(process.cwd(), 'resources', 'srd-portraits')
    const files = readdirSync(dir).filter((name) => /\.(png|webp|jpe?g)$/i.test(name))
    const have = new Set(files.map(foldPortraitStem))
    const missing = monsters
      .map((monster) => monster.name)
      .filter((name) => !have.has(foldPortraitStem(name)))
    expect(missing, `missing portraits: ${missing.join(', ')}`).toEqual([])
  })
})
