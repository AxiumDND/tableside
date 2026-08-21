export type StockArtGroup = 'place' | 'shop' | 'faction'

export type StockArtItem = {
  id: string
  title: string
  group: StockArtGroup
  aliases: string[]
}

const SHOP_EXTRA_PLACE_IDS = ['Forge', 'Market', 'Temple'] as const

export const STOCK_ART: StockArtItem[] = [
  { id: 'Town', title: 'Town', group: 'place', aliases: ['walled town'] },
  { id: 'City', title: 'City', group: 'place', aliases: [] },
  { id: 'Village', title: 'Village', group: 'place', aliases: ['hamlet'] },
  { id: 'Dungeon', title: 'Dungeon', group: 'place', aliases: [] },
  { id: 'Forest', title: 'Forest', group: 'place', aliases: ['woods', 'wood'] },
  { id: 'Inn', title: 'Inn', group: 'place', aliases: ['tavern', 'pub'] },
  { id: 'Castle', title: 'Castle', group: 'place', aliases: ['keep', 'fortress'] },
  { id: 'Temple', title: 'Temple', group: 'place', aliases: ['church', 'shrine'] },
  { id: 'Cave', title: 'Cave', group: 'place', aliases: ['cavern'] },
  { id: 'Harbor', title: 'Harbor', group: 'place', aliases: ['harbour', 'port', 'docks'] },
  { id: 'Crypt', title: 'Crypt', group: 'place', aliases: ['tomb', 'catacombs', 'catacomb'] },
  { id: 'Ruins', title: 'Ruins', group: 'place', aliases: ['ruin'] },
  { id: 'Market', title: 'Market', group: 'place', aliases: ['marketplace', 'bazaar'] },
  { id: 'Wilderness', title: 'Wilderness', group: 'place', aliases: ['road', 'moor', 'wilds'] },
  { id: 'Forge', title: 'Forge', group: 'place', aliases: ['smithy', 'blacksmith'] },
  { id: 'Tavern', title: 'Tavern', group: 'shop', aliases: ['inn', 'pub', 'bar'] },
  { id: 'Armorer', title: 'Armorer', group: 'shop', aliases: ['armor', 'armour', 'armor shop', 'armourer'] },
  { id: 'Stables', title: 'Stables', group: 'shop', aliases: ['stable', 'livery'] },
  { id: 'Weapons', title: 'Weapons', group: 'shop', aliases: ['weapon shop', 'weapon'] },
  { id: 'General Store', title: 'General Store', group: 'shop', aliases: ['store', 'general store'] },
  { id: 'Apothecary', title: 'Apothecary', group: 'shop', aliases: ['alchemy', 'potions', 'herbalist'] },
  { id: 'Thieves Guild', title: "Thieves' Guild", group: 'faction', aliases: ["thieves' guild"] },
  { id: 'Merchant Guild', title: 'Merchant Guild', group: 'faction', aliases: ['traders guild', "traders' guild"] },
  { id: 'Noble House', title: 'Noble House', group: 'faction', aliases: ['nobility'] },
  { id: 'Temple Order', title: 'Temple Order', group: 'faction', aliases: ['clergy'] },
  { id: 'Wizards Circle', title: "Wizards' Circle", group: 'faction', aliases: ["wizard's circle", 'mage guild'] },
  { id: 'Cult', title: 'Cult', group: 'faction', aliases: [] },
  { id: 'City Watch', title: 'City Watch', group: 'faction', aliases: ['city guard'] },
  { id: 'Adventurers Guild', title: "Adventurers' Guild", group: 'faction', aliases: ["adventurer's guild"] }
]

export function foldStockArtName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[—–−]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/\.[^.]+$/, '')
    .trim()
}

function stockArtPool(group?: StockArtGroup): StockArtItem[] {
  if (!group) return STOCK_ART
  if (group === 'shop') {
    const shops = STOCK_ART.filter((item) => item.group === 'shop')
    const extras = SHOP_EXTRA_PLACE_IDS.map(
      (id) => STOCK_ART.find((item) => item.id === id) ?? null
    ).filter((item): item is StockArtItem => item !== null)
    return [...shops, ...extras]
  }
  return STOCK_ART.filter((item) => item.group === group)
}

export function stockArtForTemplate(kind: 'place' | 'shop' | 'faction' | 'map' | string): StockArtItem[] {
  if (kind === 'faction') return stockArtPool('faction')
  if (kind === 'shop') return stockArtPool('shop')
  if (kind === 'place') return stockArtPool('place')
  return []
}

export function matchStockArt(name: string, group?: StockArtGroup): StockArtItem | null {
  const folded = foldStockArtName(name)
  if (!folded) return null
  const pool = stockArtPool(group)
  return (
    pool.find((item) => {
      if (foldStockArtName(item.id) === folded) return true
      if (foldStockArtName(item.title) === folded) return true
      return item.aliases.some((alias) => foldStockArtName(alias) === folded)
    }) ?? null
  )
}

export function stockArtUrl(id: string): string {
  return `tabledm://stock-art/?name=${encodeURIComponent(id)}`
}
