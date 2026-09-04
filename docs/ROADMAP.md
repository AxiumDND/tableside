# Roadmap

Tableside is a **hobby DM console for in-person nights**: laptop at the table, second monitor for the players. This list is directional, not a promise. Day-to-day focus stays **D&D 5e** at the table.

If a feature mainly helps remote / online play, it does not belong here.

## Near term (highest table impact)

1. **Session pacing aids** — tonight strip / session clock; optional scene timer.
2. **Handout / art queue** — preload a few images and advance with a hotkey.
3. **Combat ↔ map glue** — focus or highlight the active combatant’s token; DM-only HP / condition cues on tokens.
4. **NPC name flavor dropdown** — in **Tools → NPC**, add a style/flavor picker beyond race/ancestry lists, so you can roll names that sound like:
   - Classic fantasy
   - Norse
   - Greek mythology
   - Celtic / Gaelic
   - Roman / Latinate
   - Arabic / desert-fantasy
   - Slavic
   - East Asian–inspired  
   Keep lists original Tableside table material (not scraped book name tables). Pair with the existing feminine / masculine / any control.
5. **Richer Tools → Links for DM prep** — grow the curated link list so it covers more of a prep night, not just a handful of starters. Aim for useful categories such as:
   - Rules / SRD quick reference
   - Maps & battlemap makers
   - Tokens / portraits / free art
   - Generators (NPCs, loot, dungeons, encounters, names)
   - GM advice & lazy-prep workflows
   - Music / ambience finders (links only — still no bundled copyrighted audio)
   - Puzzles, traps, and random tables  
   Keep entries 5e-friendly, open in the system browser, short blurbs, no junk or paywall-bait. Easy incremental PRs via `src/shared/tableLinks.ts`.
6. **Docs keep-up** — README, GUIDE, TABLE, and Help stay on the current release.

## Later

- Prep import polish (paste / Beyond → campaign sheet without becoming a sync client)
- Optional music cues when combat starts or a scene Plays
- Printable handout export from a note
- Pathfinder 2e and Vampire 5th proper pass (sheet fields, overlay tags, lookup depth, sample content) — already called out in the README

## Out of scope

Tableside is **table-first**. These are explicitly not goals:

- Online multiplayer or remote player clients
- Accounts, logins, or cloud campaign sync
- Turning the player TV into a full VTT (dynamic lighting, freehand draw tools for online maps, etc.)
- Shipping PHB / DMG / other copyrighted book text

## Good first contributions

These are usually small, reviewable, and helpful without deep Electron knowledge:

- Doc / Help copy that still mentions an old UI name or version
- Extra curated links in `src/shared/tableLinks.ts` (DM prep: maps, generators, art, advice — see roadmap item 5)
- Unit tests for pure helpers under `src/shared/` or `src/renderer/src/lib/`
- Greystead / sample campaign typos and clearer night-sheet beats
- Accessibility or wording fixes in existing panels (no redesign)

Open an issue first if the change is more than a few files, or if you are unsure
it fits the laptop-at-the-table niche. See [CONTRIBUTING.md](../CONTRIBUTING.md).
