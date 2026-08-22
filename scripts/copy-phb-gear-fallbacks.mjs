import { copyFileSync, existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

function fold(name) {
  return name
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[—–−]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/\.[^.]+$/, '')
    .trim()
}

const dest = 'resources/srd-items'
const files = readdirSync(dest).filter((name) => /\.(webp|png)$/i.test(name))
const have = new Map(files.map((name) => [fold(name), name]))

const text = readFileSync('WOTC/Players Handbook 2024 Equipment.md', 'utf8')
const records = []
for (const block of text.replace(/\r\n/g, '\n').split(/^## /m).slice(1)) {
  const lines = block.split('\n').map((line) => line.trim())
  const name = lines[0]?.replace(/^#+\s*/, '').trim()
  if (!name) continue
  const category = lines.slice(1).find((line) => line && !line.startsWith('|') && line.length <= 90) ?? ''
  records.push({ name, category })
}

const aliases = {
  'Alchemist’s Fire': "Alchemist's Fire (Flask)",
  'Holy Water': 'Holy Water (flask)',
  'Feed per day': 'Feed (per day)',
  'Exotic Saddle': 'Saddle (Exotic)',
  'Military Saddle': 'Saddle (Military)',
  'Riding Saddle': 'Saddle (Riding)',
  'Arcane Focus': 'Crystal',
  'Druidic Focus': 'Sprig of mistletoe',
  'Holy Symbol': 'Amulet',
  'Gaming Set': 'Dice set',
  'Musical Instrument': 'Lute',
  Oil: 'Lamp oil (flask)',
  'Lamp oil': 'Lamp oil (flask)',
  Barding: 'Plate Armor',
  'Clothes, Traveler’s': "Clothes, Traveler's",
  "Alchemist’s Supplies": "Alchemist's Supplies",
  "Brewer’s Supplies": "Brewer's Supplies",
  "Calligrapher’s Supplies": "Calligrapher's Supplies",
  "Carpenter’s Tools": "Carpenter's Tools",
  "Cartographer’s Tools": "Cartographer's Tools",
  "Cobbler’s Tools": "Cobbler's Tools",
  "Cook’s Utensils": "Cook's Utensils",
  "Glassblower’s Tools": "Glassblower's Tools",
  "Jeweler’s Tools": "Jeweler's Tools",
  "Leatherworker’s Tools": "Leatherworker's Tools",
  "Mason’s Tools": "Mason's Tools",
  "Painter’s Supplies": "Painter's Supplies",
  "Potter’s Tools": "Potter's Tools",
  "Smith’s Tools": "Smith's Tools",
  "Tinker’s Tools": "Tinker's Tools",
  "Weaver’s Tools": "Weaver's Tools",
  "Woodcarver’s Tools": "Woodcarver's Tools",
  "Navigator’s Tools": "Navigator's Tools",
  "Poisoner’s Kit": "Poisoner's Kit",
  "Thieves’ Tools": "Thieves' Tools",
  "Burglar’s Pack": "Burglar's Pack",
  "Climber’s Kit": "Climber's Kit",
  "Diplomat’s Pack": "Diplomat's Pack",
  "Dungeoneer’s Pack": "Dungeoneer's Pack",
  "Entertainer’s Pack": "Entertainer's Pack",
  "Explorer’s Pack": "Explorer's Pack",
  "Healer’s Kit": "Healer's Kit",
  "Priest’s Pack": "Priest's Pack",
  "Scholar’s Pack": "Scholar's Pack"
}

let copied = 0
const missing = []
for (const record of records) {
  if (have.has(fold(record.name))) continue
  const alias = aliases[record.name]
  if (alias && have.has(fold(alias))) {
    const from = have.get(fold(alias))
    const out = join(dest, `${record.name}.webp`)
    if (!existsSync(out)) {
      copyFileSync(join(dest, from), out)
      copied += 1
      console.log('copy', from, '->', record.name)
    }
    continue
  }
  missing.push(record)
}

console.log(JSON.stringify({ total: records.length, copied, stillMissing: missing.length }))
for (const record of missing) console.log(`${record.category}\t${record.name}`)
