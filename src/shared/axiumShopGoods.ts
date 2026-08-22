import type { TradeGood, TradeGoodGroup } from './tradeGoods'

function g(
  slug: string,
  name: string,
  group: TradeGoodGroup,
  price: string,
  weight: string,
  desc: string,
  rarity: number
): TradeGood {
  return { id: `axium-${slug}`, name, group, price, weight, desc, rarity }
}

/** Fitted leather, straps, and rust-care. SRD armor stays on the rack separately. */
export const ARMORER_GOODS: TradeGood[] = [
  g('leather-straps', 'Leather Straps (set)', 'Fitting', '5 sp', '1 lb.', 'Spare belts and ties, cut to length.', 4),
  g('shield-strap', 'Shield Strap', 'Fitting', '2 sp', '—', 'A new grip-strap for a battered shield.', 4),
  g('spare-buckle', 'Spare Buckle', 'Fitting', '3 sp', '—', 'Iron, sized for belts and harness.', 3),
  g('arming-cap', 'Arming Cap', 'Fitting', '8 sp', '½ lb.', 'Quilted cap worn under a helm.', 3),
  g('helmet-pad', 'Helmet Pad', 'Fitting', '5 sp', '—', 'Wool padding for a helm that rattles.', 3),
  g('quilted-liner', 'Quilted Liner', 'Fitting', '1 gp', '1 lb.', 'Fresh padding for a jerkin or jack.', 2),
  g('repair-patch-leather', 'Repair Patch (leather)', 'Fitting', '5 sp', '—', 'Waxed leather for a torn jack.', 4),
  g('bracer-laces', 'Bracer Laces', 'Fitting', '2 sp', '—', 'Spare laces, already cut.', 3),
  g('fitting-chalk', 'Fitting Chalk', 'Fitting', '2 cp', '—', 'Marks where a plate pinches.', 2),
  g('shield-boss-cover', 'Shield Boss Cover', 'Fitting', '8 sp', '—', 'A leather hood for a dented boss.', 1),
  g('waxed-thread', 'Waxed Thread', 'Care', '3 sp', '—', 'Heavy thread for stitching hide.', 3),
  g('armor-oil', 'Armor Oil (flask)', 'Care', '1 gp', '1 lb.', 'Keeps mail from rusting if you use it.', 4),
  g('polish-cloth', 'Polish Cloth', 'Care', '2 sp', '—', 'An oiled rag. Smells of lanolin.', 3),
  g('rivet-tin', 'Rivet Tin', 'Care', '1 gp', '½ lb.', 'Spare rivets and a punch.', 2),
  g('rust-scraper', 'Rust Scraper', 'Care', '4 sp', '½ lb.', 'A small blade for scale and mail.', 2),
  g('lanolin-pot', 'Lanolin Pot', 'Care', '5 sp', '½ lb.', 'For boiled leather that has gone stiff.', 3)
]

/** Stones, oil, scabbards, and bow tackle. SRD weapons stay on the rack separately. */
export const WEAPON_GOODS: TradeGood[] = [
  g('shop-whetstone', 'Shop Whetstone', 'Edge', '1 sp', '1 lb.', 'Coarser than a pocket stone. They use it on the rack.', 4),
  g('blade-oil', 'Blade Oil (vial)', 'Edge', '5 sp', '—', 'A thin film against rust.', 4),
  g('leather-grip-wrap', 'Leather Grip Wrap', 'Edge', '3 sp', '—', 'Cord and glue for a slick hilt.', 3),
  g('axe-wedge', 'Axe Wedge', 'Edge', '2 sp', '—', 'Hardwood wedge to reset a loose head.', 3),
  g('hilt-pins', 'Hilt Pins (set)', 'Edge', '5 sp', '—', 'Iron pins to re-seat a rattling pommel.', 2),
  g('oilcloth-wrap', 'Oilcloth Wrap', 'Edge', '3 sp', '½ lb.', 'For a blade they mean to store.', 3),
  g('spare-crossguard', 'Spare Crossguard', 'Edge', '2 gp', '½ lb.', 'They will fit it if the tang allows.', 1),
  g('plain-scabbard', 'Scabbard (plain)', 'Tackle', '8 sp', '1 lb.', 'Leather, unadorned. Fits a short blade.', 4),
  g('sword-belt', 'Sword Belt', 'Tackle', '1 gp', '1 lb.', 'Belt and frog. Not fancy.', 3),
  g('knife-sheath', 'Sheath (knife)', 'Tackle', '4 sp', '—', 'Simple leather for a dagger.', 3),
  g('spare-bowstring', 'Bowstring (spare)', 'Tackle', '5 sp', '—', 'Waxed, coiled. Shortbow or longbow.', 4),
  g('string-wax', 'String Wax', 'Tackle', '2 sp', '—', 'Beeswax cake for strings and leather.', 3),
  g('quiver-strap', 'Quiver Strap', 'Tackle', '3 sp', '—', 'Replacement baldric ring and strap.', 3),
  g('fletching-kit', 'Fletching Kit (small)', 'Tackle', '1 gp', '½ lb.', 'Glue, feathers, a knife.', 2),
  g('bolt-case-liner', 'Bolt Case Liner', 'Tackle', '4 sp', '—', 'Felt for a rattling case.', 2),
  g('spear-butt', 'Spear Butt', 'Tackle', '5 sp', '1 lb.', 'Iron shoe for a shaft.', 2),
  g('bowstringer', 'Bowstringer', 'Tackle', '8 sp', '—', 'A hooked tool so they do not twist the limbs.', 1)
]

/** Mounts, tack, and feed sacks. SRD saddles and daily feed stay listed separately. */
export const STABLE_GOODS: TradeGood[] = [
  g('draft-horse', 'Draft Horse', 'Mount', '50 gp', '—', 'Broad, slow, and already shod. Ask which one.', 3),
  g('riding-horse', 'Riding Horse', 'Mount', '75 gp', '—', 'Sound wind. No tricks they admit.', 4),
  g('pony', 'Pony', 'Mount', '30 gp', '—', 'Sure-footed. The children name them.', 3),
  g('mule', 'Mule', 'Mount', '8 gp', '—', 'Will carry more than it should. Bites.', 4),
  g('bit-and-bridle', 'Bit and Bridle', 'Tack', '2 gp', '1 lb.', 'Plain iron, worn leather.', 4),
  g('saddlebags', 'Saddlebags', 'Tack', '4 gp', '8 lb.', 'Two pouches and a strap over the seat.', 4),
  g('cart', 'Cart', 'Tack', '15 gp', '—', 'Two wheels. They do not guarantee the axle.', 2),
  g('pack-harness', 'Pack Harness', 'Tack', '5 gp', '10 lb.', 'For a mule that is not saddled.', 2),
  g('lead-rope', 'Lead Rope', 'Tack', '2 sp', '2 lb.', 'Hemp, a ring at one end.', 4),
  g('curry-comb', 'Curry Comb', 'Tack', '5 sp', '½ lb.', 'For mud and winter coat.', 3),
  g('hoof-pick', 'Hoof Pick', 'Tack', '3 sp', '—', 'Iron. They will show you how if you ask.', 3),
  g('horse-blanket', 'Horse Blanket', 'Tack', '1 gp', '4 lb.', 'Wool, patched.', 3),
  g('nosebag', 'Nosebag', 'Tack', '2 sp', '1 lb.', 'For grain on the road.', 3),
  g('hobbles', 'Hobbles', 'Tack', '8 sp', '1 lb.', 'Leather. For a horse that wanders.', 2),
  g('farrier-nails', 'Farrier Nails (dozen)', 'Tack', '5 sp', '—', 'Spare nails; they keep the hammer.', 2),
  g('oats-sack', 'Oats (sack)', 'Tack', '5 sp', '10 lb.', "A day's extra for a working horse.", 3),
  g('hay-bale', 'Hay Bale', 'Tack', '2 sp', '—', 'Overnight for one stall.', 4),
  g('water-bucket', 'Water Bucket', 'Tack', '3 sp', '2 lb.', 'Wood, iron hoops.', 3)
]

/** Household sundries and road kit the SRD list does not bother naming. */
export const STORE_GOODS: TradeGood[] = [
  g('tallow-candles', 'Tallow Candles (5)', 'Household', '5 cp', '1 lb.', 'Smoke and a short hour each.', 4),
  g('sewing-kit', 'Sewing Kit', 'Household', '5 sp', '—', 'Needles, thread, a thimble.', 3),
  g('twine-ball', 'Twine Ball', 'Household', '2 cp', '½ lb.', 'Enough to parcel a crate.', 4),
  g('clay-mug', 'Clay Mug', 'Household', '3 cp', '1 lb.', 'Unglazed. Chips if you look at it.', 3),
  g('salt-box', 'Salt Box', 'Household', '1 sp', '1 lb.', 'A pinch left in it.', 2),
  g('lye-cake', 'Lye Cake', 'Household', '5 cp', '—', 'Laundry soap. Harsher than the bar they keep for faces.', 3),
  g('parcel-paper', 'Parcel Paper (sheet)', 'Household', '1 cp', '—', 'Coarse, for wrapping.', 2),
  g('needle-tin', 'Needle Tin', 'Household', '3 sp', '—', 'Spare needles. Easy to lose.', 2),
  g('extra-shirt', 'Extra Shirt', 'Travel', '4 sp', '1 lb.', 'Unbleached. One size, roughly.', 3),
  g('wool-socks', 'Wool Socks', 'Travel', '3 sp', '—', 'Darned already. Warm.', 3),
  g('rain-cape', 'Rain Cape', 'Travel', '8 sp', '2 lb.', 'Oiled cloth, hooded.', 2),
  g('walking-stick', 'Walking Stick', 'Travel', '2 sp', '2 lb.', 'Ash. Not a quarterstaff unless they insist.', 2),
  g('charm-string', 'Charm String', 'Travel', '1 sp', '—', 'Beads and a feather. For luck, they say.', 2),
  g('chalk-sticks', 'Chalk Sticks (3)', 'Travel', '1 cp', '—', 'For doors and maps.', 3),
  g('dry-rags', 'Dry Rags (bundle)', 'Travel', '2 cp', '1 lb.', 'For boots, blades, and blood.', 3),
  g('ink-horn-empty', 'Ink Horn (empty)', 'Travel', '1 sp', '—', "They will fill it for 1 gp more.", 1)
]

/** Herbs, draughts, and salves. SRD kits and potions stay in the locked cases. */
export const APOTHECARY_GOODS: TradeGood[] = [
  g('dried-feverfew', 'Dried Feverfew', 'Herb', '5 sp', '—', 'Tea for aches. Bitter.', 4),
  g('willow-bark', 'Willow Bark (pouch)', 'Herb', '4 sp', '—', 'Chewed or steeped for pain.', 3),
  g('dried-chamomile', 'Dried Chamomile', 'Herb', '3 sp', '—', 'For sleep and stomach.', 3),
  g('mint-bundle', 'Mint Bundle', 'Herb', '2 sp', '—', 'Fresh if the season allows.', 3),
  g('comfrey-leaf', 'Comfrey Leaf', 'Herb', '5 sp', '—', 'For bruises. Do not eat a fistful.', 3),
  g('garlic-braid', 'Garlic Braid', 'Herb', '2 sp', '½ lb.', 'Kitchen and ward. They claim both.', 2),
  g('charcoal-powder', 'Charcoal Powder', 'Herb', '4 sp', '—', 'For a bad belly, in water.', 2),
  g('empty-vials', 'Empty Vials (3)', 'Herb', '3 sp', '—', 'Washed. Corks included.', 3),
  g('sleeping-draught', 'Sleeping Draught', 'Draught', '1 gp', '—', 'One night, no questions.', 3),
  g('bitter-draught', 'Bitter Draught', 'Draught', '1 gp', '—', 'Empties the stomach. Unpleasant.', 2),
  g('stomach-bitters', 'Stomach Bitters', 'Draught', '5 sp', '—', 'A tot after bad meat.', 3),
  g('calm-tonic', 'Calm Tonic', 'Draught', '8 sp', '—', 'Takes the edge off. Not magic.', 2),
  g('eye-wash', 'Eye Wash', 'Draught', '5 sp', '—', 'Salt water in a clean vial.', 2),
  g('smelling-salts', 'Smelling Salts', 'Draught', '8 sp', '—', 'Wakes the faint. Harsh.', 2),
  g('wound-salve', 'Wound Salve', 'Salve', '2 gp', '½ lb.', 'Not magic. Stings, then numbs.', 4),
  g('burn-butter', 'Burn Butter', 'Salve', '1 gp', '—', 'For hearths and kettles.', 3),
  g('lip-balm', 'Lip Balm', 'Salve', '2 sp', '—', 'Beeswax and fat. Winter stock.', 2),
  g('leech-jar', 'Leech Jar', 'Salve', '1 gp', '1 lb.', 'Live, if they kept the water.', 1)
]

/** Bars, nails, charcoal, and shop tools. SRD weapons and smith's tools stay on the pegs. */
export const FORGE_GOODS: TradeGood[] = [
  g('iron-spike-set', 'Iron Spike Set (10)', 'Metal', '1 gp', '5 lb.', 'Heavy nails by another name.', 4),
  g('nails-20', 'Nails (20)', 'Metal', '5 sp', '2 lb.', 'Common iron.', 4),
  g('iron-bar', 'Iron Bar', 'Metal', '2 gp', '10 lb.', 'Stock for a small job.', 3),
  g('copper-bar', 'Copper Bar', 'Metal', '5 gp', '5 lb.', 'For fittings, not blades.', 2),
  g('wire-coil', 'Wire Coil', 'Metal', '8 sp', '1 lb.', 'Iron wire, a few yards.', 3),
  g('horseshoe-pair', 'Horseshoe (pair)', 'Metal', '1 gp', '2 lb.', 'Unfitted. The stables fit them.', 2),
  g('hinge-pair', 'Hinge Pair', 'Metal', '8 sp', '1 lb.', 'For a chest or shutter.', 3),
  g('chain-5-feet', 'Chain (5 feet)', 'Metal', '2 gp', '5 lb.', 'Common links. Not manacles.', 2),
  g('charcoal-sack', 'Charcoal Sack', 'Work', '5 sp', '10 lb.', "A day's fire if they are careful.", 4),
  g('quenching-oil', 'Quenching Oil (flask)', 'Work', '1 gp', '1 lb.', 'They do not sell the recipe.', 2),
  g('spare-tongs', 'Tongs (spare)', 'Work', '2 gp', '3 lb.', 'Shorter than the shop set.', 2),
  g('file', 'File', 'Work', '1 gp', '1 lb.', 'For burrs and a bad edge.', 3),
  g('plain-padlock', 'Padlock (plain)', 'Work', '5 gp', '1 lb.', 'Two keys. They keep no copy, they say.', 2),
  g('punch-and-drift', 'Punch and Drift', 'Work', '1 gp', '1 lb.', 'For rivets and holes.', 2),
  g('grindstone-grit', 'Grindstone Grit', 'Work', '3 sp', '1 lb.', 'Sand in a bag.', 2),
  g('leather-apron-used', 'Leather Apron (used)', 'Work', '8 sp', '3 lb.', 'Scorched. Still thick.', 1),
  g('sparks-tin', 'Sparks Tin', 'Work', '5 sp', '—', 'Dry tinder for the hearth.', 2)
]

/** Stall notions and fair food. Inn loaves and cheese still come off the trade list. */
export const MARKET_GOODS: TradeGood[] = [
  g('lucky-charm', 'Lucky Charm', 'Stall', '5 sp', '—', 'A bead or bone. Probably not lucky.', 3),
  g('ribbon-yard', 'Ribbon (yard)', 'Stall', '2 cp', '—', 'Faded color. Children like it.', 3),
  g('wooden-whistle', 'Wooden Whistle', 'Stall', '5 cp', '—', 'Shrill. They will not take it back.', 2),
  g('clay-beads', 'Clay Beads (string)', 'Stall', '1 sp', '—', 'Painted once.', 2),
  g('dried-flowers', 'Dried Flowers (bunch)', 'Stall', '2 cp', '—', "Last week's market.", 3),
  g('pickled-vegetables', 'Pickled Vegetables (jar)', 'Stall', '3 sp', '1 lb.', 'Vinegar and whatever was cheap.', 3),
  g('roast-nuts', 'Roast Nuts (paper)', 'Stall', '2 cp', '—', 'Hot if the brazier is lit.', 4),
  g('fairing-cake', 'Fairing Cake', 'Stall', '1 cp', '—', 'Sugar if they had it.', 4),
  g('cheap-mirror', 'Cheap Mirror', 'Stall', '1 gp', '—', 'Polished metal. Distorts.', 1),
  g('bone-dice', 'Bone Dice (pair)', 'Stall', '4 sp', '—', 'They swear they are honest.', 2),
  g('straw-hat', 'Straw Hat', 'Stall', '2 sp', '—', 'For harvest sun.', 2),
  g('cooking-herbs', 'Cooking Herbs (bunch)', 'Stall', '3 cp', '—', 'Thyme or whatever is in season.', 3),
  g('kitchen-knife', 'Kitchen Knife', 'Stall', '3 sp', '½ lb.', 'Not a dagger. They will argue.', 2),
  g('honeycomb-piece', 'Honeycomb (piece)', 'Stall', '2 sp', '—', 'Drips. Attracts wasps.', 2)
]
