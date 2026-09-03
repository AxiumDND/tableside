import { NIGHTSHEET_CRAWL_SAMPLE } from './openingCrawl'
import { NIGHTSHEET_LEGEND_SAMPLE } from './openingLegend'
import { parseThemeId } from './theme'

export type SheetTemplateKind =
  | 'blank'
  | 'player'
  | 'npc'
  | 'monster'
  | 'spell'
  | 'gear'
  | 'nightsheet'
  | 'recap'
  | 'roster'
  | 'map'
  | 'place'
  | 'shop'
  | 'faction'

const PLAYER = `<!--
  Party sheet template. Right-click Party/ → New player… (or copy into Party/ and rename).
  Put the portrait in Party/Art/ as Character Name.png (or Load art on the sheet). Keep AC/HP in sync with the statblock.
  See docs/CAMPAIGN.md and docs/MARKDOWN.md.
-->
# *Character Name*

[!pc]
![[Character Name.png]]

### *One-line tagline — role at the table*

| | |
|---|---|
| **Player** | Name |
| **Species** | Human |
| **Class** | Fighter 5 |
| **Background** | Soldier |
| **Alignment** | Neutral Good |
| **Role** | Front line |
| **AC** | 18 |
| **HP** | 44 |
| **Passive Perception** | 11 |
[!/pc]

\`\`\`statblock
layout: Basic 5e Layout
name: Character Name
size: Medium
type: humanoid
alignment: neutral good
ac: 18
hp: 44
hit_dice: 5d10+10
speed: 30 ft.
stats: [16, 12, 14, 10, 12, 10]
saves:
  - str: 6
  - con: 5
senses: "passive Perception 11"
languages: "Common"
traits:
  - name: Second Wind
    desc: "Bonus action, 1/short rest: regain 1d10+5 HP."
actions:
  - name: Longsword
    desc: "+6 to hit, reach 5 ft. Hit: 8 (1d8+4) slashing."
\`\`\`

*Two sentences the DM can read at a glance — who they are and what they want tonight.*

## At the table

- **Saves** — 
- **Skills** — 
- **Signature tricks** — 

[!gmonly]
How this kit bends the session. Secret hooks. What to flag if they forget a feature.
[!/gmonly]

## Look & voice

- **Look** — 
- **Manner** — 
- **Quotes** — *"…"*

## Notes

Party ties, debts, and what they care about.
`

const NPC = `<!--
  NPC sheet template. Right-click NPCs/ → New NPC… (or copy into NPCs/ and rename).
  Portrait: NPCs/Art/NPC Name.png, or Load art on the sheet. Game night sheets link with [[NPC Name]].
  See docs/CAMPAIGN.md and docs/MARKDOWN.md.
-->
# *NPC Name*

[!npc]
![[NPC Name.png]]

### *Who they are in one line*

| | |
|---|---|
| **Role** | Patron / informant / obstacle |
| **Species** |  |
| **Faction** | [[Faction Name]] |
| **Location** | [[Place Name]] |
| **Status** | Alive |
| **CR** | 2 |
[!/npc]

\`\`\`statblock
layout: Basic 5e Layout
name: NPC Name
size: Medium
type: humanoid
alignment: lawful neutral
ac: 13
hp: 27
hit_dice: 6d8
speed: 30 ft.
stats: [10, 14, 12, 13, 14, 16]
senses: "passive Perception 12"
languages: "Common"
cr: 2
actions:
  - name: Shortsword
    desc: "+4 to hit, reach 5 ft. Hit: 5 (1d6+2) piercing."
\`\`\`

*Two sentences: what the party sees, and what you need them for.*

## Look & voice

- **Look** — 
- **Manner** — 
- **Quotes** — *"…"*

[!readaloud]
A line to speak when they first appear.
[!/readaloud]

[!gmonly]
The truth. What they want. What they will not say.
[!/gmonly]

## Notes

How they move the night. What happens if the party helps, threatens, or ignores them.
`

const MONSTER = `<!--
  Bestiary template. Right-click Bestiary/ → New monster… (or copy into Bestiary/ and rename).
  Art: Bestiary/Art/Monster Name.png, or Load art on the sheet. Prefer Add to Bestiary from Lookup for SRD creatures.
  See docs/CAMPAIGN.md and docs/MARKDOWN.md.
-->
# Monster Name

[!monster]
![[Monster Name.png]]

| | |
|---|---|
| **CR** | 1 |
| **Role** | Pressure / boss / minion |
| **Source** | MM / custom |
[!/monster]

\`\`\`statblock
layout: Basic 5e Layout
name: Monster Name
size: Medium
type: undead
alignment: chaotic evil
ac: 12
hp: 22
hit_dice: 5d8
speed: 30 ft.
stats: [13, 15, 10, 7, 10, 6]
damage_immunities: "Poison"
senses: "Darkvision 60 ft., passive Perception 10"
languages: "Common"
cr: 1
traits:
  - name: Pack Tactics
    desc: "Advantage on attack rolls if an ally is within 5 ft. of the target and not Incapacitated."
actions:
  - name: Claw
    desc: "+4 to hit, reach 5 ft. Hit: 4 (1d4+2) slashing."
\`\`\`

*One line: what it does at the table.*

## Notes

Where it appears. What to telegraph. When to cut it if the fight runs long.

[!gmonly]
Tuning: add or drop HP, skip a recharge, or have it flee.
[!/gmonly]
`

const SPELL = `<!--
  Spell note template. Right-click Spells/ → New spell… or save from Lookup.
  School art: Spells/Art/, or Load art on the sheet. Lookup fills the infobox from the SRD.
  See docs/CAMPAIGN.md and docs/MARKDOWN.md.
-->
# Spell Name

[!spell]
![[Evocation.webp]]

### *Level 1 Evocation (Wizard)*

| | |
|---|---|
| **Casting Time** | Action |
| **Range** | 60 feet |
| **Components** | V, S |
| **Duration** | Instantaneous |
[!/spell]

What the spell does at the table.

Using a Higher-Level Spell Slot. 
`

const GEAR = `<!--
  Gear / magic item template. Right-click Gear/Weapons, Equipment, or Magic Items → New gear…
  or save from Lookup (weapons, armor, gear, and magic items go in those subfolders).
  Art: that folder’s Art/, or Load art on the sheet. Lookup fills Weight/Cost from the SRD.
  See docs/CAMPAIGN.md and docs/MARKDOWN.md.
-->
# Item Name

[!gear]
![[Item Name.png]]

### *Adventuring Gear*

| | |
|---|---|
| **Weight** | |
| **Cost** | |
| **Rarity** | |
| **Attunement** | |
| **Damage** | |
| **Properties** | |
[!/gear]

What it does, or any house-rule notes.
`

const NIGHTSHEET = `<!--
  Game night sheet — Party and Scenes.
  Right-click Sessions/ → New game night sheet…
  {{party}} is replaced with wikilinks to every Party/ sheet.
  {{crawl}} is replaced on Sci-fi campaigns with an Opening crawl sample (Play on the player screen).
  {{legend}} is replaced on Classic, Light, and Vampire campaigns with an Opening legend sample.
  Scene blocks: [!scene] Title … [!/scene] — art, what could happen, nested [!readaloud] / [!gmonly] / [!combat] / [!treasure], optional secrets/NPCs, and table cues.
  Party roster: [!party] … [!/party] wraps PC links, companion [[NPC]] lines, and the Focus tonight note. Read mode shows race / class / AC / HP / PP from those sheets.
  Copy a scene block to add another beat. Use // lines for notes that stay in the editor only.
  Combat blocks: [!combat] Title … [!/combat] (nest in a scene or at document level). Legacy ## Combat / Encounter / ⚔️ headings still work.
  party = all PCs. [[Name]] opens a sheet. ![[Art.webp]] then Show to players.
  Long prose belongs in a separate session note. See docs/GUIDE.md and docs/RECIPES.md.
-->
# Session Name — Game Night Sheet

*Behind the screen. Prose in [[Session Name]]. Click [[links]] to open sheets. Click art, then **Show to players**.*

[!abstract] Tonight at a glance
Opening scene → next beats → **the fight** → fallout.
[!/abstract]

{{crawl}}

{{legend}}

## 1. The Party

[!party]
{{party}}

[!note] Focus tonight
Soft spots for this session — unfinished business, a promise from last time, or something the table asked for.

- 
- 
[!/note]
[!/party]

## 2. Scenes

// Copy a whole [!scene] … [!/scene] block to add another beat. Keep the Opening first.

[!scene] Opening — name the beat
![[Scene art.webp]]

What could happen as they arrive. Who wants what. What tips the next scene.

[!readaloud]
First thing they see, hear, or are dropped into.
[!/readaloud]

**At the table** (optional — delete what you don't need):
- Place: [[Place Name]]
- Map: [[Map Name]]
- Checks: Perception DC 14 · Investigation DC 12
- If they miss / flee: …
- Music: General / Creepy / Combat
- Sound: rain · door creak
- Already in initiative?
- Leads to: next beat / …
[!/scene]

[!scene] Scene — name the beat
![[Scene art.webp]]

What could happen if they go this way — talk, search, chase, or the fight.

[!readaloud]
Optional spoken text when this beat lands.
[!/readaloud]

[!readaloud]
Mid-scene reveal — second read-aloud if the beat shifts.
[!/readaloud]

[!gmonly] Only you
Hidden truth, rigged outcome, or NPC tell they must not hear yet.
[!/gmonly]

**At the table** (optional — delete what you don't need):
- Place: [[Place Name]]
- Map: [[Map Name]]
- Checks: Perception DC 14 · Investigation DC 12
- If they miss / flee: …
- Music: General / Creepy / Combat
- Sound: door creak · thunder
- Leads to: [[next beat]] / fallout / …

**Secrets and clues in this scene** (optional — delete if none):
- 
- 

[!treasure] Cache — name the find
**Coin:** … pp · … gp · … sp · … cp
**Mundane:**
**Magic:**
**Hidden:**
**Notes:**
[!/treasure]

**NPCs in this scene** (optional — delete if none):
- [[NPC Name]] — want / will say / will not say
- Voice:

[!combat] Combat 1 — name the encounter
**Combatants:** party

- Telegraph:
- Target / quarry:
- Cut if running long:
[!/combat]
[!/scene]
`

const RECAP = `<!--
  Session recap — notes after the table on what actually happened.
  Right-click Sessions/ → New session recap…
  {{party}} is replaced with wikilinks to every Party/ sheet (who sat).
  Wrap that list in [!party] for the live race / class / AC table.
  Prep stays on the game night sheet. Secrets stay in [!gmonly].
-->
# Session Name — Recap

*After the table. Prep stays on [[Session Name — Game Night Sheet]].*

[!abstract]
One line: what happened.
[!/abstract]

## Who sat

[!party]
{{party}}
[!/party]

## What happened

- 

## Who and where

- 

## What they have

- 

## Threads

- 

[!gmonly]
Missed clues, clocks, buried secrets, sheets to update, what to prep next.
[!/gmonly]
`

const ROSTER = `<!--
  Party roster — who is travelling together.
  Right-click Party/ → New party roster…
  Individual PCs stay as New player… sheets. Companions stay in NPCs/ and are linked here.
  {{party}} is replaced with wikilinks to every Party/ sheet.
  One [!party] lists PCs and any NPCs travelling with them. Read mode shows race / class / AC from those sheets.
-->
# Party Roster

*PCs are Party sheets. Companions stay in NPCs/ — link them in the block below.*

[!party]
{{party}}

- [[NPC Name]] — why they travel
[!/party]

[!gmonly]
Who is actually with the group, who is away, and what would split them.
[!/gmonly]
`

const MAP = `<!--
  Map note template. Right-click Maps/ → New map… to pick an existing image or load one.
  Loaded art is copied to Maps/Art/ and named like this note. Pins are DM-only.
  Tokens (Party / NPCs / Bestiary) show to players. Show to players follows zoom, fog, and tokens.
  See docs/MARKDOWN.md.
-->
# Map Name

\`\`\`map
image: Map Name.jpg
pins: []
pinsLocked: true
\`\`\`

Prep notes for this map.

## Room A

Read-aloud, checks, loot.
`

const PLACE = `<!--
  Place note template. Right-click Places/ → New place… (or copy into Places/ and rename).
  Settlements, sites, wilderness, and dungeons — not battlemaps (those stay in Maps/).
  Art: Places/Art/Place Name.png, or Load art on the sheet. Shopkeepers stay in NPCs/.
  See docs/CAMPAIGN.md.
-->
# Place Name

[!place]
![[Place Name.png]]

### *What this place is in one line*

| | |
|---|---|
| **Type** | Settlement / site / wilderness / dungeon |
| **Region** | |
| **Ruler / faction** | [[Faction Name]] |
| **Map** | [[Map Name]] |
| **Mood** | |
[!/place]

[!readaloud]
First thing they see, hear, and smell.
[!/readaloud]

## At a glance

- **Notice** — 
- **Fantastic** — 
- **Dangerous** — 

## People

- [[NPC Name]] — 

## Sites

- [[Shop Name]] — 

## Rumors

- 

[!gmonly]
Truth, timers, what happens if they stay, leave, or pick a fight.
[!/gmonly]
`

const SHOP = `<!--
  Shop / inn / stall template. Right-click Places/ → New shop…
  The stall is a Place note; the proprietor is an NPC. Link both ways.
  Art: Places/Art/Shop Name.png, or Load art on the sheet. Stock can wikilink Gear notes.
  See docs/CAMPAIGN.md.
-->
# Shop Name

[!shop]
![[Shop Name.png]]

### *What they sell in one line*

| | |
|---|---|
| **Type** | Tavern / armorer / stables / weapons / store / apothecary |
| **Place** | [[Place Name]] |
| **Proprietor** | [[NPC Name]] |
| **Hours** | |
| **Attitude** | Wary / helpful / greedy |
| **Standing** | Neutral |
| **Map** | [[Map Name]] |
[!/shop]

[!readaloud]
The room when they walk in.
[!/readaloud]

## Stock

| Item | Price | Notes |
|---|---|---|
| [[Item Name]] | | |

## Services

- What they will / will not do

[!gmonly]
Real inventory, stolen goods, who they report to, the adventure hook.
[!/gmonly]
`

const FACTION = `<!--
  Faction template. Right-click Factions/ → New faction…
  Guilds, churches, houses, cults. Members stay in NPCs/; the HQ is a Place.
  Art: Factions/Art/Faction Name.png for an emblem, or Load art on the sheet.
  See docs/CAMPAIGN.md.
-->
# Faction Name

[!faction]
![[Faction Name.png]]

### *What they want in one line*

| | |
|---|---|
| **Type** | Guild / church / house / cult |
| **Leader** | [[NPC Name]] |
| **HQ** | [[Place Name]] |
| **Attitude** | Unknown / friendly / hostile |
[!/faction]

## Goals

- 
- 
- 

## Members

- [[NPC Name]] — 

## Methods

How they work: favors, coin, threats, faith.

[!gmonly]
Secrets, timers, what happens if the party joins, crosses, or ignores them.
[!/gmonly]
`

export const FALLBACK_TEMPLATES: Record<Exclude<SheetTemplateKind, 'blank'>, string> = {
  player: PLAYER,
  npc: NPC,
  monster: MONSTER,
  spell: SPELL,
  gear: GEAR,
  nightsheet: NIGHTSHEET,
  recap: RECAP,
  roster: ROSTER,
  map: MAP,
  place: PLACE,
  shop: SHOP,
  faction: FACTION
}

export const TEMPLATE_PLACEHOLDERS: Record<Exclude<SheetTemplateKind, 'blank'>, string> = {
  player: 'Character Name',
  npc: 'NPC Name',
  monster: 'Monster Name',
  spell: 'Spell Name',
  gear: 'Item Name',
  nightsheet: 'Session Name',
  recap: 'Session Name',
  roster: 'Party Roster',
  map: 'Map Name',
  place: 'Place Name',
  shop: 'Shop Name',
  faction: 'Faction Name'
}

export const TEMPLATE_FILE_NAMES: Record<Exclude<SheetTemplateKind, 'blank'>, string[]> = {
  player: ['player.md', 'pc.md', 'character.md'],
  npc: ['npc.md'],
  monster: ['monster.md', 'creature.md'],
  spell: ['spell.md'],
  gear: ['gear.md', 'item.md', 'equipment.md'],
  nightsheet: ['game night sheet.md', 'gamenightsheet.md', 'night sheet.md', 'nightsheet.md'],
  recap: ['session recap.md', 'recap.md', 'session log.md'],
  roster: ['party roster.md', 'roster.md'],
  map: ['map.md'],
  place: ['place.md', 'location.md', 'settlement.md'],
  shop: ['shop.md', 'merchant.md', 'inn.md'],
  faction: ['faction.md']
}

export function displayTitle(fileStem: string): string {
  return fileStem.replace(/^pc\s*[—–-]\s*/i, '').trim()
}

/** First `# Title` / `# *Title*` line, or null if missing / looks like an embed. */
export function headingTitleFromMarkdown(markdown: string): string | null {
  const heading = /^#\s+\*?(.+?)\*?\s*$/m.exec(markdown)
  if (!heading) return null
  const text = heading[1].replace(/\*/g, '').trim()
  if (!text || /!\[\[|\]\]|\.(png|jpe?g|webp|gif|svg)\b/i.test(text)) return null
  return text
}

const PLACEHOLDER_TITLES = new Set(
  Object.values(TEMPLATE_PLACEHOLDERS).map((value) => value.toLowerCase())
)

/** True when the H1 is still a blank-template placeholder (do not rename the file). */
export function isPlaceholderHeadingTitle(title: string): boolean {
  const folded = title.trim().toLowerCase()
  if (!folded) return true
  if (PLACEHOLDER_TITLES.has(folded)) return true
  const stripped = folded
    .replace(/\s*[—–-]\s*game\s*night\s*sheet$/i, '')
    .replace(/\s*[—–-]\s*recap$/i, '')
    .replace(/\s*[—–-]\s*roster$/i, '')
    .trim()
  return PLACEHOLDER_TITLES.has(stripped)
}

/**
 * Filename stem that should match an edited `#` title, preserving Party `PC —`
 * and Session `— Game Night Sheet` / `— Recap` / Party `— Roster` conventions from the current path.
 */
export function desiredNoteFileStem(relativePath: string, title: string): string | null {
  if (isPlaceholderHeadingTitle(title)) return null
  const posix = relativePath.replaceAll('\\', '/')
  const base = posix.split('/').pop() ?? posix
  const currentStem = base.replace(/\.[^.]+$/, '')
  let stem = sanitizeFileName(title).replace(/\.md$/i, '')
  if (!stem) return null
  if (/^pc\s*[—–-]/i.test(currentStem) && !/^pc\s*[—–-]/i.test(stem)) {
    stem = `PC — ${stem}`
  }
  if (/game\s*night\s*sheet|night\s*sheet/i.test(currentStem)) {
    stem = gameNightSheetFileStem(stem)
  }
  if (/\s*[—–-]\s*recap$/i.test(currentStem) || (/\brecap$/i.test(currentStem) && !/game\s*night/i.test(currentStem))) {
    stem = sessionRecapFileStem(stem)
  }
  if (/roster/i.test(currentStem) && !/game\s*night/i.test(currentStem)) {
    stem = partyRosterFileStem(stem)
  }
  return stem
}

/** `Session 4` → `Session 4 — Game Night Sheet`. Leaves an existing game-night-sheet name alone. */
export function gameNightSheetFileStem(name: string): string {
  const stem = sanitizeFileName(name).replace(/\.md$/i, '')
  if (/game\s*night\s*sheet/i.test(stem)) return stem
  if (/night\s*sheet/i.test(stem)) return stem.replace(/night\s*sheet/gi, 'Game Night Sheet')
  return `${stem} — Game Night Sheet`
}

/** `Session 4` → `Session 4 — Recap`. Leaves an existing recap name alone. */
export function sessionRecapFileStem(name: string): string {
  const stem = sanitizeFileName(name).replace(/\.md$/i, '')
  if (/\s*[—–-]\s*recap$/i.test(stem)) return stem.replace(/\s*[—–-]\s*recap$/i, ' — Recap')
  if (/\s+recap$/i.test(stem) && !/game\s*night/i.test(stem)) return stem.replace(/\s+recap$/i, ' — Recap')
  return `${stem} — Recap`
}

/** `The Table` → `The Table — Roster`. `Party Roster` stays `Party Roster`. */
export function partyRosterFileStem(name: string): string {
  const stem = sanitizeFileName(name).replace(/\.md$/i, '')
  if (/^party\s+roster$/i.test(stem)) return 'Party Roster'
  if (/\s*[—–-]\s*roster$/i.test(stem)) return stem.replace(/\s*[—–-]\s*roster$/i, ' — Roster')
  if (/\s+roster$/i.test(stem)) return stem.replace(/\s+roster$/i, ' — Roster')
  return `${stem} — Roster`
}

export type FillTemplateExtras = {
  partyStems?: string[]
  theme?: string | null
}

export function wikiLinkForSheet(stem: string): string {
  const title = displayTitle(stem)
  return title && title !== stem ? `[[${stem}|${title}]]` : `[[${stem}]]`
}

export function partyLinkList(stems: string[]): string {
  const unique = [...new Set(stems.map((value) => value.trim()).filter(Boolean))]
  unique.sort((a, b) => displayTitle(a).localeCompare(displayTitle(b), undefined, { sensitivity: 'base' }))
  if (unique.length === 0) {
    return '- *(No Party sheets yet — right-click Party/ → New player…)*'
  }
  return unique.map((stem) => `- ${wikiLinkForSheet(stem)}`).join('\n')
}

export function fillTemplate(
  source: string,
  kind: Exclude<SheetTemplateKind, 'blank'>,
  name: string,
  extras?: FillTemplateExtras
): string {
  const placeholder = TEMPLATE_PLACEHOLDERS[kind]
  const title = displayTitle(name)
  let body = source.replace(/^<!--[\s\S]*?-->\s*/, '').split(placeholder).join(title)
  if (kind === 'nightsheet' || kind === 'recap' || kind === 'roster') {
    const stems = extras?.partyStems ?? []
    if (body.includes('{{party}}')) {
      body = body.replaceAll('{{party}}', partyLinkList(stems))
    } else if (kind === 'nightsheet' && stems.length > 0 && !stems.some((stem) => body.includes(`[[${stem}`))) {
      body = body.replace(/^(# .+\r?\n)/, `$1\n## The characters\n\n${partyLinkList(stems)}\n\n`)
    }
    if (kind === 'nightsheet') {
      body = applyNightsheetCrawl(body, extras?.theme)
      body = applyNightsheetLegend(body, extras?.theme)
    }
  }
  return body
}

function normalizeNightSheetBody(body: string): string {
  return body.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

function applyNightsheetLegend(body: string, theme?: string | null): string {
  const normalized = normalizeNightSheetBody(body)
  const id = parseThemeId(theme)
  const legend =
    id === 'classic' || id === 'light' || id === 'vampire' ? NIGHTSHEET_LEGEND_SAMPLE : ''
  if (normalized.includes('{{legend}}')) {
    return normalizeNightSheetBody(
      normalized
        .replaceAll('{{legend}}\n', legend ? `${legend}\n` : '')
        .replaceAll('{{legend}}', legend)
        .replace(/\n{3,}/g, '\n\n')
    )
  }
  if (!legend || /^\s*>\s*\[!(?:legend|tale|chronicle)\]/m.test(normalized)) return body
  if (/^> \[!abstract\][\s\S]*?\n\n/m.test(normalized)) {
    return normalizeNightSheetBody(
      normalized.replace(/^(> \[!abstract\][\s\S]*?\n\n)/m, `$1${legend}\n\n`)
    )
  }
  if (/^## 1\. The Party/m.test(normalized)) {
    return normalizeNightSheetBody(normalized.replace(/^## 1\. The Party/m, `${legend}\n\n## 1. The Party`))
  }
  return normalizeNightSheetBody(normalized.replace(/^(# .+\n)/, `$1\n${legend}\n`))
}

function applyNightsheetCrawl(body: string, theme?: string | null): string {
  const normalized = normalizeNightSheetBody(body)
  const crawl = parseThemeId(theme) === 'scifi' ? NIGHTSHEET_CRAWL_SAMPLE : ''
  if (normalized.includes('{{crawl}}')) {
    return normalizeNightSheetBody(
      normalized
        .replaceAll('{{crawl}}\n', crawl ? `${crawl}\n` : '')
        .replaceAll('{{crawl}}', crawl)
        .replace(/\n{3,}/g, '\n\n')
    )
  }
  if (!crawl || /^\s*>\s*\[!(?:crawl|opening)\]/m.test(normalized)) return body
  if (/^> \[!abstract\][\s\S]*?\n\n/m.test(normalized)) {
    return normalizeNightSheetBody(
      normalized.replace(/^(> \[!abstract\][\s\S]*?\n\n)/m, `$1${crawl}\n\n`)
    )
  }
  if (/^## 1\. The Party/m.test(normalized)) {
    return normalizeNightSheetBody(normalized.replace(/^## 1\. The Party/m, `${crawl}\n\n## 1. The Party`))
  }
  return normalizeNightSheetBody(normalized.replace(/^(# .+\n)/, `$1\n${crawl}\n`))
}

export function rewriteDuplicatedMarkdown(source: string, fromStem: string, toStem: string): string {
  const fromTitle = displayTitle(fromStem)
  const toTitle = displayTitle(toStem)
  if (!fromTitle || fromTitle === toTitle) return source
  const escaped = fromTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return source
    .replace(new RegExp(`^#\\s+\\*?${escaped}\\*?\\s*$`, 'm'), `# *${toTitle}*`)
    .replace(new RegExp(`^#\\s+${escaped}\\s*$`, 'm'), `# ${toTitle}`)
    .replace(new RegExp(`^name:\\s*${escaped}\\s*$`, 'm'), `name: ${toTitle}`)
    .replace(new RegExp(`\\[\\[${escaped}(\\]\\]|\\|)`, 'g'), `[[${toTitle}$1`)
    .replace(new RegExp(`!\\[\\[${escaped}(\\.[a-z0-9]+)?(\\|[^\\]]*)?\\]\\]`, 'gi'), `![[${toTitle}$1$2]]`)
}

export function sanitizeFileName(name: string, fallback = 'Untitled'): string {
  const cleaned = name
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned || fallback
}
