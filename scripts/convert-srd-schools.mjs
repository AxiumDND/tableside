import { existsSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs'
import { basename, extname, join } from 'node:path'
import sharp from 'sharp'

const SCHOOLS = new Set([
  'Abjuration',
  'Conjuration',
  'Divination',
  'Enchantment',
  'Evocation',
  'Illusion',
  'Necromancy',
  'Transmutation'
])

const assets = process.argv[2] ?? 'C:/Users/james/.cursor/projects/c-Users-james-Documents-D-D-gaming/assets'
const dest = process.argv[3] ?? 'resources/srd-schools'
mkdirSync(dest, { recursive: true })

const pngs = readdirSync(assets).filter((name) => {
  if (extname(name).toLowerCase() !== '.png') return false
  return SCHOOLS.has(basename(name, extname(name)))
})

for (const file of pngs) {
  const name = basename(file, extname(file))
  const src = join(assets, file)
  const out = join(dest, `${name}.webp`)
  await sharp(src)
    .rotate()
    .resize({ width: 768, height: 1024, fit: 'cover' })
    .webp({ quality: 80, effort: 4 })
    .toFile(out)
  unlinkSync(src)
  console.log('converted', name)
}

console.log(JSON.stringify({ converted: pngs.length, dest, missing: [...SCHOOLS].filter((name) => !existsSync(join(dest, `${name}.webp`))) }))
