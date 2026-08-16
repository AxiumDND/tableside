# Recipes

Short table workflows. UI overview: [TABLE.md](TABLE.md). Authoring: [CAMPAIGN.md](CAMPAIGN.md), [MARKDOWN.md](MARKDOWN.md).

These same recipes appear in the in-app **Help** panel (header).

## Night sheet → initiative

Prep combatants in Markdown once; load them at the table in one click.

### Prep

1. Create sheets under `Party/`, `NPCs/`, and `Bestiary/` (right-click the folder, or save from Lookup).
2. Each combatant sheet needs a fenced `statblock` with at least `name`, `hp`, and `ac`.
3. In a session or night-sheet note, add a combat section:

```markdown
## ⚔️ Combat 1 — the door

**Combatants:** [[The Harbinger of the Rune-Blade]] · [[Vampire Spawn]] ×2 · party
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

Prefer a short **Night Sheet** for numbers and combatant lines, and keep long prose in `Session N.md` with `[[Session N — Night Sheet]]` links either way.

### At the table

1. Open the night sheet.
2. On the combat section, press **Add to initiative** (loads linked sheets; skips names already in Combat).
3. Open **Combat** in the header if it is not already open.
4. Roll initiative (d20 on each row) or type PC totals from the table.
5. **Start** combat, advance turns, adjust HP.
6. Optionally **Show to players** on the Combat panel to overlay order (Bloodied / 0 HP tags, no numbers).

### If Add to initiative does nothing

- Wikilink target does not match a sheet filename (check `PC —` prefixes; links can omit them).
- Sheet is not under Party / NPCs / Bestiary.
- Heading does not look like combat (add `Combat` or ⚔️).
- No `statblock` — add one, or open the sheet and confirm AC/HP parse.

Example in the Sample campaign: `examples/bad-blood/Sessions/Session 3 — Night Sheet.md`.

## Lookup → campaign note

Copy bundled SRD (or optional WOTC) text into the campaign folder so you can edit and wikilink it.

### Steps

1. Open a campaign (**Open**, **New**, or **Sample**).
2. Open **Lookup**.
3. Search — use chips (Conditions, Spells, Monsters, Weapons, …). Optional WOTC files add PHB / Gear / DMG chips.
4. Open a result:
   - **Monster** → **Add to Bestiary** (and/or **Add to combat** for this fight only)
   - **Spell** → **Add to Spells**
   - **Weapon / gear / magic item** → **Add to Gear**
5. The new markdown note appears in that folder. Open it from the file tree to tune HP, add notes, or rename.
6. Link it from a night sheet with `[[Note Name]]` like any other sheet.

### Status messages

| Button label | Meaning |
| --- | --- |
| Add to Bestiary / Spells / Gear | Will write a new note |
| Already in … | A note with that name already exists — open and edit it |
| Added to … | Just wrote the file |

Saving needs an open campaign. Conditions and pure rules entries do not get an Add-to-folder button (search-only).

### After saving a monster

1. Optional: drop art in `Bestiary/Art/Name.png` and embed `![[Name.png]]`.
2. Add `**Combatants:** [[Name]] · party` on tonight’s night sheet.
3. Or add from Combat’s Bestiary list / Lookup **Add to combat** without a night sheet.

### Optional WOTC text

Lookup stays SRD-only until you add personal book dumps. Format and filenames: [WOTC/README.md](../WOTC/README.md). Open the writable folder from Lookup when you need it.
