# Table DM

A local Windows app for running **in-person** 5e-compatible games. Your laptop is the DM console. The second monitor is a clean player view for maps, art, and handouts.

This is not a virtual tabletop. There is no account, no cloud, and no internet required at the table.

Compatible with fifth edition. Rules lookup uses the **System Reference Document 5.2** (2024 rules).

## Features

- Dual-window layout: DM console + fullscreen player display
- Campaign folder with Markdown session notes, party cards, and a media library
- Click a map or handout to push it to the player monitor
- Offline search for conditions, spells, monsters, weapons, and common rules
- Initiative tracker with HP on the DM side only
- Optional name-only turn order on the player screen

## Run it

```bash
npm install
npm run fetch-srd
npm run dev
```

After a production build (`npm run build`), use `npm start`.

`fetch-srd` downloads a slim SRD 5.2 snapshot from the [Open5e API](https://api.open5e.com/) (`srd-2024`). You only need a network connection for that step.

Two windows open. If you have a second monitor, the player window goes there fullscreen. If you only have one screen, drag the player window to the TV later, or use the **Player display** menu.

Click **Sample** to load the included Ember Road campaign and try sending *Forest Road* to the player screen.

## Campaign folder

Point the app at any folder. It will create this layout if needed:

```
campaign.json
combat.json
party/          one JSON file per PC
npcs/           homebrew / named NPCs
sessions/       Markdown run-of-show notes
media/          maps, art, handouts (png, jpg, webp, gif, svg)
```

Your Obsidian vault can wait. Later, the same `sessions/` idea can point at existing Markdown notes.

Do not put campaign notes or player data in this git repo.

## Attribution

This work includes material from the System Reference Document 5.2 (“SRD 5.2”) by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.

Structured data is republished via the Open5e API. See [ATTRIBUTION.md](ATTRIBUTION.md).
