import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import { join, normalize, relative, basename, extname } from 'node:path'
import type {
  CampaignInfo,
  CampaignTreeNode,
  Character,
  CombatState,
  MediaItem,
  SessionFile
} from '../shared/types'
import { emptyCombat } from '../shared/types'
import { normalizeCurrencies, type CampaignCurrency } from '../shared/currencies'
import { IMAGE_EXT } from '../shared/imageExt'
import {
  STANDARD_LAYOUT,
  folderMatchesCanonical,
  folderOrderIndex,
  gearSectionIndex,
  campaignTreeGroup,
  isHiddenCampaignFile,
  isNpcFolderName,
  isPartyFolderName,
  isSessionsFolderName,
  shouldHideFromFileTree
} from '../shared/campaignLayout'
import { TEMPLATE_FILE_NAMES } from '../shared/sheetTemplates'
import { templatesFor } from '../shared/systemTemplates'
import { overviewMarkdown, parseSystemId, type SystemId } from '../shared/systemPack'
import { digitalRainEnabled, holoPortraitsEnabled, parseThemeId } from '../shared/theme'

export function safeJoin(root: string, ...parts: string[]): string {
  const full = normalize(join(root, ...parts))
  const rel = relative(normalize(root), full)
  if (rel.startsWith('..')) {
    throw new Error('Invalid path')
  }
  return full
}

export async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true })
}

export async function readJson<T>(path: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as T
  } catch {
    return fallback
  }
}

export async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, JSON.stringify(value, null, 2), 'utf8')
}

export async function listJsonCharacters(dir: string): Promise<Character[]> {
  if (!existsSync(dir)) return []
  const files = (await readdir(dir)).filter((f) => f.endsWith('.json')).sort()
  const out: Character[] = []
  for (const file of files) {
    const data = await readJson<Partial<Character>>(join(dir, file), {})
    if (!data.name) continue
    out.push({
      id: data.id ?? file.replace(/\.json$/, ''),
      name: data.name,
      ac: Number(data.ac ?? 10),
      hp: Number(data.hp ?? data.maxHp ?? 10),
      maxHp: Number(data.maxHp ?? data.hp ?? 10),
      passivePerception: data.passivePerception,
      notes: data.notes,
      classLevel: data.classLevel
    })
  }
  return out
}

export async function collectMedia(root: string, dir: string, acc: MediaItem[]): Promise<void> {
  if (!existsSync(dir)) return
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      await collectMedia(root, full, acc)
      continue
    }
    const ext = entry.name.slice(entry.name.lastIndexOf('.')).toLowerCase()
    if (!IMAGE_EXT.has(ext)) continue
    const rel = relative(join(root, 'media'), full).replaceAll('\\', '/')
    acc.push({
      relativePath: rel,
      name: entry.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
      url: `tabledm://media/${rel.split('/').map(encodeURIComponent).join('/')}`
    })
  }
}

export function extOf(name: string): string {
  const i = name.lastIndexOf('.')
  return i >= 0 ? name.slice(i).toLowerCase() : ''
}

export function sortNodes(nodes: CampaignTreeNode[]): CampaignTreeNode[] {
  return nodes.sort((a, b) => {
    const group = campaignTreeGroup(a.type, a.name) - campaignTreeGroup(b.type, b.name)
    if (group) return group
    const ai = folderOrderIndex(a.name)
    const bi = folderOrderIndex(b.name)
    if (ai !== bi) return ai - bi
    const ga = gearSectionIndex(a.name)
    const gb = gearSectionIndex(b.name)
    if (ga !== gb) return ga - gb
    return a.name.localeCompare(b.name)
  })
}

export async function listTree(root: string, dir: string, depth = 0): Promise<CampaignTreeNode[]> {
  if (depth > 6 || !existsSync(dir)) return []
  const entries = await readdir(dir, { withFileTypes: true })
  const nodes: CampaignTreeNode[] = []
  for (const entry of entries) {
    if (shouldHideFromFileTree(entry.name)) continue
    const full = join(dir, entry.name)
    const relativePath = relative(root, full).replaceAll('\\', '/')
    if (entry.isDirectory()) {
      nodes.push({
        name: entry.name,
        relativePath,
        type: 'dir',
        children: await listTree(root, full, depth + 1)
      })
      continue
    }
    nodes.push({
      name: entry.name,
      relativePath,
      type: 'file',
      ext: extOf(entry.name)
    })
  }
  return sortNodes(nodes)
}

export async function findChildDir(
  root: string,
  match: (name: string) => boolean,
  fallback: string
): Promise<string> {
  if (!existsSync(root)) return join(root, fallback)
  const entries = await readdir(root, { withFileTypes: true })
  const found = entries.find((entry) => entry.isDirectory() && match(entry.name))
  return join(root, found?.name ?? fallback)
}

export async function existingCanonicalDir(root: string, canonical: string): Promise<string | null> {
  if (!existsSync(root)) return null
  const entries = await readdir(root, { withFileTypes: true })
  const found = entries.find((entry) => entry.isDirectory() && folderMatchesCanonical(entry.name, canonical))
  return found ? join(root, found.name) : null
}

export async function campaignHasCoreFolders(root: string): Promise<boolean> {
  for (const key of ['sessions', 'party', 'npcs', 'bestiary']) {
    if (await existingCanonicalDir(root, key)) return true
  }
  return false
}

export async function ensureCampaignLayout(root: string): Promise<void> {
  for (const item of STANDARD_LAYOUT) {
    const dir = (await existingCanonicalDir(root, item.canonical)) ?? join(root, item.name)
    await ensureDir(dir)
    for (const extra of item.extras) {
      await ensureDir(join(dir, extra))
      if (item.canonical === 'gear') await ensureDir(join(dir, extra, 'Art'))
    }
    if (item.canonical === 'audio') {
      for (const mood of ['Combat', 'Creepy', 'General']) {
        await ensureDir(join(dir, 'Music', mood))
      }
    }
  }
}

export async function migrateRootOverviewToStartHere(root: string): Promise<void> {
  const destDir = (await existingCanonicalDir(root, 'start here')) ?? join(root, 'Start Here')
  const dest = join(destDir, 'Overview.md')
  if (existsSync(dest)) return
  const source = join(root, 'Overview.md')
  if (!existsSync(source)) return
  await ensureDir(destDir)
  await rename(source, dest)
}

export async function readCampaignSystem(root: string): Promise<SystemId> {
  const json = await readJson<{ system?: string }>(join(root, 'campaign.json'), {})
  return parseSystemId(json.system)
}

export async function packTemplates(root: string): Promise<ReturnType<typeof templatesFor>> {
  return templatesFor(await readCampaignSystem(root))
}

export type CampaignFile = {
  name?: string
  system?: string
  theme?: string
  holoPortraits?: boolean
  digitalRain?: boolean
  currencies?: CampaignCurrency[]
}

export async function seedNewCampaignFiles(
  root: string,
  system: SystemId = 'dnd5e',
  theme?: string,
  options?: { holoPortraits?: boolean; digitalRain?: boolean }
): Promise<void> {
  const title = basename(root)
  await migrateRootOverviewToStartHere(root)
  const startHere = (await existingCanonicalDir(root, 'start here')) ?? join(root, 'Start Here')
  const overview = join(startHere, 'Overview.md')
  if (!existsSync(overview)) {
    await ensureDir(startHere)
    await writeFile(overview, overviewMarkdown(system, title), 'utf8')
  }
  const campaignPath = join(root, 'campaign.json')
  const prior = existsSync(campaignPath) ? await readJson<CampaignFile>(campaignPath, {}) : {}
  const nextTheme = parseThemeId(theme ?? prior.theme)
  await writeJson(campaignPath, {
    ...prior,
    name: prior.name ?? title,
    system,
    theme: nextTheme,
    holoPortraits: nextTheme === 'scifi' ? options?.holoPortraits !== false : prior.holoPortraits,
    digitalRain: nextTheme === 'matrix' ? options?.digitalRain !== false : prior.digitalRain
  })
  await refreshStockNightSheetTemplate(root)
}

export async function listPartyNoteStems(root: string): Promise<string[]> {
  const dir = await existingCanonicalDir(root, 'party')
  if (!dir || !existsSync(dir)) return []
  const entries = await readdir(dir, { withFileTypes: true })
  const stems: string[] = []
  for (const entry of entries) {
    if (!entry.isFile() || isHiddenCampaignFile(entry.name)) continue
    const ext = extname(entry.name).toLowerCase()
    if (ext !== '.md' && ext !== '.markdown' && ext !== '.txt') continue
    stems.push(basename(entry.name, ext))
  }
  return stems
}

export async function refreshStockNightSheetTemplate(root: string): Promise<void> {
  const templatesDir = await existingCanonicalDir(root, 'templates')
  if (!templatesDir) return
  const entries = await readdir(templatesDir)
  const wanted = new Set(TEMPLATE_FILE_NAMES.nightsheet)
  const matches = entries.filter((name) => wanted.has(name.toLowerCase()))
  const dest = join(templatesDir, 'Game Night Sheet.md')
  const preferred = matches.find((name) => name.toLowerCase() === 'game night sheet.md')
  const currentPath = preferred ? join(templatesDir, preferred) : matches[0] ? join(templatesDir, matches[0]) : null
  if (!currentPath) {
    await writeFile(dest, (await packTemplates(root)).nightsheet, 'utf8')
    return
  }
  const current = await readFile(currentPath, 'utf8')
  const alreadyCurrent =
    current.includes('{{party}}') &&
    current.includes('{{crawl}}') &&
    current.includes('{{legend}}') &&
    current.includes('# Session Name — Game Night Sheet') &&
    current.includes('## 1. The Party') &&
    current.includes('[!party]') &&
    current.includes('[!scene]') &&
    current.includes('[!combat]') &&
    !current.includes('What this page does') &&
    !current.includes('## 4. NPCs') &&
    !current.includes('## 3. Secrets and clues') &&
    !current.includes('## 3. From last time') &&
    !current.includes('## 4. Likely endings') &&
    current.includes('**At the table**')
  if (!alreadyCurrent) {
    const stock =
      current.includes('{{party}}') ||
      current.includes('Numbers and cues for behind the screen') ||
      current.includes('Combat 1 — name the encounter') ||
      current.includes('## ⚔️ Combat 1') ||
      current.includes('**Combat in this scene**') ||
      current.includes('## 1. The characters') ||
      current.includes('## 5. Locations') ||
      current.includes('## 4. NPCs') ||
      current.includes('## 3. Secrets and clues') ||
      current.includes('## 4. Treasure') ||
      current.includes('## 3. From last time') ||
      current.includes('## 4. Likely endings') ||
      (current.includes('[!scene]') && !current.includes('**At the table**')) ||
      (current.includes('[!scene]') && !current.includes('[!combat]')) ||
      (current.includes('## 1. The Party') && !current.includes('[!party]'))
    if (stock) await writeFile(dest, (await packTemplates(root)).nightsheet, 'utf8')
  } else if (currentPath !== dest) {
    await writeFile(dest, current, 'utf8')
  }
  for (const name of matches) {
    if (name.toLowerCase() === 'game night sheet.md') continue
    const extra = join(templatesDir, name)
    const text = extra === currentPath ? current : await readFile(extra, 'utf8')
    const stock =
      text.includes('{{party}}') ||
      text.includes('Numbers and cues for behind the screen') ||
      text.includes('Combat 1 — name the encounter') ||
      text.includes('## 1. The characters') ||
      text.includes('## 5. Locations') ||
      text.includes('## 4. NPCs') ||
      text.includes('## 3. Secrets and clues') ||
      text.includes('## 4. Treasure') ||
      text.includes('## 3. From last time') ||
      text.includes('## 4. Likely endings') ||
      (text.includes('[!scene]') && !text.includes('**At the table**')) ||
      (text.includes('## 1. The Party') && !text.includes('[!party]'))
    if (stock) await unlink(extra)
  }
}

export async function refreshStockCreatureTemplates(root: string): Promise<void> {
  const templatesDir = await existingCanonicalDir(root, 'templates')
  if (!templatesDir) return
  const entries = await readdir(templatesDir)
  const jobs: { kind: 'player' | 'npc' | 'monster' | 'gear' | 'spell' | 'place' | 'shop' | 'faction'; dest: string; stock: string }[] = [
    { kind: 'player', dest: 'Player.md', stock: '# *Character Name*' },
    { kind: 'npc', dest: 'NPC.md', stock: '# *NPC Name*' },
    { kind: 'monster', dest: 'Monster.md', stock: '# Monster Name' },
    { kind: 'gear', dest: 'Gear.md', stock: '# Item Name' },
    { kind: 'spell', dest: 'Spell.md', stock: '# Spell Name' },
    { kind: 'place', dest: 'Place.md', stock: '# Place Name' },
    { kind: 'shop', dest: 'Shop.md', stock: '# Shop Name' },
    { kind: 'faction', dest: 'Faction.md', stock: '# Faction Name' }
  ]
  for (const job of jobs) {
    const wanted = new Set(TEMPLATE_FILE_NAMES[job.kind])
    const matches = entries.filter((name) => wanted.has(name.toLowerCase()))
    const dest = join(templatesDir, job.dest)
    const preferred = matches.find((name) => name.toLowerCase() === job.dest.toLowerCase())
    const currentPath = preferred
      ? join(templatesDir, preferred)
      : matches[0]
        ? join(templatesDir, matches[0])
        : null
    if (!currentPath) {
      await writeFile(dest, (await packTemplates(root))[job.kind], 'utf8')
      continue
    }
    const current = await readFile(currentPath, 'utf8')
    if (current.includes(job.stock)) {
      await writeFile(dest, (await packTemplates(root))[job.kind], 'utf8')
      if (currentPath !== dest) await unlink(currentPath)
    }
  }
}

export async function prepareCampaignFolder(root: string): Promise<void> {
  const hadCore = await campaignHasCoreFolders(root)
  await ensureCampaignLayout(root)
  await migrateRootOverviewToStartHere(root)
  if (!hadCore) await seedNewCampaignFiles(root)
  else {
    await refreshStockNightSheetTemplate(root)
    await refreshStockCreatureTemplates(root)
  }
}

export async function listSessions(dir: string): Promise<SessionFile[]> {
  if (!existsSync(dir)) return []
  const files = (await readdir(dir)).filter((f) => f.endsWith('.md')).sort().reverse()
  const folderName = basename(dir)
  return files.map((file) => ({
    relativePath: `${folderName}/${file}`.replaceAll('\\', '/'),
    name: file.replace(/\.md$/, '').replace(/[-_]/g, ' ')
  }))
}

export async function loadCampaign(folder: string): Promise<CampaignInfo> {
  const fallbackName = basename(folder)
  const campaign = await readJson<CampaignFile>(join(folder, 'campaign.json'), {})
  const name =
    campaign.name && campaign.name !== 'Untitled campaign' ? campaign.name : fallbackName
  const system = parseSystemId(campaign.system)
  const theme = parseThemeId(campaign.theme)
  if (campaign.name !== name || campaign.system !== system) {
    await writeJson(join(folder, 'campaign.json'), { ...campaign, name, system })
  }
  const loaded = await readJson<CombatState>(join(folder, 'combat.json'), emptyCombat())
  const combat: CombatState = { ...emptyCombat(), ...loaded, round: loaded.round ?? 0 }

  const media: MediaItem[] = []
  await collectMedia(folder, join(folder, 'media'), media)

  return {
    folder,
    name,
    system,
    theme,
    holoPortraits: holoPortraitsEnabled(theme, campaign.holoPortraits),
    digitalRain: digitalRainEnabled(theme, campaign.digitalRain),
    currencies: normalizeCurrencies(campaign.currencies),
    media,
    sessions: await listSessions(await findChildDir(folder, isSessionsFolderName, 'Sessions')),
    party: await listJsonCharacters(await findChildDir(folder, isPartyFolderName, 'Party')),
    npcs: await listJsonCharacters(await findChildDir(folder, isNpcFolderName, 'NPCs')),
    combat,
    tree: await listTree(folder, folder)
  }
}

export function uniqueFileName(dir: string, fileName: string): string {
  const ext = extname(fileName)
  const stem = ext ? fileName.slice(0, -ext.length) : fileName
  let candidate = fileName
  let n = 2
  while (existsSync(join(dir, candidate))) {
    candidate = `${stem} ${n}${ext}`
    n += 1
  }
  return candidate
}

export function toPosix(path: string): string {
  return path.replaceAll('\\', '/')
}
