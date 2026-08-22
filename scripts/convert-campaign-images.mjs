/**
 * Convert campaign PNG/JPEG art to WebP and rewrite matching names in markdown.
 * Requires: npm install --no-save sharp
 *
 * Usage: node scripts/convert-campaign-images.mjs [campaignFolder]
 */
import { existsSync, statSync } from 'node:fs'
import { readdir, readFile, unlink, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { extname, isAbsolute, join, parse, relative } from 'node:path'

const require = createRequire(import.meta.url)
let sharp
try {
  sharp = require('sharp')
} catch {
  console.error('Install sharp first: npm install --no-save sharp')
  process.exit(1)
}

const arg = process.argv[2]
const root = arg
  ? isAbsolute(arg)
    ? arg
    : join(process.cwd(), arg)
  : join(process.cwd(), 'examples', 'greystead')
const IMAGE_RE = /\.(png|jpe?g)$/i

async function walk(dir, acc = []) {
  for (const name of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, name.name)
    if (name.isDirectory()) await walk(full, acc)
    else acc.push(full)
  }
  return acc
}

function maxEdge(file) {
  return /[/\\]Maps[/\\]Art[/\\]/i.test(file) ? 4096 : 1920
}

const files = (await walk(root)).filter((file) => IMAGE_RE.test(file))
const renamed = []
let converted = 0
let bytesIn = 0
let bytesOut = 0

for (const src of files) {
  const dest = join(parse(src).dir, `${parse(src).name}.webp`)
  bytesIn += statSync(src).size
  await sharp(src)
    .rotate()
    .resize({ width: maxEdge(src), height: maxEdge(src), fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80, effort: 4 })
    .toFile(dest)
  if (!existsSync(dest)) throw new Error(`WebP missing after convert: ${src}`)
  bytesOut += statSync(dest).size
  await unlink(src)
  renamed.push([parse(src).base, parse(dest).base])
  converted += 1
  console.log(`${converted}/${files.length}  ${relative(root, src)}`)
}

const mds = (await walk(root)).filter((file) => file.endsWith('.md'))
let mdHits = 0
for (const md of mds) {
  let text = await readFile(md, 'utf8')
  const before = text
  for (const [from, to] of renamed) {
    if (text.includes(from)) text = text.split(from).join(to)
  }
  if (text !== before) {
    await writeFile(md, text, 'utf8')
    mdHits += 1
  }
}

console.log(
  `Converted ${converted} images in ${root}. Markdown files updated: ${mdHits}. ` +
    `${(bytesIn / 1024 / 1024).toFixed(1)} MB → ${(bytesOut / 1024 / 1024).toFixed(1)} MB`
)
