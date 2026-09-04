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

## System support

Day-to-day remains **D&D 5e**. New packs stay table-first: sheet templates, combat overlay tags, Lookup depth, NPC names, Links where useful, and a small sample when it is worth shipping. No mid-campaign system switch. No shipping copyrighted rulebook text — use SRD / ORC / original table material only.

### Full Pathfinder 2e

Promote the early PF2e pack to **full support**:

- Sheet fields and layouts that match how PF2e is run at the table (PC / NPC / creature)
- Combat tracker + player TV overlay tags beyond Dying / Wounded
- Deeper offline Lookup (conditions, actions, common creatures/spells — original or ORC-safe)
- Treasure / shops / Improvise equivalents where they help
- Sample one-shot or starter night sheet (Greystead-scale, original)

### Starfinder

Add a **Starfinder** system pack (evaluate Starfinder 1e vs Starfinder 2e against Paizo’s current open licenses before building). Fit the existing Sci-fi look / crawl / hyperspace tools:

- New campaign system option + sheet templates
- Combat fields and TV overlay tags appropriate to Starfinder
- Offline Lookup core (original / ORC-safe)
- NPC names and Links aimed at sci-fi prep
- Optional small sample night

### Other games to evaluate

Candidates to review for a later pack (not committed — pick ones that fit laptop + TV nights and have a clear open / original-content path):

| Candidate | Why it might fit |
| --- | --- |
| **Vampire 5th** (finish) | Already scaffolded; needs the same “proper pass” as PF2e |
| **Call of Cthulhu / BRP** | Investigation nights, handouts, and TV art are a natural fit |
| **Blades in the Dark** (and Forged in the Dark cousins) | Crew sheets, clocks, and score prep map cleanly to night sheets |
| **Savage Worlds** | Fast combat and genre-agnostic tables |
| **OSR / Old School Essentials–style** | Simple sheets, strong map + exploration loop |
| **Dragonbane** | Compact fantasy nights; light sheet surface |
| **Shadowrun** | Overlaps sci-fi chrome; only if licensing / original pack is clear |

Evaluate each on: in-person table value, sheet/combat complexity, Lookup licensing, and whether a tiny original sample is realistic. Skip anything that forces online play or a full VTT feature set.

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
