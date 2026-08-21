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
]);

export const HIDDEN_FILE_NAMES = new Set(['campaign.json', 'combat.json', 'readme.md']);

export const FOLDER_ORDER = [
  'sessions',
  'party',
  'npcs',
  'bestiary',
  'spells',
  'gear',
  'maps',
  'handouts',
  'templates',
  'reference',
  'archive',
] as const;

export const STANDARD_LAYOUT: { canonical: string; name: string; extras: string[] }[] = [
  { canonical: 'sessions', name: 'Sessions', extras: ['Art'] },
  { canonical: 'party', name: 'Party', extras: ['Art'] },
  { canonical: 'npcs', name: 'NPCs', extras: ['Art'] },
  { canonical: 'bestiary', name: 'Bestiary', extras: ['Art'] },
  { canonical: 'spells', name: 'Spells', extras: [] },
  { canonical: 'gear', name: 'Gear', extras: [] },
  { canonical: 'maps', name: 'Maps', extras: ['Art', 'Print'] },
  { canonical: 'handouts', name: 'Handouts', extras: ['Art'] },
  { canonical: 'templates', name: 'Templates', extras: [] },
  { canonical: 'reference', name: 'Reference', extras: [] },
  { canonical: 'archive', name: 'Archive', extras: [] },
];

export const DEFAULT_OPEN_FOLDERS = new Set([
  'sessions',
  'party',
  'npcs',
  'bestiary',
  'spells',
  'gear',
  'maps',
  'handouts',
  'the party',
  "pc's",
  'pcs',
  "npc's",
]);

function foldFolderName(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/&/g, 'and')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const FOLDER_ALIASES: Record<string, string> = {
  'the party': 'party',
  pcs: 'party',
  pc: 'party',
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
  equipment: 'gear',
  'magic items': 'gear',
  'magic item': 'gear',
};

export function canonicalFolder(name: string): string {
  const folded = foldFolderName(name);
  return FOLDER_ALIASES[folded] ?? folded;
}

export function folderOrderIndex(name: string): number {
  const i = FOLDER_ORDER.indexOf(canonicalFolder(name) as (typeof FOLDER_ORDER)[number]);
  return i === -1 ? 99 : i;
}

export function isPartyFolderName(name: string): boolean {
  return canonicalFolder(name) === 'party';
}

export function isNpcFolderName(name: string): boolean {
  return canonicalFolder(name) === 'npcs';
}

export function isBestiaryFolderName(name: string): boolean {
  return canonicalFolder(name) === 'bestiary';
}

export function isSessionsFolderName(name: string): boolean {
  return canonicalFolder(name) === 'sessions';
}

export function isSpellsFolderName(name: string): boolean {
  return canonicalFolder(name) === 'spells';
}

export function isGearFolderName(name: string): boolean {
  return canonicalFolder(name) === 'gear';
}

export type CampaignLibraryFolder = 'bestiary' | 'spells' | 'gear';

export const LIBRARY_FOLDER_NAMES: Record<CampaignLibraryFolder, string> = {
  bestiary: 'Bestiary',
  spells: 'Spells',
  gear: 'Gear',
};

export function pathHasFolder(path: string, kind: 'party' | 'npcs' | 'bestiary'): boolean {
  const parts = path.replaceAll('\\', '/').split('/');
  return parts.some((part) => {
    if (kind === 'party') return isPartyFolderName(part);
    if (kind === 'npcs') return isNpcFolderName(part);
    return isBestiaryFolderName(part);
  });
}

export function isHiddenCampaignFile(name: string): boolean {
  if (name.startsWith('.')) return true;
  return HIDDEN_FILE_NAMES.has(name.toLowerCase());
}
