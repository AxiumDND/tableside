# Tableside — AI campaign import

Hand this file to an agent converting a vault, Obsidian folder, or loose notes into a Tableside campaign. Humans: [CAMPAIGN.md](CAMPAIGN.md) and [MARKDOWN.md](MARKDOWN.md).

Tableside is a **local folder of Markdown**. No account. The DM laptop is the console; a second monitor shows images only.

**Target app version: 1.7.2+.** Night sheets use structured **combat** and **treasure** blocks (party auto-roster, item/monster lookup that copies into Gear / Bestiary). Prefer the formats below so Edit on a block works without hand-editing fences.

## Rules

- One note = one thing (one PC, NPC, place, shop, faction, monster, map, gear item).
- Wikilinks resolve by **filename stem**, not folder. `[[Kay Himmel]]` opens `Kay Himmel.md` anywhere. Prefer unique stems.
- Keep existing stems if the vault already uses `[[dash-names]]`. Do not rename files and leave old links.
- Portraits live in that folder’s `Art/`, named like the sheet: `NPCs/Art/Orson Fairweather.webp`.
- Battlemaps go in `Maps/` (note + `Art/` image). Gazetteer towns/shops go in `Places/`. People go in `NPCs/`, not on the shop page.
- Published book dumps stay local. Put them in a folder named `Adventure book…` or `zz_…` so the file tree hides them. Never copy book text into a public repo.
- Book Lookup (PHB/DMG dumps) is **not** part of the campaign. That is `%APPDATA%\Tableside\Additional Books`.
- On game night sheets, prefer **fenced** callouts (`[!scene]…[!/scene]`) over `> [!scene]` quote callouts. Nest combat/treasure/read-aloud inside scenes.

## Root files

`campaign.json` (required for a named pack; hidden in the tree):

```json
{
  "name": "Campaign Name",
  "system": "dnd5e",
  "theme": "classic",
  "currencies": [
    { "id": "platinum", "label": "Platinum", "abbr": "pp" },
    { "id": "gold", "label": "Gold", "abbr": "gp" },
    { "id": "silver", "label": "Silver", "abbr": "sp" },
    { "id": "copper", "label": "Copper", "abbr": "cp" }
  ]
}
```

`system` is `dnd5e` | `pf2e` | `v5`. Missing field = 5e. Do not change mid-campaign.

`theme` is the DM console look: `classic` | `light` | `scifi` | `vampire` | `cyberpunk` | `matrix`. Missing field = Classic fantasy.

`currencies` is optional. Omit it to use classic pp/gp/sp/cp. Edit later in **Help & settings → Currencies**. Treasure coin boxes follow this list. Sci-fi / other systems may rename abbreviations (e.g. credits).

`combat.json` is live initiative. Leave it alone or omit it. `audio.json` is mixer volumes — omit it.

## Folder tree

Create these names (case-insensitive). The app fills missing empty folders on open.

```
campaign.json
Start Here/          hub — Overview.md opens first
Sessions/            prep + game night sheets (+ Art/)
Party/               PC sheets (+ Art/)
NPCs/                named people (+ Art/)
Bestiary/            creatures (+ Art/)
Places/              towns, sites, shops (+ Art/)
Factions/            guilds, churches, cults (+ Art/)
Spells/              campaign spell copies (+ Art/)
Gear/Weapons|Armor|Equipment|Trade Goods|Magic Items/   (+ Art/ each)
Maps/                map notes; Art/ images; Print/ PDFs
Handouts/            letters, props (+ Art/)
Audio/Music|Ambience|Sfx/   user audio only; do not add copyrighted tracks
Reference/           rules, trackers
Archive/             transcripts, old drafts, YouTube text
```

**Aliases** (treated as the canonical folder): `Player characters` / `PCs` / `The Party` → Party; `Locations` / `World` / `Setting` → Places; `Session Notes` → Sessions; `Assets` → Maps; `Getting Started` → Start Here.

**Skip** (not shown): `.obsidian`, `.git`, `Additional Books`, folders starting `zz_` or `Adventure book`.

**Nesting:** stay flat unless a town has many sites (`Places/Emberwood.md` + `Places/Emberwood/The Grey Mare.md`).

**Art:** rename `zimages`, `assets`, `images` sidecars to `Art/`. Copy a portrait to the sheet stem if the file is `kay.webp` and the note is `Kay Himmel.md`. Keep `* token.webp` as extras; they do not auto-attach.

## Markdown every sheet uses

```markdown
# Display title

[!pc]
![[Same Stem As Filename.webp]]

### *One-line tagline*

| | |
|---|---|
| **Key** | Value with [[Wikilinks]] |
[!/pc]

```statblock
layout: Basic 5e Layout
name: Same Stem As Filename
ac: 15
hp: 44
stats: [16, 12, 14, 10, 12, 10]
```

*Two sentences the DM needs at the table.*

[!readaloud]
Spoken text.
[!/readaloud]

[!gmonly]
Secrets.
[!/gmonly]
```

Sheet header fences may also be `[!npc]`, `[!monster]`, `[!place]`, `[!shop]`, `[!faction]`, `[!gear]`, `[!spell]`, or legacy `[!infobox]`. Quote-callout `> [!infobox]+` still works.

- `layout` is `Basic 5e Layout` / `Basic PF2e Layout` / `Basic V5 Layout`. Combat needs `name`, `ac`, `hp`. `stats` is STR DEX CON INT WIS CHA.
- Images: `![[file.webp]]`. Notes: `[[Stem]]` or `[[Stem|alias]]`.
- Hide empty template rows. Do not leave `*placeholder*` text or stub names like `[[Monster Name]]`, `[[Item Name]]`, `[[Magic Item]]`.

## Where each file goes

| Source looks like | Put it in | Sheet kind |
| --- | --- | --- |
| PC / character sheet | `Party/` | player |
| Named person, shopkeep, villain | `NPCs/` | npc |
| Monster, generic enemy, encounter stat dump | `Bestiary/` | monster |
| Town, dungeon-as-place, wilderness | `Places/` | place |
| Inn, stall, forge, temple-as-shop | `Places/` | shop |
| Guild, church, house, cult | `Factions/` | faction |
| Battlemap / tactical image | `Maps/` + `Maps/Art/` | map |
| Spell the table will edit | `Spells/` | spell |
| Weapon / armor / mundane gear | `Gear/Weapons` · `Armor` · `Equipment` · `Trade Goods` | gear |
| Magic item | `Gear/Magic Items` | gear |
| Tonight’s run (scenes + fight list) | `Sessions/` | nightsheet or plain note |
| Recap, transcript, YouTube blurb | `Archive/` | plain note |
| Haze rules, house rules | `Reference/` | plain note |
| Hub, flowchart, live hooks | `Start Here/` | plain note + `Overview.md` |

Shop = place note + proprietor NPC, linked both ways. Faction members stay NPCs; HQ is a Place.

When converting loot lists: put real item sheets under the matching `Gear/…` subfolder so night-sheet treasure `[[Wikilinks]]` resolve (and hover previews work). The DM can also **Add item…** on a treasure card — that searches Gear + SRD/books and copies missing items into Gear.

## Infobox fields by kind

Keep the table small. Extra rows are fine.

| Kind | Rows |
| --- | --- |
| Player | Player, Species, Class, Background, Alignment, Role, AC, HP |
| NPC | Role, Faction, Location, Status, CR |
| Monster | CR, Role, Source |
| Place | Type, Region, Ruler / faction, Map, Mood |
| Shop | Type, Place, Proprietor, Hours, Attitude, Standing, Map |
| Faction | Type, Leader, HQ, Attitude |
| Spell | Casting Time, Range, Components, Duration (tagline = level + school) |
| Gear | Weight, Cost, Rarity, Attunement, Damage, Properties |

Shop **Type** should be a recognizable stock word when you can: Tavern, Armorer, Weapons, General Store, Apothecary, Stables, Temple, Forge.

## Map note

Only maps get a `map` fence. Image in `Maps/Art/`.

````markdown
# Crypt Level 1

```map
image: Crypt Level 1.webp
pins: []
pinsLocked: true
```

## Room A
````

Pins/tokens/fog can be added in the app. Do not invent pin coordinates unless you have them.

## Game night sheets

A **game night sheet** is Party + Scenes (not a wall of prose). Right-click **Sessions** → **New game night sheet…**. Split long story into `Session N.md`; keep numbers on `Session N — Game Night Sheet.md`.

### Scene block

```markdown
[!scene] Opening — name the beat
![[Optional art.webp]]

What could happen in one or two lines.

[!readaloud]
Spoken text.
[!/readaloud]

[!gmonly]
Only you.
[!/gmonly]

[!treasure] Cache — name the find
**Coin:** 12 gp · 40 sp · … pp · … cp
**Mundane:**
- [[Rope]]
**Magic:**
- [[Cloak of Elvenkind]] (attunement)
**Hidden:**
**Notes:**
[!/treasure]

[!combat] Combat 1 — name the encounter
**Combatants:** [[Wolf]] ×2 · party

- Telegraph:
- Cut if running long:
[!/combat]

**At the table** (optional):
- Place: [[Place Name]]
- Map: [[Map Name]]
- Checks: Perception DC 14
- Music: General / Creepy / Combat
[!/scene]
```

Do **not** nest another `scene`, `party`, `crawl`, or `legend` inside a scene.

### Combat block (1.7+)

Aliases: `encounter`, `fight`. Skip titles that say `no combat`.

```markdown
[!combat] Combat 1 — Rat's Nest door
**Combatants:** [[Ratling]] ×4 · [[Oscar-Yoren]] · party
[!/combat]
```

- Always include `party` unless the fight truly excludes PCs. The app treats `party` as every `Party/` sheet (roster notes skipped).
- Foes are `[[Bestiary or NPC stem]]` with optional `×N` / `xN`. Separators: `·` `|` `,` `;`.
- Put only real stems — never `[[Monster Name]]`.
- At the table the DM can **Edit** the block → **Add combatant…** (NPCs + Bestiary + SRD/books). Missing SRD monsters are copied into `Bestiary/` without leaving the sheet.
- Legacy `#` / `##` headings matching `combat` / `encounter` / `⚔` still feed initiative.

### Treasure block (1.7+)

Aliases: `loot`, `hoard`.

```markdown
[!treasure] Cache — hearth stones
**Coin:** 2 pp · 40 gp · … sp · 5 cp
**Mundane:**
- [[Rope]]
- [[Traveler's Clothes]]
**Magic:**
- [[Cloak of Elvenkind]] (attunement)
**Hidden:** Investigation DC 14
**Notes:**
Under the hearth.
[!/treasure]
```

- Coin abbreviations must match `campaign.json` `currencies` (or defaults). Use `…` for empty denominations.
- Mundane = weapons / armor / equipment / trade goods. Magic = magic items. Prefer `[[Gear stem]]` links.
- Leave `**Hidden:**` blank if unused (do not leave the template stub “Perception / Investigation DC …” as filler).
- Never leave `[[Item Name]]` or `[[Magic Item]] (attunement?) — …` stubs.
- At the table: **Edit** → **Add item…** searches Gear + SRD/books and copies missing items into the correct `Gear/…` subfolder.

### Other useful blocks

| Fence | Use |
| --- | --- |
| `[!party]` | Night-sheet PC list (`- [[PC — Name\|Alias]]`) |
| `[!links]` | Auto TOC of other blocks on the sheet |
| `[!note]` / `[!abstract]` | Short text / summary |
| `[!crawl]` / `[!legend]` | Player TV openings (Sci-fi / campfire) |
| `[!gallery]` / `[!video]` | Player slideshow / clip |

## Start Here/Overview.md

Short hub only: party wikilinks, current place, faction list, tonight’s session, 3–5 plot links. No book chapters.

## Conversion checklist

1. Write `campaign.json` (`name`, `system`, `theme`; optional `currencies`). Create the standard folders including `Gear/…` subfolders.
2. Sort files with the table above. Move transcripts to `Archive/`.
3. Rename image sidecars to `Art/`. Match portrait filenames to sheet stems.
4. Give Party / NPC / Bestiary notes a typed sheet header + `statblock` with AC/HP.
5. Give Places / Shops / Factions a sheet header and wikilinks to people and sites.
6. Put loot items under the matching `Gear/` subfolder; link them from treasure blocks.
7. Point every `![[…]]` at a real image filename.
8. Fix broken `[[links]]` or keep stems so old links still resolve.
9. Build game night sheets with `[!scene]` nests: real `[!combat]` (`… · party`) and `[!treasure]` (no stubs).
10. **Open campaign** on the folder. Confirm Party under Add all players, portraits show, maps open as maps, treasure/combat Edit lookups resolve.

Do **not**: dump a city onto one page; put battlemaps in Places; put shopkeepers only on the shop note; ship copyrighted book text; edit `system` after people have sheets; leave `[[Monster Name]]` / `[[Item Name]]` placeholders in live sheets.
