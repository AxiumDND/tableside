import { ipcMain } from 'electron'
import type { AppSettings } from '../shared/types'
import { IPC } from '../shared/ipc'
import { appFolders, getSettings, openAppFolder, patchSettings } from './appSettings'
import { listDisplays } from './playerOutput'

export type AppIpcDeps = {
  confirmClose: () => void
}

export function registerAppIpc(deps: AppIpcDeps): void {
  ipcMain.handle(IPC.appDisplays, () => listDisplays())
  ipcMain.handle(IPC.appGetSettings, () => getSettings())
  ipcMain.handle(IPC.appSaveSettings, (_e, partial: AppSettings) => patchSettings(partial ?? {}))
  ipcMain.handle(IPC.appFolders, () => appFolders())
  ipcMain.handle(IPC.appOpenFolder, (_e, kind: string) => openAppFolder(kind))
  ipcMain.on(IPC.appConfirmClose, () => {
    deps.confirmClose()
  })
}
