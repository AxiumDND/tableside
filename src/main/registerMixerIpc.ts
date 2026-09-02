import { ipcMain } from 'electron'
import { type MixerPrefs } from '../shared/audio'
import { IPC } from '../shared/ipc'
import {
  broadcastMixerState,
  getMixerState,
  refreshMixerLibrary,
  runMixer
} from './campaignMixer'

export type MixerIpcDeps = {
  getCampaignFolder: () => string | null
}

export function registerMixerIpc(deps: MixerIpcDeps): void {
  ipcMain.handle(IPC.mixerGet, async () => {
    if (deps.getCampaignFolder()) await refreshMixerLibrary()
    broadcastMixerState()
    return getMixerState()
  })
  ipcMain.handle(IPC.mixerPlayMusic, (_e, playlistId: string) =>
    runMixer({ type: 'play-music', playlistId: String(playlistId ?? '') })
  )
  ipcMain.handle(IPC.mixerPauseMusic, () => runMixer({ type: 'pause-music' }))
  ipcMain.handle(IPC.mixerSkipMusic, () => runMixer({ type: 'skip-music' }))
  ipcMain.handle(IPC.mixerStopMusic, () => runMixer({ type: 'stop-music' }))
  ipcMain.handle(IPC.mixerPlayAmbience, (_e, playlistId: string) =>
    runMixer({ type: 'play-ambience', playlistId: String(playlistId ?? '') })
  )
  ipcMain.handle(IPC.mixerStopAmbience, () => runMixer({ type: 'stop-ambience' }))
  ipcMain.handle(IPC.mixerOneshot, (_e, path: string) =>
    runMixer({ type: 'oneshot', path: String(path ?? '') })
  )
  ipcMain.handle(IPC.mixerPlayCrawlMusic, (_e, path: string) =>
    runMixer({ type: 'play-crawl-music', path: String(path ?? '') })
  )
  ipcMain.handle(IPC.mixerArmCrawlMusic, () => runMixer({ type: 'arm-crawl-music' }))
  ipcMain.handle(IPC.mixerStopCrawlMusic, () => runMixer({ type: 'stop-crawl-music' }))
  ipcMain.handle(IPC.mixerPlayHyperspaceLoop, (_e, path: string) =>
    runMixer({ type: 'play-hyperspace-loop', path: String(path ?? '') })
  )
  ipcMain.handle(IPC.mixerStopHyperspaceLoop, () => runMixer({ type: 'stop-hyperspace-loop' }))
  ipcMain.handle(IPC.mixerStopAll, () => runMixer({ type: 'stop-all' }))
  ipcMain.handle(IPC.mixerSetPrefs, (_e, prefs: Partial<MixerPrefs>) =>
    runMixer({ type: 'set-prefs', prefs: prefs ?? {} })
  )
  ipcMain.handle(IPC.mixerEnded, (_e, layer: 'music' | 'ambience' | 'crawl') =>
    runMixer({
      type: 'ended',
      layer: layer === 'ambience' ? 'ambience' : layer === 'crawl' ? 'crawl' : 'music'
    })
  )
  ipcMain.handle(IPC.mixerError, (_e, message: string | null) =>
    runMixer({ type: 'error', message: typeof message === 'string' && message ? message : null })
  )
}
