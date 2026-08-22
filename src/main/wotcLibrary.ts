import { app, shell } from 'electron'
import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { WOTC_README, type WotcFile, type WotcLibrary } from '../shared/wotc'

const TEXT_EXT = new Set(['.txt', '.md', '.text'])
const BOOKS_DIR = 'Additional Books'
const LEGACY_DIR_NAMES = ['WOTC', 'WOTC Files', 'WOTC FIles']

function userBooksPath(): string {
  return join(app.getPath('userData'), BOOKS_DIR)
}

function userLegacyWotcPath(): string {
  return join(app.getPath('userData'), 'WOTC')
}

function nearbyRoots(): string[] {
  if (app.isPackaged) {
    return [join(process.resourcesPath, '..'), join(process.execPath, '..')]
  }
  return [process.cwd()]
}

function candidateFolders(): string[] {
  const names = [BOOKS_DIR, ...LEGACY_DIR_NAMES]
  const found: string[] = []
  for (const root of nearbyRoots()) {
    for (const name of names) {
      const folder = join(root, name)
      if (existsSync(folder)) found.push(folder)
    }
  }
  const legacy = join(app.getPath('appData'), 'table-dm', 'WOTC')
  if (existsSync(legacy)) found.push(legacy)
  return found
}

async function writeReadme(folder: string): Promise<void> {
  await writeFile(join(folder, 'README.txt'), WOTC_README, 'utf8')
}

async function mergeLegacyFolder(from: string, dest: string): Promise<void> {
  if (!existsSync(from)) return
  if (!existsSync(dest)) {
    await rename(from, dest)
    return
  }
  await mkdir(dest, { recursive: true })
  for (const entry of await readdir(from, { withFileTypes: true })) {
    const src = join(from, entry.name)
    const target = join(dest, entry.name)
    if (existsSync(target)) continue
    await rename(src, target)
  }
  await rm(from, { recursive: true, force: true })
}

export async function ensureWotcHome(): Promise<string> {
  const home = userBooksPath()
  await mergeLegacyFolder(userLegacyWotcPath(), home)
  await mkdir(home, { recursive: true })
  await writeReadme(home)
  return home
}

async function readFolderFiles(folder: string): Promise<WotcFile[]> {
  const entries = await readdir(folder, { withFileTypes: true })
  const files: WotcFile[] = []
  for (const entry of entries) {
    if (!entry.isFile()) continue
    const lower = entry.name.toLowerCase()
    if (lower === 'readme.txt' || lower === 'readme.md') continue
    const ext = lower.slice(lower.lastIndexOf('.'))
    if (!TEXT_EXT.has(ext)) continue
    const text = await readFile(join(folder, entry.name), 'utf8')
    if (text.trim()) files.push({ name: entry.name, text })
  }
  return files
}

async function preferredWotcFolder(): Promise<string> {
  return ensureWotcHome()
}

export async function loadWotcLibrary(): Promise<WotcLibrary> {
  const home = await preferredWotcFolder()
  const seen = new Set<string>()
  const files: WotcFile[] = []
  for (const folder of [home, userLegacyWotcPath(), ...candidateFolders()]) {
    if (!existsSync(folder)) continue
    for (const file of await readFolderFiles(folder)) {
      const key = file.name.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      files.push(file)
    }
  }
  return { folder: home, files }
}

export async function openWotcFolder(): Promise<string> {
  const home = await preferredWotcFolder()
  await shell.openPath(home)
  return home
}
