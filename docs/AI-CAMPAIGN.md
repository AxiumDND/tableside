# Tableside — AI campaign import

Hand this file to an agent converting a vault, Obsidian folder, or loose notes into a Tableside campaign. Tableside copies it to `%APPDATA%\Tableside\AI-CAMPAIGN.md` — **Help & settings → Quick start** (or **Files**) has **Copy to clipboard** and **Open in File Explorer**. Humans: [CAMPAIGN.md](CAMPAIGN.md) and [MARKDOWN.md](MARKDOWN.md).

Tableside is a **local folder of Markdown**. No account. The DM laptop is the console; a second monitor shows images only.

**Target app version: 1.8.1+.** Night sheets use structured **combat** and **treasure** blocks (party auto-roster, item/monster lookup that copies into Gear / Bestiary). `[!party]` cards show a live race / class / AC / HP / PP table from linked sheets. Classic / Light / Vampire nights get a **campfire chronicle** (`[!legend]`); Sci-fi gets an **opening crawl** (`[!crawl]`). Prefer the formats below so Edit on a block works without hand-editing fences.

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
Sessions/            prep, game night sheets, session recaps (+ Art/)
Party/               PC sheets and optional party roster (+ Art/)
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
| Standing “who travels together” list | `Party/` | roster (`Party Roster.md` or `Name — Roster.md`) |
| Named person, shopkeep, villain, companion | `NPCs/` | npc |
| Monster, generic enemy, encounter stat dump | `Bestiary/` | monster |
| Town, dungeon-as-place, wilderness | `Places/` | place |
| Inn, stall, forge, temple-as-shop | `Places/` | shop |
| Guild, church, house, cult | `Factions/` | faction |
| Battlemap / tactical image | `Maps/` + `Maps/Art/` | map |
| Spell the table will edit | `Spells/` | spell |
| Weapon / armor / mundane gear | `Gear/Weapons` · `Armor` · `Equipment` · `Trade Goods` | gear |
| Magic item | `Gear/Magic Items` | gear |
| Tonight’s run (scenes + fight list) | `Sessions/` | nightsheet or plain note |
| What actually happened (after the table) | `Sessions/` | recap |
| Transcript, YouTube blurb, old drafts | `Archive/` | plain note |
| Haze rules, house rules | `Reference/` | plain note |
| Hub, flowchart, live hooks | `Start Here/` | plain note + `Overview.md` |

Shop = place note + proprietor NPC, linked both ways. Faction members stay NPCs; HQ is a Place.

When converting loot lists: put real item sheets under the matching `Gear/…` subfolder so night-sheet treasure `[[Wikilinks]]` resolve (and hover previews work). The DM can also **Add item…** on a treasure card — that searches Gear + SRD/books and copies missing items into Gear.

## Infobox fields by kind

Keep the table small. Extra rows are fine.

| Kind | Rows |
| --- | --- |
| Player (5e) | Player, Species, Class, Background, Alignment, Role, AC, HP |
| Player (PF2e) | Player, Ancestry, Class, Background, Role, AC, HP |
| Player (V5) | Player, Clan, Predator, Role, Health (and/or HP) |
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

A **game night sheet** is Party + Scenes (not a wall of prose). Right-click **Sessions** → **New game night sheet…**. Split long story into `Session N.md`; keep numbers on `Session N — Game Night Sheet.md`. Sci-fi packs insert a `[!crawl]` sample; Classic / Light / Vampire insert a `[!legend]` sample — rewrite both, never ship licensed crawl or chronicle copy.

A **session recap** is notes after the table (`Session N — Recap.md`). What the table knows goes in the open note; secrets and next-prep go in `[!gmonly]`. Do not use scene/combat/read-aloud/crawl/legend blocks on a recap. Wrap **Who sat** in `[!party]` so the live table appears.

A **party roster** is who is travelling together (`Party Roster.md`, or `The Table — Roster.md` if they name it something else). It is **not** a PC sheet. Individual PCs stay **New player…** under `Party/`. Companions stay in `NPCs/` and are wikilinked in the same `[!party]` block. Combat, **Add all players**, and `{{party}}` skip any `Party/` note whose stem matches `/roster/i`.

### Party card (`[!party]`)

Aliases: `roster`, `pcs`. Put this on the game night sheet, the standing roster note, and the recap “Who sat” section. Do **not** nest it inside a scene.

```markdown
[!party]
[[Kay Himmel]]
[[Oscar-Yoren]]

- [[Orson Fairweather]] — mule and spare sword
[!note] Focus tonight
Unfinished business from last session.
[!/note]
[!/party]
```

- List each PC as a `[[Party stem]]` (or `- [[PC — Name|Alias]]`). The app fills `{{party}}` with every non-roster `Party/` sheet when you use **New game night sheet…** / **New session recap…** / **New party roster…**.
- Companion lines are `[[NPC stem]]` (optionally `- [[Name]] — why they travel`). Do not copy companions into `Party/`.
- Read mode: PCs become a live table (name, race, class, AC, HP) from the sheet infobox, then `statblock` `ac` / `hp`. Race reads **Species** / **Ancestry** / **Clan**. Class reads **Class** / **Role** / **Predator**. V5 **Health** can fill AC or HP if those rows are empty. Companions sit under **Travelling with** as links (hover shows the sheet + portrait).
- Nested `[!note]` / `[!gmonly]` inside the card is fine; wikilinks **inside those nested bodies are ignored** for the table — keep PC/NPC links as direct lines in the `[!party]` body.
- At the table: **Edit** → **Add NPC…** picks from `NPCs/`. Do not leave stub `- [[NPC Name]]` on a live roster.

### Session recap

```markdown
# Session 3 — Recap

*After the table. Prep stays on [[Session 3 — Game Night Sheet]].*

[!abstract]
They refused the carriage and the valley closed the road.
[!/abstract]

## Who sat

[!party]
{{party}}
[!/party]

## What happened

- 

## Who and where

- 

## What they have

- 

## Threads

- 

[!gmonly]
Missed clues, clocks, sheets to update, what to prep next.
[!/gmonly]
```

### Campfire chronicle (`[!legend]`)

Aliases: `tale`, `chronicle`. **Play** works on Classic, Light, and Vampire looks (not Sci-fi — that uses crawl). New fantasy/vampire night sheets already get a sample; rewrite it in the campaign’s voice.

```markdown
[!legend] The Pale Well
look: mist
music: Audio/Music/General/YourTrack.mp3

It is a quiet season in the uplands. Grain waits at the mill.

A girl named Lira vanishes on the night the well runs cold.

In the caves beneath the pale stone, something older keeps its count.
[!/legend]
```

- `look:` (or `style:` / `atmosphere:`) is `mist` (gothic fog), `embers` (campfire), `crimson` (vampire), or `neon` (holo). Default mist. Aliases: fog/strahd → mist; fire/campfire → embers; blood/vampire → crimson; cyber/sci-fi → neon.
- Body paragraphs (blank-line separated) rise on the player TV. Write short spoken-prose paragraphs, not one giant line and not a poem of three-word wraps — the player layout uses a readable measure.
- Optional `music:` under `Audio/Music/` (same idea as crawl). Optional `end: ![[Still.webp]]` for a closing still. Optional `preface:` is stored for older notes but the player chronicle does **not** show an opening line — put the tale in the body.
- Do not nest legend inside a scene. Do not paste licensed movie-crawl or published-module boxed text.

### Opening crawl (`[!crawl]`)

Aliases: `opening`. **Play** is Sci-fi look only. Same rules as before: original words, optional `preface:` (`none` skips the far-off line), first `![[image]]` as emblem, optional `music:` and `end:`.

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
| `[!party]` | PC + companion links; live race / class / AC / HP / PP table (see above) |
| `[!legend]` | Campfire chronicle on the player TV (Classic / Light / Vampire) |
| `[!crawl]` | Starfield crawl on the player TV (Sci-fi) |
| `[!links]` | Auto TOC of other blocks on the sheet |
| `[!note]` / `[!abstract]` | Short text / summary |
| `[!gallery]` / `[!video]` / `[!phone]` / `[!hyperspace]` | Player slideshow / local clip / incoming-call overlay / jump (ship in streaks, then a planet still) |

## Start Here/Overview.md

Short hub only: party wikilinks (or `[[Party Roster]]`), current place, faction list, tonight’s session, 3–5 plot links. No book chapters.

Optional `Templates/` at the campaign root overrides built-in **New …** sheets (`Party Roster.md`, `Session Recap.md`, `Game Night Sheet.md`, `Player.md`, …). The folder is hidden in the file tree. Prefer the built-in 1.8.1 shapes unless the table already has a house template.

## Conversion checklist

1. Write `campaign.json` (`name`, `system`, `theme`; optional `currencies`). Create the standard folders including `Gear/…` subfolders.
2. Sort files with the table above. Move transcripts to `Archive/`. Companions → `NPCs/`, not `Party/`.
3. Rename image sidecars to `Art/`. Match portrait filenames to sheet stems.
4. Give Party / NPC / Bestiary notes a typed sheet header + `statblock` with AC/HP. Fill Species/Ancestry/Clan and Class/Role/Predator so `[!party]` glance rows are not blank.
5. Give Places / Shops / Factions a sheet header and wikilinks to people and sites.
6. Put loot items under the matching `Gear/` subfolder; link them from treasure blocks.
7. Point every `![[…]]` at a real image filename.
8. Fix broken `[[links]]` or keep stems so old links still resolve.
9. One optional `Party/…Roster.md` with `[!party]` (PCs + NPC companion lines). Do not treat that file as a creature sheet.
10. Build game night sheets with `[!party]`, rewritten `[!legend]` or `[!crawl]`, and `[!scene]` nests: real `[!combat]` (`… · party`) and `[!treasure]` (no stubs).
11. After-the-table recaps: `[!party]` for who sat, no scenes/fights/openings.
12. **Open campaign** on the folder. Confirm Party under Add all players (roster note skipped), portraits show, maps open as maps, treasure/combat Edit lookups resolve, chronicle/crawl Play matches the campaign look.

Do **not**: dump a city onto one page; put battlemaps in Places; put shopkeepers only on the shop note; ship copyrighted book text or licensed crawl/chronicle copy; edit `system` after people have sheets; leave `[[Monster Name]]` / `[[Item Name]]` / `[[NPC Name]]` placeholders in live sheets; put two PC parties in `Party/` without unique stems.
