import { ipcMain, type BrowserWindow } from 'electron'
import type { AppSettings } from '../shared/types'
import { IPC } from '../shared/ipc'
import { appFolders, getSettings, openAppFolder, patchSettings } from './appSettings'
import { readConvertGuide } from './convertGuide'
import {
  embedWebSheet,
  hideWebSheetEmbed,
  setWebSheetEmbedBounds
} from './webSheetWindow'
import { applyPlayerImagePad, listDisplays } from './playerOutput'
import { playerImagePadFromSettings } from '../shared/playerImagePad'

export type AppIpcDeps = {
  confirmClose: () => void
  getDmWindow: () => BrowserWindow | null
}

export function registerAppIpc(deps: AppIpcDeps): void {
  ipcMain.handle(IPC.appDisplays, () => listDisplays())
  ipcMain.handle(IPC.appGetSettings, () => getSettings())
  ipcMain.handle(IPC.appSaveSettings, async (_e, partial: AppSettings) => {
    const next = await patchSettings(partial ?? {})
    if (partial && 'playerImagePadPct' in partial) {
      applyPlayerImagePad(playerImagePadFromSettings(next))
    }
    return next
  })
  ipcMain.handle(IPC.appFolders, () => appFolders())
  ipcMain.handle(IPC.appOpenFolder, (_e, kind: string) => openAppFolder(kind))
  ipcMain.handle(IPC.appReadConvertGuide, () => readConvertGuide())
  ipcMain.handle(IPC.appEmbedWebSheet, (_e, url: unknown, bounds: unknown) =>
    embedWebSheet(deps.getDmWindow(), url, bounds)
  )
  ipcMain.handle(IPC.appWebSheetBounds, (_e, bounds: unknown) => setWebSheetEmbedBounds(bounds))
  ipcMain.handle(IPC.appHideWebSheet, () => {
    hideWebSheetEmbed()
  })
  ipcMain.on(IPC.appConfirmClose, () => {
    deps.confirmClose()
  })
}
