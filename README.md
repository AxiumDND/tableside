# Tableside

A local Windows app for running **in-person** tabletop games. Your laptop is the DM console. The second monitor is a clean player view for maps and art — image only, plus an optional initiative overlay.

This is not a virtual tabletop. There is no account, no cloud, and no internet required at the table.

**New campaign** asks which system pack to use: **D&D 5e** (bundled SRD 5.2.1), **Pathfinder 2e** (small original core), or **Vampire 5th Edition** (Health / Willpower / Hunger tracker and original table procedures). Existing folders without a `system` field keep working as D&D 5e. Sample is still the 5e Greystead one-shot. Current release: **1.2.1**.

Tableside is a table app. It is not an official Wizards, Paizo, or Paradox product.

## Install (Windows)

**[Download the latest installer](https://github.com/AxiumDND/tableside/releases/latest)** — look for `Tableside-Setup-1.2.1.exe`. No account, no admin.

1. Run the installer. It is a per-user install: Start Menu + desktop shortcuts. You can pick the folder.
2. Open **Tableside** from the Start Menu.
3. First launch opens **Greystead — The Pale Well**, a level-1 one-shot. **Sample** loads that same folder.

Installed copies check GitHub when you are online. If a newer version exists, a dismissible bar says **Tableside x.y.z is available — Update**. Nothing downloads until you click that. Help also has **Check for updates**. Offline, the app stays quiet.

### Windows SmartScreen

The installer is **not code-signed**. Windows will often block it the first time. That is expected, not a virus warning from a scan.

1. The blue box says **Windows protected your PC**.
2. Click **More info**.
3. Click **Run anyway**.

If you downloaded from this GitHub repo’s Releases page, that is the official file. There is no store listing and no paid certificate yet — a hobby app. After you run it once, Windows usually stops asking.

Uninstall from Windows Settings. Campaign folders on disk and `%APPDATA%\Tableside` stay put.

Older builds used `%APPDATA%\table-dm`. First launch copies settings and optional WOTC files from there if they exist.

## Who made this

I'm one person — a DM first, and only a basic coder. Tableside would not exist without AI as a pair programmer. I decide what the app should do at the table, and I review what goes into the repo. This is a hobby tool for in-person games, not a studio product. If you want something built by a full team, this isn't that. If you want something a single GM made so the laptop and the player TV just work, this is it.

Questions or thanks: [tableside.gm@gmail.com](mailto:tableside.gm@gmail.com). If it helped at your table, you can [buy me a coffee](https://ko-fi.com/tablesidegm).

## Features

- Dual-window layout: DM console + fullscreen player display
- Campaign folder of Markdown notes (Obsidian-friendly wikilinks and `![[images]]`)
- Click a map or portrait, then **Show to players** — 5 second fade-in on a black screen
- Map notes (`Maps/` + a `map` fence) show the picture with DM-only pins; players still see the clean image
- Optional initiative overlay on the player screen: order, whose turn, and pack tags (5e Bloodied / 0 HP; PF2e Dying / Wounded; V5 Health, Willpower, Hunger)
- Game night sheets can pull NPC/PC/Bestiary statblocks into initiative (missing links warned; NPCs auto-roll)
- Offline Lookup for the open campaign’s system pack (5e SRD; PF2e original core; V5 original procedures)
- Optional extra 5e lookup from your own WOTC text files in `WOTC/` (spells, equipment, magic items)
- Add a monster, spell, or gear item from Lookup into the campaign Bestiary, Spells, or Gear folder
- In-app **Help**, recent campaigns, file-tree filter, and table hotkeys (`Alt+S` / `Alt+T` / `Alt+X`)
- Installed copies can check GitHub for a newer release (a dismissible notice; nothing downloads until you press **Update**)

## Run from source

```bash
npm install
npm run dev
```

Two windows open. If you have a second monitor, the player window goes there fullscreen.

```bash
npm run build
npm start
```

```bash
npm run dist
```

Writes `dist/Tableside-Setup-1.2.1.exe`. Pushing a `v1.2.1` tag builds that file and attaches it to the [GitHub Release](https://github.com/AxiumDND/tableside/releases/latest).

`npm run fetch-srd` is only needed if you want to refresh the bundled SRD snapshot from the [Open5e API](https://api.open5e.com/) (`srd-2024`).

The bundled sample is **[examples/greystead](examples/greystead)**. Tableside copies it into your user data so combat and notes do not write back into the git repo or the install folder.

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

Campaigns are ordinary folders on disk. **New campaign** picks a system, then scaffolds the standard layout; **Open campaign** reads any folder and fills in missing pieces. Folders without `"system"` in `campaign.json` default to D&D 5e.

```
Start Here/       hub notes (Overview.md — opens first)
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

Book text for Lookup is **not** part of a campaign and is **not** shipped. On a **D&D 5e** campaign, put Player’s Handbook and Dungeon Master’s Guide exports in the app `WOTC/` folder (or `%APPDATA%\Tableside\WOTC`). When those files are present, Lookup grows extra filters and searches that text. The SRD stays available either way. Filenames must contain `Spell`, `Equipment`, or `Magic Item` — details in [WOTC/README.md](WOTC/README.md). Pathfinder 2e and Vampire 5th campaigns do not load WOTC dumps.

## Attribution

This work includes material from the System Reference Document 5.2 (“SRD 5.2”) by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.

Structured data is republished via the Open5e API. See [ATTRIBUTION.md](ATTRIBUTION.md).

The Pathfinder 2e and Vampire 5th packs are original Tableside table material. They are not official Paizo or Paradox products and do not ship published adventure or clan/discipline book text.

Tableside is an independent project and is not affiliated with Wizards of the Coast, Paizo Inc., or Paradox Interactive.
