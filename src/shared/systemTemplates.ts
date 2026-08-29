import type { SystemId } from './systemPack'
import { FALLBACK_TEMPLATES, type SheetTemplateKind } from './sheetTemplates'

type TemplateKind = Exclude<SheetTemplateKind, 'blank'>
type TemplateMap = Record<TemplateKind, string>

const PF2E_PLAYER = `<!--
  Party sheet template (Pathfinder 2e). Right-click Party/ → New player…
  Keep AC, HP, and Perception in sync with the statblock. Perception is the usual initiative bonus.
-->
# *Character Name*

[!pc]
![[Character Name.png]]

### *One-line tagline — role at the table*

| | |
|---|---|
| **Player** | Name |
| **Ancestry** | Human |
| **Class** | Fighter 1 |
| **Background** |  |
| **Role** | Front line |
| **Perception** | +7 |
| **AC** | 18 |
| **HP** | 20 |
[!/pc]

\`\`\`statblock
layout: Basic PF2e Layout
name: Character Name
size: Medium
type: humanoid
ac: 18
hp: 20
speed: 25 ft.
stats: [16, 12, 14, 10, 12, 10]
initiative: 7
senses: "Perception +7"
languages: "Common"
traits:
  - name: Shield Block
    desc: "Spend a reaction to reduce damage from a physical Strike while your shield is raised."
actions:
  - name: Strike (longsword)
    desc: "+7 to hit. Damage 1d8+4 slashing."
\`\`\`

*Two sentences the GM can read at a glance — who they are and what they want tonight.*

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

const PF2E_NPC = `<!--
  NPC sheet template (Pathfinder 2e). Right-click NPCs/ → New NPC…
-->
# *NPC Name*

[!place]
![[NPC Name.png]]

### *Who they are in one line*

| | |
|---|---|
| **Role** | Patron / informant / obstacle |
| **Faction** | [[Faction Name]] |
| **Location** | [[Place Name]] |
| **Status** | Alive |
| **Level** | 1 |
| **Perception** | +6 |
[!/place]

\`\`\`statblock
layout: Basic PF2e Layout
name: NPC Name
size: Medium
type: humanoid
ac: 15
hp: 20
speed: 25 ft.
stats: [14, 12, 12, 10, 12, 12]
initiative: 6
senses: "Perception +6"
languages: "Common"
actions:
  - name: Strike
    desc: "+7 to hit. Damage 1d8+3."
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

const PF2E_MONSTER = `<!--
  Bestiary template (Pathfinder 2e). Right-click Bestiary/ → New monster…
-->
# Monster Name

[!monster]
![[Monster Name.png]]

| | |
|---|---|
| **Level** | 1 |
| **Role** | Pressure / boss / minion |
| **Source** | original |
[!/monster]

\`\`\`statblock
layout: Basic PF2e Layout
name: Monster Name
size: Medium
type: beast
ac: 16
hp: 20
speed: 35 ft.
stats: [14, 16, 12, 2, 12, 8]
initiative: 7
senses: "Perception +7, scent"
actions:
  - name: Jaws
    desc: "+8 to hit. Damage 1d8+3 piercing."
\`\`\`

*What it does on the map in one sentence.*

## Notes

Tactics, terrain, and when it runs.
`

const PF2E_SPELL = `<!--
  Spell / focus template (Pathfinder 2e). Right-click Spells/ → New spell…
-->
# Spell Name

[!spell]
![[Spell Name.png]]

| | |
|---|---|
| **Rank** | 1 |
| **Tradition** | Arcane |
| **Actions** | 2 |
| **Range** | 30 feet |
| **Duration** |  |
[!/spell]

*One paragraph: what it does at the table. Write your own text; this pack does not ship Paizo spell entries.*

## At the table

- **Heightened** — 
- **Notes** — 
`

const PF2E_GEAR = `<!--
  Gear template (Pathfinder 2e). Right-click Gear/ → New gear…
-->
# Item Name

[!gear]
![[Item Name.png]]

| | |
|---|---|
| **Category** | Weapon / armor / gear |
| **Price** |  |
| **Bulk** | L |
| **Traits** |  |
[!/gear]

*What it does in play. Original item — not copied from a Paizo book.*

## Notes

Who has it, where it came from, and whether it is loaded.
`

const PF2E_SHOP = `<!--
  Market stall / shop (Pathfinder 2e). Right-click Places/ → New shop…
  This pack does not roll SRD longswords. List wares yourself.
-->
# Shop Name

[!place]
![[Shop Name.png]]

### *What this stall is known for*

| | |
|---|---|
| **Keeper** | [[NPC Name]] |
| **Place** | [[Place Name]] |
| **Hours** | Dawn to dusk |
[!/place]

## Wares

- 
- 

> [!gmonly]
> Prices, shortages, and what the keeper will not sell.
`

const V5_PLAYER = `<!--
  Kindred sheet (Vampire 5th). Right-click Party/ → New player…
  Fill Clan and Predator yourself — the app does not ship book clans or disciplines.
-->
# *Character Name*

[!pc]
![[Character Name.png]]

### *One-line tagline — how they move through the night*

| | |
|---|---|
| **Player** | Name |
| **Clan** | *(fill your own)* |
| **Predator** | *(fill your own)* |
| **Role** |  |
| **Health** | 7 / 7 |
| **Willpower** | 5 / 5 |
| **Hunger** | 1 |
[!/pc]

\`\`\`statblock
layout: Basic V5 Layout
name: Character Name
hp: 7
willpower: 5
hunger: 1
\`\`\`

*Two sentences: who they are in this chronicle, and what they want tonight.*

## At the table

- **Ambition** — 
- **Desire** — 
- **Touchstones** — 

> [!gmonly]
> Secrets, debts, and what happens if Hunger spikes.

## Look & voice

- **Look** — 
- **Manner** — 
- **Quotes** — *"…"*

## Notes

Coterie ties and mortal entanglements.
`

const V5_NPC = `<!--
  Mortal or Kindred NPC (Vampire 5th). Right-click NPCs/ → New NPC…
-->
# *NPC Name*

[!place]
![[NPC Name.png]]

### *Who they are in one line*

| | |
|---|---|
| **Role** | Ally / rival / vessel / obstacle |
| **Clan** | *(fill your own, or mortal)* |
| **Location** | [[Place Name]] |
| **Status** | Alive |
| **Health** | 5 / 5 |
| **Willpower** | 3 / 3 |
| **Hunger** | 0 |
[!/place]

\`\`\`statblock
layout: Basic V5 Layout
name: NPC Name
hp: 5
willpower: 3
hunger: 0
\`\`\`

*What the coterie sees, and what you need them for.*

## Look & voice

- **Look** — 
- **Manner** — 
- **Quotes** — *"…"*

> [!gmonly]
> The truth. What they want. What they will not say.

## Notes

How they move the night.
`

const V5_MONSTER = `<!--
  Antagonist template (Vampire 5th). Right-click Bestiary/ → New monster…
  Original stats only — do not paste book blocks here if you are sharing the folder.
-->
# Monster Name

[!monster]
![[Monster Name.png]]

| | |
|---|---|
| **Role** | Rival / hunter / horror |
| **Health** | 8 / 8 |
| **Willpower** | 4 / 4 |
| **Hunger** | 2 |
| **Source** | original |
[!/monster]

\`\`\`statblock
layout: Basic V5 Layout
name: Monster Name
hp: 8
willpower: 4
hunger: 2
\`\`\`

*What it does on the map in one sentence.*

## Notes

Tactics and when it runs.
`

const V5_SPELL = `<!--
  Power cue (Vampire 5th). Right-click Spells/ → New spell…
  Blank on purpose. Write your own power names; the app does not ship discipline text.
-->
# Spell Name

[!spell]
![[Spell Name.png]]

| | |
|---|---|
| **Type** | Power / ritual / trick |
| **Cost** |  |
| **Dice** |  |
[!/spell]

*What happens when they use it at the table. Use your own book if you need official wording.*

## Notes

Who taught it, and what it costs socially.
`

const V5_GEAR = `<!--
  Possession template (Vampire 5th). Right-click Gear/ → New gear…
-->
# Item Name

[!gear]
![[Item Name.png]]

| | |
|---|---|
| **Kind** | Relic / weapon / document / haven gear |
| **Who holds it** |  |
[!/gear]

*Why it matters tonight.*

## Notes

Where it is, and who wants it.
`

const V5_SHOP = `<!--
  Haven, Elysium, or venue (Vampire 5th). Right-click Places/ → New shop…
-->
# Shop Name

[!place]
![[Shop Name.png]]

### *What this place is for*

| | |
|---|---|
| **Kind** | Haven / Elysium / venue |
| **Keeper** | [[NPC Name]] |
| **Place** | [[Place Name]] |
[!/place]

## What happens here

- 

> [!gmonly]
> Who watches the door, and what a scene here costs.
`

const OVERRIDES: Record<SystemId, Partial<TemplateMap>> = {
  dnd5e: {},
  pf2e: {
    player: PF2E_PLAYER,
    npc: PF2E_NPC,
    monster: PF2E_MONSTER,
    spell: PF2E_SPELL,
    gear: PF2E_GEAR,
    shop: PF2E_SHOP
  },
  v5: {
    player: V5_PLAYER,
    npc: V5_NPC,
    monster: V5_MONSTER,
    spell: V5_SPELL,
    gear: V5_GEAR,
    shop: V5_SHOP
  }
}

export function templatesFor(system?: string | null): TemplateMap {
  const id = system === 'pf2e' || system === 'v5' ? system : 'dnd5e'
  return { ...FALLBACK_TEMPLATES, ...OVERRIDES[id] }
}
