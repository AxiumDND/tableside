# Development

Tableside is an Electron + React + TypeScript app built with [electron-vite](https://electron-vite.org/).

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
| `npm test` | Run Vitest unit tests (parsers, combat helpers) |
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
  convert-srd-portraits.mjs / convert-srd-items.mjs / convert-srd-schools.mjs
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

Format and placement of personal PHB/DMG text files: [WOTC/README.md](../WOTC/README.md). The main process also writes a short `README.txt` into `%APPDATA%\Tableside\WOTC` when that folder is created.

## CI

[`.github/workflows/build.yml`](../.github/workflows/build.yml) runs `npm ci`, `npm test`, and `npm run build` on `windows-latest` for pushes and pull requests to `main`.

[`.github/workflows/release.yml`](../.github/workflows/release.yml) builds the Windows NSIS installer and publishes a GitHub Release when you push a `v*` tag (for example `git tag v1.1.0 && git push origin v1.1.0`).

## Packaging notes

`electron-builder` ships `examples/bad-blood` as an extra resource, plus `srd-portraits`, `srd-items`, and `srd-schools`. Product name is **Tableside** (`com.tabledm.app`). `npm run dist` writes `dist/Tableside-Setup-<version>.exe` (per-user NSIS: Start Menu + desktop shortcuts, custom icon). Window and installer icons live in `resources/icon.ico` (regenerate with `node scripts/make-app-icon.mjs`). First launch copies `%APPDATA%\table-dm` settings/WOTC/samples into `%APPDATA%\Tableside` if needed.

## Where behavior lives

| Concern | Start here |
| --- | --- |
| Window creation, IPC, campaign folder I/O | `src/main/index.ts` |
| Preload bridge (`window.tabledm`) | `src/preload/index.ts` |
| DM UI shell | `src/renderer/src/windows/DmApp.tsx` |
| Player fullscreen view | `src/renderer/src/windows/PlayerApp.tsx` |
| Night-sheet / combatant parsing | `src/renderer/src/lib/notes.ts` |
| Statblock YAML | `src/renderer/src/lib/statblock.ts` |
| SRD search index | `src/renderer/src/lib/srd.ts` + `data/srd/` |
| WOTC text parse | `src/renderer/src/lib/wotcParse.ts`, `src/main/wotcLibrary.ts` |
| Sheet templates | `src/shared/sheetTemplates.ts` |
| Folder aliases / hidden files | `src/shared/campaignLayout.ts` |

Author-facing contracts: [CAMPAIGN.md](CAMPAIGN.md), [MARKDOWN.md](MARKDOWN.md), [TABLE.md](TABLE.md), [RECIPES.md](RECIPES.md). In-app Help is the table-side version of TABLE + RECIPES (`src/renderer/src/components/HelpPanel.tsx`).

## Scripts notes

- `scripts/fetch-srd.mjs` — network required; writes JSON under `src/renderer/src/data/srd/`. Commit the refreshed JSON if the SRD snapshot should update for everyone.
- `scripts/tidy-bad-blood.mjs` — one-off migration helper for reshaping the Bad Blood example; not part of normal builds.

## Docs maintenance

When you change parsing or UI that authors rely on (combatant lines, callouts, templates, Lookup chips), update the matching doc in the same PR. Prefer examples copied from real Bad Blood / template patterns over abstract prose.
