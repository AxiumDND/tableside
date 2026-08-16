# Markdown and statblocks

Reference for note syntax Table DM understands. For folder layout and night sheets, see [CAMPAIGN.md](CAMPAIGN.md). For the UI, see [TABLE.md](TABLE.md).

## Supported files

| Extension | Behavior |
| --- | --- |
| `.md`, `.markdown`, `.txt` | Notes (rendered markdown) |
| `.png` `.jpg` `.jpeg` `.webp` `.gif` `.svg` `.bmp` | Images (preview + Show to players) |
| `.pdf` | DM-only preview in an iframe |

## Wikilinks

```markdown
[[Father Donovich]]
[[Father Donovich|the priest]]
[[Session 3#The Offer]]
```

- Resolved by note **stem** (filename without extension), case-insensitive.
- `PC — Name` sheets match searches for `Name`.
- Prefer unique stems; if several match, Party / NPCs / Bestiary sheets win, then notes near the current file.
- Image embeds use `![[…]]` and are not treated as note links.

## Image embeds

```markdown
![[Village of Barovia.png]]
![[Scene - The Taproom.png]]
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
| `gmonly` | `secret` | Collapsible GM-only |
| `infobox` | — | Sheet header (often with portrait + facts table); not split like other callouts |
| `tip` `warning` `note` `info` `danger` `success` `example` `abstract` | — | Styled callout cards |
| other | — | Generic callout |

Trailing `+` / `-` on the type (Obsidian fold) is accepted; fold state is not persisted.

## Combat sections

A `#` or `##` heading counts as combat if it matches `/combat|encounter|⚔/i` and does **not** match `/no combat/i`.

Preferred combatant line:

```markdown
**Combatants:** [[Lyssa von Zarovich]] · [[Vampire Spawn]] ×2 · party
```

Also accepted: `Combatants:` without bold; separators `·` `|` `,` `;`; counts `×2` / `x2`.

Fallback: wikilinks in the section to Party / NPCs / Bestiary notes, and bold labels in simple tables (`| **Name** | … |`) when they look like creature names.

`party` means every note under `Party/` (roster-named notes skipped).

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
- `layout: Basic 5e Layout` is conventional (Obsidian / Fantasy Statblocks style); the parser mainly needs the keys above.
- An unfenced block that starts with `layout: Basic 5e Layout` is also accepted.
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

`Templates/` seeds used by right-click **New …**:

| File (any of) | Creates |
| --- | --- |
| `Player.md` / `PC.md` / `Character.md` | Party sheet |
| `NPC.md` | NPC sheet |
| `Monster.md` / `Creature.md` | Bestiary sheet |
| `Spell.md` | Spells note |
| `Gear.md` / `Item.md` / `Equipment.md` | Gear note |

**New campaign** writes these from built-in fallbacks if missing. Leading HTML comments (`<!-- … -->`) are stripped when filling a new note from a template.

Placeholder text such as `Character Name` / `NPC Name` / `Monster Name` is replaced with the name you enter.

## Editing tips

- Prefer Obsidian for long writing; Table DM is happiest as the table runner.
- Keep night sheets short; put prose in the session note and link with `[[Session 3]]`.
- One creature or PC per sheet file so `[[Name]]` and portraits stay unambiguous.
