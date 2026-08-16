# Table DM

A local Windows app for running **in-person** 5e-compatible games. Your laptop is the DM console. The second monitor is a clean player view for maps and art — image only, plus an optional initiative overlay.

This is not a virtual tabletop. There is no account, no cloud, and no internet required at the table.

Compatible with fifth edition. Rules lookup uses the **System Reference Document 5.2** (2024 rules), already bundled.

## Features

- Dual-window layout: DM console + fullscreen player display
- Campaign folder of Markdown notes (Obsidian-friendly wikilinks and `![[images]]`)
- Click a map or portrait, then **Show to players** — 5 second fade-in on a black screen
- Optional initiative overlay on the player screen: order, whose turn, Bloodied (enemies under half HP)
- Night sheets can pull NPC/PC statblocks into initiative
- Offline search for conditions, spells, monsters, weapons, and common rules
- Optional extra lookup from your own WOTC text files in `WOTC/` (spells, equipment, magic items)
- Add an SRD monster to the campaign Bestiary from Lookup

## Run it

```bash
npm install
npm run build
npm start
```

The folder name `D&D gaming` contains `&`, so if a script fails, run Electron via:

```bash
node ./node_modules/electron-vite/bin/electron-vite.js build
node ./node_modules/electron/cli.js .
```

`npm run fetch-srd` is only needed if you want to refresh the bundled SRD snapshot from the [Open5e API](https://api.open5e.com/) (`srd-2024`).

Two windows open. If you have a second monitor, the player window goes there fullscreen.

Click **Sample** to load **Bad Blood**, the included Barovia three-shot. Table DM copies it into your user data folder so combat and notes do not write back into the git repo.

## Campaign folder

**New campaign** creates this folder layout in an empty directory (plus `Overview.md` and Templates). **Open campaign** reads any folder live and fills in missing standard folders. Names are matched case-insensitively (`Party` / `party`, `NPCs` / `npcs`).

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
Maps/
  Art/            battle and location maps
  Print/          print-and-play PDFs
Handouts/         letters and props
  Art/            letter images
Templates/        blank Player, NPC, and Monster sheets
Reference/        tracker, locations, cheat sheets
Archive/          recaps, transcripts, old drafts
```

Book text for Lookup is **not** part of a campaign. Put Player’s Handbook and Dungeon Master’s Guide exports in the app `WOTC/` folder (or `%APPDATA%\table-dm\WOTC`). When those files are present, Lookup grows extra filters and searches that text. The SRD stays available either way.

How to format the files — one `##` heading per spell, gear item, or magic item — is in [WOTC/README.md](WOTC/README.md). Filenames must contain `Spell`, `Equipment`, or `Magic Item` so Lookup knows which chip to add.

Notes can stay in Obsidian. Use `[[Note Name]]` wikilinks and `![[Portrait.png]]` embeds. Put art in that folder's `Art/` subfolder; portrait files should match the character name. Combatants on a night sheet should be wikilinks to Party / NPCs / Bestiary sheets.

## Installer

```bash
npm run dist
```

Writes a Windows NSIS installer to `dist/`.

## Attribution

This work includes material from the System Reference Document 5.2 (“SRD 5.2”) by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.

Structured data is republished via the Open5e API. See [ATTRIBUTION.md](ATTRIBUTION.md).
