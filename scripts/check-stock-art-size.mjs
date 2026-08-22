import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'

const dir = process.argv[2] ?? 'resources/stock-art'
const files = (await readdir(dir)).filter((name) => /\.webp$/i.test(name) && !name.includes('.tmp'))
const bad = []
for (const name of files) {
  const info = await sharp(join(dir, name)).metadata()
  const ratio = (info.width ?? 0) / (info.height ?? 1)
  const ok = Math.abs(ratio - 16 / 9) < 0.03
  console.log(`${ok ? 'ok' : 'BAD'} ${name} ${info.width}x${info.height} ${ratio.toFixed(3)}`)
  if (!ok) bad.push(name)
}
if (bad.length) {
  console.error(`not 16:9: ${bad.join(', ')}`)
  process.exitCode = 1
} else {
  console.log(`${files.length} files are 16:9`)
}
