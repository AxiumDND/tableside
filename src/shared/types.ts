import { APP_NAME } from './version'
import type { CampaignCurrency } from './currencies'
import type { PlayerDiceShow } from './playerDiceShow'

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
  willpower?: number
  maxWillpower?: number
  hunger?: number
  notes?: string
  statBlock?: StatBlock
  sourceId?: string
  /** Toggleable status ids (Poisoned, Prone, …). HP-derived Bloodied/Dead stay separate. */
  conditions?: string[]
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
  system: 'dnd5e' | 'pf2e' | 'v5'
  /** DM console look for this folder. Unknown ids fall back to classic. */
  theme: string
  /** Sci-fi only: hologram overlay on party / NPC / beast / gear art. */
  holoPortraits?: boolean
  /** Digital rain only: falling-code wallpaper in the dark wells. */
  digitalRain?: boolean
  /** Coin denominations for Treasure blocks (defaults to pp/gp/sp/cp). */
  currencies?: CampaignCurrency[]
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
  dm?: boolean
}

export type CombatantCondition = 'bloodied' | 'unconscious' | 'dead' | 'dying' | 'wounded'

export interface PlayerOverlayTag {
  label: string
  tone?: 'blood' | 'muted'
}

export interface PlayerInitiativeEntry {
  id: string
  name: string
  active: boolean
  bloodied?: boolean
  condition?: CombatantCondition | null
  hunger?: number | null
  willpower?: number | null
  maxWillpower?: number | null
  overlayTags?: PlayerOverlayTag[]
}

export interface PlayerMapToken {
  id: string
  x: number
  y: number
  size: number
  label: string
  kind: 'pc' | 'npc' | 'monster'
  imageSrc: string | null
}

/** Crop + fog sent with a map so the player window follows the DM view. */
export interface PlayerMapView {
  zoom: number
  centerX: number
  centerY: number
  fog: string
  fogSize: number
  tokens?: PlayerMapToken[]
}

export interface PlayerCrawl {
  title?: string
  body: string
  startedAt: number
  logoSrc?: string | null
  endSrc?: string | null
  preface?: string | null
  /** Set when the DM stops early — player view fades out, then clears. */
  stoppingAt?: number
}

/** Campfire chronicle look: mist, embers, crimson (vampire), neon (cyber/sci-fi). */
export type LegendLookId = 'mist' | 'embers' | 'crimson' | 'neon'

/** Parchment legend scroll — crawl payload plus atmosphere look. */
export interface PlayerLegend extends PlayerCrawl {
  look?: LegendLookId
}

export interface PlayerGallerySlide {
  src: string
  label?: string
}

export interface PlayerGallery {
  title?: string
  slides: PlayerGallerySlide[]
  index: number
  startedAt: number
  /** Auto-advance seconds; omit or 0 for manual. */
  intervalSec?: number | null
  /** Wrap at ends when advancing. Default true. */
  loop?: boolean
  /** Show title caption on the player screen. Default false. */
  showTitle?: boolean
  /** Set when the DM stops early — player view fades out, then clears. */
  stoppingAt?: number
}

export interface PlayerVideo {
  title?: string
  src: string
  muted: boolean
  startedAt: number
}

export interface PlayerPhone {
  title?: string
  photoSrc?: string | null
  ringSrc?: string | null
  startedAt: number
  answeredAt?: number
  stoppingAt?: number
}

export interface PlayerHyperspace {
  title?: string
  shipSrc?: string | null
  planetSrc?: string | null
  startedAt: number
  arrivedAt?: number
  stoppingAt?: number
}

/** Item / spell / place card shown with (or instead of) a still on the player screen. */
export interface PlayerHandout {
  title: string
  subtitle?: string
  facts?: { label: string; value: string }[]
  body?: string
  /** True when GM-only callouts were included in body. */
  includeSecrets?: boolean
}

export interface PlayerBoxOfDoom {
  dc: number
  modifier: number
  startedAt: number
  mode?: 'normal' | 'advantage' | 'disadvantage'
  rolledAt?: number
  d20?: number
  rolls?: number[]
  total?: number
  success?: boolean
  stoppingAt?: number
  sound?: boolean
  label?: string
}

export interface PlayerState {
  imageSrc: string | null
  imageTitle: string
  campaignTitle: string
  initiative: PlayerInitiativeEntry[]
  showInitiative: boolean
  initiativeRound?: number
  mapView?: PlayerMapView | null
  crawl?: PlayerCrawl | null
  legend?: PlayerLegend | null
  gallery?: PlayerGallery | null
  video?: PlayerVideo | null
  phone?: PlayerPhone | null
  hyperspace?: PlayerHyperspace | null
  handout?: PlayerHandout | null
  boxOfDoom?: PlayerBoxOfDoom | null
  diceShow?: PlayerDiceShow | null
}

export interface RecentCampaign {
  folder: string
  name: string
}

export interface AppFolders {
  appFolder: string
  userDataFolder: string
  booksFolder: string
  campaignFolder: string
  convertGuidePath: string
}

export interface AppSettings {
  campaignFolder?: string
  playerDisplayId?: number
  dmBounds?: { x: number; y: number; width: number; height: number }
  lastOpenPath?: string
  lastOpenKind?: string
  rightPanel?: 'combat' | 'tools' | 'help' | 'music' | null
  /** Last tool in the right column, restored when the panel icon shows it again. */
  lastRightPanel?: 'combat' | 'tools' | 'help' | 'music'
  /** Last page inside Tools (Lookup, NPC, Improvise, or Dice). */
  toolsTab?: 'lookup' | 'npc' | 'names' | 'improvise' | 'dice'
  /** Play roll sound on the mixer Sfx layer. Default on. */
  diceCheckSound?: boolean
  /** Send tray and sheet rolls to the player TV strip. Default on. */
  showDiceToPlayers?: boolean
  /** Seconds to hold a Box of Doom result before auto fade-out. Default 15. */
  boxOfDoomHoldSec?: number
  /** Hide bundled AI-generated NPC portrait picks app-wide. Default off (shown). */
  hideNpcPortraits?: boolean
  showPlayerPreview?: boolean
  /** Left column (preview, files, dice). Default open. */
  showLeftSidebar?: boolean
  theme?: string
  recentCampaigns?: RecentCampaign[]
  dismissedUpdateVersion?: string
}

/** Optional image when creating a map or sheet note. */
export type CreateNoteMapImage =
  | { kind: 'existing'; path: string }
  | { kind: 'import'; filePath: string }
  | { kind: 'stock'; id: string }
  | { kind: 'npc-portrait'; race: string; gender: 'feminine' | 'masculine'; id: string }

export const emptyCombat = (): CombatState => ({
  combatants: [],
  activeId: null,
  round: 0,
  showOrderToPlayers: false
})

export const emptyPlayerState = (): PlayerState => ({
  imageSrc: null,
  imageTitle: '',
  campaignTitle: APP_NAME,
  initiative: [],
  showInitiative: false,
  initiativeRound: 0,
  mapView: null,
  crawl: null,
  legend: null,
  gallery: null,
  video: null,
  phone: null,
  hyperspace: null,
  handout: null,
  boxOfDoom: null,
  diceShow: null
})

export const emptySettings = (): AppSettings => ({})
