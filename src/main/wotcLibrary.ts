import { app, shell } from 'electron';
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { WOTC_README, type WotcFile, type WotcLibrary } from '../shared/wotc';

const TEXT_EXT = new Set(['.txt', '.md', '.text']);

function userWotcPath(): string {
  return join(app.getPath('userData'), 'WOTC');
}

function nearbyRoots(): string[] {
  if (app.isPackaged) {
    return [join(process.resourcesPath, '..'), join(process.execPath, '..')];
  }
  return [process.cwd()];
}

function candidateFolders(): string[] {
  const names = ['WOTC', 'WOTC Files', 'WOTC FIles'];
  const found: string[] = [];
  for (const root of nearbyRoots()) {
    for (const name of names) {
      const folder = join(root, name);
      if (existsSync(folder)) found.push(folder);
    }
  }
  return found;
}

async function writeReadme(folder: string): Promise<void> {
  await writeFile(join(folder, 'README.txt'), WOTC_README, 'utf8');
}

async function migrateLegacyName(root: string): Promise<void> {
  const dest = join(root, 'WOTC');
  for (const legacy of ['WOTC FIles', 'WOTC Files']) {
    const from = join(root, legacy);
    if (!existsSync(from) || existsSync(dest)) continue;
    await rename(from, dest);
  }
}

export async function ensureWotcHome(): Promise<string> {
  const home = userWotcPath();
  await mkdir(home, { recursive: true });
  await writeReadme(home);
  for (const root of nearbyRoots()) {
    await migrateLegacyName(root).catch(() => undefined);
  }
  return home;
}

async function readFolderFiles(folder: string): Promise<WotcFile[]> {
  const entries = await readdir(folder, { withFileTypes: true });
  const files: WotcFile[] = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const lower = entry.name.toLowerCase();
    if (lower === 'readme.txt' || lower === 'readme.md') continue;
    const ext = lower.slice(lower.lastIndexOf('.'));
    if (!TEXT_EXT.has(ext)) continue;
    const text = await readFile(join(folder, entry.name), 'utf8');
    if (text.trim()) files.push({ name: entry.name, text });
  }
  return files;
}

async function preferredWotcFolder(): Promise<string> {
  await ensureWotcHome();
  for (const root of nearbyRoots()) {
    const folder = join(root, 'WOTC');
    if (existsSync(folder)) return folder;
  }
  return userWotcPath();
}

export async function loadWotcLibrary(): Promise<WotcLibrary> {
  const home = await preferredWotcFolder();
  const seen = new Set<string>();
  const files: WotcFile[] = [];
  for (const folder of [home, userWotcPath(), ...candidateFolders()]) {
    if (!existsSync(folder)) continue;
    for (const file of await readFolderFiles(folder)) {
      const key = file.name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      files.push(file);
    }
  }
  return { folder: home, files };
}

export async function openWotcFolder(): Promise<string> {
  const home = await preferredWotcFolder();
  await shell.openPath(home);
  return home;
}
