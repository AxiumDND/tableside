import { describe, expect, it } from 'vitest'
import { IPC } from './ipc'

describe('IPC channels', () => {
  it('has no duplicate channel strings', () => {
    const values = Object.values(IPC)
    expect(new Set(values).size).toBe(values.length)
  })

  it('pins the wire protocol (renaming a value is a breaking change)', () => {
    // Snapshot of the channel strings. If this fails, a channel value changed —
    // update both sides intentionally, then update this expectation.
    expect({ ...IPC }).toEqual({
      appDisplays: 'app:displays',
      appGetSettings: 'app:get-settings',
      appSaveSettings: 'app:save-settings',
      appWillClose: 'app:will-close',
      appConfirmClose: 'app:confirm-close',
      appDisplaysChanged: 'app:displays-changed',
      appFolders: 'app:folders',
      appOpenFolder: 'app:open-folder',
      appCheckUpdate: 'app:check-update',
      appStartUpdate: 'app:start-update',
      appDismissUpdate: 'app:dismiss-update',
      appUpdate: 'app:update',
      playerPlaceOnDisplay: 'player:place-on-display',
      playerCloseWindow: 'player:close-window',
      playerWindowOpen: 'player:window-open',
      playerWindow: 'player:window',
      playerShowImage: 'player:show-image',
      playerShowCrawl: 'player:show-crawl',
      playerStopCrawl: 'player:stop-crawl',
      playerShowLegend: 'player:show-legend',
      playerStopLegend: 'player:stop-legend',
      playerShowGallery: 'player:show-gallery',
      playerGallerySetIndex: 'player:gallery-set-index',
      playerStopGallery: 'player:stop-gallery',
      playerShowVideo: 'player:show-video',
      playerStopVideo: 'player:stop-video',
      playerClear: 'player:clear',
      playerClearOverlays: 'player:clear-overlays',
      playerSetInitiative: 'player:set-initiative',
      playerGetState: 'player:get-state',
      playerState: 'player:state',
      mixerGet: 'mixer:get',
      mixerPlayMusic: 'mixer:play-music',
      mixerPauseMusic: 'mixer:pause-music',
      mixerSkipMusic: 'mixer:skip-music',
      mixerStopMusic: 'mixer:stop-music',
      mixerPlayAmbience: 'mixer:play-ambience',
      mixerStopAmbience: 'mixer:stop-ambience',
      mixerOneshot: 'mixer:oneshot',
      mixerPlayCrawlMusic: 'mixer:play-crawl-music',
      mixerArmCrawlMusic: 'mixer:arm-crawl-music',
      mixerStopCrawlMusic: 'mixer:stop-crawl-music',
      mixerStopAll: 'mixer:stop-all',
      mixerSetPrefs: 'mixer:set-prefs',
      mixerEnded: 'mixer:ended',
      mixerError: 'mixer:error',
      mixerState: 'mixer:state',
      campaignPickFolder: 'campaign:pick-folder',
      campaignOpenPath: 'campaign:open-path',
      campaignNew: 'campaign:new',
      campaignSetTheme: 'campaign:set-theme',
      campaignSetHoloPortraits: 'campaign:set-holo-portraits',
      campaignSetDigitalRain: 'campaign:set-digital-rain',
      campaignSetCurrencies: 'campaign:set-currencies',
      campaignOpenSample: 'campaign:open-sample',
      campaignGet: 'campaign:get',
      campaignReadFile: 'campaign:read-file',
      campaignSaveFile: 'campaign:save-file',
      campaignSaveCombat: 'campaign:save-combat',
      campaignCreateNote: 'campaign:create-note',
      campaignPickImage: 'campaign:pick-image',
      campaignSetPortrait: 'campaign:set-portrait',
      campaignCopyArt: 'campaign:copy-art',
      campaignDuplicateFile: 'campaign:duplicate-file',
      campaignAddFiles: 'campaign:add-files',
      campaignDeleteFile: 'campaign:delete-file',
      campaignSaveToLibrary: 'campaign:save-to-library',
      booksLoad: 'books:load',
      booksOpenFolder: 'books:open-folder'
    })
  })
})
