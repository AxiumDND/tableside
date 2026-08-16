export type SheetTemplateKind = 'blank' | 'player' | 'npc' | 'monster' | 'spell' | 'gear'

const PLAYER = `<!--
  Party sheet template. Right-click Party/ → New player… (or copy into Party/ and rename).
  Put the portrait in Party/Art/ as Character Name.png and keep AC/HP in sync with the statblock.
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

## Combat

**Combatants:** [[Character Name]] · party

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
`

const NPC = `<!--
  NPC sheet template. Right-click NPCs/ → New NPC… (or copy into NPCs/ and rename).
  Portrait: NPCs/Art/NPC Name.png. Night sheets link with [[NPC Name]].
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

## Combat

**Combatants:** [[NPC Name]] · party

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
`

const MONSTER = `<!--
  Bestiary template. Right-click Bestiary/ → New monster… (or copy into Bestiary/ and rename).
  Art: Bestiary/Art/Monster Name.png. Prefer Add to Bestiary from Lookup for SRD creatures.
  See docs/CAMPAIGN.md and docs/MARKDOWN.md.
-->
# Monster Name

*One line: what it does at the table.*

Medium undead · chaotic evil · CR 1

| | |
|---|---|
| **CR** | 1 |
| **Role** | Pressure / boss / minion |
| **Source** | MM / custom |

## Notes

Where it appears. What to telegraph. When to cut it if the fight runs long.

> [!gmonly]
> Tuning: add or drop HP, skip a recharge, or have it flee.

## Combat

**Combatants:** [[Monster Name]] · party

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
`

const SPELL = `<!--
  Spell note template. Right-click Spells/ → New spell… or save from Lookup.
  Field lines mirror WOTC/PHB dump format (see WOTC/README.md).
-->
# Spell Name

Level 1 Evocation (Wizard)
Casting Time: Action
Range: 60 feet
Components: V, S
Duration: Instantaneous

What the spell does at the table.

Using a Higher-Level Spell Slot. 
`

const GEAR = `<!--
  Gear / magic item template. Right-click Gear/ → New gear… or save from Lookup.
  Use Damage/Properties for weapons, Rarity/Attunement for magic items (WOTC/README.md).
-->
# Item Name

Adventuring Gear
Rarity: 
Attunement: 
Damage: 
Properties: 
Weight: 
Cost: 

What it does, or any house-rule notes.
`

export const FALLBACK_TEMPLATES: Record<Exclude<SheetTemplateKind, 'blank'>, string> = {
  player: PLAYER,
  npc: NPC,
  monster: MONSTER,
  spell: SPELL,
  gear: GEAR
}

export const TEMPLATE_PLACEHOLDERS: Record<Exclude<SheetTemplateKind, 'blank'>, string> = {
  player: 'Character Name',
  npc: 'NPC Name',
  monster: 'Monster Name',
  spell: 'Spell Name',
  gear: 'Item Name'
}

export const TEMPLATE_FILE_NAMES: Record<Exclude<SheetTemplateKind, 'blank'>, string[]> = {
  player: ['player.md', 'pc.md', 'character.md'],
  npc: ['npc.md'],
  monster: ['monster.md', 'creature.md'],
  spell: ['spell.md'],
  gear: ['gear.md', 'item.md', 'equipment.md']
}

export function displayTitle(fileStem: string): string {
  return fileStem.replace(/^pc\s*[—–-]\s*/i, '').trim()
}

export function fillTemplate(source: string, kind: Exclude<SheetTemplateKind, 'blank'>, name: string): string {
  const placeholder = TEMPLATE_PLACEHOLDERS[kind]
  const title = displayTitle(name)
  return source
    .replace(/^<!--[\s\S]*?-->\s*/, '')
    .split(placeholder)
    .join(title)
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
