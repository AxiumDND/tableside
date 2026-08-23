# Recipes

Short table workflows. How-to: [GUIDE.md](GUIDE.md). UI overview: [TABLE.md](TABLE.md). Authoring: [CAMPAIGN.md](CAMPAIGN.md), [MARKDOWN.md](MARKDOWN.md).

These recipes also appear in the in-app **Help & settings** panel (header), along with campaign look, layout, maps, combat overlay, Lookup chips, and shortcuts.

## Game night sheet → initiative

Prep combatants in Markdown once; load them at the table in one click.

### Prep

1. Create sheets under `Party/`, `NPCs/`, and `Bestiary/` (right-click the folder, or save from Lookup).
2. Each combatant sheet needs a fenced `statblock` with at least `name`, `hp`, and `ac`.
3. In a session or night-sheet note, add a combat section:

```markdown
## ⚔️ Combat 1 — the door

**Combatants:** [[Vesper]] · [[Cultist]] ×3 · party
```

Rules of thumb:

| Piece | Meaning |
| --- | --- |
| Heading with `Combat`, `Encounter`, or ⚔️ | Marks an encounter card |
| `[[Sheet Name]]` | Must match a Party / NPCs / Bestiary note stem |
| `×2` / `x2` | Duplicate that sheet in initiative |
| `party` | Add every PC under `Party/` |
| Separators | `·` `\|` `,` `;` |

Skip headings that say `no combat`.

A short **game night sheet** is enough for numbers and combatant lines; longer campaigns can keep prose in `Session N.md`. The Greystead sample puts the whole night on one page so you can run without flipping. **New game night sheet…** starts from the Lazy DM 10-step template and links existing Party files.

### At the table

1. Open the game night sheet.
2. On the combat section, press **Add to initiative** (loads linked sheets; skips names already in Combat). Unresolved `[[links]]` show a warning on the card. Newly added NPCs/monsters at initiative 0 are rolled automatically.
3. Open **Combat** in the header if it is not already open.
4. Type PC totals from the table (NPCs may already be rolled). Use **Roll all** / **Roll NPCs** if you need to re-roll.
5. **Start** combat, advance turns (`Alt+T`), adjust HP.
6. Optionally **Show to players** on the Combat panel (`Alt+S` for the image) to overlay order (Bloodied / 0 HP tags, no numbers).

### If Add to initiative does nothing

- Wikilink target does not match a sheet filename (check `PC —` prefixes; links can omit them).
- Sheet is not under Party / NPCs / Bestiary.
- Heading does not look like combat (add `Combat` or ⚔️).
- No `statblock` — add one, or open the sheet and confirm AC/HP parse.

Example in the Sample campaign: `examples/greystead/Sessions/Session 1.md`.

## Lookup → campaign note

Copy bundled SRD (or optional WOTC) text into the campaign folder so you can edit and wikilink it.

### Steps

1. Open a campaign (**Open**, **New**, or **Sample**).
2. Open **Lookup**.
3. Search — use chips (Conditions, Spells, Monsters, Weapons, …). Optional WOTC files add PHB / Gear / DMG chips.
4. Open a result:
   - **Monster** → **Add to Bestiary** (and/or **Add to combat** for this fight only)
   - **Spell** → **Add to Spells**
   - **Weapon / gear / magic item** → **Add to Gear** (Weapons, Armor, Equipment, or Magic Items)
5. The new markdown note appears in that folder. Open it from the file tree to tune HP, add notes, or rename.
6. Link it from a game night sheet with `[[Note Name]]` like any other sheet.

### Status messages

| Button label | Meaning |
| --- | --- |
| Add to Bestiary / Spells / Gear | Will write a new note |
| Already in … | A note with that name already exists — open and edit it |
| Added to … | Just wrote the file |

Saving needs an open campaign. Conditions and pure rules entries do not get an Add-to-folder button (search-only).

### After saving a monster

1. Optional: drop art in `Bestiary/Art/Name.png` and embed `![[Name.png]]`.
2. Add `**Combatants:** [[Name]] · party` on tonight’s game night sheet.
3. Or add from Combat’s Bestiary list / Lookup **Add to combat** without a game night sheet.

### Optional WOTC text

Lookup stays SRD-only until you add personal book dumps. Format and filenames: [WOTC/README.md](../WOTC/README.md). Open the writable folder from Lookup when you need it.

## Music mixer

Play your own audio at the table. Tableside does not include tracks.

### Prep

1. Open the campaign. **New** / **Open** creates `Audio/Music/Combat`, `Creepy`, `General`, plus `Audio/Ambience` and `Audio/Sfx`.
2. Drop files into a mood folder, or click **Music** → **Add audio…** on that strip.
3. Extra folders under `Audio/Music/` become extra mood chips.
4. Keep files out of `Audio/` itself — those are ignored.

### At the table

1. Open **Music**.
2. Pick **Output** (laptop, HDMI TV, headset).
3. Click a mood. Choose **In order** or **Shuffle**.
4. **Play**. **Pause** holds the song. **Skip** stays in that mood. **Stop** ends it; Play starts the mood again.
5. Pick an ambience bed → **Start** / **Stop**.
6. Click soundboard buttons as needed.
7. **Stop all** when the scene ends. **Clear** on the TV does not stop the mix.

If nothing plays: unmute Master / Music, confirm Output, and check the file is under `Audio/Music/<mood>/`.

## Opening crawl (Sci-fi)

1. Set the campaign look to **Sci-fi**.
2. Add a crawl block to any note (or use the sample on a new sci-fi game night sheet):

```markdown
> [!crawl] Episode title
> preface: A far-off line of your own.
> The scrolling prologue goes here.
```

3. Edit title, far-off line, emblem, and crawl on the card.
4. **Play**. **Clear** or `Alt+X` stops it.

`preface: none` skips the far-off line. `![[mark.png]]` in the block replaces the generic emblem. Write your own words — no licensed crawl text ships with the app. Play stays disabled on other looks.

## Map with tokens and fog

1. Right-click **Maps/** → **New map…** → pick or load an image.
2. **Pan** to move. Scroll to zoom. **Pin** for DM-only notes. **Token** to place Party / NPC / Bestiary portraits. **Fog** to hide or reveal.
3. **Show to players**. The TV follows crop, fog, and tokens. Pins stay on your screen.
