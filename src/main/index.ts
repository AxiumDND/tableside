import { app, BrowserWindow, dialog, ipcMain, net, protocol, screen, shell } from 'electron'
import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { join, normalize, relative } from 'node:path'
import { pathToFileURL } from 'node:url'
import type {
  CampaignInfo,
  Character,
  CombatState,
  DisplayInfo,
  MediaItem,
  PlayerState,
  SessionFile
} from '../shared/types'
import { emptyCombat, emptyPlayerState } from '../shared/types'

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
    ? join(process.resourcesPath, 'examples', 'sample-campaign')
    : join(__dirname, '../../examples/sample-campaign')
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
    title: 'Table DM',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
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

async function listSessions(dir: string): Promise<SessionFile[]> {
  if (!existsSync(dir)) return []
  const files = (await readdir(dir)).filter((f) => f.endsWith('.md')).sort().reverse()
  return files.map((file) => ({
    relativePath: file,
    name: file.replace(/\.md$/, '').replace(/[-_]/g, ' ')
  }))
}

async function loadCampaign(folder: string): Promise<CampaignInfo> {
  await Promise.all([
    ensureDir(join(folder, 'party')),
    ensureDir(join(folder, 'npcs')),
    ensureDir(join(folder, 'sessions')),
    ensureDir(join(folder, 'media'))
  ])

  const campaign = await readJson<{ name?: string }>(join(folder, 'campaign.json'), {})
  if (!campaign.name) {
    await writeJson(join(folder, 'campaign.json'), { name: 'Untitled campaign' })
  }
  const combat = await readJson<CombatState>(join(folder, 'combat.json'), emptyCombat())

  const media: MediaItem[] = []
  await collectMedia(folder, join(folder, 'media'), media)

  return {
    folder,
    name: campaign.name ?? 'Untitled campaign',
    media,
    sessions: await listSessions(join(folder, 'sessions')),
    party: await listJsonCharacters(join(folder, 'party')),
    npcs: await listJsonCharacters(join(folder, 'npcs')),
    combat
  }
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
    campaignTitle: info.name,
    initiative: info.combat.showOrderToPlayers
      ? [...info.combat.combatants]
          .sort((a, b) => b.initiative - a.initiative)
          .map((c) => ({ id: c.id, name: c.name, active: c.id === info.combat.activeId }))
      : [],
    showInitiative: info.combat.showOrderToPlayers && info.combat.combatants.length > 0
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

  ipcMain.handle('campaign:read-session', async (_e, relativePath: string) => {
    if (!campaignFolder) return ''
    return readFile(safeJoin(campaignFolder, 'sessions', relativePath), 'utf8')
  })

  ipcMain.handle('campaign:save-session', async (_e, relativePath: string, markdown: string) => {
    if (!campaignFolder) return
    await writeFile(safeJoin(campaignFolder, 'sessions', relativePath), markdown, 'utf8')
  })

  ipcMain.handle('campaign:save-character', async (_e, folder: 'party' | 'npcs', character: Character) => {
    if (!campaignFolder) return null
    await writeJson(safeJoin(campaignFolder, folder, `${character.id}.json`), character)
    return loadCampaign(campaignFolder)
  })

  ipcMain.handle('campaign:save-combat', async (_e, combat: CombatState) => {
    if (!campaignFolder) return null
    await writeJson(join(campaignFolder, 'combat.json'), combat)
    const sorted = [...combat.combatants].sort((a, b) => b.initiative - a.initiative)
    playerState = {
      ...playerState,
      initiative: sorted.map((c) => ({ id: c.id, name: c.name, active: c.id === combat.activeId })),
      showInitiative: combat.showOrderToPlayers && combat.combatants.length > 0
    }
    sendPlayerState()
    return loadCampaign(campaignFolder)
  })
}

app.whenReady().then(async () => {
  app.setAppUserModelId('com.tabledm.app')

  protocol.handle('tabledm', async (request) => {
    try {
      const url = new URL(request.url)
      if (url.hostname !== 'media' || !campaignFolder) {
        return new Response('Not found', { status: 404 })
      }
      const rel = decodeURIComponent(url.pathname.replace(/^\//, ''))
      const full = safeJoin(campaignFolder, 'media', rel)
      if (!existsSync(full)) return new Response('Not found', { status: 404 })
      return net.fetch(pathToFileURL(full).href)
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
