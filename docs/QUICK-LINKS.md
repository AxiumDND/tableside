# Quick links bar

**Status:** first pass (1.8.19 beta). A one-button-high strip under the main header when a campaign is open. DM console only — never on the player TV.

## Why

The main header stays Campaign / Tools / Combat / Music / Help. Mid-session you still need a few facts without opening a night sheet or Tools. This bar is the home for those.

## First menus

| Menu | What it does |
| --- | --- |
| **Party** | Every `Party/` sheet (not the roster). Name, AC, spell save DC, passive perception. Click opens the sheet. Put **Save DC** on the PC infobox when they have one. |
| **Conditions** | Lookup conditions for the campaign’s system pack. Filter, then click a name for the short rules text. Does not toggle combat Cnd chips. |
| **Calendar** | Opens notes in `Reference/` or any note whose name looks like a calendar / almanac. No in-world clock yet. |

## Shape

- One control row (`h-9`), same button chrome as **Campaign ▾**.
- Menus, not extra header buttons. Add new table facts as another `QuickMenu`, not a third header.
- Empty states stay short. Do not invent a date or a party that is not on disk.
- Cheap to hide later (Help setting) if a laptop needs the row back.

## Out of scope (this pass)

- In-world year / month / watches
- Showing HP or combat conditions on the Party rows
- Editing sheets from the menu
- Player-TV chrome
