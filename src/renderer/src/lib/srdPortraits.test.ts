import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import monsters from '../data/srd/monsters.json'

function foldPortraitStem(name: string): string {
  return name
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
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

  it('ships portraits for the local Ravenloft bestiary when present', async () => {
    const { existsSync, readFileSync } = await import('node:fs')
    const path = join(process.cwd(), 'WOTC', 'Ravenloft Horrors Bestiary.md')
    if (!existsSync(path)) return
    const dir = join(process.cwd(), 'resources', 'srd-portraits')
    const have = new Set(
      readdirSync(dir)
        .filter((name) => /\.(png|webp|jpe?g)$/i.test(name))
        .map(foldPortraitStem)
    )
    const names = [...readFileSync(path, 'utf8').matchAll(/^## (.+)$/gm)].map((match) => match[1].trim())
    const missing = names.filter((name) => !have.has(foldPortraitStem(name)))
    expect(missing, `missing Ravenloft portraits: ${missing.join(', ')}`).toEqual([])
  })

  it('ships portraits for local Monster Manual files when present', async () => {
    const { existsSync, readdirSync: readDir, readFileSync } = await import('node:fs')
    const dir = join(process.cwd(), 'WOTC')
    if (!existsSync(dir)) return
    const files = readDir(dir).filter((name) => /^Monster Manual .+\.md$/i.test(name))
    if (!files.length) return
    const portraits = join(process.cwd(), 'resources', 'srd-portraits')
    const have = new Set(
      readdirSync(portraits)
        .filter((name) => /\.(png|webp|jpe?g)$/i.test(name))
        .map(foldPortraitStem)
    )
    const missing: string[] = []
    for (const file of files) {
      const names = [...readFileSync(join(dir, file), 'utf8').matchAll(/^## (.+)$/gm)].map((match) =>
        match[1].trim()
      )
      missing.push(...names.filter((name) => !have.has(foldPortraitStem(name))))
    }
    expect(missing, `missing Monster Manual portraits: ${missing.join(', ')}`).toEqual([])
  })
})
