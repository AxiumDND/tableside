import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  CampaignInfo,
  CampaignTreeNode,
  CombatState,
  Combatant,
  DisplayInfo,
  RecentCampaign
} from '../../../shared/types'
import { emptyMixerClock, emptyMixerState, mixerIsActive } from '../../../shared/audio'
import { emptyCombat } from '../../../shared/types'
import {
  applyThemeToDocument,
  digitalRainEnabled,
  holoPortraitsEnabled,
  resolveConsoleTheme,
  type ThemeId,
  type ThemeOptions
} from '../../../shared/theme'
import { getSystemPack, type SystemId } from '../../../shared/systemPack'
import CampaignFiles, {
  campaignFileUrl,
  fileKind,
  type FileKind
} from '../components/CampaignFiles'
import AudioEngine from '../components/AudioEngine'
import CombatTracker from '../components/CombatTracker'
import MusicPanel from '../components/MusicPanel'
import DiceTray, { DiceLogProvider } from '../components/DiceTray'
import HelpPanel from '../components/HelpPanel'
import PlayerPreview from '../components/PlayerPreview'
import RulesSearch from '../components/RulesSearch'
import SessionNotes, { type EncounterAddItem } from '../components/SessionNotes'
import SystemPicker from '../components/SystemPicker'
import ThemeSetup from '../components/ThemeSetup'
import DigitalRain from '../components/DigitalRain'
import { combatToPlayerInitiative, combatProfileFor, advanceCombatTurn, rollInitiativeFor } from '../lib/combat'
import { flattenImages, flattenVideos, imageTitle, isImagePath, isPdfPath } from '../lib/images'
import {
  allPartyNotes,
  bestiaryNotes,
  flattenNotes,
  partyNotes,
  pcCombatName,
  sameCombatantName,
  sheetDisplayName
} from '../lib/notes'
import { libraryFolderFor, recordToCampaignMarkdown, gearSubfolderFor } from '../lib/lookupNotes'
import { monsterToStatBlock, type SrdRecord } from '../lib/srd'
import { extractStatblock, fallbackStatblock, parsedToStatBlock, type ParsedStatblock } from '../lib/statblock'
import { APP_NAME, APP_VERSION } from '../../../shared/version'
import type { AppUpdateNotice } from '../../../shared/appUpdate'
import appIcon from '../assets/icon.png'
import UpdateBanner from '../components/UpdateBanner'
import { adjacentCampaignFile, canonicalFolder } from '../../../shared/campaignLayout'
import { usePlayerPlayback } from '../hooks/usePlayerPlayback'

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
    clearPlayer
  } = usePlayerPlayback(setMixer)
  const [mixerClock, setMixerClock] = useState(() => emptyMixerClock())
  const [displays, setDisplays] = useState<DisplayInfo[]>([])
  const [rightPanel, setRightPanel] = useState<'combat' | 'lookup' | 'help' | 'music' | null>(null)
  const [openPath, setOpenPath] = useState('')
  const [openKind, setOpenKind] = useState<FileKind>('note')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [history, setHistory] = useState<{ path: string; kind: FileKind }[]>([])
  const [playerDisplayId, setPlayerDisplayId] = useState<number | ''>('')
  const [showPlayerPreview, setShowPlayerPreview] = useState(true)
  const [showLeftSidebar, setShowLeftSidebar] = useState(true)
  const [theme, setTheme] = useState<ThemeId>('classic')
  const [playerWindowOpen, setPlayerWindowOpen] = useState(false)
  const [recentCampaigns, setRecentCampaigns] = useState<RecentCampaign[]>([])
  const [campaignSetup, setCampaignSetup] = useState<null | { step: 'system' } | { step: 'theme'; system: SystemId }>(
    null
  )
  const [updateNotice, setUpdateNotice] = useState<AppUpdateNotice | null>(null)
  const skipRestoredCombatShow = useRef(true)

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
    if (
      prefs.rightPanel === 'combat' ||
      prefs.rightPanel === 'lookup' ||
      prefs.rightPanel === 'help' ||
      prefs.rightPanel === 'music' ||
      prefs.rightPanel === null
    ) {
      setRightPanel(prefs.rightPanel ?? null)
    }
    if (info && !openPath) {
      const remembered =
        prefs.lastOpenPath && findTreeNode(info.tree, prefs.lastOpenPath)
          ? prefs.lastOpenPath
          : firstNote(info.tree)
      if (remembered) {
        const node = findTreeNode(info.tree, remembered)
        setOpenPath(remembered)
        setOpenKind(node ? fileKind(node) : 'note')
      }
    }
  }, [openPath])

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
  }, [refresh])

  function applyConsoleTheme(next: ThemeId): void {
    setTheme(next)
    applyThemeToDocument(next)
    void window.tabledm.saveSettings({ theme: next })
  }

  function applyCampaign(info: CampaignInfo | null, appTheme?: string | null): void {
    setCampaign(info)
    applyConsoleTheme(resolveConsoleTheme(info?.theme, appTheme))
    const note = info ? firstNote(info.tree) : ''
    setOpenPath(note)
    setOpenKind('note')
    setSelectedImage(null)
    setHistory([])
    skipRestoredCombatShow.current = true
    void clearPlayer()
    void window.tabledm.saveSettings({
      lastOpenPath: note || undefined,
      lastOpenKind: note ? 'note' : undefined
    })
  }

  async function openFolder(): Promise<void> {
    const info = await window.tabledm.pickCampaignFolder()
    applyCampaign(info)
    setPlayer(await window.tabledm.getPlayerState())
    setMixer(await window.tabledm.getMixer())
    setRecentCampaigns((await window.tabledm.getSettings()).recentCampaigns ?? [])
  }

  async function newCampaign(system?: SystemId, themeId?: ThemeId, options?: ThemeOptions): Promise<void> {
    if (!system) {
      setCampaignSetup({ step: 'system' })
      return
    }
    if (!themeId) {
      setCampaignSetup({ step: 'theme', system })
      return
    }
    setCampaignSetup(null)
    const info = await window.tabledm.newCampaign(system, themeId, options)
    applyCampaign(info, themeId)
    setPlayer(await window.tabledm.getPlayerState())
    setMixer(await window.tabledm.getMixer())
    setRecentCampaigns((await window.tabledm.getSettings()).recentCampaigns ?? [])
  }

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

  async function openSample(): Promise<void> {
    const info = await window.tabledm.openSampleCampaign()
    applyCampaign(info)
    setPlayer(await window.tabledm.getPlayerState())
    setMixer(await window.tabledm.getMixer())
    setRecentCampaigns((await window.tabledm.getSettings()).recentCampaigns ?? [])
  }

  async function openRecent(folder: string): Promise<void> {
    const info = await window.tabledm.openCampaignPath(folder)
    applyCampaign(info)
    setPlayer(await window.tabledm.getPlayerState())
    setMixer(await window.tabledm.getMixer())
    const prefs = await window.tabledm.getSettings()
    setRecentCampaigns(prefs.recentCampaigns ?? [])
  }

  function navigateTo(path: string, kind: FileKind): void {
    if (!path || path === openPath) {
      setOpenKind(kind)
      setSelectedImage(kind === 'image' ? path : null)
      return
    }
    if (openPath) {
      setHistory((stack) => [...stack, { path: openPath, kind: openKind }].slice(-40))
    }
    setOpenPath(path)
    setOpenKind(kind)
    setSelectedImage(kind === 'image' ? path : null)
    void window.tabledm.saveSettings({ lastOpenPath: path, lastOpenKind: kind })
  }

  function goBack(): void {
    if (history.length === 0) return
    const prev = history[history.length - 1]
    setHistory((stack) => stack.slice(0, -1))
    setOpenPath(prev.path)
    setOpenKind(prev.kind)
    setSelectedImage(prev.kind === 'image' ? prev.path : null)
    void window.tabledm.saveSettings({ lastOpenPath: prev.path, lastOpenKind: prev.kind })
  }

  function showFile(path: string, kind: FileKind): void {
    setOpenPath(path)
    setOpenKind(kind)
    setSelectedImage(kind === 'image' ? path : null)
    void window.tabledm.saveSettings({ lastOpenPath: path, lastOpenKind: kind })
  }

  function goNextFile(): void {
    if (!campaign) return
    const next = adjacentCampaignFile(campaign.tree, openPath, 1)
    if (!next) return
    showFile(next.relativePath, fileKind(next))
  }

  async function openTreeFile(node: CampaignTreeNode): Promise<void> {
    navigateTo(node.relativePath, fileKind(node))
  }

  async function saveCombat(next: CombatState): Promise<void> {
    const info = await window.tabledm.saveCombat(next)
    if (info) setCampaign(info)
  }

  const loadPartyItems = useCallback(async (): Promise<EncounterAddItem[]> => {
    if (!campaign) return []
    const notes = flattenNotes(campaign.tree)
    const from = openPath || firstNote(campaign.tree)
    const items: EncounterAddItem[] = []
    const seen = new Set<string>()
    for (const pc of partyNotes(from, notes)) {
      const text = await window.tabledm.readFile(pc.relativePath)
      const parsed = extractStatblock(text)?.block ?? fallbackStatblock(pc.relativePath, text)
      items.push({
        block: parsed,
        kind: 'pc',
        sourceId: pc.relativePath,
        name: pcCombatName(pc.relativePath)
      })
      seen.add(parsed.name.toLowerCase())
    }
    for (const pc of campaign.party) {
      if (seen.has(pc.name.toLowerCase())) continue
      items.push({
        block: {
          name: pc.name,
          ac: String(pc.ac),
          hp: pc.maxHp,
          stats: [10, 10, 10, 10, 10, 10],
          saves: {},
          skills: {},
          traits: [],
          actions: [],
          bonusActions: [],
          reactions: [],
          legendary: []
        },
        kind: 'pc',
        sourceId: pc.id,
        name: pcCombatName(pc.name)
      })
    }
    return items
  }, [campaign, openPath])

  function addMonster(record: SrdRecord): void {
    const block = monsterToStatBlock(record.data)
    const hp = Number(block.hp ?? 10)
    const willpower =
      typeof record.data.willpower === 'number' ? record.data.willpower : undefined
    const hunger = typeof record.data.hunger === 'number' ? record.data.hunger : undefined
    void addEncounterItems([], {
      id: crypto.randomUUID(),
      name: block.name,
      kind: 'monster',
      initiative: 0,
      hp,
      maxHp: hp,
      ac: Number(block.ac ?? 10),
      willpower,
      maxWillpower: willpower,
      hunger,
      statBlock: block,
      sourceId: record.id
    })
  }

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

  function addNpcFromSheet(block: ParsedStatblock, notePath?: string): void {
    const sourceId = notePath || `sheet:${block.name}`
    const name = notePath ? sheetDisplayName(notePath) : block.name
    void addEncounterItems([{ block, kind: 'npc', sourceId, name }])
  }

  function nextCopyName(base: string, existing: Combatant[]): string {
    if (!existing.some((c) => c.name === base)) return base
    let n = 2
    while (existing.some((c) => c.name === `${base} ${n}`)) n += 1
    return `${base} ${n}`
  }

  function addPartyToCombat(): void {
    void addEncounterItems([])
  }

  async function addBestiaryToCombat(notePath: string): Promise<void> {
    const text = await window.tabledm.readFile(notePath)
    const parsed = extractStatblock(text)?.block ?? fallbackStatblock(notePath, text)
    const live = campaign?.combat ?? emptyCombat()
    const name = nextCopyName(sheetDisplayName(notePath), live.combatants)
    await addEncounterItems(
      [{ block: parsed, kind: 'monster', sourceId: `${notePath}#${name}`, name }],
      undefined,
      false
    )
  }

  async function addEncounterItems(
    items: EncounterAddItem[],
    extra?: Combatant,
    includeParty = true
  ): Promise<void> {
    const party = includeParty ? await loadPartyItems() : []
    const combined = [...party, ...items]
    const combat = campaign?.combat ?? emptyCombat()
    const next = [...combat.combatants]
    let added = 0
    for (const item of combined) {
      const existing =
        item.kind === 'monster'
          ? next.find((c) => c.sourceId && item.sourceId && c.sourceId === item.sourceId)
          : next.find(
              (c) =>
                (c.sourceId && item.sourceId && c.sourceId === item.sourceId) ||
                sameCombatantName(c.name, item.name)
            )
      if (existing) {
        if (existing.name !== item.name) {
          existing.name = item.name
          added += 1
        }
        continue
      }
      const statBlock = parsedToStatBlock(item.block)
      next.push({
        id: crypto.randomUUID(),
        name: item.name,
        kind: item.kind,
        initiative: 0,
        hp: statBlock.hp ?? 10,
        maxHp: statBlock.hp ?? 10,
        ac: statBlock.ac ?? 10,
        willpower: item.block.willpower,
        maxWillpower: item.block.maxWillpower ?? item.block.willpower,
        hunger: item.block.hunger,
        sourceId: item.sourceId,
        statBlock
      })
      added += 1
    }
    if (extra && !next.some((c) => c.sourceId === extra.sourceId || c.id === extra.id)) {
      next.push(extra)
      added += 1
    }
    if (added > 0) {
      const withInit = rollInitiativeFor(next, 'unrolled-npcs')
      await saveCombat({
        ...combat,
        combatants: withInit,
        activeId: combat.activeId
      })
    }
    changeRightPanel('combat')
  }

  function openNote(notePath: string): void {
    navigateTo(
      notePath,
      isImagePath(notePath) ? 'image' : isPdfPath(notePath) ? 'pdf' : 'note'
    )
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

  function changeRightPanel(next: typeof rightPanel | ((prev: typeof rightPanel) => typeof rightPanel)): void {
    setRightPanel((prev) => {
      const value = typeof next === 'function' ? next(prev) : next
      void window.tabledm.saveSettings({ rightPanel: value })
      return value
    })
  }

  useEffect(() => {
    const typing = (target: EventTarget | null): boolean =>
      target instanceof HTMLElement &&
      (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)

    const onKey = (e: KeyboardEvent): void => {
      if (typing(e.target)) return
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault()
        goBack()
        return
      }
      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault()
        goNextFile()
        return
      }
      if (!(e.altKey && !e.ctrlKey && !e.metaKey)) return
      const key = e.key.toLowerCase()
      if (key === 's') {
        e.preventDefault()
        void showSelectedToPlayers(selectedImage, openPath, openKind)
        return
      }
      if (key === 'x') {
        e.preventDefault()
        void clearPlayer()
        return
      }
      if (key === 't') {
        e.preventDefault()
        const live = campaign?.combat
        if (!live || live.combatants.length === 0) return
        changeRightPanel('combat')
        void saveCombat(advanceCombatTurn(live))
      }
    }
    const onMouse = (e: MouseEvent): void => {
      if (e.button === 3) {
        e.preventDefault()
        goBack()
        return
      }
      if (e.button === 4) {
        e.preventDefault()
        goNextFile()
      }
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mouseup', onMouse)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mouseup', onMouse)
    }
  }, [history, openPath, openKind, campaign, selectedImage])

  return (
    <DiceLogProvider>
    <AudioEngine state={mixer} onClock={setMixerClock} />
    <div className="flex h-full flex-col bg-ink text-parchment">
      <header className="flex items-center gap-3 border-b border-line bg-panel px-4 py-2">
        <div>
          <div className="flex items-center gap-2">
            <img src={appIcon} alt="" className="h-7 w-7 rounded-sm" />
            <div className="flex items-baseline gap-2">
              <div className="font-display text-xl leading-none text-amber">{APP_NAME}</div>
              <div className="text-[11px] font-semibold tracking-wide text-amber-dim">v{APP_VERSION}</div>
            </div>
          </div>
          <div className="text-[11px] text-muted">
            {campaign ? `${getSystemPack(campaign.system).shortLabel} · second-monitor player view` : 'Table tool · second-monitor player view'}
          </div>
        </div>
        <div className="ml-4 min-w-0 flex-1">
          <div className="truncate text-sm">{campaign?.name ?? 'No campaign open'}</div>
          <div className="truncate text-[11px] text-muted">{campaign?.folder ?? 'Choose a folder to begin'}</div>
        </div>
        <button type="button" onClick={() => void newCampaign()} className="rounded border border-line px-3 py-1 text-sm hover:border-amber">
          New campaign
        </button>
        <button type="button" onClick={openFolder} className="rounded border border-line px-3 py-1 text-sm hover:border-amber">
          Open campaign
        </button>
        <button
          type="button"
          onClick={() => changeRightPanel((open) => (open === 'lookup' ? null : 'lookup'))}
          className={`rounded px-3 py-1 text-sm ${
            rightPanel === 'lookup' ? 'bg-amber font-semibold text-on-amber' : 'border border-line hover:border-amber'
          }`}
        >
          Lookup
        </button>
        <button
          type="button"
          onClick={() => {
            changeRightPanel((open) => (open === 'combat' ? null : 'combat'))
          }}
          className={`rounded px-3 py-1 text-sm ${
            rightPanel === 'combat' ? 'bg-amber font-semibold text-on-amber' : 'border border-line hover:border-amber'
          }`}
        >
          Combat
          {combat.combatants.length > 0 ? ` (${combat.combatants.length})` : ''}
        </button>
        <button
          type="button"
          onClick={() => {
            changeRightPanel((open) => (open === 'music' ? null : 'music'))
            void window.tabledm.getMixer().then(setMixer)
          }}
          className={`rounded px-3 py-1 text-sm ${
            rightPanel === 'music' ? 'bg-amber font-semibold text-on-amber' : 'border border-line hover:border-amber'
          }`}
        >
          Music
          {mixerIsActive(mixer) ? ' ·' : ''}
        </button>
        <button
          type="button"
          onClick={() => changeRightPanel((open) => (open === 'help' ? null : 'help'))}
          className={`rounded px-3 py-1 text-sm ${
            rightPanel === 'help' ? 'bg-amber font-semibold text-on-amber' : 'border border-line hover:border-amber'
          }`}
        >
          Help & settings
        </button>
      </header>
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
            <div className="flex items-center justify-between border-b border-line px-2 py-1">
              <span className="text-[10px] uppercase tracking-wider text-muted">Sidebar</span>
              <button
                type="button"
                onClick={() => {
                  setShowLeftSidebar(false)
                  void window.tabledm.saveSettings({ showLeftSidebar: false })
                }}
                className="text-[11px] text-muted hover:text-amber"
              >
                Hide
              </button>
            </div>
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
                  setHistory((stack) => stack.filter((item) => findTreeNode(info.tree, item.path)))
                  if (path === '') {
                    setOpenPath('')
                    setOpenKind('note')
                    setSelectedImage(null)
                    void window.tabledm.saveSettings({ lastOpenPath: undefined, lastOpenKind: undefined })
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
        ) : (
          <div className="relative z-[1] flex w-9 shrink-0 flex-col items-center border-r border-line py-2">
            <button
              type="button"
              onClick={() => {
                setShowLeftSidebar(true)
                void window.tabledm.saveSettings({ showLeftSidebar: true })
              }}
              className="rounded border border-line px-1 py-2 text-[11px] hover:border-amber"
              style={{ writingMode: 'vertical-rl' }}
              title="Show sidebar"
            >
              Show sidebar
            </button>
          </div>
        )}
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
          onShowToPlayers={() => void showSelectedToPlayers(selectedImage, openPath, openKind)}
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
            onClose={() => changeRightPanel(null)}
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
            onClose={() => changeRightPanel(null)}
          />
        ) : null}
        {rightPanel === 'lookup' ? (
          <div className={`flex min-h-0 ${SIDE_PANEL_WIDTH} shrink-0 flex-col`}>
            <RulesSearch
              system={campaign?.system}
              onAddMonster={addMonster}
              onSaveToCampaign={saveLookupToCampaign}
              canSaveToCampaign={Boolean(campaign)}
              onClose={() => changeRightPanel(null)}
            />
          </div>
        ) : null}
        {rightPanel === 'help' ? (
          <HelpPanel
            onClose={() => changeRightPanel(null)}
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
    </DiceLogProvider>
  )
}
