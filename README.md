# Table DM

A local Windows app for running **in-person** 5e-compatible games. Your laptop is the DM console. The second monitor is a clean player view for maps and art — image only, plus an optional initiative overlay.

This is not a virtual tabletop. There is no account, no cloud, and no internet required at the table.

Compatible with fifth edition. Rules lookup uses the **System Reference Document 5.2** (2024 rules), already bundled. Current release: **1.0.7**.

## Features

- Dual-window layout: DM console + fullscreen player display
- Campaign folder of Markdown notes (Obsidian-friendly wikilinks and `![[images]]`)
- Click a map or portrait, then **Show to players** — 5 second fade-in on a black screen
- Optional initiative overlay on the player screen: order, whose turn, Bloodied (enemies under half HP), 0 HP statuses
- Night sheets can pull NPC/PC/Bestiary statblocks into initiative (missing links warned; NPCs auto-roll)
- Offline search for conditions, spells, monsters, weapons, and common rules
- Optional extra lookup from your own WOTC text files in `WOTC/` (spells, equipment, magic items)
- Add a monster, spell, or gear item from Lookup into the campaign Bestiary, Spells, or Gear folder
- In-app **Help**, recent campaigns, file-tree filter, and table hotkeys (`Alt+S` / `Alt+T` / `Alt+X`)

## Quick start

```bash
npm install
npm run build
npm start
```

For day-to-day development with hot reload:

```bash
npm install
npm run dev
```

Two windows open. If you have a second monitor, the player window goes there fullscreen.

Click **Sample** to load **Bad Blood**, the included Barovia three-shot. Table DM copies it into your user data folder so combat and notes do not write back into the git repo.

### Installer (Windows)

```bash
npm run dist
```

Writes a Windows NSIS installer to `dist/`.

`npm run fetch-srd` is only needed if you want to refresh the bundled SRD snapshot from the [Open5e API](https://api.open5e.com/) (`srd-2024`).

## Docs

| Doc | Audience |
| --- | --- |
| [docs/TABLE.md](docs/TABLE.md) | DMs — console layout, combat, Lookup, player display |
| [docs/RECIPES.md](docs/RECIPES.md) | DMs — night sheet → initiative, Lookup → campaign note |
| [docs/CAMPAIGN.md](docs/CAMPAIGN.md) | DMs — folder layout, night sheets, combatants, images |
| [docs/MARKDOWN.md](docs/MARKDOWN.md) | DMs — wikilinks, callouts, `statblock` fields |
| [WOTC/README.md](WOTC/README.md) | Optional PHB / DMG lookup file formats |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Contributors — scripts, architecture, CI |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Pull request expectations |
| [ATTRIBUTION.md](ATTRIBUTION.md) | SRD / Open5e licensing |

## Campaign folders

Campaigns are ordinary folders on disk. **New campaign** scaffolds the standard layout; **Open campaign** reads any folder and fills in missing pieces.

```
Overview.md       hub note
Sessions/         run guides and night sheets (+ Art/)
Party/            PC sheets (+ Art/)
NPCs/             named people (+ Art/)
Bestiary/         creatures (+ Art/)
Spells/           campaign spell copies
Gear/             weapons, equipment, magic items
Maps/             Art/ + Print/
Handouts/         letters and props (+ Art/)
Templates/        blank sheets
Reference/        trackers and cheat sheets
Archive/          recaps and old drafts
```

Full authoring guide: **[docs/CAMPAIGN.md](docs/CAMPAIGN.md)**. At-the-table UI: **[docs/TABLE.md](docs/TABLE.md)**. Step recipes: **[docs/RECIPES.md](docs/RECIPES.md)** (also in the app **Help** panel). Markdown/`statblock` reference: **[docs/MARKDOWN.md](docs/MARKDOWN.md)**.

Book text for Lookup is **not** part of a campaign. Put Player’s Handbook and Dungeon Master’s Guide exports in the app `WOTC/` folder (or `%APPDATA%\table-dm\WOTC`). When those files are present, Lookup grows extra filters and searches that text. The SRD stays available either way. Filenames must contain `Spell`, `Equipment`, or `Magic Item` — details in [WOTC/README.md](WOTC/README.md).

### Examples

- [examples/bad-blood](examples/bad-blood) — full three-shot (also the in-app **Sample**)
- [examples/sample-campaign](examples/sample-campaign) — minimal one-night folder

## Attribution

This work includes material from the System Reference Document 5.2 (“SRD 5.2”) by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.

Structured data is republished via the Open5e API. See [ATTRIBUTION.md](ATTRIBUTION.md).
