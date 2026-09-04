# Roadmap

Tableside is a hobby dual-monitor DM console. This list is directional, not a
promise. Day-to-day focus stays **D&D 5e** at the table.

## Near term (highest table impact)

1. **Session pacing aids** — tonight strip / session clock; optional scene timer.
2. **Handout / art queue** — preload a few images and advance with a hotkey.
3. **Combat ↔ map glue** — focus or highlight the active combatant’s token; DM-only HP / condition cues on tokens.
4. **Docs keep-up** — README, GUIDE, TABLE, and Help stay on the current release.

## Later

- Prep import polish (paste / Beyond → campaign sheet without becoming a sync client)
- Optional music cues when combat starts or a scene Plays
- Printable handout export from a note
- Pathfinder 2e and Vampire 5th proper pass (sheet fields, overlay tags, lookup depth, sample content) — already called out in the README

## Out of scope

- Online multiplayer, accounts, or cloud campaign sync
- Full VTT lighting / drawing for the player TV
- Shipping PHB / DMG / other copyrighted book text

## Good first contributions

These are usually small, reviewable, and helpful without deep Electron knowledge:

- Doc / Help copy that still mentions an old UI name or version
- Extra curated links in `src/shared/tableLinks.ts` (5e-friendly, no junk)
- Unit tests for pure helpers under `src/shared/` or `src/renderer/src/lib/`
- Greystead / sample campaign typos and clearer night-sheet beats
- Accessibility or wording fixes in existing panels (no redesign)

Open an issue first if the change is more than a few files, or if you are unsure
it fits the local dual-monitor niche. See [CONTRIBUTING.md](../CONTRIBUTING.md).
