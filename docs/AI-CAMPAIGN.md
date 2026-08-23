# Tableside — AI campaign import

Hand this file to an agent converting a vault, Obsidian folder, or loose notes into a Tableside campaign. Humans: [CAMPAIGN.md](CAMPAIGN.md) and [MARKDOWN.md](MARKDOWN.md).

Tableside is a **local folder of Markdown**. No account. The DM laptop is the console; a second monitor shows images only.

## Rules

- One note = one thing (one PC, NPC, place, shop, faction, monster, map).
- Wikilinks resolve by **filename stem**, not folder. `[[Kay Himmel]]` opens `Kay Himmel.md` anywhere. Prefer unique stems.
- Keep existing stems if the vault already uses `[[dash-names]]`. Do not rename files and leave old links.
- Portraits live in that folder’s `Art/`, named like the sheet: `NPCs/Art/Orson Fairweather.webp`.
- Battlemaps go in `Maps/` (note + `Art/` image). Gazetteer towns/shops go in `Places/`. People go in `NPCs/`, not on the shop page.
- Published book dumps stay local. Put them in a folder named `Adventure book…` or `zz_…` so the file tree hides them. Never copy book text into a public repo.
- Book Lookup (PHB/DMG dumps) is **not** part of the campaign. That is `%APPDATA%\Tableside\Additional Books`.

## Root files

`campaign.json` (required for a named pack; hidden in the tree):

```json
{ "name": "Campaign Name", "system": "dnd5e" }
```

`system` is `dnd5e` | `pf2e` | `v5`. Missing field = 5e. Do not change mid-campaign.

`combat.json` is live initiative. Leave it alone or omit it.

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
Reference/           rules, trackers
Archive/             transcripts, old drafts, YouTube text
```

**Aliases** (treated as the canonical folder): `Player characters` / `PCs` / `The Party` → Party; `Locations` / `World` / `Setting` → Places; `Session Notes` → Sessions; `Assets` → Maps; `Getting Started` → Start Here.

**Skip** (not shown): `.obsidian`, `.git`, `WOTC`, `Additional Books`, folders starting `zz_` or `Adventure book`.

**Nesting:** stay flat unless a town has many sites (`Places/Emberwood.md` + `Places/Emberwood/The Grey Mare.md`).

**Art:** rename `zimages`, `assets`, `images` sidecars to `Art/`. Copy a portrait to the sheet stem if the file is `kay.webp` and the note is `Kay Himmel.md`. Keep `* token.webp` as extras; they do not auto-attach.

## Markdown every sheet uses

```markdown
# Display title

> [!infobox]+
> ![[Same Stem As Filename.webp]]
>
> ### One-line tagline
>
> | | |
> |---|---|
> | **Key** | Value with [[Wikilinks]] |

```statblock
layout: Basic 5e Layout
name: Same Stem As Filename
ac: 15
hp: 44
stats: [16, 12, 14, 10, 12, 10]
```

*Two sentences the DM needs at the table.*

> [!readaloud]
> Spoken text.

> [!gmonly]
> Secrets.
```

- `layout` is `Basic 5e Layout` / `Basic PF2e Layout` / `Basic V5 Layout`. Combat needs `name`, `ac`, `hp`. `stats` is STR DEX CON INT WIS CHA.
- Callouts: `infobox` (sheet chrome), `readaloud` / `flavor`, `gmonly` / `secret`. Trailing `+` is fine.
- Images: `![[file.webp]]`. Notes: `[[Stem]]` or `[[Stem|alias]]`.
- Hide empty template rows. Do not leave `*placeholder*` text.

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
| Weapon / armor / gear / magic item | matching `Gear/…` | gear |
| Tonight’s run (scenes + fight list) | `Sessions/` | nightsheet or plain note |
| Recap, transcript, YouTube blurb | `Archive/` | plain note |
| Haze rules, house rules | `Reference/` | plain note |
| Hub, flowchart, live hooks | `Start Here/` | plain note + `Overview.md` |

Shop = place note + proprietor NPC, linked both ways. Faction members stay NPCs; HQ is a Place.

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

## Game night / combat

A heading matching `combat`, `encounter`, or `⚔` (and not `no combat`) feeds initiative.

```markdown
## ⚔️ Combat 1 — Rat's Nest door

**Combatants:** [[Ratling]] ×4 · [[Oscar-Yoren]] · party
```

`party` = every `Party/` sheet except `*roster*`. Separators: `·` `|` `,` `;`. Counts: `×2` / `x2`.

Split: prose in `Session 04 — The Rat's Nest/Notes.md`; numbers in `Session 04 — Game Night Sheet.md`. Link them.

## Start Here/Overview.md

Short hub only: party wikilinks, current place, faction list, tonight’s session, 3–5 plot links. No book chapters.

## Conversion checklist

1. Write `campaign.json`. Create the standard folders.
2. Sort files with the table above. Move transcripts to `Archive/`.
3. Rename image sidecars to `Art/`. Match portrait filenames to sheet stems.
4. Give Party / NPC / Bestiary notes an infobox + `statblock` with AC/HP.
5. Give Places / Shops / Factions an infobox and wikilinks to people and sites.
6. Point every `![[…]]` at a real image filename.
7. Fix broken `[[links]]` or keep stems so old links still resolve.
8. **Open campaign** on the folder. Confirm Party appears under Add all players, portraits show, maps open as maps.

Do **not**: dump a city onto one page; put battlemaps in Places; put shopkeepers only on the shop note; ship copyrighted book text; edit `system` after people have sheets.
