# AGENTS.md

## Cursor Cloud specific instructions

Tableside is an Electron + React + TypeScript desktop app built with `electron-vite`. Architecture and scripts are documented in [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

Common scripts: `npm test` (Vitest unit + component), `npm run typecheck` (tsc over the node + web tsconfigs), `npm run lint` (ESLint flat config), `npm run build`, `npm run dev`, and `npm run test:e2e` (Playwright driving the built Electron app).

Non-obvious notes for running in the cloud VM:

- **Running the GUI:** `npm run dev` (or `npm start` for the built app) launches Electron windows. Electron needs a display; a VNC X server runs on `DISPLAY=:1`, so export `DISPLAY=:1` first. The player window only opens fullscreen when a second monitor is present, so on the single VNC display you normally see just the DM console.
- **Expected noise:** on startup Electron logs `Failed to connect to the bus` (dbus) and `Exiting GPU process due to errors during initialization` in this headless container. These are non-fatal — the app renders via software rendering.
- **E2E tests:** `npm run test:e2e` builds first (`pretest:e2e`) then drives the packaged app via Playwright's Electron support. Run it under the VNC display (`DISPLAY=:1`) or via `xvfb-run`.
- **First launch** copies the `examples/greystead` sample campaign into user data (`~/.config/Tableside`), so the DM console opens on "Greystead — The Pale Well" with no extra setup.
- **Do not run `npm run dist`** in the cloud VM — it produces a Windows NSIS installer via `electron-builder` and is Windows-only. `dev`/`build`/`start`/`test`/`lint`/`typecheck`/`test:e2e` all work on Linux.
- **`npm run fetch-srd`** requires network access to the Open5e API; it is only for refreshing the bundled SRD snapshot.
- **Optional book text** for the Lookup panel lives in the `Additional Books/` folder (only its `README.md` is tracked; book dumps are gitignored).

## Testing strategy

Where tests live and the conventions to follow:

- **Logic units** (`src/shared/**`, `src/renderer/src/lib/**`, `src/main/**`): plain Vitest in the node environment. Parsers/serializers/heuristics (e.g. `bookParse`, `statblock`, `notes`, `callouts`) are pure and should be covered here — this is the cheapest, highest-signal layer.
- **Hooks + components** (`src/renderer/src/**/*.test.tsx`): React Testing Library. Opt into jsdom with a top-of-file `// @vitest-environment jsdom` comment. Assert with plain matchers (`toBeTruthy()`, `queryByRole(...)` + `toBeNull()`), not `jest-dom`'s `toBeInTheDocument()` — the project does not wire up `jest-dom` types.
- **Canvas/geometry components** (e.g. `MapView`): jsdom has no layout or canvas, so mock the canvas child (`vi.mock('./MapStage', ...)`) and test only geometry-independent logic (tool state, fog cover/clear → `onChange`). Real pointer/canvas interaction belongs in E2E.
- **E2E** (`e2e/*.spec.ts`): Playwright driving the built Electron app. Share the launcher in `e2e/harness.ts` (`launchTableside()`), which boots against an isolated temp `--user-data-dir`; first launch copies the `examples/greystead` sample into a writable working copy, so edits/saves never touch the repo's tracked example files. Run under `DISPLAY=:1` or `xvfb-run`. Avoid flows that need native OS dialogs (folder pickers, display pickers) — Playwright cannot drive them; cover those manually.

Priorities: favor logic units and end-to-end flows over exhaustive tests of presentational cards. Do not gate CI on a coverage threshold. Check the numbers with `npm run test:coverage` when useful (its `coverage/` output is gitignored and ESLint-ignored).

## Committing

The renderer builds with esbuild (no type-checking) and CI packages on `windows-latest`, so before committing non-trivial changes run `npm run typecheck`, `npm run lint`, and `npm test`. Do not regenerate `package-lock.json` from scratch on a single platform — that drops the other platforms' optional native deps (`@rollup/*`, `@esbuild/*`) and breaks `npm ci` on Windows CI (npm/cli#4828); let `npm install` update the existing lockfile instead.
