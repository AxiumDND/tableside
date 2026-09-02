import { contextBridge, ipcRenderer } from 'electron'
import type { MixerPrefs, MixerState } from '../shared/audio'
import type {
  AppFolders,
  AppSettings,
  CampaignInfo,
  CombatState,
  CreateNoteMapImage,
  DisplayInfo,
  LegendLookId,
  PlayerHandout,
  PlayerMapView,
  PlayerState
} from '../shared/types'
import type { CampaignLibraryFolder } from '../shared/campaignLayout'
import type { SheetTemplateKind } from '../shared/sheetTemplates'
import type { BookLibrary } from '../shared/books'
import type { AppUpdateNotice } from '../shared/appUpdate'
import type { CampaignCurrency } from '../shared/currencies'
import { IPC } from '../shared/ipc'

const api = {
  getDisplays: (): Promise<DisplayInfo[]> => ipcRenderer.invoke(IPC.appDisplays),
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke(IPC.appGetSettings),
  saveSettings: (partial: AppSettings): Promise<AppSettings> =>
    ipcRenderer.invoke(IPC.appSaveSettings, partial),
  onWillClose: (callback: () => void | Promise<void>) => {
    const listener = () => {
      void callback()
    }
    ipcRenderer.on(IPC.appWillClose, listener)
    return () => ipcRenderer.removeListener(IPC.appWillClose, listener)
  },
  confirmClose: (): void => {
    ipcRenderer.send(IPC.appConfirmClose)
  },
  placePlayerOnDisplay: (displayId: number): Promise<DisplayInfo[]> =>
    ipcRenderer.invoke(IPC.playerPlaceOnDisplay, displayId),
  closePlayerWindow: (): Promise<boolean> => ipcRenderer.invoke(IPC.playerCloseWindow),
  getPlayerWindowOpen: (): Promise<boolean> => ipcRenderer.invoke(IPC.playerWindowOpen),
  onPlayerWindow: (callback: (open: boolean) => void) => {
    const listener = (_event: unknown, open: boolean) => callback(open)
    ipcRenderer.on(IPC.playerWindow, listener)
    return () => ipcRenderer.removeListener(IPC.playerWindow, listener)
  },
  onDisplaysChanged: (callback: (displays: DisplayInfo[]) => void) => {
    const listener = (_event: unknown, displays: DisplayInfo[]) => callback(displays)
    ipcRenderer.on(IPC.appDisplaysChanged, listener)
    return () => ipcRenderer.removeListener(IPC.appDisplaysChanged, listener)
  },
  showImage: (
    src: string,
    title: string,
    mapView?: PlayerMapView | null,
    handout?: PlayerHandout | null
  ): Promise<PlayerState> =>
    ipcRenderer.invoke(IPC.playerShowImage, {
      src,
      title,
      mapView: mapView ?? null,
      handout: handout ?? null
    }),
  showCrawl: (payload: {
    title?: string
    body: string
    logoSrc?: string | null
    endSrc?: string | null
    preface?: string | null
  }): Promise<PlayerState> => ipcRenderer.invoke(IPC.playerShowCrawl, payload),
  stopCrawl: (): Promise<PlayerState> => ipcRenderer.invoke(IPC.playerStopCrawl),
  showLegend: (payload: {
    title?: string
    body: string
    logoSrc?: string | null
    endSrc?: string | null
    preface?: string | null
    look?: LegendLookId
  }): Promise<PlayerState> => ipcRenderer.invoke(IPC.playerShowLegend, payload),
  stopLegend: (): Promise<PlayerState> => ipcRenderer.invoke(IPC.playerStopLegend),
  showGallery: (payload: {
    title?: string
    slides: { src: string; label?: string }[]
    intervalSec?: number | null
    loop?: boolean
    showTitle?: boolean
  }): Promise<PlayerState> => ipcRenderer.invoke(IPC.playerShowGallery, payload),
  gallerySetIndex: (index: number): Promise<PlayerState> =>
    ipcRenderer.invoke(IPC.playerGallerySetIndex, index),
  stopGallery: (): Promise<PlayerState> => ipcRenderer.invoke(IPC.playerStopGallery),
  showVideo: (payload: {
    title?: string
    src: string
    muted?: boolean
  }): Promise<PlayerState> => ipcRenderer.invoke(IPC.playerShowVideo, payload),
  stopVideo: (): Promise<PlayerState> => ipcRenderer.invoke(IPC.playerStopVideo),
  showPhone: (payload: {
    title?: string
    photoSrc?: string | null
    ringSrc?: string | null
  }): Promise<PlayerState> => ipcRenderer.invoke(IPC.playerShowPhone, payload),
  answerPhone: (): Promise<PlayerState> => ipcRenderer.invoke(IPC.playerAnswerPhone),
  stopPhone: (): Promise<PlayerState> => ipcRenderer.invoke(IPC.playerStopPhone),
  showHyperspace: (payload: {
    title?: string
    shipSrc?: string | null
    planetSrc?: string | null
  }): Promise<PlayerState> => ipcRenderer.invoke(IPC.playerShowHyperspace, payload),
  arriveHyperspace: (): Promise<PlayerState> => ipcRenderer.invoke(IPC.playerArriveHyperspace),
  stopHyperspace: (): Promise<PlayerState> => ipcRenderer.invoke(IPC.playerStopHyperspace),
  clearPlayer: (): Promise<PlayerState> => ipcRenderer.invoke(IPC.playerClear),
  clearPlayerOverlays: (): Promise<PlayerState> => ipcRenderer.invoke(IPC.playerClearOverlays),
  setPlayerInitiative: (payload: {
    entries: PlayerState['initiative']
    show: boolean
    round?: number
  }): Promise<PlayerState> => ipcRenderer.invoke(IPC.playerSetInitiative, payload),
  getPlayerState: (): Promise<PlayerState> => ipcRenderer.invoke(IPC.playerGetState),
  getMixer: (): Promise<MixerState> => ipcRenderer.invoke(IPC.mixerGet),
  mixerPlayMusic: (playlistId: string): Promise<MixerState> =>
    ipcRenderer.invoke(IPC.mixerPlayMusic, playlistId),
  mixerPauseMusic: (): Promise<MixerState> => ipcRenderer.invoke(IPC.mixerPauseMusic),
  mixerSkipMusic: (): Promise<MixerState> => ipcRenderer.invoke(IPC.mixerSkipMusic),
  mixerStopMusic: (): Promise<MixerState> => ipcRenderer.invoke(IPC.mixerStopMusic),
  mixerPlayAmbience: (playlistId: string): Promise<MixerState> =>
    ipcRenderer.invoke(IPC.mixerPlayAmbience, playlistId),
  mixerStopAmbience: (): Promise<MixerState> => ipcRenderer.invoke(IPC.mixerStopAmbience),
  mixerOneshot: (path: string): Promise<MixerState> => ipcRenderer.invoke(IPC.mixerOneshot, path),
  mixerPlayCrawlMusic: (path: string): Promise<MixerState> =>
    ipcRenderer.invoke(IPC.mixerPlayCrawlMusic, path),
  mixerArmCrawlMusic: (): Promise<MixerState> => ipcRenderer.invoke(IPC.mixerArmCrawlMusic),
  mixerStopCrawlMusic: (): Promise<MixerState> => ipcRenderer.invoke(IPC.mixerStopCrawlMusic),
  mixerPlayHyperspaceLoop: (path: string): Promise<MixerState> =>
    ipcRenderer.invoke(IPC.mixerPlayHyperspaceLoop, path),
  mixerStopHyperspaceLoop: (): Promise<MixerState> => ipcRenderer.invoke(IPC.mixerStopHyperspaceLoop),
  mixerStopAll: (): Promise<MixerState> => ipcRenderer.invoke(IPC.mixerStopAll),
  mixerSetPrefs: (prefs: Partial<MixerPrefs>): Promise<MixerState> =>
    ipcRenderer.invoke(IPC.mixerSetPrefs, prefs),
  mixerTrackEnded: (layer: 'music' | 'ambience' | 'crawl'): Promise<MixerState> =>
    ipcRenderer.invoke(IPC.mixerEnded, layer),
  mixerError: (message: string | null): Promise<MixerState> =>
    ipcRenderer.invoke(IPC.mixerError, message),
  onMixerState: (callback: (state: MixerState) => void) => {
    const listener = (_event: unknown, state: MixerState) => callback(state)
    ipcRenderer.on(IPC.mixerState, listener)
    return () => ipcRenderer.removeListener(IPC.mixerState, listener)
  },
  onPlayerState: (callback: (state: PlayerState) => void) => {
    const listener = (_event: unknown, state: PlayerState) => callback(state)
    ipcRenderer.on(IPC.playerState, listener)
    return () => ipcRenderer.removeListener(IPC.playerState, listener)
  },
  pickCampaignFolder: (): Promise<CampaignInfo | null> => ipcRenderer.invoke(IPC.campaignPickFolder),
  openCampaignPath: (folder: string): Promise<CampaignInfo | null> =>
    ipcRenderer.invoke(IPC.campaignOpenPath, folder),
  newCampaign: (
    system?: string,
    theme?: string,
    options?: { holoPortraits?: boolean; digitalRain?: boolean }
  ): Promise<CampaignInfo | null> => ipcRenderer.invoke(IPC.campaignNew, system, theme, options),
  setCampaignTheme: (theme: string): Promise<CampaignInfo | null> =>
    ipcRenderer.invoke(IPC.campaignSetTheme, theme),
  setCampaignHoloPortraits: (enabled: boolean): Promise<CampaignInfo | null> =>
    ipcRenderer.invoke(IPC.campaignSetHoloPortraits, enabled),
  setCampaignDigitalRain: (enabled: boolean): Promise<CampaignInfo | null> =>
    ipcRenderer.invoke(IPC.campaignSetDigitalRain, enabled),
  setCampaignCurrencies: (currencies: CampaignCurrency[]): Promise<CampaignInfo | null> =>
    ipcRenderer.invoke(IPC.campaignSetCurrencies, currencies),
  openSampleCampaign: (): Promise<CampaignInfo | null> => ipcRenderer.invoke(IPC.campaignOpenSample),
  getCampaign: (): Promise<CampaignInfo | null> => ipcRenderer.invoke(IPC.campaignGet),
  readFile: (relativePath: string): Promise<string> =>
    ipcRenderer.invoke(IPC.campaignReadFile, relativePath),
  saveFile: (
    relativePath: string,
    contents: string
  ): Promise<{ campaign: CampaignInfo; path: string; renamed: boolean } | null> =>
    ipcRenderer.invoke(IPC.campaignSaveFile, relativePath, contents),
  saveCombat: (combat: CombatState): Promise<CampaignInfo | null> =>
    ipcRenderer.invoke(IPC.campaignSaveCombat, combat),
  createNote: (
    folder: string,
    name: string,
    template?: SheetTemplateKind,
    mapImage?: CreateNoteMapImage | null
  ): Promise<{ campaign: CampaignInfo; path: string } | null> =>
    ipcRenderer.invoke(IPC.campaignCreateNote, folder, name, template, mapImage ?? null),
  pickImageFile: (): Promise<{ filePath: string; fileName: string } | null> =>
    ipcRenderer.invoke(IPC.campaignPickImage),
  setNotePortrait: (
    relativePath: string,
    image: CreateNoteMapImage
  ): Promise<{ campaign: CampaignInfo; path: string; markdown: string } | null> =>
    ipcRenderer.invoke(IPC.campaignSetPortrait, relativePath, image),
  copyArtToNote: (
    relativePath: string,
    image: CreateNoteMapImage,
    name?: string
  ): Promise<{ campaign: CampaignInfo; fileName: string } | null> =>
    ipcRenderer.invoke(IPC.campaignCopyArt, relativePath, image, name),
  duplicateFile: (
    relativePath: string,
    name?: string
  ): Promise<{ campaign: CampaignInfo; path: string } | null> =>
    ipcRenderer.invoke(IPC.campaignDuplicateFile, relativePath, name),
  addFiles: (
    folder: string,
    mode?: 'files' | 'art'
  ): Promise<{ campaign: CampaignInfo; paths: string[] } | null> =>
    ipcRenderer.invoke(IPC.campaignAddFiles, folder, mode ?? 'files'),
  deleteFile: (
    relativePath: string
  ): Promise<{ campaign: CampaignInfo; path: string } | null> =>
    ipcRenderer.invoke(IPC.campaignDeleteFile, relativePath),
  saveToCampaignLibrary: (
    folder: CampaignLibraryFolder,
    name: string,
    contents: string,
    subfolder?: string | null
  ): Promise<{ campaign: CampaignInfo; path: string; existed: boolean } | null> =>
    ipcRenderer.invoke(IPC.campaignSaveToLibrary, folder, name, contents, subfolder ?? null),
  loadBookLibrary: (): Promise<BookLibrary> => ipcRenderer.invoke(IPC.booksLoad),
  openBooksFolder: (): Promise<string> => ipcRenderer.invoke(IPC.booksOpenFolder),
  getAppFolders: (): Promise<AppFolders> => ipcRenderer.invoke(IPC.appFolders),
  openAppFolder: (
    kind: 'app' | 'userData' | 'books' | 'campaign' | 'convert'
  ): Promise<string> => ipcRenderer.invoke(IPC.appOpenFolder, kind),
  openDndBeyondSheet: (url: string): Promise<boolean> =>
    ipcRenderer.invoke(IPC.appOpenDndBeyond, url),
  checkForUpdate: (fromHelp?: boolean): Promise<void> =>
    ipcRenderer.invoke(IPC.appCheckUpdate, fromHelp ?? false),
  startUpdate: (): Promise<void> => ipcRenderer.invoke(IPC.appStartUpdate),
  dismissUpdate: (version: string): Promise<void> => ipcRenderer.invoke(IPC.appDismissUpdate, version),
  onAppUpdate: (callback: (notice: AppUpdateNotice) => void) => {
    const listener = (_event: unknown, notice: AppUpdateNotice) => callback(notice)
    ipcRenderer.on(IPC.appUpdate, listener)
    return () => ipcRenderer.removeListener(IPC.appUpdate, listener)
  }
}

export type TableDmApi = typeof api

contextBridge.exposeInMainWorld('tabledm', api)
