# _Claude Context — Bad Blood
*Read me first. This page tells an AI assistant how this folder works so it can help without re-learning the conventions each time. Not a play document — see [[Bad Blood — Overview]] for the arc itself.*

> [!success] ✅ THE ARC IS FINISHED — played 29 Jun → 27 Jul 2026
> This is **no longer a prep vault.** It is a completed arc plus a library of reusable material. If James asks for help here, he is almost certainly doing one of three things:
> **1. Referring back** to what happened → [[Bad Blood — Arc Conclusion & Continuity]] and the three `— Actual Play` notes are the source of truth. **Prep files describe intent, not events — never quote a run guide as if it happened.**
> **2. Planning something new** → [[Bad Blood — What Next (Ideas & Reusable Assets)]] has the asset inventory and six worked pitches.
> **3. Adding a session write-up** → see "Session write-up workflow" below.

## What this is
A completed prep-and-play archive for **Bad Blood — A Barovia Three-Shot**, a self-contained D&D horror arc James ran for his table. It lives inside a larger **Obsidian** vault (`Forge`). Treat every `.md` file as an Obsidian note, not plain markdown.

## Hard facts (easy to get wrong — don't)
- **System:** D&D 5E **2024 rules** (not 2014). Use 2024 stat-block and rules conventions.
- **Party:** **4 PCs**, finished at **Level 8**. Dallas (Glen — gnome Sorcerer), Lucian (Joe — dhampir Warlock, Undead patron, von Zarovich blood), Lykta (Natalia — dhampir Druid Stars/Monk, spirit medium), Jasper (David — halfling Fighter EK, monster hunter).
- **Played:** Session 0.5 (29 Jun, 3 players) · Session 1 (13 Jul, 3 players) · Session 2 (20 Jul, all four) · Session 3 (27 Jul, all four).
- **★ How it ended — get this right:** all four **survived**; **Lyssa von Zarovich is permanently destroyed** (radiant, in her coffin, after a mist escape the party tracked); the **Tomb-Warden is dead**; **Lykta absorbed whatever was in the amber sarcophagus** and nobody — including the DM — has decided what it is; ✂️-cut **Ernst Larnak and Strahd's Farewell letter were reinstated at the table**, so the Count's frame was revealed *in full, in writing*; and **★★ the party REFUSED the way home and is still in Barovia.** The planned TPK epilogue ("the Long Dark") **never fired and is unspent.**
- **Strahd is never seen** in any session. He is now a *correspondent* who has been refused.
- **Prep vs reality:** roughly half of Session 3's prep (the green passage, the Binding, the Unchaining, the Offer, both engineered spotlight beats) **never reached the table.** When answering questions, always check the `— Actual Play` note before trusting a run guide.

## Obsidian conventions — preserve these when editing
- **Wikilinks:** internal references use `[[Note Name]]` or `[[Note Name|display text]]`. Keep them intact; don't convert to plain text or standard markdown links. *(Obsidian resolves by filename regardless of folder, so moving a note doesn't break links.)*
- **Callouts:** used heavily. Common ones here:
  - `> [!gmonly]` — GM-only / secret info (spoilers for players).
  - `> [!infobox]+` — the portrait + quick-facts box at the top of NPC sheets.
  - `> [!note]`, `> [!tip]`, `> [!abstract]`, `> [!warning]`, `> [!success]` — as labelled.
  - Keep the `>` blockquote prefix on every line of a callout, including blank lines.
- **Stat blocks:** fenced ` ```statblock ` code blocks (the **Fantasy Statblocks** plugin renders them). Keep the YAML-ish structure — `name:`, `ac:`, `hp:`, `stats: [STR, DEX, CON, INT, WIS, CHA]`, `traits:`, `actions:`. Don't reformat into prose.
- **Tags:** notes end with hashtags like `#dnd #ravenloft #npc #barovia`. Match the existing set.
- **Footer:** most notes end with a `## Links` row of wikilinks, then tags. Follow that pattern.
- **★ marks a major beat** in play notes. ✂️ marks cut content. ☠ marks a dead NPC.

## Folder map
```
Bad Blood — A Barovia Three-Shot/
├── Bad Blood — Overview.md                     ← the hub
├── Bad Blood — Arc Conclusion & Continuity.md  ← ★ what happened / what's owed / open decisions
├── Bad Blood — What Next (Ideas & ...).md      ← ★ reusable assets + next-arc pitches + CoS notes
├── Tracker — Bad Blood.md                      ← final live state
├── _Claude Context.md                          ← this file
├── Sessions/          ← per session: run guide · Night Sheet · Actual Play · WhatsApp Recap · transcript
├── NPCs/ · PCs/ · Reference/ · Handouts & Props/ · Assets/
└── _archive/          ← superseded drafts + retired planning docs. READ-ONLY. Never cite as current.
```
- **Portrait convention:** an NPC sheet embeds its portrait as `![[<Name>.png]]`. Save the image with exactly that filename (NPC portraits live in `NPCs/`, copies in `Assets/Portraits/`).
- **Session files** run `0.5 → 1 → 2 → 3`. The **run guide** (`Session N.md`) is the read-at-table version; the **Night Sheet** is the one-page behind-the-screen version.

## ★ Session write-up workflow
When a new recording exists, produce **three files** in `Sessions/`, matching the established format exactly:
1. `session N actual transcript.md` — raw Otter.ai text, with a header noting date, duration, the Otter ID, and the recurring mistranscriptions.
2. `Session N — Actual Play.md` — DM-facing. Structure: a `> [!warning] Deviations from the run guide — the big ones` callout, part-by-part breakdown with beat tables, a **planned-vs-actual** table, then carry-forward. Keep the funny table quotes; they're the point.
3. `Session N — WhatsApp Recap.md` — player-facing, emoji-heavy, second person, hype, ends on a hook.

Then update [[Tracker — Bad Blood]]. **Read the previous session's three files first** to match the voice, and **read the run guide + Night Sheet** so the deviations table is accurate.

## House style
- **Tone:** gothic Barovia dread — desaturated, candlelit, rain. Midjourney prompts are `--ar 2:3` (portraits) / `--ar 3:4` (props), "Dungeons and Dragons style," muted palette. See [[Midjourney Prompt List]] and [[Scenes]].
- **Read-aloud vs GM-only:** boxed/italic read-aloud is for players; `[!gmonly]` is secret. **Never move secret info into a player-facing note.**
- **Concise + practical:** prep is written to be run from at the table. New content should be runnable, not just descriptive.

## When James asks for help
- Editing a note? Preserve wikilinks, callouts, stat-block fences, and the tag footer.
- Adding an NPC/creature? Mirror an existing sheet (infobox → description → goals → `[!gmonly]` secrets → statblock → Links → tags) and add it to [[NPC Index]] / [[Encounters & Stat Blocks]].
- New art? Add the prompt to [[Midjourney Prompt List]] (or [[Scenes]] for establishing art) and note the target filename.
- Planning the next game? Start from [[Bad Blood — What Next (Ideas & Reusable Assets)]] — don't re-derive the inventory.
- Coding tasks are in **Python** unless told otherwise.

#dnd #ravenloft #reference #meta
