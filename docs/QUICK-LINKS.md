# Quick links bar

**Status:** first pass (1.8.19), calendar in 1.8.20, hide and player-TV light in 1.8.21, smaller corner mark in 1.8.22, tools and panel toggles moved here from the header. The strip is DM console chrome. **Show to players** on the calendar is a light-of-day mark only. The strip is always on, campaign or not.

## Why

The header keeps Campaign / Combat / Music / Help. Mid-session facts and the old Tools pages live on this bar so you do not hunt a second header button.

## On the bar

| Control | What it does |
| --- | --- |
| **Left / right panel** | Same sidebar and right-rail glyphs that used to sit on the header. |
| **Party** | Every `Party/` sheet (not the roster). Name, AC, spell save DC, passive perception. Click opens the sheet. Put **Save DC** on the PC infobox when they have one. |
| **Conditions** | Lookup conditions for the campaign’s system pack. Filter, then click a name for the short rules text. Does not toggle combat Cnd chips. |
| **Lookup** | Opens the right rail on Lookup. Click again to close. |
| **Prep ▾** | NPC and Links — opens that page on the right rail. The button stays **Prep**. |
| **Table ▾** | Dice (Box of Doom), Timer, and Improvise. The button stays **Table**. |
| **Calendar** | **−Day** / **◀h**, then a darker date-and-time block, Day / Night, **▶h** / **+Day** / **Morning**, **Show to players**, **Hide**, then **⚙**. **Hide** leaves a **Calendar** chip. **Show to players** is a sun / moon mark on the TV, not the clock. Setup is `Calendar/Calendar.md`. Notes: [CALENDAR.md](CALENDAR.md). |

## Shape

- One control row (`h-9`), same button chrome as **Campaign ▾**.
- Glance menus (Party, Conditions) stay dropdowns. Full tools still use the right rail.
- Empty states stay short. Do not invent a date or a party that is not on disk.

## Out of scope (this pass)

- Showing HP or combat conditions on the Party rows
- Editing sheets from the menu
- Holiday lists beyond the festival rows on the calendar note
