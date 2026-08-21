# Tableside

A local Windows app for running **in-person** 5e-compatible games. Your laptop is the DM console. The second monitor is a clean player view for maps and art — image only, plus an optional initiative overlay.

This is not a virtual tabletop. There is no account, no cloud, and no internet required at the table.

Compatible with fifth edition. Rules lookup uses the **System Reference Document 5.2** (2024 rules), already bundled. Current release: **1.1.18**.

## Features

- Dual-window layout: DM console + fullscreen player display
- Campaign folder of Markdown notes (Obsidian-friendly wikilinks and `![[images]]`)
- Click a map or portrait, then **Show to players** — 5 second fade-in on a black screen
- Map notes (`Maps/` + a `map` fence) show the picture with DM-only pins; players still see the clean image
- Optional initiative overlay on the player screen: order, whose turn, Bloodied (enemies under half HP), 0 HP statuses
- Game night sheets can pull NPC/PC/Bestiary statblocks into initiative (missing links warned; NPCs auto-roll)
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

Click **Sample** to load **Bad Blood**, the included Barovia three-shot. Tableside copies it into your user data folder so combat and notes do not write back into the git repo.

### Install on a PC (Windows)

1. Run `npm run dist` (or download `Tableside-Setup-1.1.18.exe` from a GitHub Release).
2. Double-click the installer. It is a per-user install: Start Menu + desktop shortcuts, no admin required. You can pick the folder.
3. Open **Tableside** from the Start Menu. First launch copies settings and WOTC files from an older `%APPDATA%\table-dm` folder if you already had one.

Windows may show SmartScreen (“Windows protected your PC”) because the installer is not code-signed. **More info → Run anyway**.

Uninstall from Windows Settings; campaign folders on disk and `%APPDATA%\Tableside` are left in place.

### Build the installer

```bash
npm run dist
```

Writes `dist/Tableside-Setup-1.1.18.exe`. To attach that file to a GitHub Release, tag and push: `git tag v1.1.18 && git push origin v1.1.18`.

`npm run fetch-srd` is only needed if you want to refresh the bundled SRD snapshot from the [Open5e API](https://api.open5e.com/) (`srd-2024`).

## Docs

| Doc | Audience |
| --- | --- |
| [docs/TABLE.md](docs/TABLE.md) | DMs — console layout, combat, Lookup, player display |
| [docs/RECIPES.md](docs/RECIPES.md) | DMs — game night sheet → initiative, Lookup → campaign note |
| [docs/CAMPAIGN.md](docs/CAMPAIGN.md) | DMs — folder layout, game night sheets, combatants, images |
| [docs/MARKDOWN.md](docs/MARKDOWN.md) | DMs — wikilinks, callouts, `statblock` fields |
| [WOTC/README.md](WOTC/README.md) | Optional PHB / DMG lookup file formats |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Contributors — scripts, architecture, CI |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Pull request expectations |
| [ATTRIBUTION.md](ATTRIBUTION.md) | SRD / Open5e licensing |

## Campaign folders

Campaigns are ordinary folders on disk. **New campaign** scaffolds the standard layout; **Open campaign** reads any folder and fills in missing pieces.

```
Overview.md       hub note
Sessions/         run guides and game night sheets (+ Art/)
Party/            PC sheets (+ Art/)
NPCs/             named people (+ Art/)
Bestiary/         creatures (+ Art/)
Places/           towns, sites, shops (+ Art/)
Factions/         guilds and houses (+ Art/)
Spells/           campaign spell copies
Gear/             weapons, equipment, magic items
Maps/             Art/ + Print/ (map notes with DM pins)
Handouts/         letters and props (+ Art/)
Templates/        blank sheets
Reference/        trackers and cheat sheets
Archive/          recaps and old drafts
```

Full authoring guide: **[docs/CAMPAIGN.md](docs/CAMPAIGN.md)**. At-the-table UI: **[docs/TABLE.md](docs/TABLE.md)**. Step recipes: **[docs/RECIPES.md](docs/RECIPES.md)** (also in the app **Help** panel). Markdown/`statblock` reference: **[docs/MARKDOWN.md](docs/MARKDOWN.md)**.

Book text for Lookup is **not** part of a campaign. Put Player’s Handbook and Dungeon Master’s Guide exports in the app `WOTC/` folder (or `%APPDATA%\Tableside\WOTC`). When those files are present, Lookup grows extra filters and searches that text. The SRD stays available either way. Filenames must contain `Spell`, `Equipment`, or `Magic Item` — details in [WOTC/README.md](WOTC/README.md).

### Examples

- [examples/bad-blood](examples/bad-blood) — full three-shot (also the in-app **Sample**)
- [examples/sample-campaign](examples/sample-campaign) — minimal one-night folder

## Attribution

This work includes material from the System Reference Document 5.2 (“SRD 5.2”) by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.

Structured data is republished via the Open5e API. See [ATTRIBUTION.md](ATTRIBUTION.md).
