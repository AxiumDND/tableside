export const SKIP_DIR_NAMES = new Set([
  '.git',
  '.obsidian',
  '.trash',
  'node_modules',
  '.DS_Store',
  'Thumbs.db',
  'out',
  'dist'
])

export const HIDDEN_FILE_NAMES = new Set(['campaign.json', 'combat.json', 'readme.md'])

export const FOLDER_ORDER = [
  'sessions',
  'party',
  'npcs',
  'bestiary',
  'templates',
  'maps',
  'scenes',
  'portraits',
  'handouts',
  'reference',
  'archive'
] as const

export const DEFAULT_OPEN_FOLDERS = new Set([
  'sessions',
  'party',
  'npcs',
  'bestiary',
  'templates',
  'maps',
  'scenes',
  'portraits',
  'handouts',
  'the party',
  "pc's",
  'pcs',
  "npc's"
])

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
  'the party': 'party',
  pcs: 'party',
  pc: 'party',
  npcs: 'npcs',
  npc: 'npcs',
  'handouts and props': 'handouts',
  'handouts props': 'handouts',
  assets: 'scenes',
  'z archive': 'archive',
  archive: 'archive'
}

export function canonicalFolder(name: string): string {
  const folded = foldFolderName(name)
  return FOLDER_ALIASES[folded] ?? folded
}

export function folderOrderIndex(name: string): number {
  const i = FOLDER_ORDER.indexOf(canonicalFolder(name) as (typeof FOLDER_ORDER)[number])
  return i === -1 ? 99 : i
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

export function pathHasFolder(path: string, kind: 'party' | 'npcs' | 'bestiary'): boolean {
  const parts = path.replaceAll('\\', '/').split('/')
  return parts.some((part) => {
    if (kind === 'party') return isPartyFolderName(part)
    if (kind === 'npcs') return isNpcFolderName(part)
    return isBestiaryFolderName(part)
  })
}

export function isHiddenCampaignFile(name: string): boolean {
  if (name.startsWith('.')) return true
  return HIDDEN_FILE_NAMES.has(name.toLowerCase())
}
