import { app, net, protocol } from 'electron'
import { existsSync, readdirSync } from 'node:fs'
import { extname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { IMAGE_EXT } from '../shared/imageExt'

export { IMAGE_EXT }

const FILE_MIME: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
  '.flac': 'audio/flac',
  '.aac': 'audio/aac',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.m4v': 'video/mp4'
}

let srdPortraitCache: Map<string, string> | null = null
let srdItemCache: Map<string, string> | null = null
let srdSchoolCache: Map<string, string> | null = null
let stockArtCache: Map<string, string> | null = null
let npcPortraitCache: Map<string, string> | null = null

function foldPortraitStem(name: string): string {
  return name
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[—–−]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/\.[^.]+$/, '')
    .trim()
}

function srdPortraitsDir(): string {
  return app.isPackaged
    ? join(process.resourcesPath, 'srd-portraits')
    : join(__dirname, '../../resources/srd-portraits')
}

function srdItemsDir(): string {
  return app.isPackaged
    ? join(process.resourcesPath, 'srd-items')
    : join(__dirname, '../../resources/srd-items')
}

function srdSchoolsDir(): string {
  return app.isPackaged
    ? join(process.resourcesPath, 'srd-schools')
    : join(__dirname, '../../resources/srd-schools')
}

function stockArtDir(): string {
  return app.isPackaged
    ? join(process.resourcesPath, 'stock-art')
    : join(__dirname, '../../resources/stock-art')
}

function npcPortraitsDir(): string {
  return app.isPackaged
    ? join(process.resourcesPath, 'npc-portraits')
    : join(__dirname, '../../resources/npc-portraits')
}

function loadSrdImageCache(cache: Map<string, string> | null, dir: string): Map<string, string> {
  if (cache) return cache
  const next = new Map<string, string>()
  if (!existsSync(dir)) return next
  for (const name of readdirSync(dir)) {
    const ext = extname(name).toLowerCase()
    if (!IMAGE_EXT.has(ext)) continue
    next.set(foldPortraitStem(name), join(dir, name))
  }
  return next
}

function mergeImageDir(into: Map<string, string>, dir: string): void {
  if (!existsSync(dir)) return
  for (const [key, path] of loadSrdImageCache(null, dir)) {
    if (!into.has(key)) into.set(key, path)
  }
}

function loadSrdPortraitCache(): Map<string, string> {
  if (srdPortraitCache) return srdPortraitCache
  const next = new Map<string, string>()
  mergeImageDir(next, srdPortraitsDir())
  mergeImageDir(next, join(__dirname, '../../resources/local-portraits'))
  mergeImageDir(next, join(app.getPath('userData'), 'portraits'))
  srdPortraitCache = next
  return srdPortraitCache
}

function loadSrdItemCache(): Map<string, string> {
  if (!srdItemCache) srdItemCache = loadSrdImageCache(srdItemCache, srdItemsDir())
  return srdItemCache
}

function loadSrdSchoolCache(): Map<string, string> {
  if (!srdSchoolCache) srdSchoolCache = loadSrdImageCache(srdSchoolCache, srdSchoolsDir())
  return srdSchoolCache
}

function loadStockArtCache(): Map<string, string> {
  if (!stockArtCache) stockArtCache = loadSrdImageCache(stockArtCache, stockArtDir())
  return stockArtCache
}

export function findSrdPortraitFile(name: string): string | null {
  if (!name.trim()) return null
  return loadSrdPortraitCache().get(foldPortraitStem(name)) ?? null
}

export function findSrdItemFile(name: string): string | null {
  if (!name.trim()) return null
  return loadSrdItemCache().get(foldPortraitStem(name)) ?? null
}

export function findSrdSchoolFile(name: string): string | null {
  if (!name.trim()) return null
  return loadSrdSchoolCache().get(foldPortraitStem(name)) ?? null
}

export function findStockArtFile(name: string): string | null {
  if (!name.trim()) return null
  return loadStockArtCache().get(foldPortraitStem(name)) ?? null
}

function loadNpcPortraitCache(): Map<string, string> {
  if (npcPortraitCache) return npcPortraitCache
  const next = new Map<string, string>()
  const root = npcPortraitsDir()
  if (!existsSync(root)) {
    npcPortraitCache = next
    return next
  }
  for (const race of readdirSync(root, { withFileTypes: true })) {
    if (!race.isDirectory()) continue
    const raceDir = join(root, race.name)
    for (const gender of readdirSync(raceDir, { withFileTypes: true })) {
      if (!gender.isDirectory()) continue
      const genderDir = join(raceDir, gender.name)
      for (const file of readdirSync(genderDir)) {
        const ext = extname(file).toLowerCase()
        if (!IMAGE_EXT.has(ext)) continue
        const stem = file.slice(0, -ext.length)
        next.set(`${race.name}/${gender.name}/${stem}`, join(genderDir, file))
      }
    }
  }
  npcPortraitCache = next
  return next
}

export function findNpcPortraitFile(race: string, gender: string, id: string): string | null {
  const stem = id.trim().padStart(2, '0')
  if (!race.trim() || !gender.trim() || !stem) return null
  return loadNpcPortraitCache().get(`${race}/${gender}/${stem}`) ?? null
}

/**
 * Register the app's `tabledm://` protocol, which serves bundled SRD/stock
 * artwork and — for `media`/`file` hosts — images and files from inside the
 * open campaign folder. Campaign-folder access is injected so this module
 * stays free of the main process's mutable state.
 */
export function registerMediaProtocol(deps: {
  getCampaignFolder: () => string | null
  safeJoin: (root: string, ...parts: string[]) => string
}): void {
  const { getCampaignFolder, safeJoin } = deps
  protocol.handle('tabledm', async (request) => {
    try {
      const url = new URL(request.url)
      if (
        url.hostname === 'srd-portrait' ||
        url.hostname === 'srd-item' ||
        url.hostname === 'srd-school' ||
        url.hostname === 'stock-art' ||
        url.hostname === 'npc-portrait'
      ) {
        const name = url.searchParams.get('name') ?? ''
        const full =
          url.hostname === 'npc-portrait'
            ? findNpcPortraitFile(
                url.searchParams.get('race') ?? '',
                url.searchParams.get('gender') ?? '',
                url.searchParams.get('id') ?? ''
              )
            : url.hostname === 'srd-item'
            ? findSrdItemFile(name)
            : url.hostname === 'srd-school'
              ? findSrdSchoolFile(name)
              : url.hostname === 'stock-art'
                ? findStockArtFile(name)
                : findSrdPortraitFile(name)
        if (!full) return new Response('Not found', { status: 404 })
        const response = await net.fetch(pathToFileURL(full).href)
        const mime = FILE_MIME[extname(full).toLowerCase()]
        if (!mime) return response
        const headers = new Headers(response.headers)
        headers.set('Content-Type', mime)
        headers.set('Content-Disposition', 'inline')
        return new Response(response.body, { status: response.status, headers })
      }
      const campaignFolder = getCampaignFolder()
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
}
