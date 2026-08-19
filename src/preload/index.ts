import { contextBridge, ipcRenderer } from 'electron'
import type {
  AppSettings,
  CampaignInfo,
  CombatState,
  CreateNoteMapImage,
  DisplayInfo,
  PlayerMapView,
  PlayerState
} from '../shared/types'
import type { CampaignLibraryFolder } from '../shared/campaignLayout'
import type { SheetTemplateKind } from '../shared/sheetTemplates'
import type { WotcLibrary } from '../shared/wotc'

const api = {
  getDisplays: (): Promise<DisplayInfo[]> => ipcRenderer.invoke('app:displays'),
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke('app:get-settings'),
  saveSettings: (partial: AppSettings): Promise<AppSettings> =>
    ipcRenderer.invoke('app:save-settings', partial),
  onWillClose: (callback: () => void | Promise<void>) => {
    const listener = () => {
      void callback()
    }
    ipcRenderer.on('app:will-close', listener)
    return () => ipcRenderer.removeListener('app:will-close', listener)
  },
  confirmClose: (): void => {
    ipcRenderer.send('app:confirm-close')
  },
  placePlayerOnDisplay: (displayId: number): Promise<DisplayInfo[]> =>
    ipcRenderer.invoke('player:place-on-display', displayId),
  showImage: (src: string, title: string, mapView?: PlayerMapView | null): Promise<PlayerState> =>
    ipcRenderer.invoke('player:show-image', { src, title, mapView: mapView ?? null }),
  clearPlayer: (): Promise<PlayerState> => ipcRenderer.invoke('player:clear'),
  setPlayerInitiative: (payload: {
    entries: PlayerState['initiative']
    show: boolean
    round?: number
  }): Promise<PlayerState> => ipcRenderer.invoke('player:set-initiative', payload),
  getPlayerState: (): Promise<PlayerState> => ipcRenderer.invoke('player:get-state'),
  onPlayerState: (callback: (state: PlayerState) => void) => {
    const listener = (_event: unknown, state: PlayerState) => callback(state)
    ipcRenderer.on('player:state', listener)
    return () => ipcRenderer.removeListener('player:state', listener)
  },
  pickCampaignFolder: (): Promise<CampaignInfo | null> => ipcRenderer.invoke('campaign:pick-folder'),
  openCampaignPath: (folder: string): Promise<CampaignInfo | null> =>
    ipcRenderer.invoke('campaign:open-path', folder),
  newCampaign: (): Promise<CampaignInfo | null> => ipcRenderer.invoke('campaign:new'),
  openSampleCampaign: (): Promise<CampaignInfo | null> => ipcRenderer.invoke('campaign:open-sample'),
  getCampaign: (): Promise<CampaignInfo | null> => ipcRenderer.invoke('campaign:get'),
  readFile: (relativePath: string): Promise<string> =>
    ipcRenderer.invoke('campaign:read-file', relativePath),
  saveFile: (relativePath: string, contents: string): Promise<void> =>
    ipcRenderer.invoke('campaign:save-file', relativePath, contents),
  saveCombat: (combat: CombatState): Promise<CampaignInfo | null> =>
    ipcRenderer.invoke('campaign:save-combat', combat),
  createNote: (
    folder: string,
    name: string,
    template?: SheetTemplateKind,
    mapImage?: CreateNoteMapImage | null
  ): Promise<{ campaign: CampaignInfo; path: string } | null> =>
    ipcRenderer.invoke('campaign:create-note', folder, name, template, mapImage ?? null),
  pickImageFile: (): Promise<{ filePath: string; fileName: string } | null> =>
    ipcRenderer.invoke('campaign:pick-image'),
  setNotePortrait: (
    relativePath: string,
    image: CreateNoteMapImage
  ): Promise<{ campaign: CampaignInfo; path: string; markdown: string } | null> =>
    ipcRenderer.invoke('campaign:set-portrait', relativePath, image),
  duplicateFile: (
    relativePath: string,
    name?: string
  ): Promise<{ campaign: CampaignInfo; path: string } | null> =>
    ipcRenderer.invoke('campaign:duplicate-file', relativePath, name),
  addFiles: (
    folder: string,
    mode?: 'files' | 'art'
  ): Promise<{ campaign: CampaignInfo; paths: string[] } | null> =>
    ipcRenderer.invoke('campaign:add-files', folder, mode ?? 'files'),
  deleteFile: (
    relativePath: string
  ): Promise<{ campaign: CampaignInfo; path: string } | null> =>
    ipcRenderer.invoke('campaign:delete-file', relativePath),
  saveToCampaignLibrary: (
    folder: CampaignLibraryFolder,
    name: string,
    contents: string,
    subfolder?: string | null
  ): Promise<{ campaign: CampaignInfo; path: string; existed: boolean } | null> =>
    ipcRenderer.invoke('campaign:save-to-library', folder, name, contents, subfolder ?? null),
  loadWotcLibrary: (): Promise<WotcLibrary> => ipcRenderer.invoke('wotc:load'),
  openWotcFolder: (): Promise<string> => ipcRenderer.invoke('wotc:open-folder')
}

export type TableDmApi = typeof api

contextBridge.exposeInMainWorld('tabledm', api)
