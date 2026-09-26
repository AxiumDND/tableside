# One Campaign button (possible)

**Status:** built (1.8.17). Header and empty start screen use one **Campaign ▾** menu. See [ROADMAP.md](ROADMAP.md) item 7.

The header currently shows **New campaign**, **Open campaign**, and (when another recent exists) **Switch campaign**. Three controls for one job: change which folder is open. They crowd the bar next to Tools / Combat / Music / Help, and Switch appearing and disappearing feels like a fourth mode.

This note is how to fold them into **one control** without hiding New/Open from a first-night DM.

## What each action does today

| Action | When you use it | What happens |
| --- | --- | --- |
| **New campaign** | First night, or a second table | System + look, then an empty folder; scaffold the layout |
| **Open campaign** | You already have a folder | Native folder picker; missing standard folders are created |
| **Switch campaign** | You run more than one game | Menu of recents (name + path), current folder omitted |

The empty **start screen** repeats Open / New and adds **Open Sample** plus a **Recent campaigns** menu. The campaign **name and path** already sit in the header center — the three buttons do not need to repeat that name.

Switch is the mid-session action. New and Open are rare once a folder is live. Sample is first-run only.

## Recommendation

**One always-visible header control: `Campaign ▾`.**

Click opens a menu. Do not use a split button (main click vs chevron) — two hit targets for the same idea. Do not make the title text itself the only control — “click the name” is easy to miss, and the name is already identification.

```
Campaign ▾
  Recent
    Other table
      D:\Games\Other
    Last week’s one-shot
      …
  ────────────
  Open campaign…
  New campaign…
```

- **Recent** is the existing recents list (most recent first, current folder omitted, path under the name). Missing folders already drop off when you try them — keep that.
- If there are no other recents, **omit the Recent block** (no empty “none yet”). The menu is just Open + New. First launch still opens Greystead; this menu is how you leave it.
- **Open…** and **New…** stay the same IPC / folder pickers as today. Ellipsis because they open a system dialog or the new-campaign wizard.
- **Sample** does **not** go in the header menu. Too easy to stomp a live night. It stays the amber CTA on the empty start screen only.

The header then reads: title · name/path · **Campaign** · Combat · Music · Help. Two fewer buttons on a laptop bar; Switch no longer appears and vanishes.

### Start screen

Keep **Open Sample** as the first-run button. Replace the extra Open / New / Recent row with the **same Campaign menu** (label `Campaign ▾`, recents included when they exist). One pattern in both places.

### Label

Use **Campaign**, not the current folder name (already in the header) and not **Switch** (wrong when you are opening or creating). `aria-haspopup="menu"` / `aria-expanded` as `RecentCampaignMenu` already does.

## Why not the other shapes

| Shape | Why not |
| --- | --- |
| Keep three buttons, just restyle | Still three decisions every glance |
| Title-as-button only | Saves a control, but first-night DMs will not guess to click the name |
| Split button (click = last recent, chevron = menu) | Easy to open the wrong folder mid-session |
| Recents-only menu, New/Open in Help | Buries the two actions you need when recents are empty |
| Sample in the header menu | Accidental reopen of Greystead on a real campaign |

## Implementation sketch (when we build it)

Reuse `RecentCampaignMenu` — it already excludes the current folder and shows name + path. Grow it into a **Campaign menu** that always renders:

1. Recents list (if any)
2. Divider + **Open campaign…** / **New campaign…**
3. Always-visible trigger in `DmHeader` (drop the two standalone buttons)
4. Same component on `GettingStarted` (keep Sample beside it)
5. Tests: menu opens with only Open/New when recents are empty; recents omit the current folder; Open/New handlers fire
6. Help, GUIDE, TABLE: one **Campaign** control, not three buttons

No new settings. No cloud library. Pin/favorite (still mentioned on the old recents roadmap line) can wait; the menu is enough.

## Out of scope

- A campaign “library” window or sidebar browser
- Cloud / account sync
- Asking to save before switch (folders are already live on disk)
- Changing how New picks system/look or how Open creates missing folders
