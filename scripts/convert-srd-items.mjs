import { copyFileSync, existsSync, readdirSync, statSync, unlinkSync } from 'node:fs'
import { basename, extname, join } from 'node:path'
import sharp from 'sharp'

const assets = process.argv[2] ?? 'C:/Users/james/.cursor/projects/c-Users-james-Documents-D-D-gaming/assets'
const dest = process.argv[3] ?? 'resources/srd-items'

const copies = {
  Acid: ['Acid (vial)'],
  Antitoxin: ['Antitoxin (Vial)'],
  'Arrows (20)': ['Arrow (bow)'],
  'Ball Bearings': ['Ball Bearings (bag of 1000)'],
  Bagpipes: ['Musical Instrument, Bagpipes'],
  Amulet: ['Holy Symbol, Amulet)'],
  Staff: ['Wooden staff', 'Druidic Focus, Wooden Staff'],
  'Yew wand': ['Druidic Focus, Yew Wand'],
  Caltrops: ['Caltrops (bag of 20)'],
  Chain: ['Chain (10 feet)'],
  Costume: ['Clothes, costume'],
  Flask: ['Flask or tankard'],
  Ink: ['Ink (1 ounce bottle)'],
  Jug: ['Jug or pitcher'],
  Ladder: ['Ladder (10-foot)'],
  Mirror: ['Mirror, steel'],
  Paper: ['Paper (one sheet)'],
  Parchment: ['Parchment (one sheet)'],
  Perfume: ['Perfume (vial)'],
  Pole: ['Pole (10-foot)'],
  Rations: ['Rations (1 day)'],
  Robe: ['Robes'],
  Rope: ['Rope, hempen (50 feet)'],
  'Spikes, Iron': ['Spike, iron'],
  Drum: ['Musical Instrument, Drum'],
  Dulcimer: ['Musical Instrument, Dulcimer'],
  Flute: ['Musical Instrument, Flute'],
  Horn: ['Musical Instrument, Horn'],
  Lute: ['Musical Instrument, Lute'],
  Lyre: ['Musical Instrument, Lyre'],
  'Pan flute': ['Musical Instrument, Pan Flute'],
  Shawm: ['Musical Instrument, Shawm'],
  Viol: ['Musical Instrument, Viol'],
  Emblem: ['Holy Symbol, Emblem)'],
  Reliquary: ['Holy Symbol, Reliquary'],
  'Sprig of mistletoe': ['Druidic Focus, Sprig of Mistletoe'],
  'Bolts (20)': ['Crossbow bolt'],
  'Needles (50)': ['Blowgun needles'],
  'Potion of Healing': ['Potions of Healing'],
  'Half Plate Armor': ['Half plate'],
  'Crystal Ball': [
    'Crystal Ball of Mind Reading',
    'Crystal Ball of Telepathy',
    'Crystal Ball of True Seeing'
  ],
  'Dice set': ['Gaming Set, Dice'],
  'Gaming Set, Playing Cards': ['Playing card set'],
  'Bullets, Sling (20)': ['Sling bullets'],
}

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
  console.log('converted', name, statSync(out).size)
}

for (const [from, tos] of Object.entries(copies)) {
  const src = join(dest, `${from}.webp`)
  if (!existsSync(src)) continue
  for (const to of tos) {
    const out = join(dest, `${to}.webp`)
    copyFileSync(src, out)
    console.log('copy', from, '->', to)
  }
}
