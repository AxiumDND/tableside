import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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
  stopPlayerBoxOfDoom: vi.fn(() => emptyPlayerState()),
  stopPlayerHourglass: vi.fn(() => emptyPlayerState()),
  clearBoxOfDoomTimers: vi.fn(),
  clearHourglassTimers: vi.fn(),
  scheduleBoxOfDoomAutoFade: vi.fn(),
  showPlayerDice: vi.fn((payload: Record<string, unknown>) => {
    const prev = player.getPlayerState() as ReturnType<typeof emptyPlayerState>
    const next = {
      ...prev,
      diceShow: { ...payload, startedAt: Date.now() }
    }
    player.setPlayerState(next)
    return next
  }),
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
    registerAppIpc({ confirmClose: vi.fn(), getDmWindow: () => null })
    registerPlayerIpc()
    registerMixerIpc({ getCampaignFolder: () => null })
    registerCampaignIpc({
      getCampaignFolder: () => null,
      setCampaignFolder: vi.fn(async () => null),
      showOpenDialog: vi.fn(async () => ({ canceled: true, filePaths: [] }))
    })
  })

  afterEach(() => {
    vi.useRealTimers()
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

  it('fades a Box of Doom overlay onto the player TV without rolling', () => {
    player.getPlayerState.mockReturnValue({
      ...emptyPlayerState(),
      imageSrc: 'tabledm://map.png'
    })
    invoke(IPC.playerShowBoxOfDoom, { dc: 15, modifier: 4 })
    const next = player.setPlayerState.mock.calls.at(-1)?.[0] as {
      imageSrc: string
      boxOfDoom: { dc: number; modifier: number; d20?: number; rolledAt?: number }
    }
    expect(next.imageSrc).toBe('tabledm://map.png')
    expect(next.boxOfDoom).toMatchObject({ dc: 15, modifier: 4 })
    expect(next.boxOfDoom.d20).toBeUndefined()
    expect(next.boxOfDoom.rolledAt).toBeUndefined()
  })

  it('rolls a waiting Box of Doom check', () => {
    player.getPlayerState.mockReturnValue({
      ...emptyPlayerState(),
      imageSrc: 'tabledm://map.png',
      boxOfDoom: { dc: 15, modifier: 4, startedAt: 1 }
    })
    invoke(IPC.playerRollBoxOfDoom, { dc: 15, modifier: 4, d20: 12 })
    const next = player.setPlayerState.mock.calls.at(-1)?.[0] as {
      imageSrc: string
      boxOfDoom: { total: number; success: boolean; d20: number }
    }
    expect(next.imageSrc).toBe('tabledm://map.png')
    expect(next.boxOfDoom).toMatchObject({ total: 16, success: true, d20: 12 })
    expect(player.scheduleBoxOfDoomAutoFade).toHaveBeenCalled()
  })

  it('keeps the higher Box of Doom die on advantage', () => {
    player.getPlayerState.mockReturnValue({
      ...emptyPlayerState(),
      boxOfDoom: { dc: 15, modifier: 0, mode: 'advantage', startedAt: 1 }
    })
    invoke(IPC.playerRollBoxOfDoom, {
      dc: 15,
      modifier: 0,
      d20: 4,
      d20b: 17,
      mode: 'advantage'
    })
    const next = player.setPlayerState.mock.calls.at(-1)?.[0] as {
      boxOfDoom: { d20: number; rolls: number[]; success: boolean }
    }
    expect(next.boxOfDoom).toMatchObject({ d20: 17, rolls: [4, 17], success: true })
  })

  it('shows a full hourglass without starting the countdown', () => {
    player.getPlayerState.mockReturnValue({
      ...emptyPlayerState(),
      imageSrc: 'tabledm://map.png'
    })
    invoke(IPC.playerShowHourglass, { minutes: 5, sound: true })
    const next = player.setPlayerState.mock.calls.at(-1)?.[0] as {
      imageSrc: string
      boxOfDoom: unknown
      hourglass: { durationMs: number; endsAt?: number; remainingMs?: number }
    }
    expect(next.imageSrc).toBe('tabledm://map.png')
    expect(next.boxOfDoom).toBeNull()
    expect(next.hourglass.durationMs).toBe(300_000)
    expect(next.hourglass.endsAt).toBeUndefined()
    expect(next.hourglass.remainingMs).toBeUndefined()
  })

  it('starts a waiting hourglass', () => {
    vi.useFakeTimers()
    vi.setSystemTime(10_000)
    player.getPlayerState.mockReturnValue({
      ...emptyPlayerState(),
      hourglass: { durationMs: 60_000, shownAt: 1, sound: true }
    })
    invoke(IPC.playerStartHourglass)
    const next = player.setPlayerState.mock.calls.at(-1)?.[0] as {
      hourglass: { endsAt: number; durationMs: number }
    }
    expect(next.hourglass.durationMs).toBe(60_000)
    expect(next.hourglass.endsAt).toBe(70_000)
    vi.useRealTimers()
  })

  it('pauses a running hourglass and resumes from the remainder', () => {
    vi.useFakeTimers()
    vi.setSystemTime(20_000)
    player.getPlayerState.mockReturnValue({
      ...emptyPlayerState(),
      hourglass: { durationMs: 60_000, shownAt: 1, endsAt: 70_000, sound: true }
    })
    invoke(IPC.playerPauseHourglass)
    const paused = player.setPlayerState.mock.calls.at(-1)?.[0] as {
      hourglass: { remainingMs: number; endsAt?: number }
    }
    expect(paused.hourglass.remainingMs).toBe(50_000)
    expect(paused.hourglass.endsAt).toBeUndefined()

    player.getPlayerState.mockReturnValue({
      ...emptyPlayerState(),
      hourglass: { durationMs: 60_000, shownAt: 1, remainingMs: 50_000, pausedAt: 20_000, sound: true }
    })
    vi.setSystemTime(30_000)
    invoke(IPC.playerResumeHourglass)
    const resumed = player.setPlayerState.mock.calls.at(-1)?.[0] as {
      hourglass: { endsAt: number }
    }
    expect(resumed.hourglass.endsAt).toBe(80_000)
    vi.useRealTimers()
  })

  it('resets the hourglass to a full waiting glass', () => {
    player.getPlayerState.mockReturnValue({
      ...emptyPlayerState(),
      hourglass: { durationMs: 60_000, shownAt: 1, remainingMs: 12_000, pausedAt: 2 }
    })
    invoke(IPC.playerResetHourglass, { minutes: 3 })
    const next = player.setPlayerState.mock.calls.at(-1)?.[0] as {
      hourglass: { durationMs: number; endsAt?: number; remainingMs?: number }
    }
    expect(next.hourglass.durationMs).toBe(180_000)
    expect(next.hourglass.endsAt).toBeUndefined()
    expect(next.hourglass.remainingMs).toBeUndefined()
  })

  it('fades the hourglass out', () => {
    invoke(IPC.playerStopHourglass)
    expect(player.stopPlayerHourglass).toHaveBeenCalled()
  })

  it('shows dice on the player strip without clearing media', () => {
    player.getPlayerState.mockReturnValue({
      ...emptyPlayerState(),
      imageSrc: 'tabledm://scene.png'
    })
    invoke(IPC.playerShowDice, {
      source: 'Goblin',
      expr: '2d6+3',
      total: 11,
      groups: [{ sides: 6, rolls: [4, 3] }],
      bonus: 3
    })
    expect(player.showPlayerDice).toHaveBeenCalled()
    const next = player.setPlayerState.mock.calls.at(-1)?.[0] as {
      imageSrc: string
      diceShow: { expr: string; total: number }
    }
    expect(next.imageSrc).toBe('tabledm://scene.png')
    expect(next.diceShow).toMatchObject({ expr: '2d6+3', total: 11 })
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
