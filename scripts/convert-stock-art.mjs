import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'

const assets = process.argv[2] ?? 'C:/Users/james/.cursor/projects/c-Users-james-Documents-D-D-gaming/assets'
const dest = process.argv[3] ?? 'resources/stock-art'

const FILES = {
  'stock-place-town.png': 'Town.webp',
  'stock-place-city.png': 'City.webp',
  'stock-place-village.png': 'Village.webp',
  'stock-place-dungeon.png': 'Dungeon.webp',
  'stock-place-forest.png': 'Forest.webp',
  'stock-place-inn.png': 'Inn.webp',
  'stock-place-castle.png': 'Castle.webp',
  'stock-place-temple.png': 'Temple.webp',
  'stock-place-cave.png': 'Cave.webp',
  'stock-place-harbor.png': 'Harbor.webp',
  'stock-place-crypt.png': 'Crypt.webp',
  'stock-place-ruins.png': 'Ruins.webp',
  'stock-place-market.png': 'Market.webp',
  'stock-place-wilderness.png': 'Wilderness.webp',
  'stock-place-forge.png': 'Forge.webp',
  'stock-shop-tavern.png': 'Tavern.webp',
  'stock-shop-armorer.png': 'Armorer.webp',
  'stock-shop-stables.png': 'Stables.webp',
  'stock-shop-weapons.png': 'Weapons.webp',
  'stock-shop-general-store.png': 'General Store.webp',
  'stock-shop-apothecary.png': 'Apothecary.webp',
  'stock-faction-thieves-guild.png': 'Thieves Guild.webp',
  'stock-faction-merchant-guild.png': 'Merchant Guild.webp',
  'stock-faction-noble-house.png': 'Noble House.webp',
  'stock-faction-temple-order.png': 'Temple Order.webp',
  'stock-faction-wizards-circle.png': 'Wizards Circle.webp',
  'stock-faction-cult.png': 'Cult.webp',
  'stock-faction-city-watch.png': 'City Watch.webp',
  'stock-faction-adventurers-guild.png': 'Adventurers Guild.webp'
}

mkdirSync(dest, { recursive: true })
for (const [from, to] of Object.entries(FILES)) {
  await sharp(join(assets, from))
    .rotate()
    .resize({ width: 960, height: 720, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 78, effort: 4 })
    .toFile(join(dest, to))
  console.log('converted', to)
}
