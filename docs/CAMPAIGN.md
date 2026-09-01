# Campaign authoring

How to structure a campaign folder so Tableside can find notes, art, and combatants.

Also read:

- [GUIDE.md](GUIDE.md) — how to use the app at the table
- [TABLE.md](TABLE.md) — DM console, combat, Lookup, player display
- [RECIPES.md](RECIPES.md) — game night sheet → initiative, Lookup → campaign note, music, crawl (also in-app **Help**)
- [MARKDOWN.md](MARKDOWN.md) — wikilinks, callouts, `statblock` field reference
- [AI-CAMPAIGN.md](AI-CAMPAIGN.md) — spec for an AI converting a vault into this layout (1.7.12: map grid origin, square template, compact dice tray)
- [Additional Books/README.md](../Additional%20Books/README.md) — optional book text for Lookup

## Folder layout

**New campaign** picks a system pack and a DM-console look, then creates this layout (plus `Start Here/Overview.md`). **Open campaign** reads any folder live and creates missing standard folders. A root `Overview.md` moves into **Start Here** if that folder does not already have one. Folder names match case-insensitively (`Party` / `party`, `NPCs` / `npcs`). A folder with no `"system"` field is treated as D&D 5e. Do not change `system` mid-campaign — the templates and tracker will not match. `"theme"` is the DM console look (`classic` | `light` | `scifi` | `vampire` | `cyberpunk` | `matrix`); missing field = Classic fantasy. You can change theme later from Start Here.

```
campaign.json     campaign name, system pack (`dnd5e` | `pf2e` | `v5`), and DM theme (hidden in the file tree)
combat.json       live initiative (hidden)
audio.json        mixer volumes and last playlists (hidden)

Start Here/       hub notes — opens first if present
  Overview.md     campaign hook and links
Sessions/         run guides, game night sheets, and session recaps
  Art/            establishing shots
Party/            PC sheets (Add all players) and optional party roster
  Art/            PC portraits
NPCs/             named people
  Art/            NPC portraits
Bestiary/         creatures
  Art/            creature art (campaign overrides; SRD monsters have bundled defaults)
Places/           towns, sites, wilderness, dungeons-as-places
  Art/            city art and interiors (not battlemaps)
Factions/         guilds, churches, houses, cults
  Art/            emblems
Spells/           campaign copies of spells (edit after Lookup)
  Art/            school emblems and spell art
Gear/
  Weapons/        mundane weapons
    Art/          weapon art
  Armor/          mundane armor
    Art/          armor art
  Equipment/      adventuring gear and tools
    Art/          equipment art
  Magic Items/    wondrous items, potions, magic weapons
    Art/          magic item art
Maps/
  Art/            battle and location maps
  Print/          print-and-play PDFs
  *.md            map notes (fenced map block + DM-only pins + tokens)
Handouts/         letters and props
  Art/            letter images
Audio/
  Music/          mood playlists (Combat, Creepy, General — add more folders as needed)
  Ambience/       looping beds (Crowd, Rain, or loose files)
  Sfx/            soundboard one-shots (subfolders become headings)
Reference/        tracker, calendars, cheat sheets
Archive/          recaps, transcripts, old drafts
```

### Folder aliases

| You might name it | Treated as |
| --- | --- |
| `PCs`, `PC`, `The Party` | Party |
| `NPC` | NPCs |
| `Session Notes`, `Session` | Sessions |
| `Handouts and Props` | Handouts |
| `Assets` | Maps |
| `Equipment`, `Magic Items` (at the campaign root) | Gear (legacy name) |
| `Spell` | Spells |
| `Locations`, `World`, `Setting` | Places |
| `Faction` | Factions |
| `Start`, `Getting Started` | Start Here |
| `Sounds`, `Sound` | Audio |
| `Z Archive` | Archive |

Skipped directories (not shown / not scanned as notes): `.obsidian`, `.git`, `node_modules`, `Additional Books`, `out`, `dist`, and similar. A leftover `Templates/` folder is hidden from the file tree; right-click **New …** still uses those files if they exist, otherwise the system pack sheets.

Book text for Lookup is **not** part of a campaign. Put PHB / DMG exports in the app `Additional Books/` folder.

## Creating notes in the app

Right-click a folder in the file tree:

- **New player / NPC / monster / spell / gear / game night sheet / session recap / party roster / map / place / shop / faction** — fills the built-in sheet for that type and substitutes the name
- **New note** — empty markdown
- **Add art…** — import images into that folder’s `Art/` (creates `Art/` if needed). Name files like the sheet so portraits attach
- **Add files…** — import notes, PDFs, or other files into the folder you clicked

Duplicate from a file’s context menu when you need a second vampire spawn sheet, etc.

## Audio

Tableside does not ship music. Put files you own in the campaign:

| Put files here | Mixer strip |
| --- | --- |
| `Audio/Music/Combat/` | Combat mood |
| `Audio/Music/Creepy/` | Creepy mood |
| `Audio/Music/General/` | General mood |
| `Audio/Music/<any folder>/` | Extra mood (folder name is the chip) |
| `Audio/Ambience/` or `Audio/Ambience/Crowd/` | Looping beds |
| `Audio/Sfx/` or `Audio/Sfx/Doors/` | Soundboard (subfolders are headings) |

Use **Add audio…** on the Music panel, or right-click the folder. Formats: `.mp3` `.ogg` `.wav` `.m4a` `.flac` `.webm` `.aac`. Loose files in `Audio/` itself are ignored. How to play them: [GUIDE.md](GUIDE.md#5-play-music).

## Wikilinks and images

Notes can stay in Obsidian. Tableside understands:

| Syntax | Purpose |
| --- | --- |
| `[[Note Name]]` | Link to another markdown note (resolved by note stem) |
| `[[Note Name\|Alias]]` | Link with display text |
| `![[Portrait.png]]` | Embed an image from that folder’s `Art/` (or elsewhere in the campaign) |

Portrait files should match the character or creature name when possible. Click an image in a note, then **Show to players** — the player monitor fades it in on a black screen.

**Map notes** (a fenced `map` block) open as a full map with DM-only pins, circular tokens from Party / NPCs / Bestiary, zoom/pan, and drawable fog. Right-click **Maps/** → **New map…** to pick existing art or load a file into `Maps/Art/` named like the note. **Show to players** sends the image, the current crop, fog, and tokens — no pins. See [MARKDOWN.md](MARKDOWN.md).

**Places** are gazetteer notes, not battlemaps. Right-click **Places/** → **New place…** for a town, site, wilderness, or dungeon, or **New shop…** for an inn, stall, forge, or temple. The create dialog includes bundled default art (town, dungeon, mountain, swamp, inn, thieves’ guild, and similar) — pick one, or name the note `Dungeon` / `Mountain` / `Thieves' Guild` to attach the matching picture. The shopkeeper stays an NPC (`[[Hale]]` in NPCs, `[[The Weary Mare]]` in Places, linked both ways). **Factions/** → **New faction…** for a guild, church, house, or cult. A settlement note is an index of people and sites — do not dump a whole city onto one page. Stay flat unless a town has many sites (`Places/Greystead.md` plus `Places/Greystead/The Grey Mare.md`).

Supported image types: `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.svg`, `.bmp`. Full rules: [MARKDOWN.md](MARKDOWN.md).

## Callouts

```markdown
> [!readaloud]
> What you say out loud when the party enters.

> [!crawl] The Siege of Kestrel
> preface: In an age before memory, beyond the rim of charted stars.
> ![[Title Mark.png]]
> It is a time of unrest. Relay stations along the outer belt have gone dark.
>
> The outer colonies have gone silent. A courier ship
> carries the last warning toward the home docks.

> [!gmonly]
> Secrets, motives, and numbers the players should not see.

> [!infobox]+
> ![[Name.png]]
>
> ### One-line tagline
>
> | | |
> |---|---|
> | **Role** | Patron |
> | **AC** | 15 |
> | **HP** | 44 |

> [!tip]
> Optional coaching for yourself mid-session.
```

| Type | Aliases | Role |
| --- | --- | --- |
| `readaloud` | `flavor` | Player-facing text to speak |
| `scene` | `beat` | Scene card — art, what could happen, nested read-aloud, cues. Copy a block to add another beat. |
| `party` | `roster`, `pcs` | Party card — PC and companion NPC links; read mode shows race / class / AC / HP from those sheets. |
| `crawl` | `opening` | Opening crawl. Play (Sci-fi look only) shows a starfield, a far-off line (`preface:`), a generic emblem (or the first `![[image]]`), then a perspective prologue. Optional `music:` path under `Audio/Music/` overrides the mood playlist while that track plays, then resumes it. Write your own words. |
| `gmonly` | `secret` | Collapsed GM-only block |
| `infobox` | — | Sheet header / portrait card |
| `tip`, `warning`, `note`, `info`, `danger`, `success`, `example`, `abstract` | — | Highlighted callout cards |

## Statblocks

Put a fenced `statblock` on Party, NPC, and Bestiary sheets. Combat and Lookup use this block for HP, AC, and rolls.

~~~~markdown
```statblock
layout: Basic 5e Layout
name: Dire Wolf
size: Large
type: beast
alignment: unaligned
ac: 14
hp: 37
hit_dice: 5d10+10
speed: 50 ft.
stats: [17, 15, 15, 3, 12, 7]
senses: "passive Perception 13"
cr: 1
traits:
  - name: Pack Tactics
    desc: "Advantage on attacks if an ally is within 5 ft. of the target."
actions:
  - name: Bite
    desc: "+5 to hit, reach 5 ft. Hit: 10 (2d6+3) piercing."
```
~~~~

Field list and fallbacks: [MARKDOWN.md](MARKDOWN.md#statblock-fence).

You can also **Add to campaign** from Lookup (monster → Bestiary, spell → Spells, weapon → Gear/Weapons, armor → Gear/Armor, gear → Gear/Equipment, magic item → Gear/Magic Items).

## Game night sheets and combat

A **game night sheet** is a session note with a Party roster block and scene blocks that hold the night's beats. Right-click **Sessions** → **New game night sheet…** for The Party and Scenes. Existing `Party/` sheets are linked in automatically. New files are named `Session N — Game Night Sheet.md`. Sci-fi campaigns also get an Opening crawl sample — rewrite it, then **Play**.

A **session recap** is notes after the table on what actually happened. Right-click **Sessions** → **New session recap…**. New files are named `Session N — Recap.md`. The open note is what the table knows; `[!gmonly]` is yours. Prep stays on the game night sheet.

A **party roster** is who is travelling together. Right-click **Party** → **New party roster…**. `Party Roster` stays `Party Roster.md`; other names become `The Table — Roster.md`. Player sheets stay as **New player…**; companions stay in `NPCs/` and are linked in the same `[!party]` block. Combat still skips notes whose name matches `roster`.

Wrap PC and companion NPC links in `[!party]…[!/party]`. Read mode shows a live PC table (name, race, class, AC, HP); companions sit as links under the table (hover for the sheet). **Edit** → **Add NPC…** to pick from `NPCs/`. Scene blocks use `[!scene] Title` … `[!/scene]`. Put optional art with `![[…]]`, a short “what could happen” note, nested `[!readaloud]` for spoken text, nested `[!gmonly]` for hidden prep, nested `[!combat]` for fights, optional secrets/treasure/NPC bullets, and an **At the table** cue list (place, map, checks, if they miss, music, sound, leads to). Copy a whole scene block to add another beat.

1. Prefer a combat block inside a scene (or at document level). Aliases: `encounter`, `fight`. New blocks default to `**Combatants:** party`. Add foes with real Bestiary / NPC stems, or use **Edit → Add combatant…** at the table (SRD/book monsters copy into `Bestiary/`).

```markdown
[!scene] The door
…
[!combat] Combat 1 — the door
**Combatants:** [[Vesper]] · [[Cultist]] ×3 · party
[!/combat]
[!/scene]
```

2. Treasure in a beat uses `[!treasure]` (coin + Gear wikilinks). **Edit → Add item…** searches Gear / SRD / books and copies missing items into `Gear/…`. Currencies: **Help & settings → Currencies**.

Legacy: a `#` / `##` heading that includes `Combat`, `Encounter`, or ⚔️ (skip headings that say `no combat`) still works the same way.

3. List combatants with wikilinks to Party / NPCs / Bestiary sheets:

- `party` adds every PC under `Party/`.
- `×2` / `x2` adds multiple copies of that sheet.
- Separators: `·`, `|`, `,`, or `;`.
- Do not leave `[[Monster Name]]` stubs.
If there is no `Combatants:` line, Tableside still picks up wikilinks (and some bold table labels) to Party / NPCs / Bestiary notes in that section.

On the game night sheet, use **Add to initiative** / **Add encounter** to load those sheets into Combat. **Add all players** pulls every PC sheet.

Suggested split: long prose in `Session N.md`, numbers and combatant lines in `Session N — Game Night Sheet.md`, cross-linked with wikilinks. Greystead uses that split — run **Session 1 — Game Night Sheet**, reference **Session 1** for show order and coin.

Full recipe (prep + troubleshooting): [RECIPES.md](RECIPES.md#game-night-sheet--initiative).

### Player initiative overlay

On the Combat panel, **Show to players** overlays order on the second monitor:

- Current turn highlighted
- Enemies under half HP tagged **Bloodied**
- PCs at 0 HP tagged unconscious; monsters/NPCs at 0 HP tagged dead
- Conditions you toggle on a row (Poisoned, Prone, …)

HP edits stay on the DM console; the overlay never shows numbers. Step-by-step UI: [TABLE.md](TABLE.md#combat-panel).

## At the table (short)

1. Open or create a campaign (or click **Sample** for Greystead).
2. Open tonight’s session or game night sheet from the file tree.
3. Click a map or portrait → **Show to players**.
4. When a fight starts, add the encounter (or combatants) → roll / enter initiative → advance turns.
5. **Music** plays files from `Audio/Music`, `Audio/Ambience`, and `Audio/Sfx`.
6. Use **Lookup** for conditions, spells, monsters, and weapons (SRD bundled; optional book files extend it).

How-to: [GUIDE.md](GUIDE.md). Console reference: [TABLE.md](TABLE.md).

## Examples

| Folder | What it demonstrates |
| --- | --- |
| [examples/greystead](../examples/greystead) | Level-1 one-shot — first launch, **Sample**, and the only campaign shipped in the installer |
