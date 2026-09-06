# In-world calendar

**Status:** first pass (1.8.20 beta). DM console only — never on the player TV.

The live clock sits on the **Quick** bar. **−Day** / **◀h** sit before a darker date-and-time block, then Day / Night / Dawn / Dusk. After that: **▶h**, **+Day** (same hour, next date), **Morning** (next dawn), and **⚙**. Click the date to open the note.

## Where it lives

The clock is a Markdown note, not a hidden JSON file.

```
Calendar/Calendar.md
```

Open / New campaign creates a `Calendar/` folder. Existing campaigns get it the next time the folder is opened. **Set calendar…** on the Quick bar writes `Calendar/Calendar.md` if it is missing.

The source of truth is a fenced `[!calendar]` block. Advancing time rewrites that block. You can edit the note by hand; the bar re-reads it when the campaign tree refreshes.

```markdown
# Calendar

The live date sits on the Quick bar.

[!calendar]
type: custom
era: AF
year: 412
month: Seedmoon
day: 1
hour: 9
hoursPerDay: 24
dawn: 6
dusk: 18
weekdays: Moon, Tide, Ember, Stone, Vein, Rest, Hearth, Veil
months:
- Seedmoon: 30
- Year-turn: 5 festival
[!/calendar]
```

Aliases for the fence: `almanac`, `datebook`. If several notes live under `Calendar/`, the bar prefers `Calendar/Calendar.md`.

## Types

| Type | What you get |
| --- | --- |
| **Gregorian** | Earth year. 7-day week, 12 months, 24 hours, leap years on the 400-year rule. Default “now” is today’s civil date at 9am. |
| **Forgotten Realms** | Calendar of Harptos labels only — twelve 30-day months, five festival days, tendays (no named weekdays), Shieldmeet every 4 years after Midsummer. Default 1 Hammer 1492 DR, 9am. |
| **Greyhawk** | Flanaess labels only — twelve 28-day months, four 7-day festival weeks (364 days), seven weekdays (Starday → Freeday). Default 1 Fireseek 576 CY, 9am. |
| **Custom** | Your weekdays, month lengths, festival rows, hours in a day, and optional leap day. The starter is an 8-day week and 12×30 plus a 5-day Year-turn (Greystead / Millfire). |

Changing type in settings loads that preset, including its default date. Then jump the year / month / day / hour if you need a different “now”.

Setting names (Harptos, Greyhawk) are **calendar labels only** — no setting lore ships with Tableside.

## Days, weeks, and hours that are not Earth-like

Calendars at the table are not all 7×24×365.

- **Week length** — `weekdays:` is a comma list. 5, 6, 8, 10… all work. An empty list means no weekday (Harptos uses “1st tenday” on ordinary months instead).
- **Hours in a day** — `hoursPerDay` from 4 to 48. A 24-hour day prints `9am` / `2pm`. Any other length prints `Hour 8/10`. **◀h** / **▶h** wrap at that length and roll the date. **Morning** jumps to the next `dawn` hour.
- **Month lengths** — each `- Name: N` row is a month or intercalary stretch. Festival rows (`festival`) print as the day’s name (`Midwinter 1492 DR`) instead of `1 Midwinter`.
- **Leap days** — `leapEvery`, `leapDay`, `leapAfter` insert a 1-day festival after a named unit in matching years (Shieldmeet after Midsummer every 4 years). Gregorian February is handled in code, not as an extra row.

Dawn and dusk are hour numbers on that day. The exact dawn/dusk hour labels **Dawn** / **Dusk**; hours between them are **Day** (or **Night** if dusk is before dawn — polar / underdark wrap).

## Settings

**⚙** or **Set calendar…** opens the same panel:

- Type (Gregorian / Forgotten Realms / Greyhawk / Custom)
- Jump to year, month, day, hour
- Hours in a day, dawn, dusk, era suffix
- Custom: weekday list, month/festival rows, optional leap day
- **Open note** / **Save calendar**

Save writes the `[!calendar]` fence. The Quick bar updates immediately.

## Out of scope (this pass)

- Recurring holidays beyond the festival rows you list
- Weather, moons, or watches
- Player-TV chrome
- A second live clock
