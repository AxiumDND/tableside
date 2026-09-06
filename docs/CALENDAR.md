# In-world calendar (possible)

**Status:** proposal only — not built. Direction for a later Tools panel. See [ROADMAP.md](ROADMAP.md).

Tableside already has a **real-world** hourglass (Tools → Timer) for “you have three minutes.” This note is about **in-world** time: what day it is in the campaign, and whether it is dawn or the third watch. The DM advances it on purpose. It does not tick with the wall clock.

## Why it belongs at the table

A night sheet often says “the next morning” or “three days on the road.” Without a shared date, recaps drift and “until dawn” spells become a shrug. A small calendar on the DM console — optional Show to players — keeps the table honest without becoming a VTT weather sim.

Keep it **table-first**: one chip, a few advance buttons, a date the recap can quote. No remote clients, no simulated astronomy, no shipping published-setting month lists.

## What “time” means here

Three layers, stored together, advanced separately:

| Layer | What the DM sets | Typical 5e use |
| --- | --- | --- |
| **Date** | Year, month, day of month, weekday | Recaps, travel, downtime, “the 12th of Seedmoon” |
| **Day part** | A named band, not a ticking clock | Light, “we arrive at dusk,” when a rest starts |
| **Watch** (optional) | Overnight camp slot | Random encounters, who is on guard |

Do **not** store a real `HH:MM` as the source of truth. Minutes matter in combat and in the hourglass; they do not belong on the campaign calendar. If someone needs “two hours later,” the DM taps **+1 hour** (or **+1 watch**) and the day part moves.

### Day parts (default)

A short, ordered list. Each band can imply a light tag for the DM (not a lighting engine):

| Band | Light hint | Notes |
| --- | --- | --- |
| Dawn | Dim | Common “until dawn” / sunlight start |
| Morning | Bright | Travel, town |
| Midday | Bright | |
| Afternoon | Bright | |
| Dusk | Dim | Arrival, closing gates |
| Evening | Dark or lamplight | Inn, briefing |
| Night | Dark | Camp, dungeon exit |
| Midnight | Dark | Optional; can fold into Night |

Sci-fi / Vampire packs can rename the list later (duty shift, night of the chronicle). v1 copy stays 5e-fantasy.

### Hours vs bands

Still offer **+1 hour** / **+2 hours** / **+8 hours** (long rest) as *moves along the band list*, not as a digital clock. Eight hours from evening lands at dawn or morning, depending on how many bands you map to a 24-hour civil day.

Default mapping (24h civil day, 8 bands): each band is about 3 hours. A long rest is “skip ~3 bands.” A short rest is “stay in this band” unless the DM also taps +1 hour.

The civil day length is a calendar field (`hoursPerDay`, default 24) so a weird homebrew day is possible. Do not invent decimal hours in the UI.

### Watches

Camping is what D&D actually tracks at night:

- Default **3 watches** overnight (first / second / third), or **4 × 2 hours** if the DM prefers.
- Watch count is a calendar setting, not a rulebook reprint.
- Advancing the last watch → Dawn and the next date.
- Optional: tag the party member on watch (DM-only; never required).

Leave random-encounter tables out of v1. The calendar only answers “which watch is it?”

## Date math (weeks are not always 7)

A calendar definition is data, not code branches per setting:

```text
era?              "After the Millfire" (optional label)
year              integer (may be negative)
weekdays[]        5–10 names (length = days in a week)
months[]          { name, days }   // days may differ per month
intercalary[]?    named days that sit between months (festivals, year-turn)
hoursPerDay       default 24
dayParts[]        ordered bands (see above)
watchesPerNight   3 or 4
moons[]?          later — phase length in days, 1–2 moons
```

**Weekday** is `(absoluteDayIndex + weekdayOffset) mod weekdays.length`. A 5-day week, an 8-day week, and a 10-day week are the same function.

**Intercalary days** have a name and a position (after month N) but **no weekday**, or they consume a weekday — pick one rule and test it. Recommendation: they **do** advance the weekday so the week never “skips,” unless the definition sets `intercalaryHaveWeekday: false`.

**Year length** = sum of month days + intercalary days. No Julian leap-year rules unless a definition opts in (`leapEveryYears` + extra day name). Default original calendar: no leap day. Simpler to explain at the table.

### Original default (ship this, not a published setting)

Bundle **one original Tableside calendar** (Greystead can use it). Suggested shape — names are ours, not a book’s:

- **8-day week** (common homebrew; keeps “a week on the road” a bit longer than Earth)
- **12 months × 30 days** + **5 year-turn days** after the last month (360 + 5 = 365, easy mental math)
- Four seasons of three months
- Year 412 After the Millfire (or whatever Greystead’s Start Here already implies — match the sample when this is built)

Also ship a **plain 7-day / 12×28–31 Gregorian** preset for modern, urban-fantasy, or “I just want Tuesday.” The DM can type their own month and weekday names on top of either preset.

**Do not** bundle Forgotten Realms, Greyhawk, Eberron, Dragonlance, or other published month/festival lists. If a DM wants those names, they type them into the custom definition on their machine. Tableside does not ship that text.

### Custom calendars

v1: pick a preset, edit names and `days` in a structured form (same spirit as Currencies). Persist in the campaign folder.

v2: import/export a small JSON snippet so two tables can share a homebrew year.

## What D&D actually asks the calendar

These are the 5e table questions worth answering. Not a rules engine — just stamps and buttons.

| Table question | Calendar answer |
| --- | --- |
| What do I write on the recap? | Formatted date + day part |
| Three days’ travel | **+1 day** × 3 (or **+1 travel day** = +1 day + set Evening) |
| Short rest | Stay on this date; optional +1 hour |
| Long rest | +8 hours / skip to Dawn (DM choice which button) |
| Spell or effect “until dawn” | Next Dawn, maybe +1 date if it is already Morning+ |
| Overnight camp | Watches; last watch → Dawn |
| Downtime week | +N weekdays (N = `weekdays.length`) |
| Is it dark outside? | Day-part light hint (Bright / Dim / Dark) |
| Lycanthrope / festival night | Later: moon phase or named intercalary day |

Combat rounds and the hourglass stay **out** of this file. Do not couple initiative to the calendar.

Session coach (roadmap item 8) can later offer “stamp a long rest on the calendar?” — optional, snoozable, never automatic.

## UI (DM console)

**Tools → Calendar** (next to Timer). Timer is real minutes; Calendar is the fiction.

Minimum viable panel:

1. Big readout: `Seedmoon 12, 412 · Dusk` plus weekday.
2. Advance: **+1 hour**, **+1 watch**, **+1 day**, **to Dawn**, **to Dusk**.
3. **Set…** for jumping (month / day / year / day part) when the party was unconscious for a week.
4. Preset + rename months / weekdays.
5. **Show to players** — optional still: date, day part, maybe a simple dawn/dusk wash. Not a ticking clock. Header **Clear** removes it. Maps stay maps.

**Header chip** (always DM-only): the same short string so you see it while the Tools panel is closed. Click opens Calendar.

**Players see:** off by default. When shown, keep it large type, theme-aware, no week-number chrome. Sci-fi look can say “Ship-day” later; v1 is parchment.

Do **not** put the date on every handout automatically.

## Persistence

Hidden campaign file, same family as `combat.json` / `audio.json`:

- `calendar.json` — current instant + chosen definition (or a `preset` id + overrides)
- Hide from the file tree (`HIDDEN_FILE_NAMES`)
- Local folder only; no cloud

`Reference/` in the campaign layout stays a place for the DM’s own markdown calendars and cheat sheets. The live tracker is the JSON + Tools panel, not a note the parser has to scrape.

## Implementation sketch (when we build it)

Pure logic first, UI second — same split as hourglass / currencies.

1. `src/shared/calendar.ts` — types, clamp, add hours/days, format, weekday index, intercalary. Heavy Vitest (wrap year, 5- vs 8-day week, festival days).
2. `src/main` load/save `calendar.json`; IPC get/set/advance.
3. Tools panel + header chip.
4. Optional player still.
5. Custom month/weekday editor.
6. Later: moon phase, session-coach rest stamp, recap snippet (“copy date into session note”).

Greystead: set a starting date on the sample when this ships so the one-shot opens on a known morning.

## Out of scope (for this feature)

- Real-time clock synced to the laptop
- Weather, temperature, or harvest sim
- Dynamic lighting / darkness on the map (the map already has fog)
- Astrology, constellation maps, or accurate orbital mechanics
- Shipping copyrighted setting calendars
- Auto-advancing when combat ends
- Player-phone or remote “what time is it?” clients

## Open choices (decide at build time)

1. Do intercalary days have weekdays? (Lean yes.)
2. Does **to Dawn** from Dawn stay put or jump +1 day? (Lean: from Dawn/Morning stay; from Afternoon+ go to *next* dawn.)
3. Is the header chip always visible or a Help setting? (Lean: on when `calendar.json` exists or the DM has opened Calendar once.)
4. One moon in the default pack, or none until someone asks? (Lean: none in v1.)
