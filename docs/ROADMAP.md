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
6. **More NPC portrait picks** — expand the optional portrait gallery in **Tools → NPC** (and quick-create) so each race / gender bucket has a larger set to choose from. Keep art original or clearly licensed for bundling; respect **Hide portrait picks** / hide-bundled-artwork settings. No copyrighted publisher character art.
7. **Hourglass timer (Tools)** — a settable countdown in **Tools** next to Box of Doom–style Dice (e.g. 1 / 5 / 10 minutes, or a custom duration). **Show** puts a clean hourglass / countdown on the player TV so the table must decide before it runs out; optional soft chime on Music Sfx when it hits zero. DM can pause, reset, or Fade out. Not saved to the campaign; table pacing only.
8. **Recent / multi-campaign switching** — you already remember the last few opened campaigns (name + folder) on the empty start screen. Improve that for DMs running more than one game: a clear **Recents** (or Switch campaign) list while a campaign is already open — header, Files, or Open flow — so you can jump without hunting disk. Show path under the name; drop stale entries when the folder is gone; optional pin/favorite. Local settings only — no cloud library.
9. **Start session coach / DM reminders** — a **Start session** control that puts the night in “live” mode and surfaces short, dismissible prompts so you do not forget table habits. Not a rules engine — gentle nudges only. Build out possibilities such as:
   - **Session start:** offer inspiration; roll or set the party’s marching order; ask for downtime / last session hooks; confirm who’s at the table; optional “music on?” cue
   - **When combat starts:** legendary actions / lair actions; concentration checks on damage; reactions available; bloodied / 0 HP callouts; who goes first on the TV
   - **Between scenes:** short rest / long rest; ration or resource drains; faction clocks; “what did they learn?”
   - **Session end:** inspiration left on the table; milestone / XP note; recap prompt; next-session hook  
   Prefer system-aware copy (5e first; PF2e/V5 variants later). Let the DM snooze, disable per cue, or turn the whole coach off. No player-TV spam unless the DM chooses to Show something.
10. **Docs keep-up** — README, GUIDE, TABLE, and Help stay on the current release.

## Later

- Prep import polish (paste / Beyond → campaign sheet without becoming a sync client)
- Optional music cues when a scene Plays
- Printable handout export from a note
- **Campaign zip backup** — one-click export of the open campaign folder to a `.zip` (and optional import/restore into a chosen folder). For backing up before a session, moving a one-shot to another PC, or sharing a self-contained night with a friend. Stays local files only — no cloud upload. Skip huge regenerable caches if any; keep notes, art, audio, and `campaign.json` / `combat.json` / `audio.json`.
- **Party glance strip (possible)** — optional DM-only strip (header or over the map) showing live AC / HP / PP for the current party, same data as `[!party]` cards, so you need not flip back to the night sheet mid-map or mid-combat. Toggle off when you want the space. Never on the player TV.
- **Linux build** — ship a packaged Linux app alongside the Windows installer (AppImage and/or `.deb` via electron-builder). Keep the same table-first dual-monitor flow; document display/VNC quirks for contributors. macOS packaging stays optional until there is real demand.

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
