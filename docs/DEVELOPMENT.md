# Development

Table DM is an Electron + React + TypeScript app built with [electron-vite](https://electron-vite.org/).

## Requirements

- Node.js 22+ (CI uses 22)
- npm
- Windows for the packaged installer (`npm run dist`); `dev` / `build` / `start` work on other platforms for development

## Scripts

| Command | What it does |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run dev` | Hot-reload Electron app (DM + player windows) |
| `npm run build` | Compile main, preload, and renderer into `out/` |
| `npm start` | Run the built app (`electron .`) |
| `npm run preview` | electron-vite preview |
| `npm run dist` | Build + Windows NSIS installer in `dist/` |
| `npm run fetch-srd` | Refresh bundled SRD JSON from the [Open5e](https://api.open5e.com/) `srd-2024` document |

Typical loop:

```bash
npm install
npm run dev
```

Or build then run:

```bash
npm run build
npm start
```

## Layout

```
src/
  main/           Electron main process (windows, IPC, campaign I/O, WOTC folder)
  preload/        Context bridge API for the renderer
  renderer/       React UI (DM console + player view)
    src/
      components/ UI pieces (combat, notes, lookup, …)
      lib/        Parsing, combat helpers, SRD/WOTC search
      data/srd/   Bundled SRD 5.2.1 snapshot (do not edit by hand — use fetch-srd)
      windows/    DmApp / PlayerApp entry points
  shared/         Types, campaign layout, sheet templates (main + renderer)
examples/
  bad-blood/      Sample campaign shipped with the installer
  sample-campaign/ Minimal demo folder
scripts/
  fetch-srd.mjs   Open5e → src/renderer/src/data/srd
  tidy-bad-blood.mjs  One-off helper for reshaping the Bad Blood example
WOTC/             Optional local book text for Lookup (not shipped)
docs/             Authoring and contributor docs
```

## Two windows

- **DM window** — campaign tree, notes, combat, dice, Lookup
- **Player window** — fullscreen image (and optional initiative overlay) on the second display when available

Main process code lives in `src/main/index.ts`. Shared campaign folder rules live in `src/shared/campaignLayout.ts`.

## Campaign I/O

Campaigns are plain folders on disk. The app:

- Watches / reloads markdown and images from the open folder
- Hides `campaign.json` and `combat.json` in the tree
- Skips `.obsidian`, `.git`, `WOTC`, and similar noise directories
- Copies **Sample** (Bad Blood) into user data so edits do not write back to the repo / install bundle

See [CAMPAIGN.md](CAMPAIGN.md) for the folder contract authors rely on.

## SRD data

Bundled search data is under `src/renderer/src/data/srd/`. Re-fetch with:

```bash
npm run fetch-srd
```

That hits the Open5e API (network required for the script only). The app itself does not need internet at the table. Attribution: [ATTRIBUTION.md](../ATTRIBUTION.md).

## Optional WOTC lookup

Format and placement of personal PHB/DMG text files: [WOTC/README.md](../WOTC/README.md). The main process also writes a short `README.txt` into `%APPDATA%\table-dm\WOTC` when that folder is created.

## CI

[`.github/workflows/build.yml`](../.github/workflows/build.yml) runs `npm ci` and `npm run build` on `windows-latest` for pushes and pull requests to `main`.

## Packaging notes

`electron-builder` ships `examples/bad-blood` as an extra resource. Product name is **Table DM** (`com.tabledm.app`). Installer target is Windows NSIS only today.
