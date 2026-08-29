import { copyFileSync, existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const dest = 'resources/srd-items'
const text = readFileSync('Additional Books/Dungeon Masters Guide 2024 Magic Items.md', 'utf8')
const records = []
for (const block of text.replace(/\r\n/g, '\n').split(/^## /m).slice(1)) {
  const lines = block.split('\n').map((line) => line.trim())
  const name = lines[0]?.replace(/^#+\s*/, '').trim()
  if (!name) continue
  const category = lines.slice(1).find((line) => line && !line.startsWith('|') && line.length <= 90) ?? ''
  records.push({ name, category })
}

function fold(name) {
  return name
    .toLowerCase()
    .replace(/[—–−]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/\.[^.]+$/, '')
    .trim()
}

function fileFor(stem) {
  const want = fold(stem)
  return readdirSync(dest).find((name) => /\.(webp|png)$/i.test(name) && fold(name) === want)
}

function copyAs(fromStem, toName) {
  const from = fileFor(fromStem)
  if (!from) return false
  const out = join(dest, `${toName}.webp`)
  if (existsSync(out)) return false
  copyFileSync(join(dest, from), out)
  console.log('copy', from, '->', toName)
  return true
}

function fallbackStem(name, category) {
  const n = name.toLowerCase()
  const c = category.toLowerCase()
  if (c.startsWith('potion') || n.startsWith('potion ') || n.startsWith('elixir ') || n.startsWith('oil ') || n.startsWith('philter ')) {
    return 'Potion of Healing'
  }
  if (c.startsWith('ring') || n.startsWith('ring ')) return 'Signet Ring'
  if (c.startsWith('wand') || n.startsWith('wand ')) return 'Wand'
  if (c.startsWith('staff') || n.startsWith('staff ') || n.startsWith('enspelled staff')) return 'Staff'
  if (c.startsWith('rod') || n.startsWith('rod ') || n === 'tentacle rod') return 'Rod'
  if (c.startsWith('scroll') || n.startsWith('scroll ')) return 'Spell Scroll'
  if (c.includes('shield') || n.startsWith('shield ') || n.includes('shield')) return 'Shield'
  if (c.includes('studded leather') || n.includes('studded leather')) return 'Studded Leather Armor'
  if (c.includes('scale mail') || n.includes('scale mail')) return 'Scale Mail'
  if (c.includes('chain mail') || c.includes('chain shirt') || n.includes('chain')) return 'Chain Mail'
  if (c.includes('half') && c.includes('plate')) return 'Half Plate Armor'
  if (c.includes('plate') || n.includes('plate')) return 'Plate Armor'
  if (c.startsWith('armor') || n.startsWith('armor ')) return 'Leather Armor'
  if (c.includes('battleaxe') || n.includes('axe')) return 'Battleaxe'
  if (c.includes('greatsword') && !c.includes('longsword')) return 'Greatsword'
  if (c.includes('dagger') && n.includes('dagger')) return 'Dagger'
  if (c.includes('warhammer') || n.includes('hammer') && n.includes('thunder')) return 'Warhammer'
  if (c.includes('longbow') || c.includes('shortbow') || n.includes('bow')) return 'Longbow'
  if (c.includes('javelin')) return 'Javelin'
  if (c.includes('mace')) return 'Mace'
  if (c.includes('scimitar') && n.includes('scimitar')) return 'Scimitar'
  if (c.includes('quarterstaff')) return 'Quarterstaff'
  if (c.includes('greatclub')) return 'Greatclub'
  if (c.includes('trident')) return 'Trident'
  if (c.includes('maul')) return 'Maul'
  if (c.includes('club') && !n.includes('lute')) return 'Club'
  if (c.includes('glaive') || c.includes('longsword') || c.includes('sword') || n.includes('sword') || n.includes('blade')) {
    return 'Longsword'
  }
  if (c.startsWith('weapon') || n.startsWith('weapon ') || n.includes('ammunition')) return 'Longsword'
  if (n.includes('bag of') || n.startsWith('bag ')) return 'Sack'
  if (n.includes('cloak') || n.includes('cape') || n.includes('mantle') || n.includes('robe')) return 'Robe'
  if (n.includes('book') || n.includes('tome') || n.includes('manual') || n.includes('spellbook') || n.includes('deck')) {
    return 'Spellbook'
  }
  if (n.includes('crystal ball') || n.includes('orb of')) return 'Orb'
  if (n.includes('amulet') || n.includes('necklace') || n.includes('periapt') || n.includes('medallion') || n.includes('brooch') || n.includes('talisman')) {
    return 'Amulet'
  }
  if (n.includes('candle')) return 'Candle'
  if (n.includes('rope')) return 'Rope'
  if (n.includes('horn')) return 'Horn'
  if (n.includes('lantern')) return 'Lantern, Hooded'
  if (n.includes('quiver')) return 'Quiver'
  if (n.includes('saddle')) return 'Saddle (Riding)'
  if (n.includes('boots') || n.includes('slippers') || n.includes('horseshoe')) return 'Clothes, Traveler\'s'
  if (n.includes('hat') || n.includes('cap of') || n.includes('helm') || n.includes('circlet') || n.includes('headband') || n.includes('goggles')) {
    return 'Clothes, Fine'
  }
  if (n.includes('broom')) return 'Quarterstaff'
  if (n.includes('jug') || n.includes('decanter') || n.includes('cauldron') || n.includes('pot of')) return 'Jug'
  if (n.includes('bottle') || n.includes('flask') || n.includes('vial')) return 'Flask'
  if (n.includes('bead')) return 'Ioun Stone'
  if (n.includes('stone of') || n.includes('ioun')) return 'Ioun Stone'
  if (n.includes('glove') || n.includes('gauntlet') || n.includes('bracer') || n.includes('belt') || n.includes('wraps')) {
    return 'Leather Armor'
  }
  if (n.includes('pipe')) return 'Flute'
  if (n.includes('instrument') || n.includes('lute')) return 'Lute'
  if (n.includes('carpet') || n.includes('portable hole') || n.includes('well of')) return 'Blanket'
  if (n.includes('folding boat')) return 'Barrel'
  if (n.includes('fortress') || n.includes('cube') || n.includes('gate')) return 'Chest'
  if (n.includes('mirror')) return 'Mirror'
  if (n.includes('pole of')) return 'Pole'
  if (n.includes('lock')) return 'Lock'
  if (n.includes('key')) return 'Lock'
  if (n.includes('coin') || n.includes('gem of') || n.includes('pearl') || n.includes('ruby') || n.includes('scarab')) {
    return 'Ioun Stone'
  }
  if (n.includes('dust') || n.includes('pigment') || n.includes('glue') || n.includes('solvent') || n.includes('ointment') || n.includes('spice')) {
    return 'Component Pouch'
  }
  if (n.includes('eye') || n.includes('prosthetic')) return 'Crystal'
  if (n.includes('fan')) return 'Clothes, Fine'
  if (n.includes('wings')) return 'Robe'
  if (n.includes('cane') || n.includes('veteran')) return 'Quarterstaff'
  if (n.includes('doll') || n.includes('figurine') || n.includes('token')) return 'Totem'
  if (n.includes('tankard')) return 'Flask'
  if (n.includes('board') || n.includes('chime')) return 'Bell'
  if (n.includes('shackles')) return 'Manacles'
  if (n.includes('sphere')) return 'Orb'
  if (n.includes('hat')) return 'Clothes, Fine'
  return 'Ioun Stone'
}

let copied = 0
let skipped = 0
for (const record of records) {
  if (fileFor(record.name)) {
    skipped += 1
    continue
  }
  const from = fallbackStem(record.name, record.category)
  if (copyAs(from, record.name)) copied += 1
  else console.log('NO FALLBACK', record.name, from)
}
console.log(JSON.stringify({ copied, alreadyHad: skipped, total: records.length }))
