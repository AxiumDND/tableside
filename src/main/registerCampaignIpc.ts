import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { basename, dirname, join, relative } from 'node:path'
import { ipcMain } from 'electron'
import type { CampaignInfo, CombatState, CreateNoteMapImage } from '../shared/types'
import { type CampaignLibraryFolder } from '../shared/campaignLayout'
import { normalizeCurrencies } from '../shared/currencies'
import { IPC } from '../shared/ipc'
import { sanitizeFileName, type SheetTemplateKind } from '../shared/sheetTemplates'
import { parseSystemId } from '../shared/systemPack'
import { parseThemeId } from '../shared/theme'
import { loadBookLibrary, openBooksFolder } from './bookLibrary'
import {
  type CampaignFile,
  ensureCampaignLayout,
  loadCampaign,
  prepareCampaignFolder,
  readJson,
  safeJoin,
  seedNewCampaignFiles,
  toPosix,
  writeJson
} from './campaignFolder'
import {
  addCampaignFiles,
  copyImageToArtFolder,
  createCampaignNote,
  deleteCampaignFile,
  duplicateCampaignFile,
  saveCampaignFile,
  saveToCampaignLibrary,
  setNotePortrait
} from './campaignNotes'
import { ensureSampleWorkingCopy } from './sampleCampaign'

export type CampaignIpcDeps = {
  getCampaignFolder: () => string | null
  setCampaignFolder: (folder: string | null) => Promise<CampaignInfo | null>
  showOpenDialog: (options: Electron.OpenDialogOptions) => Promise<Electron.OpenDialogReturnValue>
}

export function registerCampaignIpc(deps: CampaignIpcDeps): void {
  ipcMain.handle(IPC.campaignPickFolder, async () => {
    const result = await deps.showOpenDialog({
      title: 'Open campaign folder',
      properties: ['openDirectory', 'createDirectory']
    })
    if (result.canceled || !result.filePaths[0]) return null
    return deps.setCampaignFolder(result.filePaths[0])
  })

  ipcMain.handle(IPC.campaignOpenPath, async (_e, folder: string) => {
    if (!folder || !existsSync(folder)) return null
    return deps.setCampaignFolder(folder)
  })

  ipcMain.handle(
    IPC.campaignNew,
    async (
      _e,
      systemId?: string,
      themeId?: string,
      options?: { holoPortraits?: boolean; digitalRain?: boolean }
    ) => {
      const system = parseSystemId(systemId)
      const theme = parseThemeId(themeId)
      const result = await deps.showOpenDialog({
        title: 'New campaign folder',
        properties: ['openDirectory', 'createDirectory']
      })
      if (result.canceled || !result.filePaths[0]) return null
      await ensureCampaignLayout(result.filePaths[0])
      await seedNewCampaignFiles(result.filePaths[0], system, theme, options)
      return deps.setCampaignFolder(result.filePaths[0])
    }
  )

  ipcMain.handle(IPC.campaignSetTheme, async (_e, themeId?: string) => {
    const folder = deps.getCampaignFolder()
    if (!folder) return null
    const campaignPath = join(folder, 'campaign.json')
    const campaign = await readJson<CampaignFile>(campaignPath, {})
    const theme = parseThemeId(themeId)
    await writeJson(campaignPath, {
      ...campaign,
      theme,
      ...(theme === 'scifi' ? { holoPortraits: true } : {}),
      ...(theme === 'matrix' ? { digitalRain: true } : {})
    })
    return loadCampaign(folder)
  })

  ipcMain.handle(IPC.campaignSetHoloPortraits, async (_e, enabled?: boolean) => {
    const folder = deps.getCampaignFolder()
    if (!folder) return null
    const campaignPath = join(folder, 'campaign.json')
    const campaign = await readJson<CampaignFile>(campaignPath, {})
    await writeJson(campaignPath, { ...campaign, holoPortraits: enabled === true })
    return loadCampaign(folder)
  })

  ipcMain.handle(IPC.campaignSetDigitalRain, async (_e, enabled?: boolean) => {
    const folder = deps.getCampaignFolder()
    if (!folder) return null
    const campaignPath = join(folder, 'campaign.json')
    const campaign = await readJson<CampaignFile>(campaignPath, {})
    await writeJson(campaignPath, { ...campaign, digitalRain: enabled === true })
    return loadCampaign(folder)
  })

  ipcMain.handle(IPC.campaignSetCurrencies, async (_e, currencies?: unknown) => {
    const folder = deps.getCampaignFolder()
    if (!folder) return null
    const campaignPath = join(folder, 'campaign.json')
    const campaign = await readJson<CampaignFile>(campaignPath, {})
    await writeJson(campaignPath, { ...campaign, currencies: normalizeCurrencies(currencies) })
    return loadCampaign(folder)
  })

  ipcMain.handle(IPC.campaignOpenSample, async () =>
    deps.setCampaignFolder(await ensureSampleWorkingCopy())
  )

  ipcMain.handle(IPC.campaignGet, async () => {
    const folder = deps.getCampaignFolder()
    if (!folder) return null
    await prepareCampaignFolder(folder)
    return loadCampaign(folder)
  })

  ipcMain.handle(IPC.campaignReadFile, async (_e, relativePath: string) => {
    const folder = deps.getCampaignFolder()
    if (!folder) return ''
    return readFile(safeJoin(folder, relativePath), 'utf8')
  })

  ipcMain.handle(IPC.campaignSaveFile, async (_e, relativePath: string, markdown: string) => {
    return saveCampaignFile(relativePath, markdown)
  })

  ipcMain.handle(IPC.campaignSaveCombat, async (_e, combat: CombatState) => {
    const folder = deps.getCampaignFolder()
    if (!folder) return null
    await writeJson(join(folder, 'combat.json'), combat)
    return loadCampaign(folder)
  })

  ipcMain.handle(
    IPC.campaignCreateNote,
    async (
      _e,
      folder: string,
      name: string,
      template: SheetTemplateKind = 'blank',
      mapImage?: CreateNoteMapImage | null
    ) => createCampaignNote(folder ?? '', name, template, mapImage)
  )

  ipcMain.handle(IPC.campaignPickImage, async () => {
    const result = await deps.showOpenDialog({
      title: 'Load image',
      properties: ['openFile'],
      filters: [
        { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'] },
        { name: 'All files', extensions: ['*'] }
      ]
    })
    if (result.canceled || !result.filePaths[0]) return null
    const filePath = result.filePaths[0]
    return { filePath, fileName: basename(filePath) }
  })

  ipcMain.handle(
    IPC.campaignSaveToLibrary,
    async (_e, folder: CampaignLibraryFolder, name: string, contents: string, subfolder?: string | null) =>
      saveToCampaignLibrary(folder, name, contents, subfolder)
  )

  ipcMain.handle(IPC.campaignSetPortrait, async (_e, relativePath: string, image: CreateNoteMapImage) =>
    setNotePortrait(relativePath, image)
  )

  ipcMain.handle(
    IPC.campaignCopyArt,
    async (_e, relativePath: string, image: CreateNoteMapImage, name?: string) => {
      const campaignFolder = deps.getCampaignFolder()
      if (!campaignFolder) return null
      const dest = safeJoin(campaignFolder, relativePath)
      if (!existsSync(dest)) return null
      const folder = toPosix(relative(campaignFolder, dirname(dest)))
      const fallback =
        image.kind === 'existing'
          ? basename(image.path)
          : image.kind === 'import'
            ? basename(image.filePath)
            : image.id
      const title = sanitizeFileName((name || fallback).replace(/\.[^.]+$/, ''))
      const fileName = await copyImageToArtFolder(folder, title, image)
      if (!fileName) return null
      return { campaign: await loadCampaign(campaignFolder), fileName }
    }
  )

  ipcMain.handle(IPC.campaignDuplicateFile, async (_e, relativePath: string, name?: string) =>
    duplicateCampaignFile(relativePath, name)
  )

  ipcMain.handle(IPC.campaignAddFiles, async (_e, folder: string, mode?: 'files' | 'art') =>
    addCampaignFiles(folder ?? '', mode === 'art' ? 'art' : 'files')
  )

  ipcMain.handle(IPC.campaignDeleteFile, async (_e, relativePath: string) =>
    deleteCampaignFile(relativePath)
  )

  ipcMain.handle(IPC.booksLoad, () => loadBookLibrary())
  ipcMain.handle(IPC.booksOpenFolder, () => openBooksFolder())
}
