# AGENTS.md

## Cursor Cloud specific instructions

Tableside is an Electron + React + TypeScript desktop app built with `electron-vite`. Standard scripts and architecture are documented in [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) — use `npm test` (Vitest), `npm run build`, and `npm run dev`. There is no lint script.

Non-obvious notes for running in the cloud VM:

- **Running the GUI:** `npm run dev` launches two Electron windows (DM console + player view). Electron needs a display; a VNC X server is already running on `DISPLAY=:1`, so export `DISPLAY=:1` before `npm run dev` (or `npm start`). The player window only opens fullscreen when a second monitor is present, so on the single VNC display you normally only see the DM console.
- **Expected noise:** on startup Electron logs `Failed to connect to the bus` (dbus) and `Exiting GPU process due to errors during initialization` in this headless container. These are non-fatal — the app renders and works via software rendering.
- **First launch** copies the `examples/greystead` sample campaign into user data (`~/.config/Tableside`), so the DM console opens on "Greystead — The Pale Well" with no extra setup.
- **Do not run `npm run dist`** in the cloud VM — it produces a Windows NSIS installer via `electron-builder` and is Windows-only. `dev`/`build`/`start`/`test` all work on Linux.
- **`npm run fetch-srd`** requires network access to the Open5e API; it is only for refreshing the bundled SRD snapshot and is not needed for normal development.
