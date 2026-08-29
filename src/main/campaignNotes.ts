import { existsSync } from 'node:fs'
import { copyFile, readdir, readFile, stat, unlink, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, join, relative } from 'node:path'
import type { OpenDialogOptions, OpenDialogReturnValue } from 'electron'
import type { CampaignInfo, CreateNoteMapImage } from '../shared/types'
import {
  LIBRARY_FOLDER_NAMES,
  artFolderRelativePath,
  folderMatchesCanonical,
  isArtFolderName,
  pathHasFolder,
  shouldSkipCampaignDir,
  type CampaignLibraryFolder
} from '../shared/campaignLayout'
import {
  TEMPLATE_FILE_NAMES,
  displayTitle,
  fillTemplate,
  gameNightSheetFileStem,
  rewriteDuplicatedMarkdown,
  sanitizeFileName,
  type SheetTemplateKind
} from '../shared/sheetTemplates'
import { getSystemPack } from '../shared/systemPack'
import { setSheetPortraitEmbed, sheetAcceptsPortrait } from '../shared/sheetPortrait'
import { matchStockArt } from '../shared/stockArt'
import { mapArtRelativeFolder, setMapFenceImage } from '../shared/mapCreate'
import {
  applyShopInventory,
  generateShopInventory,
  looksLikeShopNote,
  resolveShopCatalog,
  setShopTypeFields
} from '../shared/shopStock'
import {
  IMAGE_EXT,
  findSrdItemFile,
  findSrdPortraitFile,
  findSrdSchoolFile,
  findStockArtFile
} from './mediaAssets'
import {
  ensureDir,
  listPartyNoteStems,
  loadCampaign,
  packTemplates,
  readCampaignSystem,
  readJson,
  refreshStockNightSheetTemplate,
  safeJoin,
  toPosix,
  uniqueFileName
} from './campaignFolder'

export type CampaignNotesDeps = {
  getCampaignFolder: () => string | null
  samePath: (a: string, b: string) => boolean
  openFiles: (options: OpenDialogOptions) => Promise<OpenDialogReturnValue>
  onCampaignFilesChanged: () => Promise<void>
}

let deps: CampaignNotesDeps = {
  getCampaignFolder: () => null,
  samePath: () => false,
  openFiles: async () => ({ canceled: true, filePaths: [] }),
  onCampaignFilesChanged: async () => undefined
}

export function configureCampaignNotes(next: CampaignNotesDeps): void {
  deps = next
}

function getFolder(): string | null {
  return deps.getCampaignFolder()
}

export async function copyImageToArtFolder(
  noteFolder: string,
  title: string,
  choice: CreateNoteMapImage
): Promise<string | null> {
  const campaignFolder = getFolder()
  if (!campaignFolder) return null
  const source =
    choice.kind === 'existing'
      ? safeJoin(campaignFolder, toPosix(choice.path).replace(/^\/+/, ''))
      : choice.kind === 'stock'
        ? findStockArtFile(choice.id)
        : choice.filePath
  if (!source) return null
  const ext = extname(source).toLowerCase()
  if (!existsSync(source) || !IMAGE_EXT.has(ext)) return null
  const artRel = artFolderRelativePath(noteFolder)
  const artDir = safeJoin(campaignFolder, artRel)
  await ensureDir(artDir)
  const destName = `${sanitizeFileName(displayTitle(title))}${ext}`
  const dest = join(artDir, destName)
  if (!deps.samePath(source, dest)) await copyFile(source, dest)
  return destName
}

export async function setNotePortrait(
  relativePath: string,
  image: CreateNoteMapImage
): Promise<{ campaign: CampaignInfo; path: string; markdown: string } | null> {
  const campaignFolder = getFolder()
  if (!campaignFolder) return null
  const dest = safeJoin(campaignFolder, relativePath)
  if (!existsSync(dest)) return null
  const folder = toPosix(relative(campaignFolder, dirname(dest)))
  const stem = displayTitle(basename(dest, extname(dest)))
  const imageFile = await copyImageToArtFolder(folder, stem, image)
  if (!imageFile) return null
  let markdown = setSheetPortraitEmbed(await readFile(dest, 'utf8'), imageFile)
  if (image.kind === 'stock' && looksLikeShopNote(markdown) && getSystemPack(await readCampaignSystem(campaignFolder)).shopsEnabled) {
    const catalog = resolveShopCatalog(image.id)
    markdown = setShopTypeFields(markdown, catalog, false)
  }
  await writeFile(dest, markdown, 'utf8')
  return { campaign: await loadCampaign(campaignFolder), path: toPosix(relative(campaignFolder, dest)), markdown }
}

export async function resolveCreateMapImage(
  noteFolder: string,
  title: string,
  choice: CreateNoteMapImage
): Promise<string | null> {
  const campaignFolder = getFolder()
  if (!campaignFolder) return null
  if (choice.kind === 'existing') {
    const rel = toPosix(choice.path).replace(/^\/+/, '')
    return rel || null
  }
  const source = choice.kind === 'stock' ? findStockArtFile(choice.id) : choice.filePath
  if (!source) return null
  const ext = extname(source).toLowerCase()
  if (!existsSync(source) || !IMAGE_EXT.has(ext)) return null
  const artRel = mapArtRelativeFolder(noteFolder)
  const artDir = safeJoin(campaignFolder, artRel)
  await ensureDir(artDir)
  const destName = uniqueFileName(artDir, `${sanitizeFileName(title)}${ext}`)
  await copyFile(source, join(artDir, destName))
  return destName
}

export async function findTemplateSource(root: string, kind: Exclude<SheetTemplateKind, 'blank'>): Promise<string> {
  const wanted = new Set(TEMPLATE_FILE_NAMES[kind])
  const walk = async (dir: string, depth: number): Promise<string | null> => {
    if (depth > 4 || !existsSync(dir)) return null
    const entries = await readdir(dir, { withFileTypes: true })
    const inTemplates = /templates$/i.test(basename(dir))
    for (const entry of entries) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) {
        if (shouldSkipCampaignDir(entry.name)) continue
        const found = await walk(full, depth + 1)
        if (found) return found
        continue
      }
      if (!inTemplates && !/templates/i.test(relative(root, full))) continue
      if (wanted.has(entry.name.toLowerCase())) return readFile(full, 'utf8')
    }
    return null
  }
  return (await walk(root, 0)) ?? (await packTemplates(root))[kind]
}

export function noteFileName(folder: string, name: string, template: SheetTemplateKind): string {
  let stem = sanitizeFileName(name)
  stem = stem.replace(/\.md$/i, '')
  if (template === 'player' && folder && pathHasFolder(folder, 'party') && !/^pc\s*[—–-]/i.test(stem)) {
    stem = `PC — ${stem}`
  }
  if (template === 'nightsheet') stem = gameNightSheetFileStem(stem)
  return `${stem}.md`
}

export async function findLayoutFolder(canonical: CampaignLibraryFolder): Promise<string> {
  const fallback = LIBRARY_FOLDER_NAMES[canonical]
  const campaignFolder = getFolder()
  if (!campaignFolder) return fallback
  const entries = await readdir(campaignFolder, { withFileTypes: true })
  const match = entries.find((entry) => entry.isDirectory() && folderMatchesCanonical(entry.name, canonical))
  return match?.name ?? fallback
}

export async function saveToCampaignLibrary(
  folderKey: CampaignLibraryFolder,
  name: string,
  contents: string,
  subfolder?: string | null
): Promise<{ campaign: CampaignInfo; path: string; existed: boolean } | null> {
  const campaignFolder = getFolder()
  if (!campaignFolder) return null
  const body = contents.trim()
  if (!body) return null
  const folder = await findLayoutFolder(folderKey)
  const destDir = subfolder
    ? safeJoin(campaignFolder, folder, subfolder)
    : safeJoin(campaignFolder, folder)
  await ensureDir(destDir)
  const template: SheetTemplateKind =
    folderKey === 'bestiary' ? 'monster' : folderKey === 'spells' ? 'spell' : 'gear'
  const fileName = noteFileName(folder, name, template)
  const dest = join(destDir, fileName)
  const relativePath = toPosix(relative(campaignFolder, dest))
  if (existsSync(dest)) {
    return { campaign: await loadCampaign(campaignFolder), path: relativePath, existed: true }
  }
  await writeFile(dest, body.endsWith('\n') ? body : `${body}\n`, 'utf8')
  if (folderKey === 'bestiary') await copySrdArtToFolder(name, destDir, 'portrait')
  if (folderKey === 'gear') await copySrdArtToFolder(name, destDir, 'item')
  if (folderKey === 'spells') {
    const school = schoolFromSpellMarkdown(body)
    if (school) await copySrdArtToFolder(school, destDir, 'school')
  }
  return { campaign: await loadCampaign(campaignFolder), path: relativePath, existed: false }
}

export async function copySrdArtToFolder(
  name: string,
  noteDir: string,
  kind: 'portrait' | 'item' | 'school'
): Promise<void> {
  const source =
    kind === 'item' ? findSrdItemFile(name) : kind === 'school' ? findSrdSchoolFile(name) : findSrdPortraitFile(name)
  if (!source || !getFolder()) return
  const artDir = join(noteDir, 'Art')
  await ensureDir(artDir)
  const destName = `${sanitizeFileName(name)}${extname(source)}`
  const dest = join(artDir, destName)
  if (existsSync(dest)) return
  await copyFile(source, dest)
}

export function schoolFromSpellMarkdown(contents: string): string | null {
  const match = contents.match(
    /\b(Abjuration|Conjuration|Divination|Enchantment|Evocation|Illusion|Necromancy|Transmutation)\b/i
  )
  if (!match) return null
  const school = match[1]
  return school.charAt(0).toUpperCase() + school.slice(1).toLowerCase()
}

export async function createCampaignNote(
  folder: string,
  name: string,
  template: SheetTemplateKind,
  mapImage?: CreateNoteMapImage | null
): Promise<{ campaign: CampaignInfo; path: string } | null> {
  const campaignFolder = getFolder()
  if (!campaignFolder) return null
  const destDir = folder ? safeJoin(campaignFolder, folder) : campaignFolder
  await ensureDir(destDir)
  const fileName = uniqueFileName(destDir, noteFileName(folder, name, template))
  const dest = join(destDir, fileName)
  const title = sanitizeFileName(name).replace(/\.md$/i, '')
  let body = `# ${title.replace(/^pc\s*[—–-]\s*/i, '')}\n`
  if (template !== 'blank') {
    if (template === 'nightsheet') await refreshStockNightSheetTemplate(campaignFolder)
    const extras =
      template === 'nightsheet'
        ? {
            partyStems: await listPartyNoteStems(campaignFolder),
            theme: (await readJson<{ theme?: string }>(join(campaignFolder, 'campaign.json'), {})).theme
          }
        : undefined
    body = fillTemplate(await findTemplateSource(campaignFolder, template), template, title, extras)
  }
  if (template === 'map' && mapImage) {
    const imageFile = await resolveCreateMapImage(folder, title.replace(/^pc\s*[—–-]\s*/i, ''), mapImage)
    if (imageFile) body = setMapFenceImage(body, imageFile)
  }
  let artChoice = mapImage
  if (
    !artChoice &&
    (template === 'place' || template === 'shop' || template === 'faction')
  ) {
    const hit = matchStockArt(
      title,
      template === 'faction' ? 'faction' : template === 'shop' ? 'shop' : 'place'
    )
    if (hit) artChoice = { kind: 'stock', id: hit.id }
  }
  if (sheetAcceptsPortrait(template) && artChoice) {
    const imageFile = await copyImageToArtFolder(folder, displayTitle(basename(fileName, '.md')), artChoice)
    if (imageFile) body = setSheetPortraitEmbed(body, imageFile)
  }
  const pack = getSystemPack(await readCampaignSystem(campaignFolder))
  if (template === 'shop' && pack.shopsEnabled) {
    const typeId =
      artChoice?.kind === 'stock' ? artChoice.id : (matchStockArt(title, 'shop')?.id ?? 'General Store')
    body = applyShopInventory(body, generateShopInventory(typeId))
  }
  await writeFile(dest, body, 'utf8')
  if (pack.id === 'dnd5e' && template === 'monster') {
    await copySrdArtToFolder(title.replace(/^pc\s*[—–-]\s*/i, ''), destDir, 'portrait')
  }
  if (pack.id === 'dnd5e' && template === 'gear') {
    await copySrdArtToFolder(title.replace(/^pc\s*[—–-]\s*/i, ''), destDir, 'item')
  }
  const relativePath = toPosix(relative(campaignFolder, dest))
  return { campaign: await loadCampaign(campaignFolder), path: relativePath }
}

export async function duplicateCampaignFile(
  relativePath: string,
  name?: string
): Promise<{ campaign: CampaignInfo; path: string } | null> {
  const campaignFolder = getFolder()
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

export async function addCampaignFiles(
  folder: string,
  mode: 'files' | 'art' = 'files'
): Promise<{ campaign: CampaignInfo; paths: string[] } | null> {
  const campaignFolder = getFolder()
  if (!campaignFolder) return null
  const destRel = mode === 'art' ? artFolderRelativePath(folder) : folder.replaceAll('\\', '/')
  const imagesOnly = mode === 'art' || isArtFolderName(basename(destRel || '.'))
  const result = await deps.openFiles({
    title: imagesOnly ? 'Add art' : 'Add files to campaign',
    properties: ['openFile', 'multiSelections'],
    filters: imagesOnly
      ? [
          { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'] },
          { name: 'All files', extensions: ['*'] }
        ]
      : [
          {
            name: 'Notes, art, and audio',
            extensions: [
              'md',
              'markdown',
              'txt',
              'png',
              'jpg',
              'jpeg',
              'webp',
              'gif',
              'pdf',
              'mp3',
              'ogg',
              'wav',
              'm4a',
              'flac',
              'webm',
              'aac',
              'mp4',
              'mov',
              'm4v'
            ]
          },
          { name: 'Audio', extensions: ['mp3', 'ogg', 'wav', 'm4a', 'flac', 'webm', 'aac'] },
          { name: 'All files', extensions: ['*'] }
        ]
  })
  if (result.canceled || result.filePaths.length === 0) return null
  const destDir = destRel ? safeJoin(campaignFolder, destRel) : campaignFolder
  await ensureDir(destDir)
  const paths: string[] = []
  for (const source of result.filePaths) {
    const fileName = uniqueFileName(destDir, sanitizeFileName(basename(source), basename(source)))
    const dest = join(destDir, fileName)
    await copyFile(source, dest)
    paths.push(toPosix(relative(campaignFolder, dest)))
  }
  await deps.onCampaignFilesChanged()
  return { campaign: await loadCampaign(campaignFolder), paths }
}

export async function deleteCampaignFile(
  relativePath: string
): Promise<{ campaign: CampaignInfo; path: string } | null> {
  const campaignFolder = getFolder()
  if (!campaignFolder) return null
  const dest = safeJoin(campaignFolder, relativePath)
  if (!existsSync(dest)) {
    return { campaign: await loadCampaign(campaignFolder), path: relativePath }
  }
  const info = await stat(dest)
  if (!info.isFile()) return null
  await unlink(dest)
  await deps.onCampaignFilesChanged()
  return { campaign: await loadCampaign(campaignFolder), path: toPosix(relative(campaignFolder, dest)) }
}
