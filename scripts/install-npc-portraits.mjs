/**
 * Install generated NPC portraits from the Cursor assets folder into
 * resources/npc-portraits/{race}/{gender}/{01-08}.webp
 *
 * Expects files named: npc-{race}-{feminine|masculine}-{01-08}.png
 * Usage: node scripts/install-npc-portraits.mjs
 */
import { existsSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'

const root = join(process.cwd(), 'resources', 'npc-portraits')
const assets = join(
  process.env.USERPROFILE ?? '',
  '.cursor',
  'projects',
  'c-Users-james-Documents-D-D-gaming',
  'assets'
)

const re = /^npc-([a-z]+)-(feminine|masculine)-(\d{2})\.png$/i

let converted = 0

if (!existsSync(assets)) {
  console.error('Assets folder not found:', assets)
  process.exit(1)
}

for (const name of readdirSync(assets)) {
  const match = re.exec(name)
  if (!match) continue
  const [, race, gender, id] = match
  const destDir = join(root, race, gender)
  mkdirSync(destDir, { recursive: true })
  const dest = join(destDir, `${id}.webp`)
  const svg = join(destDir, `${id}.svg`)
  await sharp(join(assets, name))
    .resize(768, 1024, { fit: 'cover' })
    .webp({ quality: 82 })
    .toFile(dest)
  if (existsSync(svg)) unlinkSync(svg)
  converted += 1
  console.log(`${race}/${gender}/${id}.webp`)
}

console.log(`Installed ${converted} portraits into ${root}`)
if (!converted) {
  console.error('No npc-*-{feminine|masculine}-NN.png files found in', assets)
  process.exit(1)
}
