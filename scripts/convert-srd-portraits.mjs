import { copyFileSync, existsSync, readdirSync, unlinkSync } from 'node:fs'
import { basename, extname, join } from 'node:path'
import sharp from 'sharp'

const assets = process.argv[2] ?? 'C:/Users/james/.cursor/projects/c-Users-james-Documents-D-D-gaming/assets'
const dest = process.argv[3] ?? 'resources/srd-portraits'

const pngs = readdirSync(assets).filter((name) => {
  if (extname(name).toLowerCase() !== '.png') return false
  const stem = basename(name, extname(name))
  return !/^c__/i.test(stem) && !/workspaceStorage|image-[a-f0-9-]{8}/i.test(stem)
})

for (const file of pngs) {
  const name = basename(file, extname(file))
  const src = join(assets, file)
  const out = join(dest, `${name}.webp`)
  await sharp(src)
    .rotate()
    .resize({ width: 768, height: 1024, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80, effort: 4 })
    .toFile(out)
  unlinkSync(src)
  const ascii = name.replace(/[’‘]/g, "'")
  if (ascii !== name) {
    const alias = join(dest, `${ascii}.webp`)
    if (!existsSync(alias)) copyFileSync(out, alias)
  }
  console.log('converted', name)
}

console.log(JSON.stringify({ converted: pngs.length, dest }))
