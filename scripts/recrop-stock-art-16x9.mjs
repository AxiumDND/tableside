import { mkdir, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import sharp from 'sharp'

const dest = process.argv[2] ?? 'resources/stock-art'
const WIDTH = 1280
const HEIGHT = 720
const out = join(tmpdir(), 'tableside-stock-art-16x9')

await mkdir(out, { recursive: true })
const files = (await readdir(dest)).filter((name) => /\.webp$/i.test(name) && !name.includes('.tmp'))
for (const name of files) {
  const tmp = join(out, name)
  await sharp(join(dest, name))
    .resize({ width: WIDTH, height: HEIGHT, fit: 'cover', position: 'centre' })
    .webp({ quality: 78, effort: 4 })
    .toFile(tmp)
  const info = await sharp(tmp).metadata()
  console.log(`${name} ${info.width}x${info.height}`)
}
console.log(out)
