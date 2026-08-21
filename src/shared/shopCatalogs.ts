import { tradeGoodByName } from './tradeGoods'

export type ShopStockOffer = {
  name: string
  price: string
  notes?: string
  /** Wikilink to a Gear / SRD name. Flavor rows stay plain text. */
  link?: boolean
  weight?: number
}

export type ShopCatalog = {
  id: string
  title: string
  tagline: string
  pick: { min: number; max: number }
  always?: ShopStockOffer[]
  stock: ShopStockOffer[]
  services: string[]
}

function srd(name: string, price: string, extra?: { notes?: string; weight?: number }): ShopStockOffer {
  return { name, price, link: true, notes: extra?.notes, weight: extra?.weight ?? 1 }
}

function food(name: string, price: string, extra?: { notes?: string; weight?: number }): ShopStockOffer {
  return { name, price, notes: extra?.notes, weight: extra?.weight ?? 1 }
}

function axium(name: string, extra?: { notes?: string; weight?: number }): ShopStockOffer {
  const item = tradeGoodByName(name)
  if (!item) throw new Error(`Unknown Axium trade good: ${name}`)
  return {
    name: item.name,
    price: item.price,
    link: true,
    notes: extra?.notes,
    weight: extra?.weight ?? item.rarity
  }
}

export const SHOP_CATALOGS: Record<string, ShopCatalog> = {
  Tavern: {
    id: 'Tavern',
    title: 'Tavern',
    tagline: 'Warm ale, a common room, and a fire that never quite dies.',
    pick: { min: 6, max: 10 },
    always: [
      axium('Small Ale (mug)'),
      axium('Hearth Bread (loaf)'),
      axium('House Stew (bowl)', { notes: 'Ask what’s in it' }),
      axium('Shared Room (night)')
    ],
    stock: [
      axium('Small Ale (pitcher)'),
      axium('House Bitter (mug)'),
      axium('Orchard Cider (mug)'),
      axium('Perry (mug)'),
      axium('Mead (horn)'),
      axium('Mead (jug)'),
      axium('Mulled Wine (cup)'),
      axium('Common Wine (bottle)'),
      axium('Cellar Wine (bottle)'),
      axium('Hearth Spirits (tot)'),
      axium('Buttermilk (mug)'),
      axium('Oatcakes (3)'),
      axium('Dripping and Onions'),
      axium('Pickled Eggs (3)'),
      axium('Pottage (bowl)'),
      axium('Hard Cheese (wedge)'),
      axium('Sausage (link)'),
      axium('Hearth Mutton'),
      axium('Salt Fish (plate)'),
      axium('Roast Fowl'),
      axium("Traveler's Pie"),
      axium('Honey Cake'),
      axium('Pallet by the Fire'),
      axium('Private Room (night)'),
      axium('Hot Bath'),
      axium('Road Skin of Ale'),
      srd('Rations (1 day)', '5 sp', { weight: 1 })
    ],
    services: [
      'Stabling overnight',
      'A message left for someone who drinks here',
      'A quiet table in the back',
      'We didn’t see you — 5 gp',
      'Wake them at dawn'
    ]
  },
  Armorer: {
    id: 'Armorer',
    title: 'Armorer',
    tagline: 'Fitted steel and boiled leather, priced as listed.',
    pick: { min: 6, max: 10 },
    always: [
      srd('Shield', '10 gp'),
      srd('Leather Armor', '10 gp'),
      axium('Leather Straps (set)'),
      axium('Armor Oil (flask)')
    ],
    stock: [
      srd('Padded Armor', '5 gp', { weight: 3 }),
      srd('Hide Armor', '10 gp', { weight: 3 }),
      srd('Studded Leather Armor', '45 gp', { weight: 3 }),
      srd('Chain Shirt', '50 gp', { weight: 2 }),
      srd('Scale Mail', '50 gp', { weight: 2 }),
      srd('Breastplate', '400 gp', { weight: 1 }),
      srd('Ring Mail', '30 gp', { weight: 2 }),
      srd('Chain Mail', '75 gp', { weight: 2 }),
      srd('Splint Armor', '200 gp', { weight: 1 }),
      srd('Plate Armor', '1,500 gp', { notes: 'Commission — weeks', weight: 1 }),
      axium('Shield Strap'),
      axium('Spare Buckle'),
      axium('Arming Cap'),
      axium('Helmet Pad'),
      axium('Quilted Liner'),
      axium('Repair Patch (leather)'),
      axium('Bracer Laces'),
      axium('Fitting Chalk'),
      axium('Shield Boss Cover'),
      axium('Waxed Thread'),
      axium('Polish Cloth'),
      axium('Rivet Tin'),
      axium('Rust Scraper'),
      axium('Lanolin Pot')
    ],
    services: [
      'Repair — half the list price, a day in the shop',
      'Refit a suit they already own — 5 gp',
      'Shield strap and polish — 2 sp',
      'Rush work — double, ready tonight'
    ]
  },
  Weapons: {
    id: 'Weapons',
    title: 'Weapons',
    tagline: 'Steel on the rack, oil on the cloth.',
    pick: { min: 8, max: 12 },
    always: [
      srd('Dagger', '2 gp'),
      srd('Arrows (20)', '1 gp'),
      axium('Shop Whetstone'),
      axium('Blade Oil (vial)')
    ],
    stock: [
      srd('Club', '1 sp', { weight: 2 }),
      srd('Handaxe', '5 gp', { weight: 3 }),
      srd('Javelin', '5 sp', { weight: 2 }),
      srd('Light Hammer', '2 gp', { weight: 2 }),
      srd('Mace', '5 gp', { weight: 3 }),
      srd('Quarterstaff', '2 sp', { weight: 2 }),
      srd('Spear', '1 gp', { weight: 3 }),
      srd('Shortbow', '25 gp', { weight: 2 }),
      srd('Light Crossbow', '25 gp', { weight: 2 }),
      srd('Bolts (20)', '1 gp', { weight: 2 }),
      srd('Battleaxe', '10 gp', { weight: 3 }),
      srd('Longsword', '15 gp', { weight: 3 }),
      srd('Shortsword', '10 gp', { weight: 3 }),
      srd('Warhammer', '15 gp', { weight: 2 }),
      srd('Rapier', '25 gp', { weight: 2 }),
      srd('Scimitar', '25 gp', { weight: 2 }),
      srd('Greataxe', '30 gp', { weight: 1 }),
      srd('Greatsword', '50 gp', { weight: 1 }),
      srd('Longbow', '50 gp', { weight: 2 }),
      srd('Heavy Crossbow', '50 gp', { weight: 1 }),
      srd('Whip', '2 gp', { weight: 1 }),
      axium('Leather Grip Wrap'),
      axium('Axe Wedge'),
      axium('Hilt Pins (set)'),
      axium('Oilcloth Wrap'),
      axium('Spare Crossguard'),
      axium('Scabbard (plain)'),
      axium('Sword Belt'),
      axium('Sheath (knife)'),
      axium('Bowstring (spare)'),
      axium('String Wax'),
      axium('Quiver Strap'),
      axium('Fletching Kit (small)'),
      axium('Bolt Case Liner'),
      axium('Spear Butt'),
      axium('Bowstringer')
    ],
    services: [
      'Sharpen and oil — 2 sp',
      'Refit a grip or strap — 5 sp',
      'Identify what they’re carrying (no charge if they buy)',
      'Special order — a week, extra coin'
    ]
  },
  Stables: {
    id: 'Stables',
    title: 'Stables',
    tagline: 'Tack on the wall, hay in the loft, coin for a stall.',
    pick: { min: 5, max: 8 },
    always: [
      srd('Feed (per day)', '5 cp'),
      srd('Saddle (Riding)', '10 gp'),
      axium('Hay Bale'),
      axium('Bit and Bridle')
    ],
    stock: [
      axium('Draft Horse', { notes: 'Ask which one' }),
      axium('Riding Horse', { notes: 'Ask which one' }),
      axium('Pony'),
      axium('Mule'),
      srd('Saddle (Military)', '20 gp', { weight: 1 }),
      axium('Saddlebags'),
      axium('Cart'),
      axium('Pack Harness'),
      axium('Lead Rope'),
      axium('Curry Comb'),
      axium('Hoof Pick'),
      axium('Horse Blanket'),
      axium('Nosebag'),
      axium('Hobbles'),
      axium('Farrier Nails (dozen)'),
      axium('Oats (sack)'),
      axium('Water Bucket'),
      srd('Rations (1 day)', '5 sp', { weight: 2 })
    ],
    services: [
      'Boarding — 5 sp a night',
      'Grooming and new shoes — 1 gp',
      'A spare mount for a day — 2 gp (they want it back)',
      'They will not sell the grey mare'
    ]
  },
  'General Store': {
    id: 'General Store',
    title: 'General Store',
    tagline: 'Rope, rations, and whatever the last caravan left.',
    pick: { min: 8, max: 12 },
    always: [
      srd('Torch', '1 cp'),
      srd('Rations (1 day)', '5 sp'),
      axium('Tallow Candles (5)'),
      axium('Twine Ball')
    ],
    stock: [
      srd('Backpack', '2 gp', { weight: 3 }),
      srd('Bedroll', '1 gp', { weight: 3 }),
      srd('Blanket', '5 sp', { weight: 2 }),
      srd('Waterskin', '2 sp', { weight: 3 }),
      srd('Rope, hempen (50 feet)', '1 gp', { weight: 3 }),
      srd('Tinderbox', '5 sp', { weight: 3 }),
      srd('Crowbar', '2 gp', { weight: 2 }),
      srd('Hammer', '1 gp', { weight: 2 }),
      srd('Piton', '5 cp', { weight: 2 }),
      srd('Lantern, Hooded', '5 gp', { weight: 2 }),
      srd('Lamp oil (flask)', '1 sp', { weight: 2 }),
      srd('Tent', '2 gp', { weight: 1 }),
      srd('Pouch', '5 sp', { weight: 2 }),
      srd('Clothes, Common', '5 sp', { weight: 2 }),
      srd("Clothes, Traveler's", '2 gp', { weight: 2 }),
      srd('Soap', '2 cp', { weight: 1 }),
      srd("Mess Kit", '2 sp', { weight: 1 }),
      axium('Hardtack (week)'),
      axium('Salt Pouch'),
      axium('Honey Jar'),
      axium('Road Skin of Ale'),
      axium('Sewing Kit'),
      axium('Clay Mug'),
      axium('Salt Box'),
      axium('Lye Cake'),
      axium('Parcel Paper (sheet)'),
      axium('Needle Tin'),
      axium('Extra Shirt'),
      axium('Wool Socks'),
      axium('Rain Cape'),
      axium('Walking Stick'),
      axium('Charm String'),
      axium('Chalk Sticks (3)'),
      axium('Dry Rags (bundle)'),
      axium('Ink Horn (empty)')
    ],
    services: [
      'Hold a parcel for a named person — 1 sp',
      'Buy used gear at a third of list',
      'They can send to the next town — a week, 5 sp'
    ]
  },
  Apothecary: {
    id: 'Apothecary',
    title: 'Apothecary',
    tagline: 'Bitters, balms, and a drawer that stays locked.',
    pick: { min: 6, max: 10 },
    always: [srd("Healer's Kit", '5 gp'), axium('Wound Salve'), axium('Dried Feverfew')],
    stock: [
      srd('Antitoxin (Vial)', '50 gp', { weight: 2 }),
      srd('Potion of Healing', '50 gp', { weight: 3 }),
      srd("Herbalism Kit", '5 gp', { weight: 2 }),
      srd("Alchemist's Supplies", '50 gp', { weight: 1 }),
      srd('Holy Water (flask)', '25 gp', { weight: 1 }),
      axium('Willow Bark (pouch)'),
      axium('Dried Chamomile'),
      axium('Mint Bundle'),
      axium('Comfrey Leaf'),
      axium('Garlic Braid'),
      axium('Charcoal Powder'),
      axium('Empty Vials (3)'),
      axium('Sleeping Draught', { notes: 'One night, no questions' }),
      axium('Bitter Draught'),
      axium('Stomach Bitters'),
      axium('Calm Tonic'),
      axium('Eye Wash'),
      axium('Smelling Salts'),
      axium('Burn Butter'),
      axium('Lip Balm'),
      axium('Leech Jar'),
      food('Something in the locked drawer', '—', { notes: 'They will not name a price', weight: 1 })
    ],
    services: [
      'Identify a vial or herb — 1 gp',
      'Sit with a poisoned patient — 5 gp',
      'They do not sell love philters — they say'
    ]
  },
  Forge: {
    id: 'Forge',
    title: 'Forge',
    tagline: 'The hammer talks louder than the smith.',
    pick: { min: 6, max: 10 },
    always: [srd("Smith's Tools", '20 gp'), srd('Hammer', '1 gp'), axium('Nails (20)'), axium('Charcoal Sack')],
    stock: [
      srd('Dagger', '2 gp', { weight: 3 }),
      srd('Handaxe', '5 gp', { weight: 3 }),
      srd('Mace', '5 gp', { weight: 2 }),
      srd('Longsword', '15 gp', { weight: 2 }),
      srd('Battleaxe', '10 gp', { weight: 2 }),
      srd('Warhammer', '15 gp', { weight: 2 }),
      srd('Shield', '10 gp', { weight: 2 }),
      srd('Chain Shirt', '50 gp', { weight: 1 }),
      srd('Crowbar', '2 gp', { weight: 2 }),
      srd('Piton', '5 cp', { weight: 2 }),
      axium('Iron Spike Set (10)'),
      axium('Iron Bar'),
      axium('Copper Bar'),
      axium('Wire Coil'),
      axium('Horseshoe (pair)'),
      axium('Hinge Pair'),
      axium('Chain (5 feet)'),
      axium('Quenching Oil (flask)'),
      axium('Tongs (spare)'),
      axium('File'),
      axium('Padlock (plain)'),
      axium('Punch and Drift'),
      axium('Grindstone Grit'),
      axium('Leather Apron (used)'),
      axium('Sparks Tin')
    ],
    services: [
      'Repair weapons and armor — half the list, a day',
      'Straighten a bent blade — 1 gp',
      'Melt down scrap for credit',
      'Commission work — name the piece, wait a week'
    ]
  },
  Market: {
    id: 'Market',
    title: 'Market',
    tagline: 'Stalls, noise, and a price that moves if you linger.',
    pick: { min: 8, max: 12 },
    always: [srd('Rations (1 day)', '5 sp'), axium('Hearth Bread (loaf)'), axium('Roast Nuts (paper)')],
    stock: [
      srd('Torch', '1 cp', { weight: 3 }),
      srd('Rope, hempen (50 feet)', '1 gp', { weight: 2 }),
      srd('Waterskin', '2 sp', { weight: 2 }),
      srd('Pouch', '5 sp', { weight: 2 }),
      srd('Clothes, Common', '5 sp', { weight: 2 }),
      srd('Blanket', '5 sp', { weight: 2 }),
      srd('Soap', '2 cp', { weight: 2 }),
      srd('Ink Pen', '2 cp', { weight: 1 }),
      srd('Paper (one sheet)', '2 sp', { weight: 1 }),
      srd('Dagger', '2 gp', { weight: 1 }),
      axium('Dried Apples (pouch)'),
      axium("Farmer's Cheese (wheel)"),
      axium("Traveler's Pie"),
      axium('Hard Cheese (wedge)'),
      axium('Honey Jar'),
      axium('Oatcakes (3)'),
      axium('Lucky Charm', { notes: 'Probably not' }),
      axium('Ribbon (yard)'),
      axium('Wooden Whistle'),
      axium('Clay Beads (string)'),
      axium('Dried Flowers (bunch)'),
      axium('Pickled Vegetables (jar)'),
      axium('Fairing Cake'),
      axium('Cheap Mirror'),
      axium('Bone Dice (pair)'),
      axium('Straw Hat'),
      axium('Cooking Herbs (bunch)'),
      axium('Kitchen Knife'),
      axium('Honeycomb (piece)')
    ],
    services: [
      'They will haggle',
      'A boy will carry parcels across town — 2 cp',
      'Someone here knows a rumour for a drink'
    ]
  },
  Temple: {
    id: 'Temple',
    title: 'Temple',
    tagline: 'Offerings at the rail; mercy if the plate is full.',
    pick: { min: 6, max: 10 },
    always: [
      srd('Holy Water (flask)', '25 gp'),
      srd("Healer's Kit", '5 gp'),
      axium('Votive Candle'),
      axium('Clean Bandages (10)')
    ],
    stock: [
      srd('Potion of Healing', '50 gp', { notes: 'If they have one', weight: 2 }),
      srd('Antitoxin (Vial)', '50 gp', { weight: 1 }),
      axium('Tithe Taper'),
      axium('Incense Stick'),
      axium('Incense Bundle'),
      axium('Altar Oil (vial)'),
      axium('Blessed Salt (pouch)'),
      axium('Offering Bowl'),
      axium('Flower Wreath'),
      axium('Prayer Beads'),
      axium('Faith Token'),
      axium('Wooden Charm'),
      axium('Pilgrim Badge'),
      axium('Scripture Copy (page)'),
      axium('Plain Cowl'),
      axium('Aspergillum'),
      axium('Temple Wine (cup)'),
      axium('Hearth Wafers (3)'),
      axium('Pilgrim Meal'),
      axium('Splints and Linen'),
      axium('Mercy Balm'),
      axium('Fever Tea'),
      axium('Hospice Tonic'),
      axium('Stitching Kit'),
      axium('Bitter Purge'),
      axium('Burial Shroud'),
      axium('Grave Candles (4)'),
      axium('Mourning Cloth')
    ],
    services: [
      'Wash and bind a wound — 5 sp',
      'Hospice cot, one night — 3 sp (or an offering)',
      'Sit a fever till dawn — 1 gp',
      'Stitch a cut (they use the house kit) — 1 gp',
      'Administer antitoxin and watch — 5 gp plus the vial',
      'Anoint the dying — 1 gp',
      'Burial rites and a shroud — 2 gp',
      'Naming, marriage, or a blessing on the road — 5 sp',
      'Sanctuary till morning, no questions — 5 gp',
      'Petition the altar for a miracle — they name a price, or refuse'
    ]
  }
}
