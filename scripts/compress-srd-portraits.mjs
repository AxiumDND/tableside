/**
 * One-off: convert bundled SRD portraits PNG → WebP.
 * Requires: npm install --no-save sharp
 *
 * Usage: node scripts/compress-srd-portraits.mjs
 */
import { existsSync } from 'node:fs'
import { readdir, unlink } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join, parse } from 'node:path'

const require = createRequire(import.meta.url)
let sharp
try {
  sharp = require('sharp')
} catch {
  console.error('Install sharp first: npm install --no-save sharp')
  process.exit(1)
}

const dir = join(import.meta.dirname, '..', 'resources', 'srd-portraits')
const files = (await readdir(dir)).filter((name) => /\.png$/i.test(name))
if (!files.length) {
  console.log('No PNG files to convert.')
  process.exit(0)
}

let converted = 0
for (const name of files) {
  const src = join(dir, name)
  const dest = join(dir, `${parse(name).name}.webp`)
  await sharp(src)
    .rotate()
    .resize({ width: 768, height: 1024, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80, effort: 4 })
    .toFile(dest)
  if (!existsSync(dest)) throw new Error(`WebP missing after convert: ${name}`)
  await unlink(src)
  converted += 1
  if (converted % 25 === 0 || converted === files.length) {
    console.log(`${converted} / ${files.length}`)
  }
}

console.log(`Converted ${converted} portraits to WebP.`)
