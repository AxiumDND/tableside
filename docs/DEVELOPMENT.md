# Development

User-facing how-to: [GUIDE.md](GUIDE.md).

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
| `npm run test:e2e` | Build then Playwright smoke against Electron (`e2e/`). Sets `TABLESIDE_E2E=1` so profiles stay hermetic |
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
  main/           Electron main process (windows, IPC, campaign modules, Additional Books)
  preload/        Context bridge API for the renderer
  renderer/       React UI (DM console + player view)
    src/
      components/ UI pieces (combat, notes, lookup, …)
      lib/        Parsing, combat helpers, SRD/book search
      data/srd/   Bundled SRD 5.2.1 snapshot (do not edit by hand — use fetch-srd)
      windows/    DmApp / PlayerApp entry points
  shared/         Types, campaign layout, sheet templates (main + renderer)
examples/
  greystead/      Only sample — first launch, Sample button, and installer extraResource
scripts/
  fetch-srd.mjs   Open5e → src/renderer/src/data/srd
  convert-srd-portraits.mjs / convert-srd-items.mjs / convert-srd-schools.mjs
Additional Books/ Optional local book text for Lookup (not shipped)
docs/             Authoring and contributor docs
```

## Two windows

- **DM window** — campaign tree, notes, combat, dice, Lookup
- **Player window** — fullscreen image (and optional initiative overlay) on the second display when available

Main process entry is `src/main/index.ts` (windows + IPC wiring). Sample campaign copy lives in `src/main/sampleCampaign.ts`; folder load/tree/templates in `src/main/campaignFolder.ts`; note/file mutations in `src/main/campaignNotes.ts`; mixer/library in `src/main/campaignMixer.ts`; player window/state in `src/main/playerOutput.ts`; settings/folders in `src/main/appSettings.ts`. Shared campaign folder rules live in `src/shared/campaignLayout.ts`.

## Campaign I/O

Campaigns are plain folders on disk. The app:

- Watches / reloads markdown and images from the open folder
- Hides `campaign.json` and `combat.json` in the tree
- Skips `.obsidian`, `.git`, `Additional Books`, and similar noise directories
- Copies **Sample** (Greystead) into user data so edits do not write back to the repo / install bundle. First launch with no usable `campaignFolder` opens that copy.

See [CAMPAIGN.md](CAMPAIGN.md) for the folder contract authors rely on.

## SRD data

Bundled search data is under `src/renderer/src/data/srd/`. Re-fetch with:

```bash
npm run fetch-srd
```

That hits the Open5e API (network required for the script only). The app itself does not need internet at the table. Attribution: [ATTRIBUTION.md](../ATTRIBUTION.md).

## Optional book lookup

Format and placement of personal PHB/DMG text files: [Additional Books/README.md](../Additional%20Books/README.md). The main process also writes a short `README.txt` into `%APPDATA%\Tableside\Additional Books` when that folder is created.

## CI

[`.github/workflows/build.yml`](../.github/workflows/build.yml) on pushes and pull requests to `main`:

- `build` on `windows-latest`: `npm ci`, `npm test`, `npm run build`
- `checks` on `ubuntu-latest`: lint, typecheck, tests, then `xvfb-run` e2e (the same gate a tag must pass)

Scripts that shell out to `tsc` / `vitest` / `playwright` use `node ./node_modules/...` so paths with `&` (for example `D&D gaming`) do not break `cmd.exe` on Windows.

Hermetic Electron smoke: `npm run test:e2e` (builds first). The suite sets `TABLESIDE_E2E=1` so `migrateLegacyUserData` does not copy a real `%APPDATA%\table-dm` profile into the temp userData dir.

[`.github/workflows/release.yml`](../.github/workflows/release.yml) publishes a GitHub Release when you push a `v*` tag (for example `git tag v1.2.0 && git push origin v1.2.0`). The Ubuntu `checks` job is the same lint / typecheck / test / e2e sequence as pull requests; the Windows installer job (`npm run dist`) waits for it, so a tag cannot ship what PR CI would have blocked. The release must include `latest.yml` (and the `.exe`) so installed copies can check for updates.

## Packaging notes

`electron-builder` ships `examples/greystead` as the only campaign extra resource, plus `srd-portraits`, `srd-items`, `srd-schools`, and `stock-art`. Product name is **Tableside** (`com.tabledm.app`). `npm run dist` writes `dist/Tableside-Setup-<version>.exe` (per-user NSIS: Start Menu + desktop shortcuts, custom icon). Window and installer icons live in `resources/icon.ico` (regenerate with `node scripts/make-app-icon.mjs`). First launch copies `%APPDATA%\table-dm` settings/books/samples into `%APPDATA%\Tableside` if needed.

## Where behavior lives

| Concern | Start here |
| --- | --- |
| Window creation, IPC wiring | `src/main/index.ts` |
| Sample campaign copy / refresh | `src/main/sampleCampaign.ts` |
| Campaign folder load / tree / templates | `src/main/campaignFolder.ts` |
| Note create / duplicate / art / delete | `src/main/campaignNotes.ts` |
| Shared image extension set | `src/shared/imageExt.ts` |
| Campaign audio mixer / library | `src/main/campaignMixer.ts` |
| Player window / display / state | `src/main/playerOutput.ts` |
| App settings / folders / migrate | `src/main/appSettings.ts` |
| GitHub update check | `src/main/appUpdater.ts` |
| `tabledm://` media protocol | `src/main/mediaAssets.ts` |
| Preload bridge (`window.tabledm`) | `src/preload/index.ts` |
| DM UI shell | `src/renderer/src/windows/DmApp.tsx` |
| DM player playback orchestration | `src/renderer/src/hooks/usePlayerPlayback.ts` |
| Session notes panel | `src/renderer/src/components/SessionNotes.tsx` |
| Session note markdown / callouts | `src/renderer/src/components/SessionNoteMarkdown.tsx` |
| Map board (state / stage) | `src/renderer/src/components/MapView.tsx` |
| Map helpers / toolbars | `src/renderer/src/components/MapViewHelpers.ts`, `MapViewPanels.tsx` |
| Player fullscreen view | `src/renderer/src/windows/PlayerApp.tsx` |
| Night-sheet / combatant parsing | `src/renderer/src/lib/notes.ts` |
| Map note / fog / camera | `src/renderer/src/lib/mapNote.ts`, `mapFog.ts`, `mapCamera.ts` |
| Statblock YAML | `src/renderer/src/lib/statblock.ts` |
| SRD search index | `src/renderer/src/lib/srd.ts` + `data/srd/` |
| Book text parse | `src/renderer/src/lib/bookParse.ts`, `src/main/bookLibrary.ts` |
| Sheet templates | `src/shared/sheetTemplates.ts` |
| Folder aliases / hidden files | `src/shared/campaignLayout.ts` |

Author-facing contracts: [CAMPAIGN.md](CAMPAIGN.md), [MARKDOWN.md](MARKDOWN.md), [TABLE.md](TABLE.md), [RECIPES.md](RECIPES.md). In-app Help is the table-side version of TABLE + RECIPES (`src/renderer/src/components/HelpPanel.tsx`).

## Scripts notes

- `scripts/fetch-srd.mjs` — network required; writes JSON under `src/renderer/src/data/srd/`. Commit the refreshed JSON if the SRD snapshot should update for everyone.

## Docs maintenance

When you change parsing or UI that authors rely on (combatant lines, callouts, templates, Lookup chips), update the matching doc in the same PR. Prefer examples copied from Greystead over abstract prose.
