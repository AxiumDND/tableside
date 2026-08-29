import type { CombatantCondition } from './types'

export type SystemId = 'dnd5e' | 'pf2e' | 'v5'

export const DEFAULT_SYSTEM: SystemId = 'dnd5e'

export const SYSTEM_IDS: SystemId[] = ['dnd5e', 'pf2e', 'v5']

export const STATBLOCK_LAYOUT_RE = /layout:\s*Basic (?:5e|PF2e|V5) Layout/i

export function parseSystemId(value: unknown): SystemId {
  if (value === 'pf2e' || value === 'v5' || value === 'dnd5e') return value
  return DEFAULT_SYSTEM
}

export type OverlayTagTone = 'blood' | 'muted'

export interface OverlayTag {
  label: string
  tone?: OverlayTagTone
}

export interface CombatProfile {
  id: SystemId
  hpLabel: string
  showAc: boolean
  acLabel: string
  showWillpower: boolean
  showHunger: boolean
  initHint: string
  emptyHint: string
  halfHpTag: Extract<CombatantCondition, 'bloodied' | 'wounded'> | null
  zeroHpPc: CombatantCondition
  zeroHpNpc: CombatantCondition
}

export interface LookupFilterChip {
  id: string
  label: string
}

export interface SystemPack {
  id: SystemId
  label: string
  shortLabel: string
  blurb: string
  attribution: string
  officialDisclaimer: string
  lookupFilters: LookupFilterChip[]
  lookupSource: string
  lookupSourceLabel: string
  combat: CombatProfile
  statblockLayout: string
  shopsEnabled: boolean
  bookLookup: boolean
  sampleCampaign: boolean
}

const DND5E_COMBAT: CombatProfile = {
  id: 'dnd5e',
  hpLabel: 'HP',
  showAc: true,
  acLabel: 'AC',
  showWillpower: false,
  showHunger: false,
  initHint: 'DEX',
  emptyHint: 'Add the party, then pick creatures from the Bestiary.',
  halfHpTag: 'bloodied',
  zeroHpPc: 'unconscious',
  zeroHpNpc: 'dead'
}

const PF2E_COMBAT: CombatProfile = {
  id: 'pf2e',
  hpLabel: 'HP',
  showAc: true,
  acLabel: 'AC',
  showWillpower: false,
  showHunger: false,
  initHint: 'Perc',
  emptyHint: 'Add the party, then pick creatures from the Bestiary.',
  halfHpTag: 'wounded',
  zeroHpPc: 'dying',
  zeroHpNpc: 'dead'
}

const V5_COMBAT: CombatProfile = {
  id: 'v5',
  hpLabel: 'Health',
  showAc: false,
  acLabel: 'AC',
  showWillpower: true,
  showHunger: true,
  initHint: 'Init',
  emptyHint: 'Add the party, then add rivals from notes or the tracker.',
  halfHpTag: null,
  zeroHpPc: 'unconscious',
  zeroHpNpc: 'dead'
}

export const SYSTEM_PACKS: Record<SystemId, SystemPack> = {
  dnd5e: {
    id: 'dnd5e',
    label: 'D&D 5e (SRD)',
    shortLabel: 'D&D 5e',
    blurb: 'Bundled SRD 5.2.1 lookup, AC / HP / Bloodied tracker, and the Greystead sample.',
    attribution:
      'This work includes material from the System Reference Document 5.2 (“SRD 5.2”) by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode. Structured data via the Open5e API (document key srd-2024).',
    officialDisclaimer: 'Tableside is not affiliated with Wizards of the Coast.',
    lookupFilters: [
      { id: 'all', label: 'All' },
      { id: 'source:srd', label: 'SRD 5.2.1' },
      { id: 'rule', label: 'Rules' },
      { id: 'condition', label: 'Conditions' },
      { id: 'spell', label: 'Spells' },
      { id: 'monster', label: 'Monsters' },
      { id: 'weapon', label: 'Weapons' },
      { id: 'armor', label: 'Armor' },
      { id: 'gear', label: 'Gear' },
      { id: 'trade', label: 'Trade Goods' },
      { id: 'temple', label: 'Temple Goods' },
      { id: 'armorer', label: 'Armorer Goods' },
      { id: 'arms', label: 'Weapon Goods' },
      { id: 'stables', label: 'Stable Goods' },
      { id: 'store', label: 'Store Goods' },
      { id: 'apothecary', label: 'Apothecary' },
      { id: 'forge', label: 'Forge' },
      { id: 'market', label: 'Market Goods' },
      { id: 'magic', label: 'Magic Items' }
    ],
    lookupSource: 'srd',
    lookupSourceLabel: 'SRD 5.2.1',
    combat: DND5E_COMBAT,
    statblockLayout: 'Basic 5e Layout',
    shopsEnabled: true,
    bookLookup: true,
    sampleCampaign: true
  },
  pf2e: {
    id: 'pf2e',
    label: 'Pathfinder 2e',
    shortLabel: 'PF2e',
    blurb: 'Small original core lookup, Perception initiative, Dying / Wounded instead of Bloodied.',
    attribution:
      'Pathfinder 2e pack text in Tableside is original table material. Condition and action names are used as mechanics identifiers. This is not Paizo product text and is not scraped from Archives of Nethys.',
    officialDisclaimer: 'Tableside is not an official Paizo product and is not affiliated with Paizo Inc.',
    lookupFilters: [
      { id: 'all', label: 'All' },
      { id: 'source:pf2e', label: 'PF2e core' },
      { id: 'condition', label: 'Conditions' },
      { id: 'rule', label: 'Actions' },
      { id: 'monster', label: 'Creatures' },
      { id: 'gear', label: 'Gear' }
    ],
    lookupSource: 'pf2e',
    lookupSourceLabel: 'PF2e core',
    combat: PF2E_COMBAT,
    statblockLayout: 'Basic PF2e Layout',
    shopsEnabled: false,
    bookLookup: false,
    sampleCampaign: false
  },
  v5: {
    id: 'v5',
    label: 'Vampire 5th Edition',
    shortLabel: 'Vampire 5th',
    blurb: 'Health / Willpower / Hunger tracker and original table procedures. No book text ships with the app.',
    attribution:
      'Vampire 5th Edition pack text in Tableside is original table procedure, not published Vampire material. There is no open V5 SRD. Add your own chronicle notes if you own the books.',
    officialDisclaimer: 'Tableside is not an official Paradox Interactive or World of Darkness product.',
    lookupFilters: [
      { id: 'all', label: 'All' },
      { id: 'source:v5', label: 'V5 core' },
      { id: 'topic:core', label: 'Core' },
      { id: 'topic:hunger', label: 'Hunger' },
      { id: 'topic:health', label: 'Health' },
      { id: 'topic:willpower', label: 'Willpower' },
      { id: 'topic:predation', label: 'Predation' }
    ],
    lookupSource: 'v5',
    lookupSourceLabel: 'V5 core',
    combat: V5_COMBAT,
    statblockLayout: 'Basic V5 Layout',
    shopsEnabled: false,
    bookLookup: false,
    sampleCampaign: false
  }
}

export function getSystemPack(id?: string | null): SystemPack {
  return SYSTEM_PACKS[parseSystemId(id)]
}

export function overviewMarkdown(system: SystemId, title: string): string {
  if (system === 'pf2e') {
    return `# ${title}

Pathfinder 2e table. Open **Start Here**, then **Sessions** for tonight.

Sheets use Ancestry, Class, Perception, AC, and HP. Combat tags **Dying** and **Wounded** instead of Bloodied. Lookup is a small original core (conditions, actions, a handful of creatures) — not Archives of Nethys and not a Paizo book dump. Add your own notes in this folder.

Towns go in **Places/**; people stay in **NPCs/**. Put portraits in each folder's **Art** subfolder.
`
  }
  if (system === 'v5') {
    return `# ${title}

Vampire 5th Edition table. Open **Start Here**, then **Sessions** for tonight.

The tracker uses **Health**, **Willpower**, and **Hunger** (0–5). Lookup is original table procedure only — no clan writeups, disciplines, or book stat blocks ship with the app. Drop your own chronicle notes here if you own the books.

Havens and sites go in **Places/**; people stay in **NPCs/**. Put portraits in each folder's **Art** subfolder.
`
  }
  return `# ${title}

Open **Start Here** first, then **Sessions** for tonight's notes. Towns and shops go in **Places/**; shopkeepers stay in **NPCs/**. Put portraits in each folder's **Art** subfolder.
`
}

export function conditionLabel(condition: CombatantCondition | null | undefined): string | null {
  switch (condition) {
    case 'bloodied':
      return 'Bloodied'
    case 'wounded':
      return 'Wounded'
    case 'dying':
      return 'Dying'
    case 'unconscious':
      return 'Unconscious'
    case 'dead':
      return 'Dead'
    default:
      return null
  }
}

export function layoutIdForSource(source?: string): string {
  if (source === 'pf2e') return SYSTEM_PACKS.pf2e.statblockLayout
  if (source === 'v5') return SYSTEM_PACKS.v5.statblockLayout
  return SYSTEM_PACKS.dnd5e.statblockLayout
}
