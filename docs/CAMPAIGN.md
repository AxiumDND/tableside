# Campaign authoring

How to structure a campaign folder so Table DM can find notes, art, and combatants.

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
  Art/            creature art
Spells/           campaign copies of spells (edit after Lookup)
Gear/             weapons, equipment, and magic items
Maps/
  Art/            battle and location maps
  Print/          print-and-play PDFs
Handouts/         letters and props
  Art/            letter images
Templates/        blank Player, NPC, Monster, Spell, and Gear sheets
Reference/        tracker, locations, cheat sheets
Archive/          recaps, transcripts, old drafts
```

Aliases work for common renames: `PCs` → Party, `Equipment` / `Magic Items` → Gear, `Session Notes` → Sessions, and similar.

Book text for Lookup is **not** part of a campaign. Put PHB / DMG exports in the app `WOTC/` folder — see [WOTC/README.md](../WOTC/README.md).

## Wikilinks and images

Notes can stay in Obsidian. Table DM understands:

| Syntax | Purpose |
| --- | --- |
| `[[Note Name]]` | Link to another markdown note (resolved by note stem) |
| `[[Note Name\|Alias]]` | Link with display text |
| `![[Portrait.png]]` | Embed an image from that folder’s `Art/` (or elsewhere in the campaign) |

Portrait files should match the character or creature name when possible. Click an image in a note, then **Show to players** — the player monitor fades it in on a black screen.

Supported image types: `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.svg`, `.bmp`.

## Callouts

Obsidian-style callouts render in the DM console:

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

Templates under `Templates/` are a good starting point. You can also **Add to campaign** from Lookup (monster → Bestiary, spell → Spells, gear → Gear).

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

If there is no `Combatants:` line, Table DM still picks up wikilinks (and some bold table labels) to Party / NPCs / Bestiary notes in that section.

On the night sheet, use **Add encounter** to load those sheets into Combat. **Add all players** pulls every PC sheet.

### Player initiative overlay

On the Combat panel, **Show to players** overlays order on the second monitor:

- Current turn highlighted
- Enemies under half HP tagged **Bloodied**
- PCs at 0 HP tagged unconscious; monsters/NPCs at 0 HP tagged dead

HP edits stay on the DM console; the overlay never shows numbers.

## At the table

1. Open or create a campaign (or click **Sample** for Bad Blood).
2. Open tonight’s session or night sheet from the file tree.
3. Click a map or portrait → **Show to players**.
4. When a fight starts, add the encounter (or combatants) → roll / enter initiative → advance turns.
5. Use **Lookup** for conditions, spells, monsters, and weapons (SRD bundled; optional WOTC files extend it).

## Examples

| Folder | What it demonstrates |
| --- | --- |
| [examples/bad-blood](../examples/bad-blood) | Full three-shot with night sheets, art, and combatants |
| [examples/sample-campaign](../examples/sample-campaign) | Minimal one-night starter |
