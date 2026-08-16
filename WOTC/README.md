# WOTC lookup files

Drop your own book text here. Table DM does **not** ship Player’s Handbook, Dungeon Master’s Guide, or other Wizards books.

When this folder has files Lookup can read, extra filter chips appear (PHB 2024, PHB Gear, DMG Items) and search includes that text. SRD 5.2.1 stays available either way.

## Where to put files

Use `.md` or `.txt`. The filename tells Lookup what it is:

| Filename contains | Lookup chip | Example filename |
| --- | --- | --- |
| `Spell` | PHB 2024 | `Players Handbook 2024 Spell List.md` |
| `Equipment` or `Gear` | PHB Gear | `Players Handbook 2024 Equipment.md` |
| `Magic Item` or `Dungeon Master` | DMG Items | `Dungeon Masters Guide 2024 Magic Items.md` |

Also scanned (same rules):

- This project folder: `WOTC/`
- Installed app: `%APPDATA%\table-dm\WOTC`
- A `WOTC` folder next to `Table DM.exe`

Restart Lookup (close and open the panel, or restart the app) after adding files.

## How to make the files

Copy from your books or D&D Beyond, then save **one entry per `##` heading**. Strip art credits, page headers, image captions, and the D&D Beyond website footer.

Use a blank line between the header block and the description. Keep field names exactly as shown (`Casting Time:`, `Rarity:`, and so on).

### Spells

Name the file something with **Spell** in it.

```markdown
# Players Handbook 2024 Spell List

## Acid Splash
Evocation Cantrip (Sorcerer, Wizard)
Casting Time: Action
Range: 60 feet
Components: V, S
Duration: Instantaneous

You create an acidic bubble at a point within range...

Cantrip Upgrade. The damage increases by 1d6 when you reach levels 5 (2d6), 11 (3d6), and 17 (4d6).

## Aid
Level 2 Abjuration (Bard, Cleric, Druid, Paladin, Ranger)
Casting Time: Action
Range: 30 feet
Components: V, S, M (a strip of white cloth)
Duration: 8 hours

Choose up to three creatures within range...

Using a Higher-Level Spell Slot. Each target’s Hit Points increase by 5 for each spell slot level above 2.
```

Rules:

- Heading is the spell name (`## Fireball`).
- Next line is school + **Cantrip (Classes)** or **Level N School (Classes)**.
- Then these fields, one per line: `Casting Time`, `Range`, `Components`, `Duration`.
- Then the body. Put **Using a Higher-Level Spell Slot.** on its own paragraph if the spell has one.

A looser dump also works if each spell name is immediately followed by that Cantrip / Level line (no `##` required), but the heading format above is the one to aim for.

### Equipment

Name the file something with **Equipment** or **Gear** in it.

```markdown
# Players Handbook 2024 Equipment

## Longsword
Simple Melee Weapons
Damage: 1d8 Slashing
Properties: Versatile (1d10)
Mastery: Sap
Weight: 3 lb.
Cost: 15 GP

## Padded Armor
Light Armor
Armor Class: 11 + Dex modifier
Stealth: Disadvantage
Weight: 8 lb.
Cost: 5 GP
Don: 1 Minute to Don or Doff

## Alchemist’s Supplies
Artisan’s Tools
Cost: 50 GP
Ability: Intelligence
Weight: 8 lb.
Utilize: Identify a substance (DC 15), or start a fire (DC 15)
Craft: Acid, Alchemist’s Fire, Component Pouch, Oil, Paper, Perfume

## Acid
Adventuring Gear
Cost: 25 GP
Weight: 1 lb.

When you take the Attack action, you can replace one of your attacks with throwing a vial of Acid...

## Coins
Rule

Characters often find coins on their adventures...
```

Rules:

- Heading is the item or rule name.
- Optional category line under the heading (`Simple Melee Weapons`, `Light Armor`, `Adventuring Gear`, `Rule`).
- Then `Field: value` lines. Recognised fields: `Damage`, `Properties`, `Mastery`, `Weight`, `Cost`, `Armor Class`, `Strength`, `Stealth`, `Don`, `Ability`, `Utilize`, `Craft`, `Variants`, `Carrying Capacity`.
- Blank line, then any extra description or markdown table.

### Magic items

Name the file something with **Magic Item** or **Dungeon Master** in it.

```markdown
# Dungeon Masters Guide 2024 Magic Items

## Alchemy Jug
Wondrous Item
Rarity: Uncommon

This ceramic jug appears to be able to hold a gallon of liquid...

| Liquid | Max. Amount |
| --- | --- |
| Acid | 8 ounces |
| Beer | 4 gallons |

## Armor of Invulnerability
Armor (Plate Armor)
Rarity: Legendary
Attunement: Requires Attunement

You have Resistance to Bludgeoning, Piercing, and Slashing damage while you wear this armor.

Metal Shell. You can take a Magic action to give yourself Immunity...
```

Rules:

- Heading is the item name (`## Alchemy Jug`). `Ammunition, +1, +2, or +3` is fine as a name.
- Next line is the type: `Wondrous Item`, `Armor (...)`, `Weapon (...)`, `Potion`, `Ring`, `Rod`, `Staff`, `Wand`, or `Scroll`.
- Then `Rarity:` (`Common`, `Uncommon`, `Rare`, `Very Rare`, `Legendary`, `Artifact`, or a mix like `Uncommon (+1), Rare (+2), or Very Rare (+3)`).
- Then `Attunement:` if it needs it (`Requires Attunement` or `Requires Attunement by a Dwarf`).
- Blank line, then the body. Markdown tables are OK.

## Checklist

1. Save as `.md` in this folder (or `%APPDATA%\table-dm\WOTC`).
2. Put **Spell**, **Equipment**, or **Magic Item** in the filename.
3. One `##` heading per entry.
4. Field names match the examples above, including the colon.
5. Open Lookup — a new chip should appear, and a search for the first entry should find it.
