import {
  APOTHECARY_GOODS,
  ARMORER_GOODS,
  FORGE_GOODS,
  MARKET_GOODS,
  STABLE_GOODS,
  STORE_GOODS,
  WEAPON_GOODS
} from './axiumShopGoods'

export {
  APOTHECARY_GOODS,
  ARMORER_GOODS,
  FORGE_GOODS,
  MARKET_GOODS,
  STABLE_GOODS,
  STORE_GOODS,
  WEAPON_GOODS
} from './axiumShopGoods'

export type TradeGoodGroup =
  | 'Drink'
  | 'Food'
  | 'Lodging'
  | 'Provisions'
  | 'Offering'
  | 'Remedy'
  | 'Devotion'
  | 'Hospice'
  | 'Fitting'
  | 'Care'
  | 'Edge'
  | 'Tackle'
  | 'Mount'
  | 'Tack'
  | 'Household'
  | 'Travel'
  | 'Herb'
  | 'Draught'
  | 'Salve'
  | 'Metal'
  | 'Work'
  | 'Stall'

export type AxiumCategory =
  | 'Trade Goods'
  | 'Temple Goods'
  | 'Armorer Goods'
  | 'Weapon Goods'
  | 'Stable Goods'
  | 'Store Goods'
  | 'Apothecary Goods'
  | 'Forge Goods'
  | 'Market Goods'

export type TradeGood = {
  id: string
  name: string
  group: TradeGoodGroup
  price: string
  weight: string
  desc: string
  /** Relative chance to appear on a shop board. */
  rarity: number
}

/**
 * Axium Trade Goods — inn food, drink, rooms, and market provisions.
 * Coin scale matches common 5e inn prices (mug of ale 4 cp, loaf 2 cp) without copying book lists.
 */
export const TRADE_GOODS: TradeGood[] = [
  {
    id: 'axium-small-ale-mug',
    name: 'Small Ale (mug)',
    group: 'Drink',
    price: '4 cp',
    weight: '1 lb.',
    desc: 'Watered table beer. Safe to drink all evening.',
    rarity: 4
  },
  {
    id: 'axium-small-ale-pitcher',
    name: 'Small Ale (pitcher)',
    group: 'Drink',
    price: '2 sp',
    weight: '8 lb.',
    desc: 'A pitcher for the table. Four mugs, give or take the foam.',
    rarity: 3
  },
  {
    id: 'axium-house-bitter-mug',
    name: 'House Bitter (mug)',
    group: 'Drink',
    price: '5 cp',
    weight: '1 lb.',
    desc: 'Darker, local, and slightly sour. The regulars swear by it.',
    rarity: 3
  },
  {
    id: 'axium-orchard-cider-mug',
    name: 'Orchard Cider (mug)',
    group: 'Drink',
    price: '5 cp',
    weight: '1 lb.',
    desc: 'Pressed apples, still or barely sparkling. Sweeter than ale.',
    rarity: 3
  },
  {
    id: 'axium-perry-mug',
    name: 'Perry (mug)',
    group: 'Drink',
    price: '6 cp',
    weight: '1 lb.',
    desc: 'Pear cider. An autumn drink; some houses keep it year-round.',
    rarity: 2
  },
  {
    id: 'axium-mead-horn',
    name: 'Mead (horn)',
    group: 'Drink',
    price: '8 cp',
    weight: '1 lb.',
    desc: 'Honey wine, stronger than small ale. Served in a horn or thick cup.',
    rarity: 4
  },
  {
    id: 'axium-mead-jug',
    name: 'Mead (jug)',
    group: 'Drink',
    price: '4 sp',
    weight: '6 lb.',
    desc: 'Enough for a table. Honey is dear, so the jug costs.',
    rarity: 2
  },
  {
    id: 'axium-mulled-wine-cup',
    name: 'Mulled Wine (cup)',
    group: 'Drink',
    price: '1 sp',
    weight: '1 lb.',
    desc: 'Warmed with spice. A winter pour; some kitchens fake it in summer.',
    rarity: 2
  },
  {
    id: 'axium-common-wine-bottle',
    name: 'Common Wine (bottle)',
    group: 'Drink',
    price: '2 sp',
    weight: '3 lb.',
    desc: 'Local red or white, stoppered. Nothing to toast a lord with.',
    rarity: 3
  },
  {
    id: 'axium-cellar-wine-bottle',
    name: 'Cellar Wine (bottle)',
    group: 'Drink',
    price: '10 gp',
    weight: '3 lb.',
    desc: 'The one bottle they keep under the bar. Dusty label, honest cork.',
    rarity: 1
  },
  {
    id: 'axium-hearth-spirits-tot',
    name: 'Hearth Spirits (tot)',
    group: 'Drink',
    price: '2 sp',
    weight: '—',
    desc: 'A short pour of distilled grain. Burns going down.',
    rarity: 2
  },
  {
    id: 'axium-buttermilk-mug',
    name: 'Buttermilk (mug)',
    group: 'Drink',
    price: '2 cp',
    weight: '1 lb.',
    desc: 'Cold from the crock. What the kitchen drinks.',
    rarity: 2
  },
  {
    id: 'axium-hearth-bread',
    name: 'Hearth Bread (loaf)',
    group: 'Food',
    price: '2 cp',
    weight: '1/2 lb.',
    desc: 'Dense brown loaf, baked that morning if the fire was lit.',
    rarity: 4
  },
  {
    id: 'axium-oatcakes',
    name: 'Oatcakes (3)',
    group: 'Food',
    price: '3 cp',
    weight: '1/2 lb.',
    desc: 'Dry, travel-friendly cakes. Better with butter or stew.',
    rarity: 3
  },
  {
    id: 'axium-dripping-onions',
    name: 'Dripping and Onions',
    group: 'Food',
    price: '4 cp',
    weight: '—',
    desc: 'Fried onions in yesterday’s fat, on a heel of bread.',
    rarity: 3
  },
  {
    id: 'axium-pickled-eggs',
    name: 'Pickled Eggs (3)',
    group: 'Food',
    price: '4 cp',
    weight: '—',
    desc: 'From the jar on the bar. Vinegar and peppercorn.',
    rarity: 2
  },
  {
    id: 'axium-pottage',
    name: 'Pottage (bowl)',
    group: 'Food',
    price: '6 cp',
    weight: '1 lb.',
    desc: 'Grain, root, and whatever went in the pot. Thick enough to stand a spoon.',
    rarity: 3
  },
  {
    id: 'axium-house-stew',
    name: 'House Stew (bowl)',
    group: 'Food',
    price: '1 sp',
    weight: '1 lb.',
    desc: 'The day’s pot. Ask what’s in it; they may tell you.',
    rarity: 4
  },
  {
    id: 'axium-hard-cheese',
    name: 'Hard Cheese (wedge)',
    group: 'Food',
    price: '1 sp',
    weight: '1/2 lb.',
    desc: 'A wedge cut from the wheel. Keeps a week in a pack.',
    rarity: 3
  },
  {
    id: 'axium-sausage',
    name: 'Sausage (link)',
    group: 'Food',
    price: '8 cp',
    weight: '1/4 lb.',
    desc: 'Smoked or fresh, depending on the house. One link, off the board.',
    rarity: 3
  },
  {
    id: 'axium-hearth-mutton',
    name: 'Hearth Mutton',
    group: 'Food',
    price: '3 sp',
    weight: '1/2 lb.',
    desc: 'A thick cut, roasted or boiled. Bones for the dog if you leave them.',
    rarity: 2
  },
  {
    id: 'axium-salt-fish',
    name: 'Salt Fish (plate)',
    group: 'Food',
    price: '2 sp',
    weight: '1/2 lb.',
    desc: 'Dried or pickled fish, oil, and onion. A coastal house staple.',
    rarity: 2
  },
  {
    id: 'axium-roast-fowl',
    name: 'Roast Fowl',
    group: 'Food',
    price: '5 sp',
    weight: '2 lb.',
    desc: 'Bird from the spit. Shares well; they will not split the price.',
    rarity: 2
  },
  {
    id: 'axium-travelers-pie',
    name: "Traveler's Pie",
    group: 'Food',
    price: '1 sp',
    weight: '1 lb.',
    desc: 'Pastry lid, meat or vegetable filling. Eaten in the hand.',
    rarity: 3
  },
  {
    id: 'axium-honey-cake',
    name: 'Honey Cake',
    group: 'Food',
    price: '1 sp',
    weight: '1/4 lb.',
    desc: 'Sweet, dense, and gone by evening if they baked a tray.',
    rarity: 2
  },
  {
    id: 'axium-dried-apples',
    name: 'Dried Apples (pouch)',
    group: 'Provisions',
    price: '1 sp',
    weight: '1/2 lb.',
    desc: 'A day’s chew on the road. Better than hardtack if you can get it.',
    rarity: 3
  },
  {
    id: 'axium-butter-crock',
    name: 'Butter Crock',
    group: 'Provisions',
    price: '1 sp',
    weight: '1/2 lb.',
    desc: 'Salted butter in a small crock. The kitchen will sell one if asked.',
    rarity: 2
  },
  {
    id: 'axium-farmers-cheese',
    name: "Farmer's Cheese (wheel)",
    group: 'Provisions',
    price: '5 sp',
    weight: '4 lb.',
    desc: 'A small wheel. Market stock more often than taproom stock.',
    rarity: 2
  },
  {
    id: 'axium-honey-jar',
    name: 'Honey Jar',
    group: 'Provisions',
    price: '2 sp',
    weight: '1 lb.',
    desc: 'A jar of last summer’s take. Cooks and apothecaries both buy it.',
    rarity: 2
  },
  {
    id: 'axium-salt-pouch',
    name: 'Salt Pouch',
    group: 'Provisions',
    price: '5 sp',
    weight: '1 lb.',
    desc: 'Fine salt for the pot or the pack. Worth more inland.',
    rarity: 1
  },
  {
    id: 'axium-hardtack',
    name: 'Hardtack (week)',
    group: 'Provisions',
    price: '3 sp',
    weight: '3 lb.',
    desc: 'Ship biscuit. Soak it or break a tooth. Keeps a month dry.',
    rarity: 2
  },
  {
    id: 'axium-road-skin-ale',
    name: 'Road Skin of Ale',
    group: 'Provisions',
    price: '1 sp',
    weight: '4 lb.',
    desc: 'A filled skin for the road. Goes sour if you linger.',
    rarity: 2
  },
  {
    id: 'axium-pallet-fire',
    name: 'Pallet by the Fire',
    group: 'Lodging',
    price: '2 sp',
    weight: '—',
    desc: 'A space on the floor near the hearth, blanket if they have one spare.',
    rarity: 3
  },
  {
    id: 'axium-shared-room',
    name: 'Shared Room (night)',
    group: 'Lodging',
    price: '5 sp',
    weight: '—',
    desc: 'A bed in a room with strangers. Door that mostly latches.',
    rarity: 4
  },
  {
    id: 'axium-private-room',
    name: 'Private Room (night)',
    group: 'Lodging',
    price: '8 sp',
    weight: '—',
    desc: 'One room, one bed, a pot, and a bar on the door.',
    rarity: 2
  },
  {
    id: 'axium-hot-bath',
    name: 'Hot Bath',
    group: 'Lodging',
    price: '5 sp',
    weight: '—',
    desc: 'A tub behind the kitchen. Water that was hot when they filled it.',
    rarity: 2
  }
]

/**
 * Axium Temple Goods — offerings, hospice remedies, and devotionals.
 * Mundane house-wares; SRD holy water and healer’s kits stay on the temple board separately.
 */
export const TEMPLE_GOODS: TradeGood[] = [
  {
    id: 'axium-votive-candle',
    name: 'Votive Candle',
    group: 'Offering',
    price: '1 sp',
    weight: '—',
    desc: 'A short candle for the rail. Burns about an hour.',
    rarity: 4
  },
  {
    id: 'axium-tithe-taper',
    name: 'Tithe Taper',
    group: 'Offering',
    price: '2 cp',
    weight: '—',
    desc: 'The cheapest light. They still count it.',
    rarity: 3
  },
  {
    id: 'axium-incense-stick',
    name: 'Incense Stick',
    group: 'Offering',
    price: '5 sp',
    weight: '—',
    desc: 'Resin on a reed. One stick, one prayer if you are brief.',
    rarity: 3
  },
  {
    id: 'axium-incense-bundle',
    name: 'Incense Bundle',
    group: 'Offering',
    price: '1 gp',
    weight: '—',
    desc: 'A day’s worth for the censer. The sacristan cuts them to length.',
    rarity: 4
  },
  {
    id: 'axium-altar-oil',
    name: 'Altar Oil (vial)',
    group: 'Offering',
    price: '2 gp',
    weight: '—',
    desc: 'Scented oil for lamps and thumbs. Not for frying.',
    rarity: 3
  },
  {
    id: 'axium-blessed-salt',
    name: 'Blessed Salt (pouch)',
    group: 'Offering',
    price: '5 sp',
    weight: '1/4 lb.',
    desc: 'Salt spoken over. The kitchen and the threshold both use it.',
    rarity: 3
  },
  {
    id: 'axium-clay-bowl',
    name: 'Offering Bowl',
    group: 'Offering',
    price: '3 sp',
    weight: '1 lb.',
    desc: 'Unglazed clay. Leave coin, grain, or a folded name.',
    rarity: 2
  },
  {
    id: 'axium-flower-wreath',
    name: 'Flower Wreath',
    group: 'Offering',
    price: '5 cp',
    weight: '—',
    desc: 'Seasonal, and wilting by dusk. They sell what the garden gave.',
    rarity: 2
  },
  {
    id: 'axium-prayer-beads',
    name: 'Prayer Beads',
    group: 'Devotion',
    price: '1 gp',
    weight: '—',
    desc: 'Wood or bone, a loop of ten. No two houses knot them the same.',
    rarity: 4
  },
  {
    id: 'axium-faith-token',
    name: 'Faith Token',
    group: 'Devotion',
    price: '5 gp',
    weight: '—',
    desc: 'A small house emblem on a cord. Worn at the throat or kept in a pocket.',
    rarity: 3
  },
  {
    id: 'axium-wooden-charm',
    name: 'Wooden Charm',
    group: 'Devotion',
    price: '5 sp',
    weight: '—',
    desc: 'Carved by a novice. Protection is implied, not guaranteed.',
    rarity: 3
  },
  {
    id: 'axium-pilgrim-badge',
    name: 'Pilgrim Badge',
    group: 'Devotion',
    price: '1 sp',
    weight: '—',
    desc: 'Pewter stamp of this house. Proof you came, or that you bought one.',
    rarity: 3
  },
  {
    id: 'axium-scripture-copy',
    name: 'Scripture Copy (page)',
    group: 'Devotion',
    price: '2 gp',
    weight: '—',
    desc: 'A hand copy of a short passage. Ink still smells.',
    rarity: 2
  },
  {
    id: 'axium-plain-cowl',
    name: 'Plain Cowl',
    group: 'Devotion',
    price: '8 sp',
    weight: '1 lb.',
    desc: 'Undyed wool. For mourning, novice work, or rain.',
    rarity: 2
  },
  {
    id: 'axium-aspergillum',
    name: 'Aspergillum',
    group: 'Devotion',
    price: '3 gp',
    weight: '1 lb.',
    desc: 'A perforated ball on a handle, for sprinkling. Empty until you fill it.',
    rarity: 1
  },
  {
    id: 'axium-temple-wine',
    name: 'Temple Wine (cup)',
    group: 'Devotion',
    price: '2 sp',
    weight: '—',
    desc: 'A sip at the rail, not a tavern pour. Watered, and they watch the cup.',
    rarity: 2
  },
  {
    id: 'axium-hearth-wafer',
    name: 'Hearth Wafers (3)',
    group: 'Devotion',
    price: '2 cp',
    weight: '—',
    desc: 'Unleavened, dry, and meant to be taken with a blessing or a dry mouth.',
    rarity: 2
  },
  {
    id: 'axium-pilgrim-meal',
    name: 'Pilgrim Meal',
    group: 'Hospice',
    price: '2 sp',
    weight: '—',
    desc: 'Bread, broth, and a place on the bench. No second helping.',
    rarity: 3
  },
  {
    id: 'axium-clean-bandages',
    name: 'Clean Bandages (10)',
    group: 'Remedy',
    price: '3 sp',
    weight: '1/2 lb.',
    desc: 'Boiled linen strips. The hospice will not take them back.',
    rarity: 4
  },
  {
    id: 'axium-splints-linen',
    name: 'Splints and Linen',
    group: 'Remedy',
    price: '5 sp',
    weight: '2 lb.',
    desc: 'Two slats, wrap, and a stick to bite. For a bone that has not gone green.',
    rarity: 3
  },
  {
    id: 'axium-mercy-balm',
    name: 'Mercy Balm',
    group: 'Remedy',
    price: '2 gp',
    weight: '—',
    desc: 'A pot of salve for cuts and burns. It is not a miracle. It is clean.',
    rarity: 4
  },
  {
    id: 'axium-fever-tea',
    name: 'Fever Tea',
    group: 'Remedy',
    price: '5 sp',
    weight: '—',
    desc: 'Bitter herbs in a twist of cloth. Steep till the steam bites.',
    rarity: 3
  },
  {
    id: 'axium-hospice-tonic',
    name: 'Hospice Tonic',
    group: 'Remedy',
    price: '1 gp',
    weight: '—',
    desc: 'A dark sip for weakness after a long illness. They will not sell two.',
    rarity: 2
  },
  {
    id: 'axium-stitching-kit',
    name: 'Stitching Kit',
    group: 'Remedy',
    price: '2 gp',
    weight: '1/2 lb.',
    desc: 'Needle, gut, and a small flask of spirits. The priest may use it for you.',
    rarity: 2
  },
  {
    id: 'axium-bitter-purge',
    name: 'Bitter Purge',
    group: 'Remedy',
    price: '1 gp',
    weight: '—',
    desc: 'For worms, bad water, or a night of foolish eating. Stay near a pot.',
    rarity: 2
  },
  {
    id: 'axium-shroud',
    name: 'Burial Shroud',
    group: 'Hospice',
    price: '5 sp',
    weight: '2 lb.',
    desc: 'Plain cloth, long enough. They will not haggle over this.',
    rarity: 3
  },
  {
    id: 'axium-grave-candles',
    name: 'Grave Candles (4)',
    group: 'Hospice',
    price: '4 sp',
    weight: '1 lb.',
    desc: 'Four tapers for a vigil. Sold as a set.',
    rarity: 2
  },
  {
    id: 'axium-mourning-cloth',
    name: 'Mourning Cloth',
    group: 'Hospice',
    price: '1 gp',
    weight: '1 lb.',
    desc: 'A dark wrap for the shoulders. Returned if you ask, rarely washed.',
    rarity: 1
  }
]

export const AXIUM_SOURCE = 'axium'
export const AXIUM_SOURCE_LABEL = 'Axium Trade Goods'
export const AXIUM_TEMPLE_LABEL = 'Axium Temple Goods'

export const AXIUM_GOODS: TradeGood[] = [
  ...TRADE_GOODS,
  ...TEMPLE_GOODS,
  ...ARMORER_GOODS,
  ...WEAPON_GOODS,
  ...STABLE_GOODS,
  ...STORE_GOODS,
  ...APOTHECARY_GOODS,
  ...FORGE_GOODS,
  ...MARKET_GOODS
]

const GROUP_CATEGORY: Record<TradeGoodGroup, AxiumCategory> = {
  Drink: 'Trade Goods',
  Food: 'Trade Goods',
  Lodging: 'Trade Goods',
  Provisions: 'Trade Goods',
  Offering: 'Temple Goods',
  Remedy: 'Temple Goods',
  Devotion: 'Temple Goods',
  Hospice: 'Temple Goods',
  Fitting: 'Armorer Goods',
  Care: 'Armorer Goods',
  Edge: 'Weapon Goods',
  Tackle: 'Weapon Goods',
  Mount: 'Stable Goods',
  Tack: 'Stable Goods',
  Household: 'Store Goods',
  Travel: 'Store Goods',
  Herb: 'Apothecary Goods',
  Draught: 'Apothecary Goods',
  Salve: 'Apothecary Goods',
  Metal: 'Forge Goods',
  Work: 'Forge Goods',
  Stall: 'Market Goods'
}

const CATEGORY_SOURCE_LABEL: Record<AxiumCategory, string> = {
  'Trade Goods': AXIUM_SOURCE_LABEL,
  'Temple Goods': AXIUM_TEMPLE_LABEL,
  'Armorer Goods': 'Axium Armorer Goods',
  'Weapon Goods': 'Axium Weapon Goods',
  'Stable Goods': 'Axium Stable Goods',
  'Store Goods': 'Axium Store Goods',
  'Apothecary Goods': 'Axium Apothecary Goods',
  'Forge Goods': 'Axium Forge Goods',
  'Market Goods': 'Axium Market Goods'
}

export function axiumCategory(group: TradeGoodGroup): AxiumCategory {
  return GROUP_CATEGORY[group]
}

export function axiumSourceLabel(group: TradeGoodGroup): string {
  return CATEGORY_SOURCE_LABEL[axiumCategory(group)]
}

export function tradeGoodByName(name: string): TradeGood | null {
  const folded = name.toLowerCase()
  return AXIUM_GOODS.find((item) => item.name.toLowerCase() === folded) ?? null
}

export function goodsForShopType(type: string): TradeGood[] {
  switch (type.trim().toLowerCase()) {
    case 'temple':
      return TEMPLE_GOODS
    case 'tavern':
      return TRADE_GOODS
    case 'armorer':
    case 'armor':
      return ARMORER_GOODS
    case 'weapons':
      return WEAPON_GOODS
    case 'stables':
      return STABLE_GOODS
    case 'general store':
      return [...STORE_GOODS, ...TRADE_GOODS.filter((item) => item.group === 'Provisions')]
    case 'apothecary':
      return APOTHECARY_GOODS
    case 'forge':
      return FORGE_GOODS
    case 'market':
      return [
        ...MARKET_GOODS,
        ...TRADE_GOODS.filter((item) => item.group === 'Food' || item.group === 'Provisions')
      ]
    default:
      return TRADE_GOODS
  }
}
