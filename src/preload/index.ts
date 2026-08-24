import { contextBridge, ipcRenderer } from 'electron'
import type { MixerPrefs, MixerState } from '../shared/audio'
import type {
  AppFolders,
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
import type { AppUpdateNotice } from '../shared/appUpdate'

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
  closePlayerWindow: (): Promise<boolean> => ipcRenderer.invoke('player:close-window'),
  getPlayerWindowOpen: (): Promise<boolean> => ipcRenderer.invoke('player:window-open'),
  onPlayerWindow: (callback: (open: boolean) => void) => {
    const listener = (_event: unknown, open: boolean) => callback(open)
    ipcRenderer.on('player:window', listener)
    return () => ipcRenderer.removeListener('player:window', listener)
  },
  onDisplaysChanged: (callback: (displays: DisplayInfo[]) => void) => {
    const listener = (_event: unknown, displays: DisplayInfo[]) => callback(displays)
    ipcRenderer.on('app:displays-changed', listener)
    return () => ipcRenderer.removeListener('app:displays-changed', listener)
  },
  showImage: (src: string, title: string, mapView?: PlayerMapView | null): Promise<PlayerState> =>
    ipcRenderer.invoke('player:show-image', { src, title, mapView: mapView ?? null }),
  showCrawl: (payload: {
    title?: string
    body: string
    logoSrc?: string | null
    endSrc?: string | null
    preface?: string | null
  }): Promise<PlayerState> => ipcRenderer.invoke('player:show-crawl', payload),
  stopCrawl: (): Promise<PlayerState> => ipcRenderer.invoke('player:stop-crawl'),
  clearPlayer: (): Promise<PlayerState> => ipcRenderer.invoke('player:clear'),
  setPlayerInitiative: (payload: {
    entries: PlayerState['initiative']
    show: boolean
    round?: number
  }): Promise<PlayerState> => ipcRenderer.invoke('player:set-initiative', payload),
  getPlayerState: (): Promise<PlayerState> => ipcRenderer.invoke('player:get-state'),
  getMixer: (): Promise<MixerState> => ipcRenderer.invoke('mixer:get'),
  mixerPlayMusic: (playlistId: string): Promise<MixerState> =>
    ipcRenderer.invoke('mixer:play-music', playlistId),
  mixerPauseMusic: (): Promise<MixerState> => ipcRenderer.invoke('mixer:pause-music'),
  mixerSkipMusic: (): Promise<MixerState> => ipcRenderer.invoke('mixer:skip-music'),
  mixerStopMusic: (): Promise<MixerState> => ipcRenderer.invoke('mixer:stop-music'),
  mixerPlayAmbience: (playlistId: string): Promise<MixerState> =>
    ipcRenderer.invoke('mixer:play-ambience', playlistId),
  mixerStopAmbience: (): Promise<MixerState> => ipcRenderer.invoke('mixer:stop-ambience'),
  mixerOneshot: (path: string): Promise<MixerState> => ipcRenderer.invoke('mixer:oneshot', path),
  mixerPlayCrawlMusic: (path: string): Promise<MixerState> =>
    ipcRenderer.invoke('mixer:play-crawl-music', path),
  mixerArmCrawlMusic: (): Promise<MixerState> => ipcRenderer.invoke('mixer:arm-crawl-music'),
  mixerStopCrawlMusic: (): Promise<MixerState> => ipcRenderer.invoke('mixer:stop-crawl-music'),
  mixerStopAll: (): Promise<MixerState> => ipcRenderer.invoke('mixer:stop-all'),
  mixerSetPrefs: (prefs: Partial<MixerPrefs>): Promise<MixerState> =>
    ipcRenderer.invoke('mixer:set-prefs', prefs),
  mixerTrackEnded: (layer: 'music' | 'ambience' | 'crawl'): Promise<MixerState> =>
    ipcRenderer.invoke('mixer:ended', layer),
  mixerError: (message: string | null): Promise<MixerState> =>
    ipcRenderer.invoke('mixer:error', message),
  onMixerState: (callback: (state: MixerState) => void) => {
    const listener = (_event: unknown, state: MixerState) => callback(state)
    ipcRenderer.on('mixer:state', listener)
    return () => ipcRenderer.removeListener('mixer:state', listener)
  },
  onPlayerState: (callback: (state: PlayerState) => void) => {
    const listener = (_event: unknown, state: PlayerState) => callback(state)
    ipcRenderer.on('player:state', listener)
    return () => ipcRenderer.removeListener('player:state', listener)
  },
  pickCampaignFolder: (): Promise<CampaignInfo | null> => ipcRenderer.invoke('campaign:pick-folder'),
  openCampaignPath: (folder: string): Promise<CampaignInfo | null> =>
    ipcRenderer.invoke('campaign:open-path', folder),
  newCampaign: (
    system?: string,
    theme?: string,
    options?: { holoPortraits?: boolean; digitalRain?: boolean }
  ): Promise<CampaignInfo | null> => ipcRenderer.invoke('campaign:new', system, theme, options),
  setCampaignTheme: (theme: string): Promise<CampaignInfo | null> =>
    ipcRenderer.invoke('campaign:set-theme', theme),
  setCampaignHoloPortraits: (enabled: boolean): Promise<CampaignInfo | null> =>
    ipcRenderer.invoke('campaign:set-holo-portraits', enabled),
  setCampaignDigitalRain: (enabled: boolean): Promise<CampaignInfo | null> =>
    ipcRenderer.invoke('campaign:set-digital-rain', enabled),
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
  copyArtToNote: (
    relativePath: string,
    image: CreateNoteMapImage,
    name?: string
  ): Promise<{ campaign: CampaignInfo; fileName: string } | null> =>
    ipcRenderer.invoke('campaign:copy-art', relativePath, image, name),
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
  openWotcFolder: (): Promise<string> => ipcRenderer.invoke('wotc:open-folder'),
  getAppFolders: (): Promise<AppFolders> => ipcRenderer.invoke('app:folders'),
  openAppFolder: (kind: 'app' | 'userData' | 'books'): Promise<string> =>
    ipcRenderer.invoke('app:open-folder', kind),
  checkForUpdate: (fromHelp?: boolean): Promise<void> =>
    ipcRenderer.invoke('app:check-update', fromHelp ?? false),
  startUpdate: (): Promise<void> => ipcRenderer.invoke('app:start-update'),
  dismissUpdate: (version: string): Promise<void> => ipcRenderer.invoke('app:dismiss-update', version),
  onAppUpdate: (callback: (notice: AppUpdateNotice) => void) => {
    const listener = (_event: unknown, notice: AppUpdateNotice) => callback(notice)
    ipcRenderer.on('app:update', listener)
    return () => ipcRenderer.removeListener('app:update', listener)
  }
}

export type TableDmApi = typeof api

contextBridge.exposeInMainWorld('tabledm', api)
