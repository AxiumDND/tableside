# Campaign authoring

How to structure a campaign folder so Tableside can find notes, art, and combatants.

Also read:

- [TABLE.md](TABLE.md) — DM console, combat, Lookup, player display
- [RECIPES.md](RECIPES.md) — night sheet → initiative, Lookup → campaign note (also in-app **Help**)
- [MARKDOWN.md](MARKDOWN.md) — wikilinks, callouts, `statblock` field reference
- [WOTC/README.md](../WOTC/README.md) — optional book text for Lookup

## Folder layout

**New campaign** creates this layout (plus `Overview.md` and Templates). **Open campaign** reads any folder live and creates missing standard folders. Folder names match case-insensitively (`Party` / `party`, `NPCs` / `npcs`).

```
campaign.json     campaign name (hidden in the file tree)
combat.json       live initiative (hidden)
Overview.md       hub note — opens first if present

Sessions/         run guides and night sheets
  Art/            establishing shots
Party/            PC sheets (Add all players)
  Art/            PC portraits
NPCs/             named people
  Art/            NPC portraits
Bestiary/         creatures
  Art/            creature art (campaign overrides; SRD monsters have bundled defaults)
Spells/           campaign copies of spells (edit after Lookup)
Gear/
  Weapons/        mundane weapons
  Armor/          mundane armor
  Equipment/      adventuring gear and tools
  Magic Items/    wondrous items, potions, magic weapons
Maps/
  Art/            battle and location maps
  Print/          print-and-play PDFs
  *.md            map notes (fenced map block + DM-only pins + tokens)
Handouts/         letters and props
  Art/            letter images
Templates/        blank Player, NPC, Monster, Spell, Gear, Night Sheet, and Map sheets
Reference/        tracker, locations, cheat sheets
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
| `Z Archive` | Archive |

Skipped directories (not shown / not scanned as notes): `.obsidian`, `.git`, `node_modules`, `WOTC`, `out`, `dist`, and similar.

Book text for Lookup is **not** part of a campaign. Put PHB / DMG exports in the app `WOTC/` folder.

## Creating notes in the app

Right-click a folder in the file tree:

- **New player / NPC / monster / spell / gear / night sheet / map** — copies the matching Templates file and substitutes the name
- **New note** — empty markdown
- **Add files…** — import images, PDFs, or markdown into that folder

Duplicate from a file’s context menu when you need a second vampire spawn sheet, etc.

## Wikilinks and images

Notes can stay in Obsidian. Tableside understands:

| Syntax | Purpose |
| --- | --- |
| `[[Note Name]]` | Link to another markdown note (resolved by note stem) |
| `[[Note Name\|Alias]]` | Link with display text |
| `![[Portrait.png]]` | Embed an image from that folder’s `Art/` (or elsewhere in the campaign) |

Portrait files should match the character or creature name when possible. Click an image in a note, then **Show to players** — the player monitor fades it in on a black screen.

**Map notes** (a fenced `map` block) open as a full map with DM-only pins, circular tokens from Party / NPCs / Bestiary, zoom/pan, and drawable fog. Right-click **Maps/** → **New map…** to pick existing art or load a file into `Maps/Art/` named like the note. **Show to players** sends the image, the current crop, fog, and tokens — no pins. See [MARKDOWN.md](MARKDOWN.md).

Supported image types: `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.svg`, `.bmp`. Full rules: [MARKDOWN.md](MARKDOWN.md).

## Callouts

```markdown
> [!readaloud]
> What you say out loud when the party enters.

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

Templates under `Templates/` are a good starting point. You can also **Add to campaign** from Lookup (monster → Bestiary, spell → Spells, weapon → Gear/Weapons, armor → Gear/Armor, gear → Gear/Equipment, magic item → Gear/Magic Items).

## Night sheets and combat

A **night sheet** is a session note with combat sections that feed the initiative tracker.

1. Use a heading that includes `Combat`, `Encounter`, or ⚔️ (skip headings that say `no combat`).
2. List combatants with wikilinks to Party / NPCs / Bestiary sheets:

```markdown
## ⚔️ Combat 1 — the door

**Combatants:** [[The Harbinger of the Rune-Blade]] · [[Vampire Spawn]] ×2 · party
```

- `party` adds every PC under `Party/`.
- `×2` / `x2` adds multiple copies of that sheet.
- Separators: `·`, `|`, `,`, or `;`.

If there is no `Combatants:` line, Tableside still picks up wikilinks (and some bold table labels) to Party / NPCs / Bestiary notes in that section.

On the night sheet, use **Add to initiative** / **Add encounter** to load those sheets into Combat. **Add all players** pulls every PC sheet.

Suggested split: long prose in `Session N.md`, numbers and combatant lines in `Session N — Night Sheet.md`, cross-linked with wikilinks.

Full recipe (prep + troubleshooting): [RECIPES.md](RECIPES.md#night-sheet--initiative).

### Player initiative overlay

On the Combat panel, **Show to players** overlays order on the second monitor:

- Current turn highlighted
- Enemies under half HP tagged **Bloodied**
- PCs at 0 HP tagged unconscious; monsters/NPCs at 0 HP tagged dead

HP edits stay on the DM console; the overlay never shows numbers. Step-by-step UI: [TABLE.md](TABLE.md#combat-panel).

## At the table (short)

1. Open or create a campaign (or click **Sample** for Bad Blood).
2. Open tonight’s session or night sheet from the file tree.
3. Click a map or portrait → **Show to players**.
4. When a fight starts, add the encounter (or combatants) → roll / enter initiative → advance turns.
5. Use **Lookup** for conditions, spells, monsters, and weapons (SRD bundled; optional WOTC files extend it).

Full UI walkthrough: [TABLE.md](TABLE.md).

## Examples

| Folder | What it demonstrates |
| --- | --- |
| [examples/bad-blood](../examples/bad-blood) | Full three-shot with night sheets, art, and combatants |
| [examples/sample-campaign](../examples/sample-campaign) | Minimal one-night starter |
