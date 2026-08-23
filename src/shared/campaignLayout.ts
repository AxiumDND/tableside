import type { CampaignTreeNode } from './types'

export const SKIP_DIR_NAMES = new Set([
  '.git',
  '.obsidian',
  '.trash',
  'node_modules',
  '.DS_Store',
  'Thumbs.db',
  'out',
  'dist',
  'WOTC',
  'wotc',
  'WOTC Files',
  'WOTC FIles',
  'Additional Books',
  'additional books'
])

/** Hide local book dumps and scratch asset vaults from the campaign file tree. */
export function shouldSkipCampaignDir(name: string): boolean {
  if (SKIP_DIR_NAMES.has(name) || isHiddenCampaignFile(name)) return true
  const folded = name.toLowerCase().trim()
  return folded.startsWith('zz_') || folded.startsWith('zz ') || folded.startsWith('adventure book')
}

export function isTemplatesFolderName(name: string): boolean {
  return foldFolderName(name) === 'templates'
}

/** File tree only — a leftover Templates/ folder is still used when creating notes. */
export function shouldHideFromFileTree(name: string): boolean {
  return shouldSkipCampaignDir(name) || isTemplatesFolderName(name)
}

export const HIDDEN_FILE_NAMES = new Set(['campaign.json', 'combat.json', 'audio.json', 'readme.md'])

export const FOLDER_ORDER = [
  'start here',
  'sessions',
  'party',
  'npcs',
  'bestiary',
  'places',
  'factions',
  'spells',
  'gear',
  'maps',
  'handouts',
  'audio',
  'reference',
  'archive'
] as const

/** Subfolders created under Gear/. */
export const GEAR_SECTIONS = ['Weapons', 'Armor', 'Equipment', 'Trade Goods', 'Magic Items'] as const

export const STANDARD_LAYOUT: { canonical: string; name: string; extras: string[] }[] = [
  { canonical: 'sessions', name: 'Sessions', extras: ['Art'] },
  { canonical: 'party', name: 'Party', extras: ['Art'] },
  { canonical: 'npcs', name: 'NPCs', extras: ['Art'] },
  { canonical: 'bestiary', name: 'Bestiary', extras: ['Art'] },
  { canonical: 'places', name: 'Places', extras: ['Art'] },
  { canonical: 'factions', name: 'Factions', extras: ['Art'] },
  { canonical: 'spells', name: 'Spells', extras: ['Art'] },
  { canonical: 'gear', name: 'Gear', extras: [...GEAR_SECTIONS] },
  { canonical: 'maps', name: 'Maps', extras: ['Art', 'Print'] },
  { canonical: 'handouts', name: 'Handouts', extras: ['Art'] },
  { canonical: 'audio', name: 'Audio', extras: ['Music', 'Ambience', 'Sfx'] },
  { canonical: 'reference', name: 'Reference', extras: [] },
  { canonical: 'archive', name: 'Archive', extras: [] }
]

function foldFolderName(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/&/g, 'and')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const FOLDER_ALIASES: Record<string, string> = {
  start: 'start here',
  starthere: 'start here',
  'getting started': 'start here',
  'the party': 'party',
  pcs: 'party',
  pc: 'party',
  'player characters': 'party',
  'player character': 'party',
  npcs: 'npcs',
  npc: 'npcs',
  'session notes': 'sessions',
  session: 'sessions',
  'handouts and props': 'handouts',
  'handouts props': 'handouts',
  assets: 'maps',
  'z archive': 'archive',
  archive: 'archive',
  spell: 'spells',
  spells: 'spells',
  gear: 'gear',
  places: 'places',
  place: 'places',
  locations: 'places',
  location: 'places',
  world: 'places',
  setting: 'places',
  factions: 'factions',
  faction: 'factions',
  audio: 'audio',
  sounds: 'audio',
  sound: 'audio'
}

export function canonicalFolder(name: string): string {
  const folded = foldFolderName(name)
  return FOLDER_ALIASES[folded] ?? folded
}

export function folderOrderIndex(name: string): number {
  const i = FOLDER_ORDER.indexOf(canonicalFolder(name) as (typeof FOLDER_ORDER)[number])
  return i === -1 ? 99 : i
}

/** Sort order for Gear/Weapons, Armor, Equipment, Trade Goods, Magic Items. */
export function gearSectionIndex(name: string): number {
  const folded = foldFolderName(name)
  if (folded === 'weapons' || folded === 'weapon') return 0
  if (folded === 'armor' || folded === 'armour') return 1
  if (folded === 'equipment' || folded === 'adventuring gear') return 2
  if (folded === 'trade goods' || folded === 'trade good') return 3
  if (folded === 'magic items' || folded === 'magic item') return 4
  return 99
}

export function folderMatchesCanonical(name: string, canonical: string): boolean {
  if (canonical === 'gear') return isGearFolderName(name)
  return canonicalFolder(name) === canonical
}

export function isPartyFolderName(name: string): boolean {
  return canonicalFolder(name) === 'party'
}

export function isNpcFolderName(name: string): boolean {
  return canonicalFolder(name) === 'npcs'
}

export function isBestiaryFolderName(name: string): boolean {
  return canonicalFolder(name) === 'bestiary'
}

export function isSessionsFolderName(name: string): boolean {
  return canonicalFolder(name) === 'sessions'
}

export function isSpellsFolderName(name: string): boolean {
  return canonicalFolder(name) === 'spells'
}

export function isGearFolderName(name: string): boolean {
  const folded = foldFolderName(name)
  return folded === 'gear' || folded === 'equipment' || folded === 'magic items' || folded === 'magic item'
}

export function isMapsFolderName(name: string): boolean {
  return canonicalFolder(name) === 'maps'
}

export function isPlacesFolderName(name: string): boolean {
  return canonicalFolder(name) === 'places'
}

export function isFactionsFolderName(name: string): boolean {
  return canonicalFolder(name) === 'factions'
}

export function isAudioFolderName(name: string): boolean {
  return canonicalFolder(name) === 'audio'
}

export function isArtFolderName(name: string): boolean {
  return foldFolderName(name) === 'art'
}

export function isPrintFolderName(name: string): boolean {
  return foldFolderName(name) === 'print'
}

/** `Bestiary` → `Bestiary/Art`; already an Art folder stays as-is. */
export function artFolderRelativePath(folderPath: string): string {
  const path = folderPath.replaceAll('\\', '/').replace(/\/+$/, '')
  if (!path) return 'Art'
  const last = path.split('/').pop() ?? ''
  if (isArtFolderName(last)) return path
  return `${path}/Art`
}

/** Folders whose portraits/maps live in an Art/ sidecar (not Gear root or Maps/Print). */
export function folderUsesArt(folderPath: string): boolean {
  const parts = folderPath.replaceAll('\\', '/').split('/').filter(Boolean)
  if (parts.length === 0) return false
  const last = parts[parts.length - 1] ?? ''
  if (isPrintFolderName(last)) return false
  if (isArtFolderName(last)) return true
  for (const part of parts) {
    if (isArtFolderName(part) || isPrintFolderName(part)) continue
    const canonical = canonicalFolder(part)
    if (
      canonical === 'party' ||
      canonical === 'npcs' ||
      canonical === 'bestiary' ||
      canonical === 'places' ||
      canonical === 'factions' ||
      canonical === 'spells' ||
      canonical === 'sessions' ||
      canonical === 'maps' ||
      canonical === 'handouts'
    ) {
      return true
    }
    if (gearSectionIndex(part) < 99) return true
  }
  return false
}

/** 0 = normal folder, 1 = file, 2 = Art (notes first, portraits last). */
export function campaignTreeGroup(type: 'dir' | 'file', name: string): number {
  if (type === 'file') return 1
  if (isArtFolderName(name)) return 2
  return 0
}

export function folderContainsPath(dirPath: string, filePath?: string): boolean {
  if (!filePath) return false
  const dir = dirPath.replaceAll('\\', '/')
  const file = filePath.replaceAll('\\', '/')
  return file === dir || file.startsWith(`${dir}/`)
}

/** Art is a sidecar for portraits/maps — keep it collapsed unless the DM opens it. */
export function folderRevealsOpenFile(dirPath: string, dirName: string, openPath?: string): boolean {
  if (isArtFolderName(dirName)) return false
  return folderContainsPath(dirPath, openPath)
}

/**
 * Auto-expand folders that hold the open file, but a manual collapse wins
 * until a different file is opened.
 */
export function folderIsOpenInTree(
  dirPath: string,
  dirName: string,
  openPath: string | undefined,
  userOpen: boolean,
  collapsedForOpenPath: string | undefined
): boolean {
  const normalizedOpen = openPath ?? ''
  if (collapsedForOpenPath !== undefined && collapsedForOpenPath === normalizedOpen) return false
  return userOpen || folderRevealsOpenFile(dirPath, dirName, openPath)
}

export type CampaignLibraryFolder = 'bestiary' | 'spells' | 'gear'

export const LIBRARY_FOLDER_NAMES: Record<CampaignLibraryFolder, string> = {
  bestiary: 'Bestiary',
  spells: 'Spells',
  gear: 'Gear'
}

export function isHoloPortraitPath(path: string): boolean {
  return (
    pathHasFolder(path, 'party') ||
    pathHasFolder(path, 'npcs') ||
    pathHasFolder(path, 'bestiary') ||
    pathHasFolder(path, 'gear')
  )
}

export function isStartHerePath(path: string): boolean {
  const root = path.replaceAll('\\', '/').split('/').find(Boolean) ?? ''
  return canonicalFolder(root) === 'start here'
}

export function pathHasFolder(
  path: string,
  kind: 'party' | 'npcs' | 'bestiary' | 'gear' | 'spells' | 'sessions' | 'maps' | 'places' | 'factions'
): boolean {
  const parts = path.replaceAll('\\', '/').split('/')
  return parts.some((part) => {
    if (kind === 'party') return isPartyFolderName(part)
    if (kind === 'npcs') return isNpcFolderName(part)
    if (kind === 'bestiary') return isBestiaryFolderName(part)
    if (kind === 'gear') return isGearFolderName(part)
    if (kind === 'spells') return isSpellsFolderName(part)
    if (kind === 'sessions') return isSessionsFolderName(part)
    if (kind === 'places') return isPlacesFolderName(part)
    if (kind === 'factions') return isFactionsFolderName(part)
    return isMapsFolderName(part)
  })
}

export function isHiddenCampaignFile(name: string): boolean {
  if (name.startsWith('.')) return true
  return HIDDEN_FILE_NAMES.has(name.toLowerCase())
}

export function parentRelativePath(path: string): string {
  const posix = path.replaceAll('\\', '/').replace(/\/+$/, '')
  const slash = posix.lastIndexOf('/')
  return slash === -1 ? '' : posix.slice(0, slash)
}

function findCampaignNode(nodes: CampaignTreeNode[], path: string): CampaignTreeNode | null {
  const want = path.replaceAll('\\', '/')
  for (const node of nodes) {
    if (node.relativePath.replaceAll('\\', '/') === want) return node
    if (node.children) {
      const found = findCampaignNode(node.children, want)
      if (found) return found
    }
  }
  return null
}

/** Next/previous file in the same Files-tree folder (does not walk into subfolders). */
export function adjacentCampaignFile(
  tree: CampaignTreeNode[],
  currentPath: string,
  direction: 1 | -1
): CampaignTreeNode | null {
  const current = currentPath.replaceAll('\\', '/')
  if (!current) return null
  const parentPath = parentRelativePath(current)
  const siblings = parentPath ? (findCampaignNode(tree, parentPath)?.children ?? []) : tree
  const files = siblings.filter((node) => node.type === 'file')
  const index = files.findIndex((node) => node.relativePath.replaceAll('\\', '/') === current)
  if (index < 0) return null
  return files[index + direction] ?? null
}
