import { app, BrowserWindow, dialog, ipcMain, net, protocol, screen, shell } from 'electron'
import { existsSync } from 'node:fs'
import { copyFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { join, normalize, relative, basename, dirname, extname } from 'node:path'
import { pathToFileURL } from 'node:url'
import type {
  CampaignInfo,
  CampaignTreeNode,
  Character,
  CombatState,
  DisplayInfo,
  MediaItem,
  PlayerState,
  SessionFile
} from '../shared/types'
import { emptyCombat, emptyPlayerState } from '../shared/types'
import { APP_VERSION } from '../shared/version'
import {
  SKIP_DIR_NAMES,
  folderOrderIndex,
  isBestiaryFolderName,
  isHiddenCampaignFile,
  pathHasFolder
} from '../shared/campaignLayout'
import {
  FALLBACK_TEMPLATES,
  TEMPLATE_FILE_NAMES,
  fillTemplate,
  rewriteDuplicatedMarkdown,
  sanitizeFileName,
  type SheetTemplateKind
} from '../shared/sheetTemplates'

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'tabledm',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true
    }
  }
])

let dmWindow: BrowserWindow | null = null
let playerWindow: BrowserWindow | null = null
let campaignFolder: string | null = null
let playerState: PlayerState = emptyPlayerState()

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.bmp'])
const FILE_MIME: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp'
}

function settingsPath(): string {
  return join(app.getPath('userData'), 'settings.json')
}

async function readSettings(): Promise<{ campaignFolder?: string }> {
  try {
    return JSON.parse(await readFile(settingsPath(), 'utf8'))
  } catch {
    return {}
  }
}

async function writeSettings(next: { campaignFolder?: string }): Promise<void> {
  await mkdir(app.getPath('userData'), { recursive: true })
  await writeFile(settingsPath(), JSON.stringify(next, null, 2), 'utf8')
}

function sampleCampaignPath(): string {
  return app.isPackaged
    ? join(process.resourcesPath, 'examples', 'bad-blood')
    : join(__dirname, '../../examples/bad-blood')
}

function rendererUrl(hash: string): string {
  if (process.env.ELECTRON_RENDERER_URL) {
    return `${process.env.ELECTRON_RENDERER_URL}#/${hash}`
  }
  return `${pathToFileURL(join(__dirname, '../renderer/index.html')).href}#/${hash}`
}

function createDmWindow(): void {
  dmWindow = new BrowserWindow({
    width: 1480,
    height: 920,
    minWidth: 1100,
    minHeight: 720,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#0e0c0a',
    title: `Table DM ${APP_VERSION}`,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      plugins: true
    }
  })

  dmWindow.on('ready-to-show', () => dmWindow?.show())
  dmWindow.on('closed', () => {
    dmWindow = null
    playerWindow?.close()
  })
  dmWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })
  dmWindow.loadURL(rendererUrl('dm'))
}

function playerBounds() {
  const displays = screen.getAllDisplays()
  const primary = screen.getPrimaryDisplay()
  const secondary = displays.find((d) => d.id !== primary.id)
  return (secondary ?? primary).bounds
}

function createPlayerWindow(): void {
  const bounds = playerBounds()
  playerWindow = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    frame: false,
    fullscreen: screen.getAllDisplays().length > 1,
    autoHideMenuBar: true,
    backgroundColor: '#050403',
    title: 'Table DM — Player',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  if (screen.getAllDisplays().length === 1) {
    playerWindow.setBounds({ x: bounds.x + 80, y: bounds.y + 80, width: 1100, height: 700 })
  }

  playerWindow.on('closed', () => {
    playerWindow = null
  })
  playerWindow.loadURL(rendererUrl('player'))
  playerWindow.webContents.on('did-finish-load', () => {
    playerWindow?.webContents.send('player:state', playerState)
  })
}

function sendPlayerState(): void {
  playerWindow?.webContents.send('player:state', playerState)
  dmWindow?.webContents.send('player:state', playerState)
}

function listDisplays(): DisplayInfo[] {
  const primaryId = screen.getPrimaryDisplay().id
  return screen.getAllDisplays().map((d) => ({
    id: d.id,
    label: d.label,
    bounds: d.bounds,
    primary: d.id === primaryId
  }))
}

function safeJoin(root: string, ...parts: string[]): string {
  const full = normalize(join(root, ...parts))
  const rel = relative(normalize(root), full)
  if (rel.startsWith('..')) {
    throw new Error('Invalid path')
  }
  return full
}

async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true })
}

async function readJson<T>(path: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as T
  } catch {
    return fallback
  }
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, JSON.stringify(value, null, 2), 'utf8')
}

async function listJsonCharacters(dir: string): Promise<Character[]> {
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

async function collectMedia(root: string, dir: string, acc: MediaItem[]): Promise<void> {
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

function extOf(name: string): string {
  const i = name.lastIndexOf('.')
  return i >= 0 ? name.slice(i).toLowerCase() : ''
}

function sortNodes(nodes: CampaignTreeNode[]): CampaignTreeNode[] {
  return nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1
    const ai = folderOrderIndex(a.name)
    const bi = folderOrderIndex(b.name)
    if (ai !== bi) return ai - bi
    return a.name.localeCompare(b.name)
  })
}

async function listTree(root: string, dir: string, depth = 0): Promise<CampaignTreeNode[]> {
  if (depth > 6 || !existsSync(dir)) return []
  const entries = await readdir(dir, { withFileTypes: true })
  const nodes: CampaignTreeNode[] = []
  for (const entry of entries) {
    if (SKIP_DIR_NAMES.has(entry.name) || isHiddenCampaignFile(entry.name)) continue
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

async function listSessions(dir: string): Promise<SessionFile[]> {
  if (!existsSync(dir)) return []
  const files = (await readdir(dir)).filter((f) => f.endsWith('.md')).sort().reverse()
  return files.map((file) => ({
    relativePath: file,
    name: file.replace(/\.md$/, '').replace(/[-_]/g, ' ')
  }))
}

async function loadCampaign(folder: string): Promise<CampaignInfo> {
  const fallbackName = basename(folder)
  const campaign = await readJson<{ name?: string }>(join(folder, 'campaign.json'), {})
  const name =
    campaign.name && campaign.name !== 'Untitled campaign' ? campaign.name : fallbackName
  if (campaign.name !== name) {
    await writeJson(join(folder, 'campaign.json'), { ...campaign, name })
  }
  const loaded = await readJson<CombatState>(join(folder, 'combat.json'), emptyCombat())
  const combat: CombatState = { ...emptyCombat(), ...loaded, round: loaded.round ?? 0 }

  const media: MediaItem[] = []
  await collectMedia(folder, join(folder, 'media'), media)

  return {
    folder,
    name,
    media,
    sessions: await listSessions(join(folder, 'sessions')),
    party: await listJsonCharacters(join(folder, 'party')),
    npcs: await listJsonCharacters(join(folder, 'npcs')),
    combat,
    tree: await listTree(folder, folder)
  }
}

function uniqueFileName(dir: string, fileName: string): string {
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

function toPosix(path: string): string {
  return path.replaceAll('\\', '/')
}

async function findTemplateSource(root: string, kind: Exclude<SheetTemplateKind, 'blank'>): Promise<string> {
  const wanted = new Set(TEMPLATE_FILE_NAMES[kind])
  const walk = async (dir: string, depth: number): Promise<string | null> => {
    if (depth > 4 || !existsSync(dir)) return null
    const entries = await readdir(dir, { withFileTypes: true })
    const inTemplates = /templates$/i.test(basename(dir))
    for (const entry of entries) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) {
        if (SKIP_DIR_NAMES.has(entry.name)) continue
        const found = await walk(full, depth + 1)
        if (found) return found
        continue
      }
      if (!inTemplates && !/templates/i.test(relative(root, full))) continue
      if (wanted.has(entry.name.toLowerCase())) return readFile(full, 'utf8')
    }
    return null
  }
  return (await walk(root, 0)) ?? FALLBACK_TEMPLATES[kind]
}

function noteFileName(folder: string, name: string, template: SheetTemplateKind): string {
  let stem = sanitizeFileName(name)
  stem = stem.replace(/\.md$/i, '')
  if (template === 'player' && folder && pathHasFolder(folder, 'party') && !/^pc\s*[—–-]/i.test(stem)) {
    stem = `PC — ${stem}`
  }
  return `${stem}.md`
}

async function findBestiaryFolder(): Promise<string> {
  if (!campaignFolder) return 'Bestiary'
  const entries = await readdir(campaignFolder, { withFileTypes: true })
  const match = entries.find((entry) => entry.isDirectory() && isBestiaryFolderName(entry.name))
  return match?.name ?? 'Bestiary'
}

async function saveToBestiary(
  name: string,
  contents: string
): Promise<{ campaign: CampaignInfo; path: string; existed: boolean } | null> {
  if (!campaignFolder) return null
  const body = contents.trim()
  if (!body) return null
  const folder = await findBestiaryFolder()
  const destDir = safeJoin(campaignFolder, folder)
  await ensureDir(destDir)
  const fileName = noteFileName(folder, name, 'monster')
  const dest = join(destDir, fileName)
  const relativePath = toPosix(relative(campaignFolder, dest))
  if (existsSync(dest)) {
    return { campaign: await loadCampaign(campaignFolder), path: relativePath, existed: true }
  }
  await writeFile(dest, body.endsWith('\n') ? body : `${body}\n`, 'utf8')
  return { campaign: await loadCampaign(campaignFolder), path: relativePath, existed: false }
}

async function createCampaignNote(
  folder: string,
  name: string,
  template: SheetTemplateKind
): Promise<{ campaign: CampaignInfo; path: string } | null> {
  if (!campaignFolder) return null
  const destDir = folder ? safeJoin(campaignFolder, folder) : campaignFolder
  await ensureDir(destDir)
  const fileName = uniqueFileName(destDir, noteFileName(folder, name, template))
  const dest = join(destDir, fileName)
  const title = sanitizeFileName(name).replace(/\.md$/i, '')
  let body = `# ${title.replace(/^pc\s*[—–-]\s*/i, '')}\n`
  if (template !== 'blank') {
    body = fillTemplate(await findTemplateSource(campaignFolder, template), template, title)
  }
  await writeFile(dest, body, 'utf8')
  const relativePath = toPosix(relative(campaignFolder, dest))
  return { campaign: await loadCampaign(campaignFolder), path: relativePath }
}

async function duplicateCampaignFile(
  relativePath: string,
  name?: string
): Promise<{ campaign: CampaignInfo; path: string } | null> {
  if (!campaignFolder) return null
  const source = safeJoin(campaignFolder, relativePath)
  if (!existsSync(source)) return null
  const dir = dirname(source)
  const ext = extname(source)
  const stem = basename(source, ext)
  const wanted = name?.trim()
    ? sanitizeFileName(name).replace(/\.[^.]+$/, '') + ext
    : `${stem} copy${ext}`
  const fileName = uniqueFileName(dir, wanted)
  const dest = join(dir, fileName)
  if (ext.toLowerCase() === '.md' || ext.toLowerCase() === '.markdown' || ext.toLowerCase() === '.txt') {
    const text = await readFile(source, 'utf8')
    await writeFile(dest, rewriteDuplicatedMarkdown(text, stem, basename(fileName, ext)), 'utf8')
  } else {
    await copyFile(source, dest)
  }
  return { campaign: await loadCampaign(campaignFolder), path: toPosix(relative(campaignFolder, dest)) }
}

async function addCampaignFiles(folder: string): Promise<{ campaign: CampaignInfo; paths: string[] } | null> {
  if (!campaignFolder) return null
  const result = await dialog.showOpenDialog(dmWindow ?? undefined, {
    title: 'Add files to campaign',
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Notes and art', extensions: ['md', 'markdown', 'txt', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'pdf'] },
      { name: 'All files', extensions: ['*'] }
    ]
  })
  if (result.canceled || result.filePaths.length === 0) return null
  const destDir = folder ? safeJoin(campaignFolder, folder) : campaignFolder
  await ensureDir(destDir)
  const paths: string[] = []
  for (const source of result.filePaths) {
    const fileName = uniqueFileName(destDir, sanitizeFileName(basename(source), basename(source)))
    const dest = join(destDir, fileName)
    await copyFile(source, dest)
    paths.push(toPosix(relative(campaignFolder, dest)))
  }
  return { campaign: await loadCampaign(campaignFolder), paths }
}

async function setCampaignFolder(folder: string | null): Promise<CampaignInfo | null> {
  campaignFolder = folder
  await writeSettings({ campaignFolder: folder ?? undefined })
  if (!folder) {
    playerState = { ...emptyPlayerState() }
    sendPlayerState()
    return null
  }
  const info = await loadCampaign(folder)
    playerState = {
      ...playerState,
      campaignTitle: info.name
    }
  sendPlayerState()
  return info
}

function registerIpc(): void {
  ipcMain.handle('app:displays', () => listDisplays())

  ipcMain.handle('player:show-image', (_e, payload: { src: string; title: string }) => {
    playerState = { ...playerState, imageSrc: payload.src, imageTitle: payload.title }
    sendPlayerState()
    return playerState
  })

  ipcMain.handle('player:clear', () => {
    playerState = { ...playerState, imageSrc: null, imageTitle: '' }
    sendPlayerState()
    return playerState
  })

  ipcMain.handle('player:set-initiative', (_e, entries: PlayerState['initiative'], show: boolean) => {
    playerState = { ...playerState, initiative: entries, showInitiative: show }
    sendPlayerState()
    return playerState
  })

  ipcMain.handle('player:get-state', () => playerState)

  ipcMain.handle('player:place-on-display', (_e, displayId: number) => {
    const display = screen.getAllDisplays().find((d) => d.id === displayId)
    if (!display || !playerWindow) return listDisplays()
    playerWindow.setBounds(display.bounds)
    playerWindow.setFullScreen(true)
    return listDisplays()
  })

  ipcMain.handle('campaign:pick-folder', async () => {
    const result = await dialog.showOpenDialog(dmWindow ?? undefined, {
      title: 'Open campaign folder',
      properties: ['openDirectory', 'createDirectory']
    })
    if (result.canceled || !result.filePaths[0]) return null
    return setCampaignFolder(result.filePaths[0])
  })

  ipcMain.handle('campaign:open-sample', async () => setCampaignFolder(sampleCampaignPath()))

  ipcMain.handle('campaign:get', async () => {
    if (!campaignFolder) return null
    return loadCampaign(campaignFolder)
  })

  ipcMain.handle('campaign:save-name', async (_e, name: string) => {
    if (!campaignFolder) return null
    await writeJson(join(campaignFolder, 'campaign.json'), { name })
    playerState = { ...playerState, campaignTitle: name }
    sendPlayerState()
    return loadCampaign(campaignFolder)
  })

  ipcMain.handle('campaign:read-file', async (_e, relativePath: string) => {
    if (!campaignFolder) return ''
    return readFile(safeJoin(campaignFolder, relativePath), 'utf8')
  })

  ipcMain.handle('campaign:save-file', async (_e, relativePath: string, markdown: string) => {
    if (!campaignFolder) return
    await writeFile(safeJoin(campaignFolder, relativePath), markdown, 'utf8')
  })

  ipcMain.handle('campaign:read-session', async (_e, relativePath: string) => {
    if (!campaignFolder) return ''
    const path = relativePath.includes('/') || relativePath.includes('\\')
      ? relativePath
      : join('sessions', relativePath)
    return readFile(safeJoin(campaignFolder, path), 'utf8')
  })

  ipcMain.handle('campaign:save-session', async (_e, relativePath: string, markdown: string) => {
    if (!campaignFolder) return
    const path = relativePath.includes('/') || relativePath.includes('\\')
      ? relativePath
      : join('sessions', relativePath)
    await writeFile(safeJoin(campaignFolder, path), markdown, 'utf8')
  })

  ipcMain.handle('campaign:save-character', async (_e, folder: 'party' | 'npcs', character: Character) => {
    if (!campaignFolder) return null
    await writeJson(safeJoin(campaignFolder, folder, `${character.id}.json`), character)
    return loadCampaign(campaignFolder)
  })

  ipcMain.handle('campaign:save-combat', async (_e, combat: CombatState) => {
    if (!campaignFolder) return null
    await writeJson(join(campaignFolder, 'combat.json'), combat)
    return loadCampaign(campaignFolder)
  })

  ipcMain.handle(
    'campaign:create-note',
    async (_e, folder: string, name: string, template: SheetTemplateKind = 'blank') =>
      createCampaignNote(folder ?? '', name, template)
  )

  ipcMain.handle('campaign:save-to-bestiary', async (_e, name: string, contents: string) =>
    saveToBestiary(name, contents)
  )

  ipcMain.handle('campaign:duplicate-file', async (_e, relativePath: string, name?: string) =>
    duplicateCampaignFile(relativePath, name)
  )

  ipcMain.handle('campaign:add-files', async (_e, folder: string) => addCampaignFiles(folder ?? ''))
}

app.whenReady().then(async () => {
  app.setAppUserModelId('com.tabledm.app')

  protocol.handle('tabledm', async (request) => {
    try {
      const url = new URL(request.url)
      if (!campaignFolder || (url.hostname !== 'media' && url.hostname !== 'file')) {
        return new Response('Not found', { status: 404 })
      }
      const fromQuery = url.searchParams.get('path')
      const rel = fromQuery ?? decodeURIComponent(url.pathname.replace(/^\//, ''))
      const full =
        url.hostname === 'media' ? safeJoin(campaignFolder, 'media', rel) : safeJoin(campaignFolder, rel)
      if (!existsSync(full)) return new Response('Not found', { status: 404 })
      const response = await net.fetch(pathToFileURL(full).href)
      const mime = FILE_MIME[extname(full).toLowerCase()]
      if (!mime) return response
      const headers = new Headers(response.headers)
      headers.set('Content-Type', mime)
      headers.set('Content-Disposition', 'inline')
      return new Response(response.body, { status: response.status, headers })
    } catch {
      return new Response('Forbidden', { status: 403 })
    }
  })

  registerIpc()

  const settings = await readSettings()
  if (settings.campaignFolder && existsSync(settings.campaignFolder)) {
    campaignFolder = settings.campaignFolder
    const info = await loadCampaign(campaignFolder)
    playerState = {
      ...emptyPlayerState(),
      campaignTitle: info.name
    }
  }

  createDmWindow()
  createPlayerWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createDmWindow()
      createPlayerWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
