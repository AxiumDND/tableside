import { app, BrowserWindow, dialog, ipcMain, net, protocol, screen, shell } from 'electron';
import { existsSync } from 'node:fs';
import { copyFile, cp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join, normalize, relative, basename, dirname, extname, isAbsolute } from 'node:path';
import { pathToFileURL } from 'node:url';
import type {
  AppSettings,
  CampaignInfo,
  CampaignTreeNode,
  Character,
  CombatState,
  DisplayInfo,
  MediaItem,
  PlayerState,
  SessionFile,
} from '../shared/types';
import { emptyCombat, emptyPlayerState, emptySettings } from '../shared/types';
import { APP_VERSION } from '../shared/version';
import {
  LIBRARY_FOLDER_NAMES,
  SKIP_DIR_NAMES,
  STANDARD_LAYOUT,
  canonicalFolder,
  folderOrderIndex,
  isHiddenCampaignFile,
  isNpcFolderName,
  isPartyFolderName,
  isSessionsFolderName,
  pathHasFolder,
  type CampaignLibraryFolder,
} from '../shared/campaignLayout';
import {
  FALLBACK_TEMPLATES,
  TEMPLATE_FILE_NAMES,
  fillTemplate,
  rewriteDuplicatedMarkdown,
  sanitizeFileName,
  type SheetTemplateKind,
} from '../shared/sheetTemplates';
import { loadWotcLibrary, openWotcFolder } from './wotcLibrary';
import { createLogger, initializeFileLogging } from './logger';
import { handleIpcError, safeFileOperation } from './errorHandler';
import { validateString, validatePath, validateObject, ValidationError } from './validation';

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'tabledm',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

const logger = createLogger('Main');

let dmWindow: BrowserWindow | null = null;
let playerWindow: BrowserWindow | null = null;
let campaignFolder: string | null = null;
let playerState: PlayerState = emptyPlayerState();
let settings: AppSettings = emptySettings();
let allowQuit = false;
let boundsTimer: ReturnType<typeof setTimeout> | null = null;

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.bmp']);
const FILE_MIME: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp',
};

function settingsPath(): string {
  return join(app.getPath('userData'), 'settings.json');
}

async function readSettings(): Promise<AppSettings> {
  try {
    return { ...emptySettings(), ...JSON.parse(await readFile(settingsPath(), 'utf8')) };
  } catch {
    return emptySettings();
  }
}

async function writeSettings(next: AppSettings): Promise<void> {
  settings = next;
  await mkdir(app.getPath('userData'), { recursive: true });
  await writeFile(settingsPath(), JSON.stringify(next, null, 2), 'utf8');
}

async function patchSettings(partial: AppSettings): Promise<AppSettings> {
  await writeSettings({ ...settings, ...partial });
  return settings;
}

function samePath(a: string, b: string): boolean {
  return normalize(a).toLowerCase() === normalize(b).toLowerCase();
}

function sampleSourcePath(): string {
  return app.isPackaged
    ? join(process.resourcesPath, 'examples', 'bad-blood')
    : join(__dirname, '../../examples/bad-blood');
}

function sampleWorkingPath(): string {
  return join(app.getPath('userData'), 'samples', 'bad-blood');
}

async function ensureSampleWorkingCopy(): Promise<string> {
  const source = sampleSourcePath();
  const dest = sampleWorkingPath();
  if (!existsSync(dest)) {
    await mkdir(dirname(dest), { recursive: true });
    await cp(source, dest, { recursive: true });
  }
  return dest;
}

function rendererUrl(hash: string): string {
  if (process.env.ELECTRON_RENDERER_URL) {
    return `${process.env.ELECTRON_RENDERER_URL}#/${hash}`;
  }
  return `${pathToFileURL(join(__dirname, '../renderer/index.html')).href}#/${hash}`;
}

function scheduleBoundsSave(): void {
  if (!dmWindow || dmWindow.isMaximized()) return;
  if (boundsTimer) clearTimeout(boundsTimer);
  boundsTimer = setTimeout(() => {
    if (!dmWindow) return;
    void patchSettings({ dmBounds: dmWindow.getBounds() });
  }, 400);
}

function createDmWindow(): void {
  const bounds = settings.dmBounds;
  dmWindow = new BrowserWindow({
    width: bounds?.width ?? 1480,
    height: bounds?.height ?? 920,
    x: bounds?.x,
    y: bounds?.y,
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
      plugins: true,
    },
  });

  dmWindow.on('ready-to-show', () => dmWindow?.show());
  dmWindow.on('moved', scheduleBoundsSave);
  dmWindow.on('resized', scheduleBoundsSave);
  dmWindow.on('close', (event) => {
    if (allowQuit) return;
    event.preventDefault();
    dmWindow?.webContents.send('app:will-close');
    setTimeout(() => {
      if (allowQuit || !dmWindow) return;
      allowQuit = true;
      dmWindow.close();
    }, 2000);
  });
  dmWindow.on('closed', () => {
    dmWindow = null;
    playerWindow?.close();
  });
  dmWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });
  dmWindow.loadURL(rendererUrl('dm'));
}

function playerBounds() {
  const displays = screen.getAllDisplays();
  const preferred = settings.playerDisplayId
    ? displays.find((d) => d.id === settings.playerDisplayId)
    : undefined;
  if (preferred) return preferred.bounds;
  const primary = screen.getPrimaryDisplay();
  const secondary = displays.find((d) => d.id !== primary.id);
  return (secondary ?? primary).bounds;
}

function createPlayerWindow(): void {
  const bounds = playerBounds();
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
      contextIsolation: true,
    },
  });

  if (screen.getAllDisplays().length === 1) {
    playerWindow.setBounds({ x: bounds.x + 80, y: bounds.y + 80, width: 1100, height: 700 });
  }

  playerWindow.on('closed', () => {
    playerWindow = null;
  });
  playerWindow.loadURL(rendererUrl('player'));
  playerWindow.webContents.on('did-finish-load', () => {
    playerWindow?.webContents.send('player:state', playerState);
  });
}

function sendPlayerState(): void {
  playerWindow?.webContents.send('player:state', playerState);
  dmWindow?.webContents.send('player:state', playerState);
}

function listDisplays(): DisplayInfo[] {
  const primaryId = screen.getPrimaryDisplay().id;
  return screen.getAllDisplays().map((d) => ({
    id: d.id,
    label: d.label,
    bounds: d.bounds,
    primary: d.id === primaryId,
  }));
}

function safeJoin(root: string, ...parts: string[]): string {
  // Check for absolute paths in parts (Windows: C:\, D:\, etc. or Unix: /)
  for (const part of parts) {
    if (isAbsolute(part)) {
      logger.warn('Attempted to join absolute path', { root, part });
      throw new ValidationError('Path parts cannot be absolute');
    }
  }

  const full = normalize(join(root, ...parts));
  const rel = relative(normalize(root), full);
  
  if (rel.startsWith('..') || isAbsolute(rel)) {
    logger.warn('Path traversal attempt blocked', { root, parts, rel });
    throw new ValidationError('Invalid path: traversal outside root not allowed');
  }
  
  return full;
}

async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

async function readJson<T>(path: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, JSON.stringify(value, null, 2), 'utf8');
}

async function listJsonCharacters(dir: string): Promise<Character[]> {
  if (!existsSync(dir)) return [];
  const files = (await readdir(dir)).filter((f) => f.endsWith('.json')).sort();
  const out: Character[] = [];
  for (const file of files) {
    const data = await readJson<Partial<Character>>(join(dir, file), {});
    if (!data.name) continue;
    out.push({
      id: data.id ?? file.replace(/\.json$/, ''),
      name: data.name,
      ac: Number(data.ac ?? 10),
      hp: Number(data.hp ?? data.maxHp ?? 10),
      maxHp: Number(data.maxHp ?? data.hp ?? 10),
      passivePerception: data.passivePerception,
      notes: data.notes,
      classLevel: data.classLevel,
    });
  }
  return out;
}

async function collectMedia(root: string, dir: string, acc: MediaItem[]): Promise<void> {
  if (!existsSync(dir)) return;
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      await collectMedia(root, full, acc);
      continue;
    }
    const ext = entry.name.slice(entry.name.lastIndexOf('.')).toLowerCase();
    if (!IMAGE_EXT.has(ext)) continue;
    const rel = relative(join(root, 'media'), full).replaceAll('\\', '/');
    acc.push({
      relativePath: rel,
      name: entry.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
      url: `tabledm://media/${rel.split('/').map(encodeURIComponent).join('/')}`,
    });
  }
}

function extOf(name: string): string {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i).toLowerCase() : '';
}

function sortNodes(nodes: CampaignTreeNode[]): CampaignTreeNode[] {
  return nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
    const ai = folderOrderIndex(a.name);
    const bi = folderOrderIndex(b.name);
    if (ai !== bi) return ai - bi;
    return a.name.localeCompare(b.name);
  });
}

async function listTree(root: string, dir: string, depth = 0): Promise<CampaignTreeNode[]> {
  if (depth > 6 || !existsSync(dir)) return [];
  const entries = await readdir(dir, { withFileTypes: true });
  const nodes: CampaignTreeNode[] = [];
  for (const entry of entries) {
    if (SKIP_DIR_NAMES.has(entry.name) || isHiddenCampaignFile(entry.name)) continue;
    const full = join(dir, entry.name);
    const relativePath = relative(root, full).replaceAll('\\', '/');
    if (entry.isDirectory()) {
      nodes.push({
        name: entry.name,
        relativePath,
        type: 'dir',
        children: await listTree(root, full, depth + 1),
      });
      continue;
    }
    nodes.push({
      name: entry.name,
      relativePath,
      type: 'file',
      ext: extOf(entry.name),
    });
  }
  return sortNodes(nodes);
}

async function findChildDir(
  root: string,
  match: (name: string) => boolean,
  fallback: string
): Promise<string> {
  if (!existsSync(root)) return join(root, fallback);
  const entries = await readdir(root, { withFileTypes: true });
  const found = entries.find((entry) => entry.isDirectory() && match(entry.name));
  return join(root, found?.name ?? fallback);
}

async function existingCanonicalDir(root: string, canonical: string): Promise<string | null> {
  if (!existsSync(root)) return null;
  const entries = await readdir(root, { withFileTypes: true });
  const found = entries.find(
    (entry) => entry.isDirectory() && canonicalFolder(entry.name) === canonical
  );
  return found ? join(root, found.name) : null;
}

async function campaignHasCoreFolders(root: string): Promise<boolean> {
  for (const key of ['sessions', 'party', 'npcs', 'bestiary']) {
    if (await existingCanonicalDir(root, key)) return true;
  }
  return false;
}

async function ensureCampaignLayout(root: string): Promise<void> {
  for (const item of STANDARD_LAYOUT) {
    const dir = (await existingCanonicalDir(root, item.canonical)) ?? join(root, item.name);
    await ensureDir(dir);
    for (const extra of item.extras) {
      await ensureDir(join(dir, extra));
    }
  }
}

async function seedNewCampaignFiles(root: string): Promise<void> {
  const title = basename(root);
  const overview = join(root, 'Overview.md');
  if (!existsSync(overview)) {
    await writeFile(
      overview,
      `# ${title}\n\nOpen **Sessions** for tonight's notes. Put portraits in each folder's **Art** subfolder.\n`,
      'utf8'
    );
  }
  const campaignPath = join(root, 'campaign.json');
  if (!existsSync(campaignPath)) {
    await writeJson(campaignPath, { name: title });
  }
  const templatesDir = (await existingCanonicalDir(root, 'templates')) ?? join(root, 'Templates');
  await ensureDir(templatesDir);
  const seeds: { file: string; kind: Exclude<SheetTemplateKind, 'blank'> }[] = [
    { file: 'Player.md', kind: 'player' },
    { file: 'NPC.md', kind: 'npc' },
    { file: 'Monster.md', kind: 'monster' },
    { file: 'Spell.md', kind: 'spell' },
    { file: 'Gear.md', kind: 'gear' },
  ];
  const existing = new Set((await readdir(templatesDir)).map((name) => name.toLowerCase()));
  for (const seed of seeds) {
    if (TEMPLATE_FILE_NAMES[seed.kind].some((name) => existing.has(name))) continue;
    await writeFile(join(templatesDir, seed.file), FALLBACK_TEMPLATES[seed.kind], 'utf8');
  }
}

async function prepareCampaignFolder(root: string): Promise<void> {
  const hadCore = await campaignHasCoreFolders(root);
  await ensureCampaignLayout(root);
  if (!hadCore) await seedNewCampaignFiles(root);
}

async function listSessions(dir: string): Promise<SessionFile[]> {
  if (!existsSync(dir)) return [];
  const files = (await readdir(dir))
    .filter((f) => f.endsWith('.md'))
    .sort()
    .reverse();
  const folderName = basename(dir);
  return files.map((file) => ({
    relativePath: `${folderName}/${file}`.replaceAll('\\', '/'),
    name: file.replace(/\.md$/, '').replace(/[-_]/g, ' '),
  }));
}

async function loadCampaign(folder: string): Promise<CampaignInfo> {
  const fallbackName = basename(folder);
  const campaign = await readJson<{ name?: string }>(join(folder, 'campaign.json'), {});
  const name =
    campaign.name && campaign.name !== 'Untitled campaign' ? campaign.name : fallbackName;
  if (campaign.name !== name) {
    await writeJson(join(folder, 'campaign.json'), { ...campaign, name });
  }
  const loaded = await readJson<CombatState>(join(folder, 'combat.json'), emptyCombat());
  const combat: CombatState = { ...emptyCombat(), ...loaded, round: loaded.round ?? 0 };

  const media: MediaItem[] = [];
  await collectMedia(folder, join(folder, 'media'), media);

  return {
    folder,
    name,
    media,
    sessions: await listSessions(await findChildDir(folder, isSessionsFolderName, 'Sessions')),
    party: await listJsonCharacters(await findChildDir(folder, isPartyFolderName, 'Party')),
    npcs: await listJsonCharacters(await findChildDir(folder, isNpcFolderName, 'NPCs')),
    combat,
    tree: await listTree(folder, folder),
  };
}

function uniqueFileName(dir: string, fileName: string): string {
  const ext = extname(fileName);
  const stem = ext ? fileName.slice(0, -ext.length) : fileName;
  let candidate = fileName;
  let n = 2;
  while (existsSync(join(dir, candidate))) {
    candidate = `${stem} ${n}${ext}`;
    n += 1;
  }
  return candidate;
}

function toPosix(path: string): string {
  return path.replaceAll('\\', '/');
}

async function findTemplateSource(
  root: string,
  kind: Exclude<SheetTemplateKind, 'blank'>
): Promise<string> {
  const wanted = new Set(TEMPLATE_FILE_NAMES[kind]);
  const walk = async (dir: string, depth: number): Promise<string | null> => {
    if (depth > 4 || !existsSync(dir)) return null;
    const entries = await readdir(dir, { withFileTypes: true });
    const inTemplates = /templates$/i.test(basename(dir));
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (SKIP_DIR_NAMES.has(entry.name)) continue;
        const found = await walk(full, depth + 1);
        if (found) return found;
        continue;
      }
      if (!inTemplates && !/templates/i.test(relative(root, full))) continue;
      if (wanted.has(entry.name.toLowerCase())) return readFile(full, 'utf8');
    }
    return null;
  };
  return (await walk(root, 0)) ?? FALLBACK_TEMPLATES[kind];
}

function noteFileName(folder: string, name: string, template: SheetTemplateKind): string {
  let stem = sanitizeFileName(name);
  stem = stem.replace(/\.md$/i, '');
  if (
    template === 'player' &&
    folder &&
    pathHasFolder(folder, 'party') &&
    !/^pc\s*[—–-]/i.test(stem)
  ) {
    stem = `PC — ${stem}`;
  }
  return `${stem}.md`;
}

async function findLayoutFolder(canonical: CampaignLibraryFolder): Promise<string> {
  const fallback = LIBRARY_FOLDER_NAMES[canonical];
  if (!campaignFolder) return fallback;
  const entries = await readdir(campaignFolder, { withFileTypes: true });
  const match = entries.find(
    (entry) => entry.isDirectory() && canonicalFolder(entry.name) === canonical
  );
  return match?.name ?? fallback;
}

async function saveToCampaignLibrary(
  folderKey: CampaignLibraryFolder,
  name: string,
  contents: string
): Promise<{ campaign: CampaignInfo; path: string; existed: boolean } | null> {
  if (!campaignFolder) return null;
  const body = contents.trim();
  if (!body) return null;
  const folder = await findLayoutFolder(folderKey);
  const destDir = safeJoin(campaignFolder, folder);
  await ensureDir(destDir);
  const template: SheetTemplateKind =
    folderKey === 'bestiary' ? 'monster' : folderKey === 'spells' ? 'spell' : 'gear';
  const fileName = noteFileName(folder, name, template);
  const dest = join(destDir, fileName);
  const relativePath = toPosix(relative(campaignFolder, dest));
  if (existsSync(dest)) {
    return { campaign: await loadCampaign(campaignFolder), path: relativePath, existed: true };
  }
  await writeFile(dest, body.endsWith('\n') ? body : `${body}\n`, 'utf8');
  return { campaign: await loadCampaign(campaignFolder), path: relativePath, existed: false };
}

async function createCampaignNote(
  folder: string,
  name: string,
  template: SheetTemplateKind
): Promise<{ campaign: CampaignInfo; path: string } | null> {
  if (!campaignFolder) return null;
  const destDir = folder ? safeJoin(campaignFolder, folder) : campaignFolder;
  await ensureDir(destDir);
  const fileName = uniqueFileName(destDir, noteFileName(folder, name, template));
  const dest = join(destDir, fileName);
  const title = sanitizeFileName(name).replace(/\.md$/i, '');
  let body = `# ${title.replace(/^pc\s*[—–-]\s*/i, '')}\n`;
  if (template !== 'blank') {
    body = fillTemplate(await findTemplateSource(campaignFolder, template), template, title);
  }
  await writeFile(dest, body, 'utf8');
  const relativePath = toPosix(relative(campaignFolder, dest));
  return { campaign: await loadCampaign(campaignFolder), path: relativePath };
}

async function duplicateCampaignFile(
  relativePath: string,
  name?: string
): Promise<{ campaign: CampaignInfo; path: string } | null> {
  if (!campaignFolder) return null;
  const source = safeJoin(campaignFolder, relativePath);
  if (!existsSync(source)) return null;
  const dir = dirname(source);
  const ext = extname(source);
  const stem = basename(source, ext);
  const wanted = name?.trim()
    ? sanitizeFileName(name).replace(/\.[^.]+$/, '') + ext
    : `${stem} copy${ext}`;
  const fileName = uniqueFileName(dir, wanted);
  const dest = join(dir, fileName);
  if (
    ext.toLowerCase() === '.md' ||
    ext.toLowerCase() === '.markdown' ||
    ext.toLowerCase() === '.txt'
  ) {
    const text = await readFile(source, 'utf8');
    await writeFile(dest, rewriteDuplicatedMarkdown(text, stem, basename(fileName, ext)), 'utf8');
  } else {
    await copyFile(source, dest);
  }
  return {
    campaign: await loadCampaign(campaignFolder),
    path: toPosix(relative(campaignFolder, dest)),
  };
}

async function addCampaignFiles(
  folder: string
): Promise<{ campaign: CampaignInfo; paths: string[] } | null> {
  if (!campaignFolder) return null;
  const result = await dialog.showOpenDialog({
    title: 'Add files to campaign',
    properties: ['openFile', 'multiSelections'],
    filters: [
      {
        name: 'Notes and art',
        extensions: ['md', 'markdown', 'txt', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'pdf'],
      },
      { name: 'All files', extensions: ['*'] },
    ],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const destDir = folder ? safeJoin(campaignFolder, folder) : campaignFolder;
  await ensureDir(destDir);
  const paths: string[] = [];
  for (const source of result.filePaths) {
    const fileName = uniqueFileName(destDir, sanitizeFileName(basename(source), basename(source)));
    const dest = join(destDir, fileName);
    await copyFile(source, dest);
    paths.push(toPosix(relative(campaignFolder, dest)));
  }
  return { campaign: await loadCampaign(campaignFolder), paths };
}

async function setCampaignFolder(folder: string | null): Promise<CampaignInfo | null> {
  campaignFolder = folder;
  await patchSettings({ campaignFolder: folder ?? undefined });
  if (!folder) {
    playerState = { ...emptyPlayerState() };
    sendPlayerState();
    return null;
  }
  await prepareCampaignFolder(folder);
  const info = await loadCampaign(folder);
  playerState = {
    ...playerState,
    campaignTitle: info.name,
  };
  sendPlayerState();
  return info;
}

function registerIpc(): void {
  ipcMain.handle('app:displays', () => listDisplays());

  ipcMain.handle('player:show-image', (_e, payload: { src: string; title: string }) => {
    playerState = { ...playerState, imageSrc: payload.src, imageTitle: payload.title };
    sendPlayerState();
    return playerState;
  });

  ipcMain.handle('player:clear', () => {
    playerState = { ...playerState, imageSrc: null, imageTitle: '' };
    sendPlayerState();
    return playerState;
  });

  ipcMain.handle(
    'player:set-initiative',
    (_e, payload: { entries: PlayerState['initiative']; show: boolean; round?: number }) => {
      playerState = {
        ...playerState,
        initiative: payload.entries ?? [],
        showInitiative: Boolean(payload.show),
        initiativeRound: Number(payload.round ?? 0),
      };
      sendPlayerState();
      return playerState;
    }
  );

  ipcMain.handle('player:get-state', () => playerState);

  ipcMain.handle('player:place-on-display', (_e, displayId: number) => {
    const display = screen.getAllDisplays().find((d) => d.id === displayId);
    if (!display || !playerWindow) return listDisplays();
    void patchSettings({ playerDisplayId: displayId });
    playerWindow.setBounds(display.bounds);
    playerWindow.setFullScreen(true);
    return listDisplays();
  });

  ipcMain.handle('app:get-settings', () => settings);

  ipcMain.handle('app:save-settings', async (_e, partial: unknown) => {
    try {
      validateObject(partial, 'settings');
      
      // Whitelist allowed settings keys
      const allowedKeys = [
        'campaignFolder',
        'lastOpenPath',
        'lastOpenKind',
        'dmWindowBounds',
        'playerWindowBounds'
      ] as const;
      
      const safePartial: Partial<AppSettings> = {};
      const partialObj = partial as Record<string, unknown>;

      for (const key of allowedKeys) {
        if (key in partialObj) {
          (safePartial as any)[key] = partialObj[key];
        }
      }
      
      return await patchSettings(safePartial);
    } catch (error) {
      return await handleIpcError(error, { operation: 'save settings' });
    }
  });

  ipcMain.on('app:confirm-close', () => {
    allowQuit = true;
    dmWindow?.close();
  });

  ipcMain.handle('campaign:pick-folder', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Open campaign folder',
      properties: ['openDirectory', 'createDirectory'],
    });
    if (result.canceled || !result.filePaths[0]) return null;
    return setCampaignFolder(result.filePaths[0]);
  });

  ipcMain.handle('campaign:new', async () => {
    const result = await dialog.showOpenDialog({
      title: 'New campaign folder',
      properties: ['openDirectory', 'createDirectory'],
    });
    if (result.canceled || !result.filePaths[0]) return null;
    await ensureCampaignLayout(result.filePaths[0]);
    await seedNewCampaignFiles(result.filePaths[0]);
    return setCampaignFolder(result.filePaths[0]);
  });

  ipcMain.handle('campaign:open-sample', async () =>
    setCampaignFolder(await ensureSampleWorkingCopy())
  );

  ipcMain.handle('campaign:get', async () => {
    if (!campaignFolder) return null;
    await prepareCampaignFolder(campaignFolder);
    return loadCampaign(campaignFolder);
  });

  ipcMain.handle('campaign:read-file', async (_e, relativePath: unknown) => {
    try {
      if (!campaignFolder) return '';
      
      const validPath = validatePath(relativePath, 'relativePath');
      const fullPath = safeJoin(campaignFolder, validPath);
      
      return await safeFileOperation(
        () => readFile(fullPath, 'utf8'),
        'read file',
        validPath
      );
    } catch (error) {
      return await handleIpcError(error, { operation: 'read file' });
    }
  });

  ipcMain.handle('campaign:save-file', async (_e, relativePath: unknown, markdown: unknown) => {
    try {
      if (!campaignFolder) return;
      
      const validPath = validatePath(relativePath, 'relativePath');
      const validMarkdown = validateString(markdown, 'markdown');
      const fullPath = safeJoin(campaignFolder, validPath);
      
      await safeFileOperation(
        () => writeFile(fullPath, validMarkdown, 'utf8'),
        'save file',
        validPath
      );
      
      logger.info('File saved', { path: validPath });
    } catch (error) {
      return await handleIpcError(error, { operation: 'save file' });
    }
  });

  ipcMain.handle('campaign:save-combat', async (_e, combat: unknown) => {
    try {
      if (!campaignFolder) return null;
      
      validateObject(combat, 'combat');
      
      await safeFileOperation(
        () => writeJson(join(campaignFolder!, 'combat.json'), combat),
        'save combat state'
      );
      
      logger.debug('Combat state saved');
      
      // Return just the combat state, not full campaign reload
      return combat;
    } catch (error) {
      return await handleIpcError(error, { operation: 'save combat' });
    }
  });

  ipcMain.handle(
    'campaign:create-note',
    async (_e, folder: string, name: string, template: SheetTemplateKind = 'blank') =>
      createCampaignNote(folder ?? '', name, template)
  );

  ipcMain.handle(
    'campaign:save-to-library',
    async (_e, folder: CampaignLibraryFolder, name: string, contents: string) =>
      saveToCampaignLibrary(folder, name, contents)
  );

  ipcMain.handle('campaign:duplicate-file', async (_e, relativePath: string, name?: string) =>
    duplicateCampaignFile(relativePath, name)
  );

  ipcMain.handle('campaign:add-files', async (_e, folder: string) =>
    addCampaignFiles(folder ?? '')
  );

  ipcMain.handle('wotc:load', () => loadWotcLibrary());
  ipcMain.handle('wotc:open-folder', () => openWotcFolder());
}

// Process-level error handlers
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', error);
  dialog.showErrorBox('Unexpected Error', `An unexpected error occurred:\n\n${error.message}`);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', reason as Error);
});

app.whenReady().then(async () => {
  // Initialize file logging
  await initializeFileLogging();
  logger.info('Table DM starting', { version: APP_VERSION });
  
  app.setAppUserModelId('com.tabledm.app');

  protocol.handle('tabledm', async (request) => {
    try {
      const url = new URL(request.url);
      if (!campaignFolder || (url.hostname !== 'media' && url.hostname !== 'file')) {
        return new Response('Not found', { status: 404 });
      }
      const fromQuery = url.searchParams.get('path');
      const rel = fromQuery ?? decodeURIComponent(url.pathname.replace(/^\//, ''));
      const full =
        url.hostname === 'media'
          ? safeJoin(campaignFolder, 'media', rel)
          : safeJoin(campaignFolder, rel);
      if (!existsSync(full)) return new Response('Not found', { status: 404 });
      const response = await net.fetch(pathToFileURL(full).href);
      const mime = FILE_MIME[extname(full).toLowerCase()];
      if (!mime) return response;
      const headers = new Headers(response.headers);
      headers.set('Content-Type', mime);
      headers.set('Content-Disposition', 'inline');
      return new Response(response.body, { status: response.status, headers });
    } catch {
      return new Response('Forbidden', { status: 403 });
    }
  });

  registerIpc();

  settings = await readSettings();
  if (settings.campaignFolder && existsSync(settings.campaignFolder)) {
    campaignFolder = samePath(settings.campaignFolder, sampleSourcePath())
      ? await ensureSampleWorkingCopy()
      : settings.campaignFolder;
    if (campaignFolder !== settings.campaignFolder) {
      await patchSettings({ campaignFolder });
    }
    const info = await loadCampaign(campaignFolder);
    playerState = {
      ...emptyPlayerState(),
      campaignTitle: info.name,
    };
  }

  createDmWindow();
  createPlayerWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createDmWindow();
      createPlayerWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
