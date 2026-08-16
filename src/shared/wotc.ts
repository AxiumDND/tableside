export interface WotcFile {
  name: string
  text: string
}

export interface WotcLibrary {
  folder: string
  files: WotcFile[]
}

export const WOTC_README = `WOTC lookup files
=================

Drop your own book text here (Player's Handbook spell list, and later other
exports). Table DM does not ship these books.

When this folder has files Lookup can read, extra filter chips appear and
search includes that text.

Supported now
- "*Spell*" .txt / .md  — 2024 Player's Handbook-style spell list

Also scanned
- This folder (%APPDATA%\\table-dm\\WOTC)
- A WOTC folder next to the app or the project
`
