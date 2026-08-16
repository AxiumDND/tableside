# Table DM

A local Windows app for running **in-person** 5e-compatible games. Your laptop is the DM console. The second monitor is a clean player view for maps and art — image only, nothing else.

This is not a virtual tabletop. There is no account, no cloud, and no internet required at the table.

Compatible with fifth edition. Rules lookup uses the **System Reference Document 5.2** (2024 rules).

## Features

- Dual-window layout: DM console + fullscreen player display
- Campaign folder of Markdown notes (Obsidian-friendly wikilinks and `![[images]]`)
- Click a map or portrait, then **Show to players** — 5 second fade-in on a black screen
- Night sheets can pull NPC/PC statblocks into initiative
- Offline search for conditions, spells, monsters, weapons, and common rules
- Initiative tracker on the DM side only

## Run it

```bash
npm install
npm run fetch-srd
npm run dev
```

After a production build (`npm run build`), use `npm start`.

The folder name `D&D gaming` contains `&`, so if a script fails, run Electron via:

```bash
node ./node_modules/electron-vite/bin/electron-vite.js build
node ./node_modules/electron/cli.js .
```

`fetch-srd` downloads a slim SRD 5.2 snapshot from the [Open5e API](https://api.open5e.com/) (`srd-2024`). You only need a network connection for that step.

Two windows open. If you have a second monitor, the player window goes there fullscreen.

Click **Sample** to load **Bad Blood**, the included Barovia three-shot.

## Campaign folder

Point **Open campaign** at any folder. Table DM reads it live. A layout that works well at the table:

```
campaign.json     campaign name (hidden in the file tree)
combat.json       live initiative (hidden)
Overview.md       hub note — opens first if present

Sessions/         run guides and night sheets
Party/            PC sheets (always loaded into combat)
NPCs/             named NPCs with statblocks
Bestiary/         creatures
Templates/        blank Player, NPC, and Monster sheets
Maps/             battle maps and location maps
Scenes/           establishing shots
Portraits/        character art
Handouts/         letters and props
Reference/        tracker, locations, cheat sheets
Archive/          recaps, transcripts, old drafts
```

Notes can stay in Obsidian. Use `[[Note Name]]` wikilinks and `![[Portrait.png]]` embeds. Portrait files should match the character name. Combatants on a night sheet should be wikilinks to Party / NPCs / Bestiary sheets.

The app will not create empty `party/` or `media/` folders on open.

## Attribution

This work includes material from the System Reference Document 5.2 (“SRD 5.2”) by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.

Structured data is republished via the Open5e API. See [ATTRIBUTION.md](ATTRIBUTION.md).
