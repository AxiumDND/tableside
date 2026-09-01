import type { BlockIndex } from '../../../shared/blockIndex'
import type { CalloutKind } from '../../../shared/callouts'
import type { CrawlCalloutFields } from '../../../shared/openingCrawl'
import type { LegendCalloutFields } from '../../../shared/openingLegend'
import type { GalleryCalloutFields } from '../../../shared/playerGallery'
import type { VideoCalloutFields } from '../../../shared/playerVideo'
import type { PhoneCalloutFields } from '../../../shared/playerPhone'
import type { HyperspaceCalloutFields } from '../../../shared/playerHyperspace'
import type { ThemeId } from '../../../shared/theme'
import type { AudioTrack } from '../../../shared/audio'
import type {
  PlayerCrawl,
  PlayerGallery,
  PlayerHyperspace,
  PlayerLegend,
  PlayerPhone,
  PlayerVideo
} from '../../../shared/types'
import type { CampaignImage, CampaignVideo } from '../lib/images'
import type { CampaignNote, NightEncounter } from '../lib/notes'

export type SessionNoteMarkdownDeps = {
  markdown: string
  path: string
  images: CampaignImage[]
  noteIndex: CampaignNote[]
  selectedImage?: string | null
  theme?: ThemeId
  disabled?: boolean
  musicTracks?: AudioTrack[]
  videos?: CampaignVideo[]
  encounters: NightEncounter[]
  addingId: string | null
  onOpenNote?: (path: string) => void
  onSelectImage?: (path: string) => void
  onAddEncounter?: unknown
  onAddEncounterClick: (encounter: NightEncounter) => void
  activeCrawl?: { title?: string; body: string } | null
  playerCrawl?: PlayerCrawl | null
  onStopCrawl?: () => void
  onPlayCrawl?: unknown
  persistCrawl: (index: number, fields: CrawlCalloutFields) => void | Promise<void>
  playCrawlCard: (index: number, fields: CrawlCalloutFields) => void | Promise<void>
  loadCrawlLogo: () => Promise<string | null>
  loadCrawlEndImage: () => Promise<string | null>
  loadCrawlMusic: () => Promise<string | null>
  activeLegend?: { title?: string; body: string } | null
  playerLegend?: PlayerLegend | null
  onStopLegend?: () => void
  onPlayLegend?: unknown
  persistLegend: (index: number, fields: LegendCalloutFields) => void | Promise<void>
  playLegendCard: (index: number, fields: LegendCalloutFields) => void | Promise<void>
  loadLegendLogo: () => Promise<string | null>
  loadLegendEndImage: () => Promise<string | null>
  loadLegendMusic: () => Promise<string | null>
  activeGallery?: { title?: string; imageRefs: string[] } | null
  playerGallery?: PlayerGallery | null
  onStopGallery?: () => void
  onGalleryPrev?: () => void
  onGalleryNext?: () => void
  onPlayGallery?: unknown
  persistGallery: (index: number, fields: GalleryCalloutFields) => void | Promise<void>
  playGalleryCard: (index: number, fields: GalleryCalloutFields) => void | Promise<void>
  activeVideo?: { title?: string; videoRef: string } | null
  playerVideo?: PlayerVideo | null
  onStopVideo?: () => void
  onPlayVideo?: unknown
  persistVideo: (index: number, fields: VideoCalloutFields) => void | Promise<void>
  playVideoCard: (index: number, fields: VideoCalloutFields) => void | Promise<void>
  loadVideoFile: () => Promise<string | null>
  activePhone?: { title?: string; npcRef: string | null } | null
  playerPhone?: PlayerPhone | null
  onStopPhone?: () => void
  onAnswerPhone?: () => void
  onPlayPhone?: unknown
  persistPhone: (index: number, fields: PhoneCalloutFields) => void | Promise<void>
  playPhoneCard: (index: number, fields: PhoneCalloutFields) => void | Promise<void>
  loadPhoneRing: () => Promise<string | null>
  activeHyperspace?: { title?: string; shipRef: string | null; planetRef: string | null } | null
  playerHyperspace?: PlayerHyperspace | null
  onStopHyperspace?: () => void
  onArriveHyperspace?: () => void
  onPlayHyperspace?: unknown
  persistHyperspace: (index: number, fields: HyperspaceCalloutFields) => void | Promise<void>
  playHyperspaceCard: (index: number, fields: HyperspaceCalloutFields) => void | Promise<void>
  loadHyperspaceShip: () => Promise<string | null>
  loadHyperspacePlanet: () => Promise<string | null>
  loadHyperspaceSound: () => Promise<string | null>
  blockEditEnabled?: boolean
  blockIndex?: BlockIndex
  editingBlocks?: ReadonlySet<string>
  onBlockEdit?: (key: string) => void
  onBlockDone?: (key: string) => void
  onBlockSave?: (key: string, markdown: string) => void
  onBlockInsert?: (key: string, position: 'above' | 'below', kind: CalloutKind) => void
  onBlockDelete?: (key: string) => void
  currencies?: import('../../../shared/currencies').CampaignCurrency[]
  system?: string | null
  onEnsureGear?: (
    record: import('../lib/srd').SrdRecord
  ) => Promise<'added' | 'exists' | void> | 'added' | 'exists' | void
  onEnsureMonster?: (
    record: import('../lib/srd').SrdRecord
  ) => Promise<'added' | 'exists' | void> | 'added' | 'exists' | void
  gearNotes?: CampaignNote[]
}
