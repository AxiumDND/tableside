import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import sharp from 'sharp'

const assets = process.argv[2]
const out = join(tmpdir(), 'tableside-greystead-16x9')
await mkdir(out, { recursive: true })

const names = [
  'The Grey Mare.webp',
  'The Mill.webp',
  'The Ridge Road.webp',
  "Mayor's House.webp",
  'Greystead.webp',
  'Shrine of the Hearth.webp',
  'The Ridge Cave.webp',
  'Pale Well Caves.webp',
  'The Pale Well.webp'
]

for (const name of names) {
  const tmp = join(out, name)
  await sharp(join(assets, name))
    .resize({ width: 1280, height: 720, fit: 'cover', position: 'centre' })
    .webp({ quality: 78, effort: 4 })
    .toFile(tmp)
  const info = await sharp(tmp).metadata()
  console.log(`${name} ${info.width}x${info.height}`)
}
console.log(out)
