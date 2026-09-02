import { beforeEach, describe, expect, it, vi } from 'vitest'
import { IPC } from '../shared/ipc'
import { emptyPlayerState } from '../shared/types'

const { ipc } = vi.hoisted(() => ({
  ipc: {
    handles: new Map<string, (...args: unknown[]) => unknown>(),
    ons: new Map<string, (...args: unknown[]) => unknown>()
  }
}))

vi.mock('electron', () => ({
  ipcMain: {
    handle: (channel: string, fn: (...args: unknown[]) => unknown) => {
      ipc.handles.set(channel, fn)
    },
    on: (channel: string, fn: (...args: unknown[]) => unknown) => {
      ipc.ons.set(channel, fn)
    }
  },
  screen: {
    getAllDisplays: () => []
  }
}))

const player = vi.hoisted(() => ({
  listDisplays: vi.fn(() => [{ id: 1, label: 'Screen' }]),
  getPlayerState: vi.fn(() => emptyPlayerState()),
  setPlayerState: vi.fn((next: unknown) => next),
  clearPlayerMedia: vi.fn(() => emptyPlayerState()),
  clearPlayerOverlays: vi.fn(() => emptyPlayerState()),
  stopPlayerCrawl: vi.fn(() => emptyPlayerState()),
  stopPlayerLegend: vi.fn(() => emptyPlayerState()),
  stopPlayerGallery: vi.fn(() => emptyPlayerState()),
  stopPlayerPhone: vi.fn(() => emptyPlayerState()),
  stopPlayerHyperspace: vi.fn(() => emptyPlayerState()),
  arrivePlayerHyperspace: vi.fn(() => emptyPlayerState()),
  playerWindowVisible: vi.fn(() => false),
  closePlayerWindow: vi.fn(),
  hasSecondDisplay: vi.fn(() => false),
  hidePlayerWindow: vi.fn(),
  showPlayerWindow: vi.fn()
}))

vi.mock('./playerOutput', () => player)

const mixer = vi.hoisted(() => ({
  broadcastMixerState: vi.fn(),
  getMixerState: vi.fn(() => ({ playing: false })),
  refreshMixerLibrary: vi.fn(async () => undefined),
  runMixer: vi.fn((command: unknown) => command)
}))

vi.mock('./campaignMixer', () => mixer)

const settings = vi.hoisted(() => ({
  appFolders: vi.fn(() => ({ userData: '/tmp' })),
  getSettings: vi.fn(() => ({})),
  openAppFolder: vi.fn(),
  patchSettings: vi.fn(async (partial: unknown) => partial)
}))

vi.mock('./appSettings', () => settings)

vi.mock('./campaignFolder', () => ({
  ensureCampaignLayout: vi.fn(),
  loadCampaign: vi.fn(),
  prepareCampaignFolder: vi.fn(),
  readJson: vi.fn(),
  safeJoin: vi.fn(),
  seedNewCampaignFiles: vi.fn(),
  toPosix: vi.fn(),
  writeJson: vi.fn()
}))

vi.mock('./campaignNotes', () => ({
  addCampaignFiles: vi.fn(),
  copyImageToArtFolder: vi.fn(),
  createCampaignNote: vi.fn(),
  deleteCampaignFile: vi.fn(),
  duplicateCampaignFile: vi.fn(),
  saveCampaignFile: vi.fn(),
  saveToCampaignLibrary: vi.fn(),
  setNotePortrait: vi.fn()
}))

vi.mock('./sampleCampaign', () => ({
  ensureSampleWorkingCopy: vi.fn(async () => '/tmp/sample')
}))

vi.mock('./bookLibrary', () => ({
  loadBookLibrary: vi.fn(() => ({ folders: [] })),
  openBooksFolder: vi.fn()
}))

import { registerAppIpc } from './registerAppIpc'
import { registerCampaignIpc } from './registerCampaignIpc'
import { registerMixerIpc } from './registerMixerIpc'
import { registerPlayerIpc } from './registerPlayerIpc'

function invoke(channel: string, ...args: unknown[]): unknown {
  const handler = ipc.handles.get(channel)
  if (!handler) throw new Error(`missing handle ${channel}`)
  return handler({}, ...args)
}

describe('main IPC registration', () => {
  beforeEach(() => {
    ipc.handles.clear()
    ipc.ons.clear()
    vi.clearAllMocks()
    player.getPlayerState.mockReturnValue(emptyPlayerState())
    registerAppIpc({ confirmClose: vi.fn() })
    registerPlayerIpc()
    registerMixerIpc({ getCampaignFolder: () => null })
    registerCampaignIpc({
      getCampaignFolder: () => null,
      setCampaignFolder: vi.fn(async () => null),
      showOpenDialog: vi.fn(async () => ({ canceled: true, filePaths: [] }))
    })
  })

  it('registers invoke handlers for every request channel', () => {
    const sendOnly = new Set<string>([
      IPC.appWillClose,
      IPC.appDisplaysChanged,
      IPC.appUpdate,
      IPC.playerWindow,
      IPC.playerState,
      IPC.mixerState
    ])
    const updater = new Set<string>([IPC.appCheckUpdate, IPC.appStartUpdate, IPC.appDismissUpdate])
    for (const channel of Object.values(IPC)) {
      if (sendOnly.has(channel) || updater.has(channel)) continue
      if (channel === IPC.appConfirmClose) {
        expect(ipc.ons.has(channel)).toBe(true)
        continue
      }
      expect(ipc.handles.has(channel)).toBe(true)
    }
  })

  it('shows an image on the player TV and clears other overlays', () => {
    invoke(IPC.playerShowImage, { src: 'tabledm://map.png', title: 'Cave' })
    expect(player.setPlayerState).toHaveBeenCalled()
    const next = player.setPlayerState.mock.calls[0][0] as {
      imageSrc: string
      crawl: unknown
      phone: unknown
    }
    expect(next.imageSrc).toBe('tabledm://map.png')
    expect(next.crawl).toBeNull()
    expect(next.phone).toBeNull()
  })

  it('plays mixer music by playlist id', () => {
    invoke(IPC.mixerPlayMusic, 'tavern')
    expect(mixer.runMixer).toHaveBeenCalledWith({ type: 'play-music', playlistId: 'tavern' })
  })

  it('returns null from campaign:get when no folder is open', async () => {
    await expect(invoke(IPC.campaignGet)).resolves.toBeNull()
  })

  it('saves app settings through patchSettings', () => {
    invoke(IPC.appSaveSettings, { theme: 'scifi' })
    expect(settings.patchSettings).toHaveBeenCalledWith({ theme: 'scifi' })
  })
})
