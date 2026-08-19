# At the table

How the DM console and player window work during a session.

## Layout

| Area | Role |
| --- | --- |
| Header | Campaign name, Combat / Lookup / Help panels, New / Open / Sample, player display picker, Clear |
| Left column | Mini **Players see** preview, campaign file tree, dice tray |
| Center | Open note, image, or PDF |
| Right (optional) | Combat tracker, Lookup, or Help |

Two Electron windows open: the DM console, and a fullscreen **player** window (preferably on a second monitor).

## Start a session

1. **Sample** — copies Bad Blood into user data and opens it (safe to edit).
2. **Open campaign** — pick any campaign folder on disk.
3. **New campaign** — pick an empty folder; Tableside scaffolds the standard layout and Templates.

With more than one display, use **Player display…** to put the player window on the TV/monitor facing the table.

## Show maps and art

1. Open a note that embeds `![[image.png]]`, or open an image from the tree.
2. Click the image so it is selected.
3. Press **Show to players** — the player screen fades in over ~5 seconds on black.
4. **Clear** (header or preview) blanks the player screen.

The left **Players see** panel mirrors the player window. Use **Hide** there if you need vertical space.

PDFs open in the center pane for you; they are not sent to the player display as images. Export or screenshot maps you want to show, or use image files under `Maps/Art/`.

## File tree

- Click a note, image, or PDF to open it. Folders start collapsed; the folder that holds the open file (and its parents) stay expanded. `Art/` stays collapsed — portraits load from there onto the `.md` sheets.
- **Search** (hidden until you click it next to Files, or press `Ctrl+F` / `/`) finds notes, maps, and art by name. Results are a flat ranked list with folder paths — `Esc` clears, then hides the box.
- **Right-click** a folder (or empty tree area) to create notes from Templates. **Add art…** on Party, NPCs, Bestiary, Spells, Sessions, Maps, Handouts, a Gear subsection, or the `Art/` folder itself copies pictures into that folder’s `Art/` (creates it if needed). Name art like the sheet (`Ghoul.webp`) so portraits attach. **Add files…** still imports notes and PDFs into the folder you clicked. Gear has **Weapons**, **Armor**, **Equipment**, and **Magic Items** — right-click the subsection to add a note or art there.
- Right-click a file to **Duplicate…**, **Add art here…** (into that folder’s `Art/`), add files beside it, or **Delete…** (asks first).
- Creating **New player / NPC / monster / spell / gear / game night sheet / map** uses `Templates/Player.md` (etc.) when present, then fills in the name you type. **New game night sheet…** is a Lazy DM 10-step page and links every existing `Party/` sheet.
- **New map…** lets you choose an existing campaign image or **Load image…**. Loaded files are copied into that folder’s `Art/` (usually `Maps/Art/`) and named to match the map.
- `campaign.json`, `combat.json`, and `README.md` stay hidden from the tree.

Navigation: **← Back** in the note header, **Alt+←**, or mouse back button.

## Notes center

- **Edit** / **Save** — markdown editor (`Ctrl+S` saves, `Esc` cancels, Tab inserts two spaces).
- **Links** — heading jump list for long session notes.
- Wikilinks open other notes; images stay clickable for **Show to players**.
- Sheets with a `statblock` (Party / NPCs / Bestiary) open in sheet view with **Add to combat**.
- Map notes (` ```map ` fence) show **Pan / Pin / Token / Fog** — extra controls open as a submenu under the selected tool. Pins stay DM-only. Tokens (Party / NPCs / Bestiary portraits) scale together; Large/Huge stay 2×/3× a Medium token. **Show to players** follows crop, fog, and tokens.
- Night-sheet combat sections show **Add to initiative** when combatants resolve — see [CAMPAIGN.md](CAMPAIGN.md).

## Combat panel

Open with **Combat** in the header.

| Control | What it does |
| --- | --- |
| **Add all players** | Loads every `Party/` sheet (skips names already in the list) |
| Bestiary filter + click | Adds that creature from `Bestiary/` |
| Manual row | Name / Init / HP / AC for ad-hoc combatants |
| d20 on a row | Rolls initiative for that combatant (PCs: type their table roll into Init) |
| **Start** / next-round controls | Begins round 1 and advances whose turn it is |
| Eye / view | Opens that combatant’s rollable statblock without changing the turn |
| **Show to players** | Superimposes initiative order on the current player image |
| Clear combat | Empties the tracker (confirm dialog) |

State saves to `combat.json` in the campaign folder.

### What players see on the overlay

- Names in initiative order, current turn highlighted
- **Bloodied** on enemies/NPCs under half HP
- **Unconscious** on PCs at 0 HP; **dead** on monsters/NPCs at 0 HP
- No HP numbers, AC, or secrets

## Lookup panel

Offline MiniSearch over the bundled SRD 5.2.1 snapshot (conditions, spells, monsters, weapons, rules).

- Filter chips narrow the category.
- Monster results can **Add to combat**. Lookup shows the bundled D&D-fantasy default portrait when one exists. Spells show the emblem for their school of magic. Weapons and gear show still-life item art the same way.
- With a campaign open, **Add to Bestiary / Spells / Gear** writes a campaign markdown note (skipped if a same-named note already exists). Adding a monster also copies its default portrait into `Bestiary/Art/` if the campaign does not already have one.
- Optional WOTC files add chips like PHB 2024 / PHB Gear / DMG Items / Ravenloft / MM2024 — [WOTC/README.md](../WOTC/README.md). Use **Open WOTC folder** in Lookup to jump to the writable location.

Step-by-step save flow: [RECIPES.md](RECIPES.md#lookup--campaign-note).

## Help panel

**Help** in the header opens a side panel written for the table: quick start, player screen, files and maps, combat and game night sheets, Lookup, dice, and shortcuts. Click a heading to open it; click again to close.

## Dice tray

Bottom of the left column: quick d4–d20 buttons plus a custom expression field (for example `2d6+3`). Rolls feed the shared dice log used by combat and statblock clicks.

## Keyboard and mouse

| Input | Action |
| --- | --- |
| Alt+← | Back in note history |
| Mouse back (button 4) | Back in note history |
| Alt+S | Show selected image to players |
| Alt+X | Clear player screen |
| Alt+T | Next combat turn (opens Combat) |
| Ctrl+S (while editing) | Save note |
| Esc (while editing) | Cancel edit (prompts if dirty) |
| Esc (dialogs) | Dismiss confirm dialogs |

## After the session

- Combat state remains in `combat.json` until you clear it.
- Note edits write straight to the campaign folder (Obsidian vaults stay in sync on disk).
- Sample campaigns live under user data — re-clicking **Sample** can refresh from the bundled copy depending on how that folder is managed; keep lasting edits in your own campaign folder.
