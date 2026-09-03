import { useCallback, useEffect, useRef, useState } from 'react'
import type { CampaignInfo, CampaignTreeNode, DisplayInfo, RecentCampaign } from '../../../shared/types'
import { emptyMixerClock, emptyMixerState, mixerIsActive } from '../../../shared/audio'
import { emptyCombat } from '../../../shared/types'
import {
  applyThemeToDocument,
  digitalRainEnabled,
  holoPortraitsEnabled,
  resolveConsoleTheme,
  type ThemeId
} from '../../../shared/theme'
import { getSystemPack, parseSystemId } from '../../../shared/systemPack'
import CampaignFiles, { campaignFileUrl, fileKind } from '../components/CampaignFiles'
import AudioEngine from '../components/AudioEngine'
import CombatTracker from '../components/CombatTracker'
import MusicPanel from '../components/MusicPanel'
import DiceTray, { DiceLogProvider } from '../components/DiceTray'
import { HideBundledArtworkProvider } from '../hooks/useBundledArtwork'
import HelpPanel from '../components/HelpPanel'
import PlayerPreview from '../components/PlayerPreview'
import SessionNotes from '../components/SessionNotes'
import SystemPicker from '../components/SystemPicker'
import ThemeSetup from '../components/ThemeSetup'
import DigitalRain from '../components/DigitalRain'
import { combatToPlayerInitiative, combatProfileFor, advanceCombatTurn } from '../lib/combat'
import { flattenImages, flattenVideos, imageTitle } from '../lib/images'
import { allPartyNotes, bestiaryNotes, flattenNotes, sheetDisplayName } from '../lib/notes'
import { libraryFolderFor, recordToCampaignMarkdown, gearSubfolderFor } from '../lib/lookupNotes'
import type { SrdRecord } from '../lib/srd'
import type { AppUpdateNotice } from '../../../shared/appUpdate'
import UpdateBanner from '../components/UpdateBanner'
import DmHeader from '../components/DmHeader'
import ToolsPanel from '../components/ToolsPanel'
import { adjacentCampaignFile, canonicalFolder } from '../../../shared/campaignLayout'
import { asRightPanelId, asToolsTabId, type RightPanelId, type ToolsTabId } from '../../../shared/rightPanel'
import { enrichNpcSheet } from '../lib/npcCreate'
import type { NpcQuickCreateInput } from '../components/NpcPanel'
import { usePlayerPlayback } from '../hooks/usePlayerPlayback'
import { useConsoleHotkeys } from '../hooks/useConsoleHotkeys'
import { useCombatActions } from '../hooks/useCombatActions'
import { useCampaignOpen } from '../hooks/useCampaignOpen'
import { useCampaignNavigation } from '../hooks/useCampaignNavigation'

const SIDE_PANEL_WIDTH = 'w-[400px]'

function findTreeNode(nodes: CampaignTreeNode[], path: string): CampaignTreeNode | null {
  for (const node of nodes) {
    if (node.relativePath === path) return node
    if (node.children) {
      const found = findTreeNode(node.children, path)
      if (found) return found
    }
  }
  return null
}

function firstNote(nodes: CampaignTreeNode[]): string {
  const files: string[] = []
  const walk = (list: CampaignTreeNode[]): void => {
    for (const node of list) {
      if (node.type === 'file' && fileKind(node) === 'note') files.push(node.relativePath)
      if (node.children) walk(node.children)
    }
  }
  walk(nodes)
  const inStartHere = (path: string): boolean =>
    canonicalFolder(path.replaceAll('\\', '/').split('/')[0] ?? '') === 'start here'
  const startOverview = files.find(
    (p) => inStartHere(p) && /overview/i.test(p.split('/').pop() ?? '')
  )
  if (startOverview) return startOverview
  const startHere = files.find((p) => inStartHere(p))
  if (startHere) return startHere
  const overview = files.find((p) => /overview/i.test(p.split('/').pop() ?? ''))
  if (overview) return overview
  const night = files.find((p) => /night sheet/i.test(p))
  if (night) return night
  return files[0] ?? ''
}

export default function DmApp() {
  const [campaign, setCampaign] = useState<CampaignInfo | null>(null)
  const [mixer, setMixer] = useState(emptyMixerState())
  const {
    player,
    setPlayer,
    activeCrawl,
    activeLegend,
    activeGallery,
    activeVideo,
    activePhone,
    showSelectedToPlayers,
    handleMapLiveView,
    playCrawl,
    playLegend,
    stopCrawl,
    stopLegend,
    playGallery,
    galleryPrev,
    galleryNext,
    stopGallery,
    playVideo,
    stopVideo,
    playPhone,
    answerPhone,
    stopPhone,
    playHyperspace,
    arriveHyperspace,
    stopHyperspace,
    activeHyperspace,
    clearPlayer
  } = usePlayerPlayback(setMixer)
  const [mixerClock, setMixerClock] = useState(() => emptyMixerClock())
  const [displays, setDisplays] = useState<DisplayInfo[]>([])
  const [rightPanel, setRightPanel] = useState<RightPanelId | null>(null)
  const [lastRightPanel, setLastRightPanel] = useState<RightPanelId>('combat')
  const [toolsTab, setToolsTab] = useState<ToolsTabId>('lookup')
  const [diceCheckSound, setDiceCheckSound] = useState(true)
  const [hideNpcPortraits, setHideNpcPortraits] = useState(false)
  const {
    openPath,
    openKind,
    selectedImage,
    history,
    setSelectedImage,
    navigateTo,
    goBack,
    goNextFile,
    openNote,
    openTreeFile,
    resetNavigation,
    restoreOpen,
    clearOpen,
    pruneHistory
  } = useCampaignNavigation(campaign)
  const [playerDisplayId, setPlayerDisplayId] = useState<number | ''>('')
  const [showPlayerPreview, setShowPlayerPreview] = useState(true)
  const [showLeftSidebar, setShowLeftSidebar] = useState(true)
  const [theme, setTheme] = useState<ThemeId>('classic')
  const [playerWindowOpen, setPlayerWindowOpen] = useState(false)
  const [recentCampaigns, setRecentCampaigns] = useState<RecentCampaign[]>([])
  const [updateNotice, setUpdateNotice] = useState<AppUpdateNotice | null>(null)
  const skipRestoredCombatShow = useRef(true)
  const prevBoxOfDoomRef = useRef(player.boxOfDoom)

  const refresh = useCallback(async () => {
    const [info, state, mix, screens, prefs, windowOpen] = await Promise.all([
      window.tabledm.getCampaign(),
      window.tabledm.getPlayerState(),
      window.tabledm.getMixer(),
      window.tabledm.getDisplays(),
      window.tabledm.getSettings(),
      window.tabledm.getPlayerWindowOpen?.() ?? Promise.resolve(false)
    ])
    setCampaign(info)
    setPlayer(state)
    setMixer(mix)
    setDisplays(screens)
    setPlayerWindowOpen(Boolean(windowOpen))
    const saved = prefs.playerDisplayId
    setPlayerDisplayId(
      saved != null && screens.some((d) => d.id === saved)
        ? saved
        : (screens.find((d) => !d.dm)?.id ?? screens[0]?.id ?? '')
    )
    setShowPlayerPreview(prefs.showPlayerPreview !== false)
    setShowLeftSidebar(prefs.showLeftSidebar !== false)
    const nextTheme = resolveConsoleTheme(info?.theme, prefs.theme)
    setTheme(nextTheme)
    applyThemeToDocument(nextTheme)
    setRecentCampaigns(prefs.recentCampaigns ?? [])
    const restoredPanel = asRightPanelId(prefs.rightPanel)
    setRightPanel(restoredPanel)
    setLastRightPanel(asRightPanelId(prefs.lastRightPanel) ?? restoredPanel ?? 'combat')
    setToolsTab(asToolsTabId(prefs.toolsTab))
    setDiceCheckSound(prefs.diceCheckSound !== false)
    setHideNpcPortraits(prefs.hideNpcPortraits === true)
    if (info && !openPath) {
      const remembered =
        prefs.lastOpenPath && findTreeNode(info.tree, prefs.lastOpenPath)
          ? prefs.lastOpenPath
          : firstNote(info.tree)
      if (remembered) {
        const node = findTreeNode(info.tree, remembered)
        restoreOpen(remembered, node ? fileKind(node) : 'note')
      }
    }
  }, [openPath, restoreOpen, setPlayer])

  useEffect(() => {
    if (digitalRainEnabled(theme, campaign?.digitalRain)) {
      document.documentElement.dataset.digitalRain = 'on'
    } else {
      delete document.documentElement.dataset.digitalRain
    }
  }, [theme, campaign?.digitalRain])

  useEffect(() => {
    void refresh()
    const stopPlayer = window.tabledm.onPlayerState(setPlayer)
    const stopMixer = window.tabledm.onMixerState(setMixer)
    const stopPlayerWindow = window.tabledm.onPlayerWindow?.(setPlayerWindowOpen)
    const stopUpdate = window.tabledm.onAppUpdate(setUpdateNotice)
    const stopDisplays = window.tabledm.onDisplaysChanged((screens) => {
      setDisplays(screens)
      setPlayerDisplayId((current) =>
        screens.some((d) => d.id === current) ? current : (screens.find((d) => !d.dm)?.id ?? screens[0]?.id ?? '')
      )
    })
    return () => {
      stopPlayer()
      stopMixer()
      stopPlayerWindow?.()
      stopUpdate()
      stopDisplays()
    }
  }, [refresh, setPlayer])

  function applyConsoleTheme(next: ThemeId): void {
    setTheme(next)
    applyThemeToDocument(next)
    void window.tabledm.saveSettings({ theme: next })
  }

  function applyCampaign(info: CampaignInfo | null, appTheme?: string | null): void {
    setCampaign(info)
    applyConsoleTheme(resolveConsoleTheme(info?.theme, appTheme))
    resetNavigation(info ? firstNote(info.tree) : '')
    skipRestoredCombatShow.current = true
    void clearPlayer()
  }

  const syncAfterOpen = useCallback(async (): Promise<void> => {
    setPlayer(await window.tabledm.getPlayerState())
    setMixer(await window.tabledm.getMixer())
    setRecentCampaigns((await window.tabledm.getSettings()).recentCampaigns ?? [])
  }, [setPlayer])

  const { campaignSetup, setCampaignSetup, openFolder, newCampaign, openSample, openRecent } = useCampaignOpen({
    applyCampaign,
    syncAfterOpen
  })

  async function changeCampaignTheme(next: ThemeId): Promise<void> {
    applyConsoleTheme(next)
    if (!campaign) return
    const updated = await window.tabledm.setCampaignTheme(next)
    if (updated) setCampaign(updated)
  }

  async function changeHoloPortraits(enabled: boolean): Promise<void> {
    if (!campaign) return
    const updated = await window.tabledm.setCampaignHoloPortraits(enabled)
    if (updated) setCampaign(updated)
  }

  async function changeDigitalRain(enabled: boolean): Promise<void> {
    if (!campaign) return
    const updated = await window.tabledm.setCampaignDigitalRain(enabled)
    if (updated) setCampaign(updated)
  }

  async function changeCurrencies(currencies: import('../../../shared/currencies').CampaignCurrency[]): Promise<void> {
    if (!campaign) return
    const updated = await window.tabledm.setCampaignCurrencies(currencies)
    if (updated) setCampaign(updated)
  }

  const { saveCombat, addMonster, addNpcFromSheet, addPartyToCombat, addBestiaryToCombat, addEncounterItems } =
    useCombatActions({
      campaign,
      setCampaign,
      getPartyFromNote: () => openPath || firstNote(campaign?.tree ?? []),
      onOpenCombatPanel: () => changeRightPanel('combat')
    })

  async function saveLookupToCampaign(record: SrdRecord): Promise<'added' | 'exists' | void> {
    const folder = libraryFolderFor(record)
    if (!folder) return
    const result = await window.tabledm.saveToCampaignLibrary(
      folder,
      record.name,
      recordToCampaignMarkdown(record),
      gearSubfolderFor(record)
    )
    if (!result) return
    setCampaign(result.campaign)
    navigateTo(result.path, 'note')
    return result.existed ? 'exists' : 'added'
  }

  async function createNpcFromQuickCreate(input: NpcQuickCreateInput): Promise<void> {
    const created = await window.tabledm.createNote('NPCs', input.name, 'npc', input.portrait ?? null)
    if (!created) return
    let campaignInfo = created.campaign
    let path = created.path
    const current = await window.tabledm.readFile(path)
    const next = enrichNpcSheet(current, input.name, input.species, input.statBlockId ?? null)
    if (next !== current) {
      const saved = await window.tabledm.saveFile(path, next)
      if (saved) {
        campaignInfo = saved.campaign
        path = saved.path
      }
    }
    setCampaign(campaignInfo)
    navigateTo(path, 'note')
  }

  /** Copy an item into Gear without leaving the open sheet (treasure picker). */
  async function ensureGearFromLookup(record: SrdRecord): Promise<'added' | 'exists' | void> {
    if (libraryFolderFor(record) !== 'gear') return
    const result = await window.tabledm.saveToCampaignLibrary(
      'gear',
      record.name,
      recordToCampaignMarkdown(record),
      gearSubfolderFor(record)
    )
    if (!result) return
    setCampaign(result.campaign)
    return result.existed ? 'exists' : 'added'
  }

  /** Copy a monster into Bestiary without leaving the open sheet (combat picker). */
  async function ensureMonsterFromLookup(record: SrdRecord): Promise<'added' | 'exists' | void> {
    if (libraryFolderFor(record) !== 'bestiary') return
    const result = await window.tabledm.saveToCampaignLibrary(
      'bestiary',
      record.name,
      recordToCampaignMarkdown(record)
    )
    if (!result) return
    setCampaign(result.campaign)
    return result.existed ? 'exists' : 'added'
  }

  const combat = campaign?.combat ?? emptyCombat()
  const nextFile = campaign ? adjacentCampaignFile(campaign.tree, openPath, 1) : null

  useEffect(() => {
    const live = campaign?.combat
    const entries = live ? combatToPlayerInitiative(live, combatProfileFor(campaign?.system)) : []
    const round = live?.round ?? 0
    if (skipRestoredCombatShow.current) {
      if (campaign) skipRestoredCombatShow.current = false
      void window.tabledm.setPlayerInitiative({ entries, show: false, round })
      return
    }
    void window.tabledm.setPlayerInitiative({
      entries,
      show: Boolean(live?.showOrderToPlayers && live.combatants.length > 0),
      round
    })
  }, [campaign, campaign?.combat])

  useEffect(() => {
    const prev = prevBoxOfDoomRef.current
    prevBoxOfDoomRef.current = player.boxOfDoom
    if (!prev || player.boxOfDoom) return
    const live = campaign?.combat
    const entries = live ? combatToPlayerInitiative(live, combatProfileFor(campaign?.system)) : []
    void window.tabledm.setPlayerInitiative({
      entries,
      show: Boolean(live?.showOrderToPlayers && live.combatants.length > 0),
      round: live?.round ?? 0
    })
  }, [player.boxOfDoom, campaign, campaign?.combat])

  function changeRightPanel(next: RightPanelId | null | ((prev: RightPanelId | null) => RightPanelId | null)): void {
    setRightPanel((prev) => {
      const value = typeof next === 'function' ? next(prev) : next
      if (value) {
        setLastRightPanel(value)
        void window.tabledm.saveSettings({ rightPanel: value, lastRightPanel: value })
      } else {
        void window.tabledm.saveSettings({ rightPanel: null })
      }
      return value
    })
  }

  useConsoleHotkeys({
    onBack: goBack,
    onNext: goNextFile,
    onShowArt: () => void showSelectedToPlayers(selectedImage, openPath, openKind, { mode: 'art' }),
    onShowHandout: (includeSecrets) =>
      void showSelectedToPlayers(selectedImage, openPath, openKind, { mode: 'handout', includeSecrets }),
    onClearPlayer: () => void clearPlayer(),
    onAdvanceTurn: () => {
      const live = campaign?.combat
      if (!live || live.combatants.length === 0) return
      changeRightPanel('combat')
      void saveCombat(advanceCombatTurn(live))
    }
  })

  return (
    <DiceLogProvider allowCrit={parseSystemId(campaign?.system) === 'dnd5e'}>
    <HideBundledArtworkProvider hide={hideNpcPortraits}>
    <AudioEngine state={mixer} onClock={setMixerClock} />
    <div className="flex h-full flex-col bg-ink text-parchment">
      <DmHeader
        campaign={campaign}
        rightPanel={rightPanel}
        combatCount={combat.combatants.length}
        mixerActive={mixerIsActive(mixer)}
        sidebarOpen={showLeftSidebar}
        onNewCampaign={() => void newCampaign()}
        onOpenCampaign={openFolder}
        onToggleSidebar={() => {
          setShowLeftSidebar((open) => {
            const next = !open
            void window.tabledm.saveSettings({ showLeftSidebar: next })
            return next
          })
        }}
        onToggleRightPanel={() => {
          changeRightPanel((open) => (open ? null : lastRightPanel))
        }}
        onToggleTools={() => changeRightPanel((open) => (open === 'tools' ? null : 'tools'))}
        onToggleCombat={() => changeRightPanel((open) => (open === 'combat' ? null : 'combat'))}
        onToggleMusic={() => {
          changeRightPanel((open) => (open === 'music' ? null : 'music'))
          void window.tabledm.getMixer().then(setMixer)
        }}
        onToggleHelp={() => changeRightPanel((open) => (open === 'help' ? null : 'help'))}
      />
      <div>
      <UpdateBanner
        notice={updateNotice}
        onUpdate={() => void window.tabledm.startUpdate()}
        onDismiss={() => {
          if (updateNotice && 'version' in updateNotice && updateNotice.version) {
            void window.tabledm.dismissUpdate(updateNotice.version)
          }
          setUpdateNotice(null)
        }}
      />
      </div>

      <div className="relative flex min-h-0 flex-1">
        {digitalRainEnabled(theme, campaign?.digitalRain) ? <DigitalRain /> : null}
        {showLeftSidebar ? (
          <div className="relative z-[1] flex w-64 shrink-0 flex-col border-r border-line">
            <PlayerPreview
              state={player}
              hidden={!showPlayerPreview}
              playerWindowOpen={playerWindowOpen}
              displays={displays}
              playerDisplayId={playerDisplayId}
              onClear={() => void clearPlayer()}
              onCloseWindow={() => {
                void window.tabledm.closePlayerWindow().then(setPlayerWindowOpen)
              }}
              onPickDisplay={(id) => {
                setPlayerDisplayId(id)
                void window.tabledm.placePlayerOnDisplay(id).then((screens) => {
                  setDisplays(screens)
                  void window.tabledm.getPlayerWindowOpen().then(setPlayerWindowOpen)
                })
              }}
              onRefreshDisplays={async () => {
                setDisplays(await window.tabledm.getDisplays())
              }}
              onToggle={() => {
                setShowPlayerPreview((open) => {
                  const next = !open
                  void window.tabledm.saveSettings({ showPlayerPreview: next })
                  return next
                })
              }}
            />
            {campaign ? (
              <CampaignFiles
                tree={campaign.tree}
                campaignName={campaign.name}
                selected={openPath}
                onOpen={(node) => void openTreeFile(node)}
                onTreeChange={(info, path) => {
                  setCampaign(info)
                  pruneHistory((p) => Boolean(findTreeNode(info.tree, p)))
                  if (path === '') {
                    clearOpen()
                    return
                  }
                  if (!path) return
                  const node = findTreeNode(info.tree, path)
                  navigateTo(path, node ? fileKind(node) : 'note')
                }}
              />
            ) : (
              <div className="matrix-rain-well flex-1 px-3 py-4 text-xs text-muted">Open a campaign to see files.</div>
            )}
            <DiceTray />
          </div>
        ) : null}
        <div className="relative z-[1] flex min-h-0 min-w-0 flex-1">
        <SessionNotes
          path={openPath}
          kind={openKind}
          imageUrl={
            openKind === 'image' || openKind === 'pdf' || openKind === 'audio'
              ? campaignFileUrl(openPath)
              : undefined
          }
          images={campaign ? flattenImages(campaign.tree) : []}
          notes={campaign ? flattenNotes(campaign.tree) : []}
          selectedImage={selectedImage}
          disabled={!campaign}
          onSelectImage={setSelectedImage}
          onShowToPlayers={(options) =>
            void showSelectedToPlayers(selectedImage, openPath, openKind, options)
          }
          onPlayCrawl={(title, body, logoSrc, preface, musicPath, endSrc) =>
            void playCrawl(title, body, logoSrc, preface, musicPath, endSrc)
          }
          onStopCrawl={() => void stopCrawl()}
          activeCrawl={activeCrawl}
          playerCrawl={player.crawl}
          onPlayLegend={(title, body, logoSrc, preface, musicPath, endSrc, look) =>
            void playLegend(title, body, logoSrc, preface, musicPath, endSrc, look)
          }
          onStopLegend={() => void stopLegend()}
          activeLegend={activeLegend}
          playerLegend={player.legend}
          onPlayGallery={(title, slides, imageRefs, intervalSec, loop, showTitle) =>
            void playGallery(title, slides, imageRefs, intervalSec, loop, showTitle)
          }
          onStopGallery={() => void stopGallery()}
          onGalleryPrev={() => void galleryPrev()}
          onGalleryNext={() => void galleryNext()}
          activeGallery={activeGallery}
          playerGallery={player.gallery}
          onPlayVideo={(title, src, muted, videoRef) => void playVideo(title, src, muted, videoRef)}
          onStopVideo={() => void stopVideo()}
          activeVideo={activeVideo}
          playerVideo={player.video}
          onPlayPhone={(title, photoSrc, ringSrc, npcRef) =>
            void playPhone(title, photoSrc, ringSrc, npcRef)
          }
          onStopPhone={() => void stopPhone()}
          onAnswerPhone={() => void answerPhone()}
          activePhone={activePhone}
          playerPhone={player.phone}
          onPlayHyperspace={(title, shipSrc, planetSrc, shipRef, planetRef, enterSound, loopSound, exitSound) =>
            void playHyperspace(
              title,
              shipSrc,
              planetSrc,
              shipRef,
              planetRef,
              enterSound,
              loopSound,
              exitSound
            )
          }
          onStopHyperspace={() => void stopHyperspace()}
          onArriveHyperspace={() => void arriveHyperspace()}
          activeHyperspace={activeHyperspace}
          playerHyperspace={player.hyperspace}
          videos={campaign ? flattenVideos(campaign.tree) : []}
          musicTracks={mixer.library.music.flatMap((playlist) => playlist.tracks)}
          onMapLiveView={handleMapLiveView}
          onOpenNote={openNote}
          onBack={history.length > 0 ? goBack : undefined}
          backLabel={
            history.length > 0
              ? imageTitle(history[history.length - 1].path).replace(/^PC\s+[—–-]\s+/i, '')
              : undefined
          }
          onNext={nextFile ? goNextFile : undefined}
          nextLabel={nextFile ? imageTitle(nextFile.relativePath).replace(/^PC\s+[—–-]\s+/i, '') : undefined}
          onAddNpcToCombat={addNpcFromSheet}
          onAddEncounter={addEncounterItems}
          onCampaignChange={setCampaign}
          onNewCampaign={() => void newCampaign()}
          onOpenCampaign={() => void openFolder()}
          onOpenSample={() => void openSample()}
          recentCampaigns={recentCampaigns}
          onOpenRecent={(folder) => void openRecent(folder)}
          shopsEnabled={getSystemPack(campaign?.system).shopsEnabled}
          theme={theme}
          onThemeChange={(next) => void changeCampaignTheme(next)}
          holoPortraits={holoPortraitsEnabled(theme, campaign?.holoPortraits)}
          digitalRain={digitalRainEnabled(theme, campaign?.digitalRain)}
          onHoloPortraitsChange={campaign ? (enabled) => void changeHoloPortraits(enabled) : undefined}
          onDigitalRainChange={campaign ? (enabled) => void changeDigitalRain(enabled) : undefined}
          currencies={campaign?.currencies}
          system={campaign?.system}
          onEnsureGear={ensureGearFromLookup}
          onEnsureMonster={ensureMonsterFromLookup}
        />
        {rightPanel === 'music' ? (
          <MusicPanel
            state={mixer}
            clock={mixerClock}
            disabled={!campaign}
          />
        ) : null}
        {rightPanel === 'combat' ? (
          <CombatTracker
            combat={combat}
            system={campaign?.system}
            bestiary={
              campaign
                ? bestiaryNotes(flattenNotes(campaign.tree)).map((note) => ({
                    path: note.relativePath,
                    name: sheetDisplayName(note.stem)
                  }))
                : []
            }
            partyCount={campaign ? allPartyNotes(flattenNotes(campaign.tree)).length : 0}
            onAddParty={addPartyToCombat}
            onAddBestiary={(path) => void addBestiaryToCombat(path)}
            onChange={(next) => void saveCombat(next)}
          />
        ) : null}
        {rightPanel === 'tools' ? (
          <div className={`flex min-h-0 ${SIDE_PANEL_WIDTH} shrink-0 flex-col`}>
            <ToolsPanel
              tab={toolsTab}
              onTabChange={(next) => {
                setToolsTab(next)
                void window.tabledm.saveSettings({ toolsTab: next })
              }}
              system={campaign?.system}
              canCreateNpc={Boolean(campaign)}
              onCreateNpc={(input) => void createNpcFromQuickCreate(input)}
              hideNpcPortraits={hideNpcPortraits}
              onHideNpcPortraits={(hide) => {
                setHideNpcPortraits(hide)
                void window.tabledm.saveSettings({ hideNpcPortraits: hide })
              }}
              onAddMonster={addMonster}
              onSaveToCampaign={saveLookupToCampaign}
              canSaveToCampaign={Boolean(campaign)}
              boxOfDoom={player.boxOfDoom ?? null}
              diceCheckSound={diceCheckSound}
              onDiceCheckSound={(on) => {
                setDiceCheckSound(on)
                void window.tabledm.saveSettings({ diceCheckSound: on })
              }}
            />
          </div>
        ) : null}
        {rightPanel === 'help' ? (
          <HelpPanel
            updateNotice={updateNotice}
            onCheckUpdate={() => void window.tabledm.checkForUpdate(true)}
            onStartUpdate={() => void window.tabledm.startUpdate()}
            theme={theme}
            onThemeChange={(next) => void changeCampaignTheme(next)}
            holoPortraits={holoPortraitsEnabled(theme, campaign?.holoPortraits)}
            onHoloPortraitsChange={campaign ? (enabled) => void changeHoloPortraits(enabled) : undefined}
            digitalRain={digitalRainEnabled(theme, campaign?.digitalRain)}
            onDigitalRainChange={campaign ? (enabled) => void changeDigitalRain(enabled) : undefined}
            currencies={campaign?.currencies}
            onCurrenciesChange={campaign ? (next) => void changeCurrencies(next) : undefined}
            hideNpcPortraits={hideNpcPortraits}
            onHideNpcPortraitsChange={(hide) => {
              setHideNpcPortraits(hide)
              void window.tabledm.saveSettings({ hideNpcPortraits: hide })
            }}
          />
        ) : null}
        </div>
      </div>
      {campaignSetup?.step === 'system' ? (
        <SystemPicker onPick={(id) => void newCampaign(id)} onCancel={() => setCampaignSetup(null)} />
      ) : null}
      {campaignSetup?.step === 'theme' ? (
        <ThemeSetup
          onPick={(id, options) => void newCampaign(campaignSetup.system, id, options)}
          onBack={() => setCampaignSetup({ step: 'system' })}
          onCancel={() => setCampaignSetup(null)}
        />
      ) : null}
    </div>
    </HideBundledArtworkProvider>
    </DiceLogProvider>
  )
}
