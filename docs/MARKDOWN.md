# Markdown and statblocks

Reference for note syntax Tableside understands. For folder layout and game night sheets, see [CAMPAIGN.md](CAMPAIGN.md). For the UI, see [TABLE.md](TABLE.md).

## Supported files

| Extension | Behavior |
| --- | --- |
| `.md`, `.markdown`, `.txt` | Notes (rendered markdown) |
| `.png` `.jpg` `.jpeg` `.webp` `.gif` `.svg` `.bmp` | Images (preview + Show to players) |
| `.pdf` | DM-only preview in an iframe |
| `.mp3` `.ogg` `.wav` `.m4a` `.flac` `.webm` `.aac` | Campaign audio (`Audio/`). Preview in the note pane; play at the table from **Music** |

## Wikilinks

```markdown
[[Brother Pell]]
[[Brother Pell|the priest]]
[[Session 3#The Offer]]
```

- Resolved by note **stem** (filename without extension), case-insensitive.
- `PC — Name` sheets match searches for `Name`.
- Prefer unique stems; if several match, Party / NPCs / Bestiary sheets win, then notes near the current file.
- Image embeds use `![[…]]` and are not treated as note links.

## Image embeds

```markdown
![[Greystead.webp]]
![[The Grey Mare.webp]]
```

Resolution order (simplified): same folder, that folder’s `Art/`, campaign-wide match by filename. Put portraits next to the sheet in `Art/` and name them like the character when you can.

Click an embedded image in the DM view to select it, then **Show to players**.

## Callouts

Obsidian callout form:

```markdown
> [!TYPE] Optional title
> Body line
> More body
```

| TYPE | Aliases | Rendering |
| --- | --- | --- |
| `readaloud` | `flavor` | Read-aloud card |
| `crawl` | `opening` | Opening crawl card. Edit title, far-off line, emblem, and crawl on the card (writes back to the note). **Play** (Sci-fi look only) shows a starfield, an original far-off line (`preface:`; `none` skips it), a generic title emblem (or the first `![[image]]`), then a silent perspective prologue. Write your own words — Tableside does not include licensed crawl text, logos, or music. |
| `gmonly` | `secret` | Collapsible GM-only |
| `infobox` | — | Sheet header (often with portrait + facts table); not split like other callouts |
| `tip` `warning` `note` `info` `danger` `success` `example` `abstract` | — | Styled callout cards |
| other | — | Generic callout |

Trailing `+` / `-` on the type (Obsidian fold) is accepted; fold state is not persisted.

## Combat sections

A `#` or `##` heading counts as combat if it matches `/combat|encounter|⚔/i` and does **not** match `/no combat/i`.

Preferred combatant line:

```markdown
**Combatants:** [[Vesper]] · [[Cultist]] ×3 · party
```

Also accepted: `Combatants:` without bold; separators `·` `|` `,` `;`; counts `×2` / `x2`.

Fallback: wikilinks in the section to Party / NPCs / Bestiary notes, and bold labels in simple tables (`| **Name** | … |`) when they look like creature names.

`party` means every note under `Party/` (roster-named notes skipped).

## Map notes

A note with a fenced `map` block opens as a map view (image fills the center). Pins are **DM-only**. Tokens (party, NPC, and monster portraits) **show on the player screen**. Scroll to zoom, drag to pan (or use **Pan**). **Show to players** sends the image, the current crop, fog of war, and tokens — the player screen follows as you zoom, pan, paint, or move tokens.

Put the picture in `Maps/Art/`. Right-click **Maps/** → **New map…** to pick an existing campaign image, or **Load image…** to copy a file into that folder’s `Art/` named after the note.

~~~~markdown
```map
image: Crypt Level 1.jpg
pins:
  - id: a
    x: 0.22
    y: 0.31
    label: A1
    heading: Room A — Entry
tokens:
  - id: jasper
    kind: pc
    source: Party/PC — Jasper Alderwick.md
    x: 0.48
    y: 0.62
    label: Jasper
  - id: dire-wolf
    kind: monster
    source: Bestiary/Dire Wolf.md
    x: 0.62
    y: 0.40
    space: large
    label: Dire Wolf
tokenScale: 0.05
```
~~~~

- `image` — filename, resolved like `![[…]]` (same folder, then `Art/`).
- `x` / `y` — 0 to 1 across the image (not pixels).
- `heading` — matches a `##` in **this** file. Clicking the pin shows that section.
- Click **Pin**. Pins start **locked** — **Unlock pins** before **Add pin**, **Edit pin**, or **Delete pin**. The exception is an empty map: you can place the first pin while locked. **Edit pin** changes label/heading (**Save**); unlock to drag. **Delete pin** removes a pin you click.
- Click **Token** for the token submenu: pick a Party / NPC / Bestiary sheet, then click the map. The sheet’s portrait is cropped to a circle (initials if there is no image); the name sits under the token. Party sheets named `PC — …` still pick up `Art/Character Name.png`. Drag to move. **Size** (or Shift+scroll) scales every token at once — Medium is the base size; Large is 2×, Huge 3×, Gargantuan 4×, Tiny ½×, from the creature’s `size` on its sheet. Drop the same monster more than once for multiples. **Delete token** removes the selected one. Tokens are stored in the same `map` fence (`kind` is `pc`, `npc`, or `monster`; `space` is the size category; `tokenScale` is the shared Medium diameter).
- Click **Fog** for hide / reveal, brush size, **Cover all**, and **Clear fog**. Players see solid black over tokens in hidden areas; you see a translucent overlay with tokens still grabable on top. Fog is stored in the same `map` fence (`fog` / `fogSize`).
- **Pan** is the default: drag to move, scroll or the **Zoom** slider to zoom, **Fit** resets. **Show to players** follows crop, fog, and tokens — pins stay DM-only.

Room writeups stay in the same markdown file:

```markdown
## Room A — Entry

Read-aloud, checks, loot.
```

## Statblock fence

Primary form — YAML-like fields inside a fenced block:

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
saves:
  - str: 5
  - dex: 4
skills:
  - perception: 3
damage_immunities: "Poison"
damage_resistances: "Cold"
damage_vulnerabilities: "Fire"
condition_immunities: "Charmed"
senses: "Darkvision 60 ft., passive Perception 13"
languages: "—"
cr: 1
initiative: 2
traits:
  - name: Pack Tactics
    desc: "Advantage on attacks if an ally is within 5 ft. of the target."
actions:
  - name: Bite
    desc: "+5 to hit, reach 5 ft. Hit: 10 (2d6+3) piercing."
bonus_actions:
  - name: Example
    desc: "…"
reactions:
  - name: Example
    desc: "…"
legendary:
  - name: Example
    desc: "…"
```
~~~~

Notes:

- `stats` is STR, DEX, CON, INT, WIS, CHA in that order.
- `layout: Basic 5e Layout` is conventional for D&D 5e (Obsidian / Fantasy Statblocks style). Pathfinder 2e sheets use `Basic PF2e Layout`; Vampire 5th uses `Basic V5 Layout`. The parser mainly needs the keys above.
- An unfenced block that starts with one of those layout lines is also accepted.
- If there is no fence, sheets under Party / NPCs / Bestiary can still get a **fallback** block from the title and any AC/HP lines — always prefer a real `statblock` for combat.

### Fields used in combat UI

| Field | Use |
| --- | --- |
| `name` | Display name (file stem can override for PCs) |
| `hp` / `ac` | Tracker values |
| `stats` / `initiative` | Initiative bonus if no explicit bonus |
| `traits` `actions` `bonus_actions` `reactions` `legendary` | Rollable text on the combatant view |

Dice-looking phrases in action text (for example `2d6+3`, `DC 15`) are clickable in the rollable statblock view.

## Infobox sheets

NPC / PC sheet view looks for:

```markdown
> [!infobox]+
> ![[Name.png]]
>
> ### Tagline
>
> | | |
> |---|---|
> | **Role** | … |
> | **AC** | 15 |
> | **HP** | 44 |
```

Facts in that table surface in the sheet chrome. Keep the combat numbers in sync with the `statblock`.

## Templates

Right-click **New …** fills a built-in sheet from the campaign’s system pack. A leftover `Templates/` folder is hidden from the file tree but still used when those files are present:

| File (any of) | Creates |
| --- | --- |
| `Player.md` / `PC.md` / `Character.md` | Party sheet |
| `NPC.md` | NPC sheet |
| `Monster.md` / `Creature.md` | Bestiary sheet |
| `Spell.md` | Spells note |
| `Gear.md` / `Item.md` / `Equipment.md` | Gear note |
| `Game Night Sheet.md` / `Night Sheet.md` / `nightsheet.md` | Game night sheet |
| `Map.md` | Map note (image + DM pins + tokens) |
| `Place.md` / `Location.md` / `Settlement.md` | Place note (town, site, wilderness, dungeon) |
| `Shop.md` / `Merchant.md` / `Inn.md` | Shop note (inn, stall, forge, temple) |
| `Faction.md` | Faction note (guild, church, house, cult) |

Leading HTML comments (`<!-- … -->`) are stripped when filling a new note from a template.

Placeholder text such as `Character Name` / `NPC Name` / `Monster Name` / `Place Name` / `Shop Name` / `Faction Name` is replaced with the name you enter. Game night sheets also replace `{{party}}` with wikilinks to every `Party/` sheet.

## Editing tips

- Prefer Obsidian for long writing; Tableside is happiest as the table runner.
- Keep game night sheets short; put prose in the session note and link with `[[Session 3]]`.
- One creature or PC per sheet file so `[[Name]]` and portraits stay unambiguous.
