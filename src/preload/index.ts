import { contextBridge, ipcRenderer } from 'electron'
import type { CampaignInfo, Character, CombatState, DisplayInfo, PlayerState } from '../shared/types'
import type { SheetTemplateKind } from '../shared/sheetTemplates'

const api = {
  getDisplays: (): Promise<DisplayInfo[]> => ipcRenderer.invoke('app:displays'),
  placePlayerOnDisplay: (displayId: number): Promise<DisplayInfo[]> =>
    ipcRenderer.invoke('player:place-on-display', displayId),
  showImage: (src: string, title: string): Promise<PlayerState> =>
    ipcRenderer.invoke('player:show-image', { src, title }),
  clearPlayer: (): Promise<PlayerState> => ipcRenderer.invoke('player:clear'),
  setPlayerInitiative: (entries: PlayerState['initiative'], show: boolean): Promise<PlayerState> =>
    ipcRenderer.invoke('player:set-initiative', entries, show),
  getPlayerState: (): Promise<PlayerState> => ipcRenderer.invoke('player:get-state'),
  onPlayerState: (callback: (state: PlayerState) => void) => {
    const listener = (_event: unknown, state: PlayerState) => callback(state)
    ipcRenderer.on('player:state', listener)
    return () => ipcRenderer.removeListener('player:state', listener)
  },
  pickCampaignFolder: (): Promise<CampaignInfo | null> => ipcRenderer.invoke('campaign:pick-folder'),
  openSampleCampaign: (): Promise<CampaignInfo | null> => ipcRenderer.invoke('campaign:open-sample'),
  getCampaign: (): Promise<CampaignInfo | null> => ipcRenderer.invoke('campaign:get'),
  saveCampaignName: (name: string): Promise<CampaignInfo | null> =>
    ipcRenderer.invoke('campaign:save-name', name),
  readSession: (relativePath: string): Promise<string> =>
    ipcRenderer.invoke('campaign:read-session', relativePath),
  saveSession: (relativePath: string, markdown: string): Promise<void> =>
    ipcRenderer.invoke('campaign:save-session', relativePath, markdown),
  readFile: (relativePath: string): Promise<string> =>
    ipcRenderer.invoke('campaign:read-file', relativePath),
  saveFile: (relativePath: string, contents: string): Promise<void> =>
    ipcRenderer.invoke('campaign:save-file', relativePath, contents),
  saveCharacter: (folder: 'party' | 'npcs', character: Character): Promise<CampaignInfo | null> =>
    ipcRenderer.invoke('campaign:save-character', folder, character),
  saveCombat: (combat: CombatState): Promise<CampaignInfo | null> =>
    ipcRenderer.invoke('campaign:save-combat', combat),
  createNote: (
    folder: string,
    name: string,
    template?: SheetTemplateKind
  ): Promise<{ campaign: CampaignInfo; path: string } | null> =>
    ipcRenderer.invoke('campaign:create-note', folder, name, template),
  duplicateFile: (
    relativePath: string,
    name?: string
  ): Promise<{ campaign: CampaignInfo; path: string } | null> =>
    ipcRenderer.invoke('campaign:duplicate-file', relativePath, name),
  addFiles: (folder: string): Promise<{ campaign: CampaignInfo; paths: string[] } | null> =>
    ipcRenderer.invoke('campaign:add-files', folder),
  saveToBestiary: (
    name: string,
    contents: string
  ): Promise<{ campaign: CampaignInfo; path: string; existed: boolean } | null> =>
    ipcRenderer.invoke('campaign:save-to-bestiary', name, contents)
}

export type TableDmApi = typeof api

contextBridge.exposeInMainWorld('tabledm', api)
