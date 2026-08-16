export type CombatantKind = 'pc' | 'npc' | 'monster'

export interface AbilityScores {
  strength?: number
  dexterity?: number
  constitution?: number
  intelligence?: number
  wisdom?: number
  charisma?: number
}

export interface StatAction {
  name: string
  desc: string
  limit?: string | null
}

export interface StatBlock {
  name: string
  size?: string
  type?: string
  alignment?: string
  cr?: number | string
  ac?: number
  armorDetail?: string
  hp?: number
  hitDice?: string
  speed?: string
  scores?: AbilityScores
  modifiers?: AbilityScores
  initiativeBonus?: number
  saves?: string
  skills?: string
  senses?: string
  languages?: string
  immunities?: string
  resistances?: string
  vulnerabilities?: string
  conditionImmunities?: string
  traits?: StatAction[]
  actions?: StatAction[]
  bonusActions?: StatAction[]
  reactions?: StatAction[]
  legendary?: StatAction[]
  lair?: StatAction[]
}

export interface Character {
  id: string
  name: string
  ac: number
  hp: number
  maxHp: number
  passivePerception?: number
  notes?: string
  classLevel?: string
}

export interface Combatant {
  id: string
  name: string
  kind: CombatantKind
  initiative: number
  hp: number
  maxHp: number
  ac: number
  notes?: string
  statBlock?: StatBlock
  sourceId?: string
}

export interface CombatState {
  combatants: Combatant[]
  activeId: string | null
  round: number
  showOrderToPlayers: boolean
}

export interface MediaItem {
  relativePath: string
  name: string
  url: string
}

export interface SessionFile {
  relativePath: string
  name: string
}

export interface CampaignTreeNode {
  name: string
  relativePath: string
  type: 'dir' | 'file'
  ext?: string
  children?: CampaignTreeNode[]
}

export interface CampaignInfo {
  folder: string
  name: string
  media: MediaItem[]
  sessions: SessionFile[]
  party: Character[]
  npcs: Character[]
  combat: CombatState
  tree: CampaignTreeNode[]
}

export interface DisplayInfo {
  id: number
  label: string
  bounds: { x: number; y: number; width: number; height: number }
  primary: boolean
}

export interface PlayerInitiativeEntry {
  id: string
  name: string
  active: boolean
}

export interface PlayerState {
  imageSrc: string | null
  imageTitle: string
  campaignTitle: string
  initiative: PlayerInitiativeEntry[]
  showInitiative: boolean
}

export const emptyCombat = (): CombatState => ({
  combatants: [],
  activeId: null,
  round: 0,
  showOrderToPlayers: true
})

export const emptyPlayerState = (): PlayerState => ({
  imageSrc: null,
  imageTitle: '',
  campaignTitle: 'Table DM',
  initiative: [],
  showInitiative: false
})
