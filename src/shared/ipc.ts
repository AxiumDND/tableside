/**
 * Single source of truth for Electron IPC channel names.
 *
 * Both the preload bridge (renderer side) and the main process import these
 * constants so a channel can never be renamed on one side but not the other.
 * The string VALUES are the wire protocol — changing one is a breaking change
 * and is guarded by ipc.test.ts.
 */
export const IPC = {
  // app / lifecycle
  appDisplays: 'app:displays',
  appGetSettings: 'app:get-settings',
  appSaveSettings: 'app:save-settings',
  appWillClose: 'app:will-close',
  appConfirmClose: 'app:confirm-close',
  appDisplaysChanged: 'app:displays-changed',
  appFolders: 'app:folders',
  appOpenFolder: 'app:open-folder',
  appReadConvertGuide: 'app:read-convert-guide',
  appEmbedWebSheet: 'app:embed-web-sheet',
  appWebSheetBounds: 'app:web-sheet-bounds',
  appHideWebSheet: 'app:hide-web-sheet',
  appCheckUpdate: 'app:check-update',
  appStartUpdate: 'app:start-update',
  appDismissUpdate: 'app:dismiss-update',
  appUpdate: 'app:update',

  // player window
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
  playerShowPhone: 'player:show-phone',
  playerAnswerPhone: 'player:answer-phone',
  playerStopPhone: 'player:stop-phone',
  playerShowHyperspace: 'player:show-hyperspace',
  playerArriveHyperspace: 'player:arrive-hyperspace',
  playerStopHyperspace: 'player:stop-hyperspace',
  playerShowBoxOfDoom: 'player:show-box-of-doom',
  playerRollBoxOfDoom: 'player:roll-box-of-doom',
  playerStopBoxOfDoom: 'player:stop-box-of-doom',
  playerShowDice: 'player:show-dice',
  playerClear: 'player:clear',
  playerClearOverlays: 'player:clear-overlays',
  playerSetInitiative: 'player:set-initiative',
  playerGetState: 'player:get-state',
  playerState: 'player:state',

  // audio mixer
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
  mixerPlayHyperspaceLoop: 'mixer:play-hyperspace-loop',
  mixerStopHyperspaceLoop: 'mixer:stop-hyperspace-loop',
  mixerStopAll: 'mixer:stop-all',
  mixerSetPrefs: 'mixer:set-prefs',
  mixerEnded: 'mixer:ended',
  mixerError: 'mixer:error',
  mixerState: 'mixer:state',

  // campaign folder I/O
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

  // optional Additional Books lookup library
  booksLoad: 'books:load',
  booksOpenFolder: 'books:open-folder'
} as const

export type IpcChannel = (typeof IPC)[keyof typeof IPC]
