export type SheetTemplateKind = 'blank' | 'player' | 'npc' | 'monster' | 'spell' | 'gear' | 'nightsheet' | 'map'

const PLAYER = `<!--
  Party sheet template. Right-click Party/ → New player… (or copy into Party/ and rename).
  Put the portrait in Party/Art/ as Character Name.png (or Load art on the sheet). Keep AC/HP in sync with the statblock.
  See docs/CAMPAIGN.md and docs/MARKDOWN.md.
-->
# *Character Name*

> [!infobox]+
> ![[Character Name.png]]
>
> ### *One-line tagline — role at the table*
>
> | | |
> |---|---|
> | **Player** | Name |
> | **Species** | Human |
> | **Class** | Fighter 5 |
> | **Background** | Soldier |
> | **Alignment** | Neutral Good |
> | **Role** | Front line |
> | **AC** | 18 |
> | **HP** | 44 |

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

> [!gmonly]
> How this kit bends the session. Secret hooks. What to flag if they forget a feature.

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

> [!infobox]+
> ![[NPC Name.png]]
>
> ### *Who they are in one line*
>
> | | |
> |---|---|
> | **Role** | Patron / informant / obstacle |
> | **Faction** | |
> | **Location** | |
> | **Status** | Alive |
> | **CR** | 2 |

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

> [!readaloud]
> A line to speak when they first appear.

> [!gmonly]
> The truth. What they want. What they will not say.

## Notes

How they move the night. What happens if the party helps, threatens, or ignores them.
`

const MONSTER = `<!--
  Bestiary template. Right-click Bestiary/ → New monster… (or copy into Bestiary/ and rename).
  Art: Bestiary/Art/Monster Name.png, or Load art on the sheet. Prefer Add to Bestiary from Lookup for SRD creatures.
  See docs/CAMPAIGN.md and docs/MARKDOWN.md.
-->
# Monster Name

> [!infobox]+
> ![[Monster Name.png]]
>
> | | |
> |---|---|
> | **CR** | 1 |
> | **Role** | Pressure / boss / minion |
> | **Source** | MM / custom |

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

> [!gmonly]
> Tuning: add or drop HP, skip a recharge, or have it flee.
`

const SPELL = `<!--
  Spell note template. Right-click Spells/ → New spell… or save from Lookup.
  School art: Spells/Art/, or Load art on the sheet. Lookup fills the infobox from the SRD.
  See docs/CAMPAIGN.md and docs/MARKDOWN.md.
-->
# Spell Name

> [!infobox]+
> ![[Evocation.webp]]
>
> ### *Level 1 Evocation (Wizard)*
>
> | | |
> |---|---|
> | **Casting Time** | Action |
> | **Range** | 60 feet |
> | **Components** | V, S |
> | **Duration** | Instantaneous |

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

> [!infobox]+
> ![[Item Name.png]]
>
> ### *Adventuring Gear*
>
> | | |
> |---|---|
> | **Weight** | |
> | **Cost** | |
> | **Rarity** | |
> | **Attunement** | |
> | **Damage** | |
> | **Properties** | |

What it does, or any house-rule notes.
`

const NIGHTSHEET = `<!--
  Game night sheet template — Lazy DM 10-step prep. Right-click Sessions/ → New game night sheet…
  {{party}} is replaced with wikilinks to every Party/ sheet.
  Combat headings (⚔️ / Combat / Encounter) + Combatants lines feed Add to initiative.
  party = all PCs. [[Name]] opens a sheet. ![[Art.webp]] then Show to players.
  Long prose belongs in a separate session note. See docs/RECIPES.md.
-->
# Session Name — Game Night Sheet

*Behind the screen. Prose in [[Session Name]]. Click [[links]] to open sheets. Click art, then **Show to players**.*

> [!abstract] Tonight at a glance
> Strong start → scenes → **the fight** → fallout.

## 1. The characters

{{party}}

- Spotlight tonight:
- What they want / what they forgot last time:

## 2. Strong start

> [!readaloud]
> First thing they see, hear, or are dropped into.

- Already in initiative? Map: [[Map Name]]

## 3. Scenes

1. 
2. 
3. **the fight**
4. Fallout

## 4. Secrets and clues

Three things they can find no matter which way they go:

- 
- 
- 

## 5. Locations

- [[Map Name]] — what they notice, what's fantastic, what's dangerous
- Set dressing / telegraph:

## 6. NPCs

- [[NPC Name]] — want / will say / will not say
- Voice:

## 7. Monsters

Copy the combat block for a second fight. Headings that say *no combat* are skipped.

## ⚔️ Combat 1 — name the encounter

**Combatants:** [[Monster Name]] · party

| | |
|---|---|
| **Monster Name** | AC · HP · key attacks |

- Telegraph:
- Target / quarry:
- Cut if running long:

## 8. Treasure

- Coin / mundane:
- Magic (attunement?):

## 9. From last time

- Open threads:
- Promises, debts, unused clues:

## 10. Likely endings

- If they succeed:
- If they fail or flee:
- Hook for next session:
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

export const FALLBACK_TEMPLATES: Record<Exclude<SheetTemplateKind, 'blank'>, string> = {
  player: PLAYER,
  npc: NPC,
  monster: MONSTER,
  spell: SPELL,
  gear: GEAR,
  nightsheet: NIGHTSHEET,
  map: MAP
}

export const TEMPLATE_PLACEHOLDERS: Record<Exclude<SheetTemplateKind, 'blank'>, string> = {
  player: 'Character Name',
  npc: 'NPC Name',
  monster: 'Monster Name',
  spell: 'Spell Name',
  gear: 'Item Name',
  nightsheet: 'Session Name',
  map: 'Map Name'
}

export const TEMPLATE_FILE_NAMES: Record<Exclude<SheetTemplateKind, 'blank'>, string[]> = {
  player: ['player.md', 'pc.md', 'character.md'],
  npc: ['npc.md'],
  monster: ['monster.md', 'creature.md'],
  spell: ['spell.md'],
  gear: ['gear.md', 'item.md', 'equipment.md'],
  nightsheet: ['game night sheet.md', 'gamenightsheet.md', 'night sheet.md', 'nightsheet.md'],
  map: ['map.md']
}

export function displayTitle(fileStem: string): string {
  return fileStem.replace(/^pc\s*[—–-]\s*/i, '').trim()
}

/** `Session 4` → `Session 4 — Game Night Sheet`. Leaves an existing game-night-sheet name alone. */
export function gameNightSheetFileStem(name: string): string {
  const stem = sanitizeFileName(name).replace(/\.md$/i, '')
  if (/game\s*night\s*sheet/i.test(stem)) return stem
  if (/night\s*sheet/i.test(stem)) return stem.replace(/night\s*sheet/gi, 'Game Night Sheet')
  return `${stem} — Game Night Sheet`
}

export type FillTemplateExtras = {
  partyStems?: string[]
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
  if (kind === 'nightsheet') {
    const stems = extras?.partyStems ?? []
    if (body.includes('{{party}}')) {
      body = body.replaceAll('{{party}}', partyLinkList(stems))
    } else if (stems.length > 0 && !stems.some((stem) => body.includes(`[[${stem}`))) {
      body = body.replace(/^(# .+\r?\n)/, `$1\n## The characters\n\n${partyLinkList(stems)}\n\n`)
    }
  }
  return body
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
