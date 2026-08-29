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

## Committing

The renderer builds with esbuild (no type-checking) and CI packages on `windows-latest`, so before committing non-trivial changes run `npm run typecheck`, `npm run lint`, and `npm test`. Do not regenerate `package-lock.json` from scratch on a single platform — that drops the other platforms' optional native deps (`@rollup/*`, `@esbuild/*`) and breaks `npm ci` on Windows CI (npm/cli#4828); let `npm install` update the existing lockfile instead.
