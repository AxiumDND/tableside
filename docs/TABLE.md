# At the table

How the DM console and player window work during a session. **New to Tableside?** Start with [GUIDE.md](GUIDE.md) (first night, music, crawl, maps). This page is the control-by-control reference.

## Layout

| Area | Role |
| --- | --- |
| Header | Campaign name, Combat / Music / Lookup / Help & settings, New / Open / Sample, player display picker, Clear |
| Left column | Mini **Players see** preview, campaign file tree, dice tray |
| Center | Open note, image, PDF, or audio preview |
| Right (optional) | Combat tracker, Music mixer, Lookup, or Help & settings |

Two Electron windows open: the DM console, and a fullscreen **player** window on a second monitor. **Close** on the Players see preview shuts the player window so you can use the TV for something else. Pick a monitor or **Show to players** to open it again. **Theme** is a campaign setting (Classic fantasy, Light, Sci-fi, Vampire, Cyberpunk, Digital rain): New campaign asks for it, Open applies `campaign.json`, and you can change it from **Help & settings** or **Start Here**. Sci-fi can turn on **Hologram portraits** for party, NPC, beast, and gear art. Digital rain can turn on **Falling code** in the file list and notes. The player TV stays black.

## Start a session

1. **Sample** — copies Greystead (the 5e level-1 one-shot) into user data and opens it (safe to edit). On install or update, the copy is replaced when the bundled `sampleRevision` is newer. First launch with no campaign folder does the same.
2. **Open campaign** — pick any campaign folder on disk. Folders without `"system"` in `campaign.json` run as D&D 5e.
3. **New campaign** — pick a system (D&D 5e, Pathfinder 2e, or Vampire 5th), then a look, then an empty folder; Tableside scaffolds the standard layout. Changing system later is not supported. Theme can change any time from Start Here.

With more than one display, click the **Players see** preview to put the player window on the TV/monitor facing the table. Close that window when you do not need it. The player window is built on that screen’s pixels (a 1080p TV next to a 4K laptop stays sharp after a restart or after you unplug the TV).

## Show maps and art

1. Open a note that embeds `![[image.png]]`, or open an image from the tree.
2. Click the image so it is selected.
3. Press **Show to players** — the player screen fades in over ~5 seconds on black.
4. **Clear** (header or preview) blanks the player screen.

The left **Players see** panel mirrors the player window. Use **Hide** there if you need vertical space.

PDFs open in the center pane for you; they are not sent to the player display as images. Export or screenshot maps you want to show, or use image files under `Maps/Art/`.

## Opening crawl (Sci-fi)

In a Sci-fi campaign, a `> [!crawl]` (or `> [!opening]`) block in any note shows an **Opening crawl** card. **Play** opens a starfield on the player screen and the Players see preview: two seconds of stars, an original far-off line (about eight seconds), a generic title emblem (or the first `![[image]]` in the block), then a perspective title crawl. Optional `music: Audio/Music/…` (or **Crawl music** on the card) overrides the mood playlist for that track, then resumes the previous mood when the track ends or you **Clear**. Edit title, far-off line, emblem, crawl music, and crawl text on the card — they write back into the note. `preface: none` skips the far-off line. The callout title is the heading; the body is the scrolling text. **Clear** or `Alt+X` stops the picture and restores mood music. Other campaign looks still show the card so the note stays readable; Play stays disabled until the look is Sci-fi. Write your own words — Tableside does not include licensed crawl text or music files.

## Music & sound

**Music** (header) opens a mixer that is separate from the player picture. **Clear** blanks the TV image; it does not stop audio. Use **Stop all** on the mixer.

| Strip | Source | Playback |
| --- | --- | --- |
| Music | `Audio/Music/<mood>/` (Combat, Creepy, General, or any extra folder) | Pick a mood, then Play / Pause / Skip / Stop. In order or Shuffle stays in that mood. Crossfades when the track or mood changes. |
| Ambience | `Audio/Ambience/` (folders or loose files) | Pick a bed, then Start / Stop. One looping bed |
| Soundboard | `Audio/Sfx/` (subfolders are headings) | Click a one-shot; several can overlap |
| Master | — | Whole mix + mute |

Each strip has its own volume. **Now playing** shows the current music track and ambience bed, with elapsed time and length. Music and ambience fade in and out over five seconds; **Stop all** fades both. **Output** picks the Windows audio device (laptop, HDMI TV, headset). The mix uses that device whether the player view is open or closed. Drop your own `.mp3` / `.ogg` / `.wav` / `.m4a` files into `Audio/Music`, `Audio/Ambience`, or `Audio/Sfx` — files in `Audio/` itself are ignored. Tableside does not include music. Volumes, last playlists, and the output device save in hidden `audio.json`.

Each strip has **Add audio…**. Right-click an Audio folder works the same. Opening a track in the tree is a DM preview only.

## File tree

- Click a note, image, or PDF to open it. Folders start collapsed; the folder that holds the open file (and its parents) expand so you can see it. Click a folder again to collapse it and browse elsewhere — opening a different file expands its folder. `Art/` stays collapsed — portraits load from there onto the `.md` sheets.
- **Search** (hidden until you click it next to Files, or press `Ctrl+F` / `/`) finds notes, maps, and art by name. Results are a flat ranked list with folder paths — `Esc` clears, then hides the box.
- **Right-click** a folder (or empty tree area) to create a player, NPC, monster, spell, gear, game night sheet, map, place, shop, or faction. **Add art…** on Party, NPCs, Bestiary, Places, Factions, Spells, Sessions, Maps, Handouts, a Gear subsection, or the `Art/` folder itself copies pictures into that folder’s `Art/` (creates it if needed). Name art like the sheet (`Ghoul.webp`) so portraits attach. **Add files…** still imports notes and PDFs into the folder you clicked. Gear has **Weapons**, **Armor**, **Equipment**, and **Magic Items** — right-click the subsection to add a note or art there.
- Right-click a file to **Duplicate…**, **Add art here…** (into that folder’s `Art/`), add files beside it, or **Delete…** (asks first).
- Creating **New player / NPC / monster / spell / gear / game night sheet / map / place / shop / faction** fills the built-in sheet for that type and the name you type. **New game night sheet…** is Party + Scenes (copy a `[!scene]` block to add beats) and links every existing `Party/` sheet. **New place…** / **New shop…** live on `Places/` and include bundled default art (town, dungeon, mountain, swamp, inn, and similar). **New faction…** is on `Factions/` (thieves’ guild, city watch, cult, and similar).
- **New map…** lets you choose an existing campaign image or **Load image…**. Loaded files are copied into that folder’s `Art/` (usually `Maps/Art/`) and named to match the map.
- `campaign.json`, `combat.json`, `audio.json`, `README.md`, and `Templates/` stay hidden from the tree.

Navigation: **← Back** in the note header, **Alt+←**, or mouse back button.

## Notes center

- **Edit** / **Save** — markdown editor (`Ctrl+S` saves, `Esc` cancels, Tab inserts two spaces).
- **Links** — heading jump list for long session notes.
- Wikilinks open other notes; images stay clickable for **Show to players**. A `> [!crawl]` block is an Opening crawl card — **Play** in Sci-fi sends it to the player screen.
- Sheets with a `statblock` (Party / NPCs / Bestiary) open in sheet view with **Add to combat**.
- Map notes (` ```map ` fence) show **Pan / Pin / Token / Fog** — extra controls open as a submenu under the selected tool. Pins stay DM-only. Tokens (Party / NPCs / Bestiary portraits) scale together; Large/Huge stay 2×/3× a Medium token. **Show to players** follows crop, fog, and tokens.
- Night-sheet combat sections show **Add to initiative** when combatants resolve — see [CAMPAIGN.md](CAMPAIGN.md).

## Combat panel

Open with **Combat** in the header.

| Control | What it does |
| --- | --- |
| **Add all players** | Loads every `Party/` sheet (skips names already in the list) |
| Bestiary filter + click | Adds that creature from `Bestiary/` |
| Manual row | Name / Init / HP, plus AC (5e/PF2e) or Willpower and Hunger (Vampire 5th) |
| d20 on a row | Rolls initiative for that combatant (PCs: type their table roll into Init) |
| **Start** / next-round controls | Begins round 1 and advances whose turn it is |
| Eye / view | Opens that combatant’s rollable statblock without changing the turn |
| **Show to players** | Superimposes initiative order on the current player image |
| Clear combat | Empties the tracker (confirm dialog) |

State saves to `combat.json` in the campaign folder.

### What players see on the overlay

- Names in initiative order, current turn highlighted
- D&D 5e: **Bloodied** on enemies/NPCs under half HP; **Unconscious** on PCs at 0 HP; **dead** on monsters/NPCs at 0 HP
- Pathfinder 2e: **Wounded** under half HP; **Dying** on PCs at 0 HP
- Vampire 5th: **Health**, **Willpower**, and **Hunger** (0–5)
- No extra secrets (full HP pools stay on the DM tracker)

## Lookup panel

Offline MiniSearch over the **open campaign’s system pack**. D&D 5e uses the bundled SRD 5.2.1 snapshot (conditions, spells, monsters, weapons, rules, Axium goods). Pathfinder 2e uses a small original core. Vampire 5th uses original table procedures only.

- Filter chips narrow the category.
- Monster results can **Add to combat**. On 5e, Lookup shows the bundled D&D-fantasy default portrait when one exists. Spells show the emblem for their school of magic. Weapons and gear show still-life item art the same way.
- With a campaign open, **Add to Bestiary / Spells / Gear** writes a campaign markdown note (skipped if a same-named note already exists). Adding a 5e monster also copies its default portrait into `Bestiary/Art/` if the campaign does not already have one.
- Optional WOTC files add chips like PHB 2024 / PHB Gear / DMG Items / Ravenloft / MM2024 on **5e campaigns only** — [WOTC/README.md](../WOTC/README.md). Use **Open WOTC folder** in Lookup to jump to the writable location.

Step-by-step save flow: [RECIPES.md](RECIPES.md#lookup--campaign-note).

## Help & settings

**Help & settings** in the header opens a side panel: campaign look, then quick start, player screen, files and maps, combat and game night sheets, Lookup, dice, and shortcuts. Click a heading to open it; click again to close.

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
- **Sample** lives in `%APPDATA%\Tableside\samples\greystead`. Tableside refreshes it automatically when the bundled `sampleRevision` in `campaign.json` is newer than your copy. Delete that folder and click **Sample** to force a refresh. Keep lasting edits in your own campaign folder.
- **Updates** — if you are online, a newer GitHub release can show a dismissible bar. Help → Updates to check by hand. Offline, nothing is shown.
