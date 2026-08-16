import { useCallback, useEffect, useState } from 'react'
import type {
  CampaignInfo,
  CampaignTreeNode,
  CombatState,
  Combatant,
  DisplayInfo,
  PlayerState
} from '../../../shared/types'
import { emptyCombat, emptyPlayerState } from '../../../shared/types'
import CampaignFiles, {
  campaignFileUrl,
  fileKind,
  type FileKind
} from '../components/CampaignFiles'
import CombatTracker from '../components/CombatTracker'
import DiceTray, { DiceLogProvider } from '../components/DiceTray'
import HelpPanel from '../components/HelpPanel'
import PlayerPreview from '../components/PlayerPreview'
import RulesSearch from '../components/RulesSearch'
import SessionNotes, { type EncounterAddItem } from '../components/SessionNotes'
import { combatToPlayerInitiative } from '../lib/combat'
import { flattenImages, imageTitle, isImagePath, isPdfPath } from '../lib/images'
import {
  allPartyNotes,
  bestiaryNotes,
  flattenNotes,
  partyNotes,
  sameCombatantName,
  sheetDisplayName
} from '../lib/notes'
import { libraryFolderFor, recordToCampaignMarkdown } from '../lib/lookupNotes'
import { monsterToStatBlock, type SrdRecord } from '../lib/srd'
import { extractStatblock, fallbackStatblock, parsedToStatBlock, type ParsedStatblock } from '../lib/statblock'
import { APP_VERSION } from '../../../shared/version'

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
  const overview = files.find((p) => /overview/i.test(p.split('/').pop() ?? ''))
  if (overview) return overview
  const night = files.find((p) => /night sheet/i.test(p))
  if (night) return night
  return files[0] ?? ''
}

export default function DmApp() {
  const [campaign, setCampaign] = useState<CampaignInfo | null>(null)
  const [player, setPlayer] = useState<PlayerState>(emptyPlayerState())
  const [displays, setDisplays] = useState<DisplayInfo[]>([])
  const [rightPanel, setRightPanel] = useState<'combat' | 'lookup' | 'help' | null>(null)
  const [openPath, setOpenPath] = useState('')
  const [openKind, setOpenKind] = useState<FileKind>('note')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [history, setHistory] = useState<{ path: string; kind: FileKind }[]>([])
  const [playerDisplayId, setPlayerDisplayId] = useState<number | ''>('')
  const [showPlayerPreview, setShowPlayerPreview] = useState(true)

  const refresh = useCallback(async () => {
    const [info, state, screens, prefs] = await Promise.all([
      window.tabledm.getCampaign(),
      window.tabledm.getPlayerState(),
      window.tabledm.getDisplays(),
      window.tabledm.getSettings()
    ])
    setCampaign(info)
    setPlayer(state)
    setDisplays(screens)
    setPlayerDisplayId(prefs.playerDisplayId ?? '')
    setShowPlayerPreview(prefs.showPlayerPreview !== false)
    if (
      prefs.rightPanel === 'combat' ||
      prefs.rightPanel === 'lookup' ||
      prefs.rightPanel === 'help' ||
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
    refresh()
    return window.tabledm.onPlayerState(setPlayer)
  }, [refresh])

  function applyCampaign(info: CampaignInfo | null): void {
    setCampaign(info)
    const note = info ? firstNote(info.tree) : ''
    setOpenPath(note)
    setOpenKind('note')
    setSelectedImage(null)
    setHistory([])
    void window.tabledm.saveSettings({
      lastOpenPath: note || undefined,
      lastOpenKind: note ? 'note' : undefined
    })
  }

  async function openFolder(): Promise<void> {
    const info = await window.tabledm.pickCampaignFolder()
    applyCampaign(info)
    setPlayer(await window.tabledm.getPlayerState())
  }

  async function newCampaign(): Promise<void> {
    const info = await window.tabledm.newCampaign()
    applyCampaign(info)
    setPlayer(await window.tabledm.getPlayerState())
  }

  async function openSample(): Promise<void> {
    const info = await window.tabledm.openSampleCampaign()
    applyCampaign(info)
    setPlayer(await window.tabledm.getPlayerState())
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

  async function openTreeFile(node: CampaignTreeNode): Promise<void> {
    navigateTo(node.relativePath, fileKind(node))
  }

  async function showSelectedToPlayers(): Promise<void> {
    const path = selectedImage ?? (openKind === 'image' ? openPath : null)
    if (!path) return
    setPlayer(await window.tabledm.showImage(campaignFileUrl(path), imageTitle(path)))
  }

  async function clearPlayer(): Promise<void> {
    setPlayer(await window.tabledm.clearPlayer())
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
        name: sheetDisplayName(pc.relativePath)
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
          reactions: []
        },
        kind: 'pc',
        sourceId: pc.id,
        name: pc.name
      })
    }
    return items
  }, [campaign, openPath])

  function addMonster(record: SrdRecord): void {
    const block = monsterToStatBlock(record.data)
    const hp = Number(block.hp ?? 10)
    void addEncounterItems([], {
      id: crypto.randomUUID(),
      name: block.name,
      kind: 'monster',
      initiative: 0,
      hp,
      maxHp: hp,
      ac: Number(block.ac ?? 10),
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
      recordToCampaignMarkdown(record)
    )
    if (!result) return
    setCampaign(result.campaign)
    navigateTo(result.path, 'note')
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
      await saveCombat({
        ...combat,
        combatants: next,
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

  useEffect(() => {
    const live = campaign?.combat
    if (!live) {
      void window.tabledm.setPlayerInitiative({ entries: [], show: false, round: 0 })
      return
    }
    void window.tabledm.setPlayerInitiative({
      entries: combatToPlayerInitiative(live),
      show: Boolean(live.showOrderToPlayers && live.combatants.length > 0),
      round: live.round
    })
  }, [campaign?.combat])

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
      if (!e.altKey || e.key !== 'ArrowLeft' || typing(e.target)) return
      e.preventDefault()
      goBack()
    }
    const onMouse = (e: MouseEvent): void => {
      if (e.button !== 3) return
      e.preventDefault()
      goBack()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mouseup', onMouse)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mouseup', onMouse)
    }
  }, [history, openPath, openKind])

  return (
    <DiceLogProvider>
    <div className="flex h-full flex-col bg-ink text-parchment">
      <header className="flex items-center gap-3 border-b border-line bg-panel px-4 py-2">
        <div>
          <div className="flex items-baseline gap-2">
            <div className="font-display text-xl leading-none text-amber">Table DM</div>
            <div className="text-[11px] font-semibold tracking-wide text-amber-dim">v{APP_VERSION}</div>
          </div>
          <div className="text-[11px] text-muted">5e compatible · second-monitor player view</div>
        </div>
        <div className="ml-4 min-w-0 flex-1">
          <div className="truncate text-sm">{campaign?.name ?? 'No campaign open'}</div>
          <div className="truncate text-[11px] text-muted">{campaign?.folder ?? 'Choose a folder to begin'}</div>
        </div>
        <button
          type="button"
          onClick={() => {
            changeRightPanel((open) => (open === 'combat' ? null : 'combat'))
          }}
          className={`rounded px-3 py-1 text-sm ${
            rightPanel === 'combat' ? 'bg-amber font-semibold text-ink' : 'border border-line hover:border-amber'
          }`}
        >
          Combat
          {combat.combatants.length > 0 ? ` (${combat.combatants.length})` : ''}
        </button>
        <button
          type="button"
          onClick={() => changeRightPanel((open) => (open === 'lookup' ? null : 'lookup'))}
          className={`rounded px-3 py-1 text-sm ${
            rightPanel === 'lookup' ? 'bg-amber font-semibold text-ink' : 'border border-line hover:border-amber'
          }`}
        >
          Lookup
        </button>
        <button
          type="button"
          onClick={() => changeRightPanel((open) => (open === 'help' ? null : 'help'))}
          className={`rounded px-3 py-1 text-sm ${
            rightPanel === 'help' ? 'bg-amber font-semibold text-ink' : 'border border-line hover:border-amber'
          }`}
        >
          Help
        </button>
        <button type="button" onClick={newCampaign} className="rounded border border-line px-3 py-1 text-sm hover:border-amber">
          New campaign
        </button>
        <button type="button" onClick={openFolder} className="rounded border border-line px-3 py-1 text-sm hover:border-amber">
          Open campaign
        </button>
        <button type="button" onClick={openSample} className="rounded border border-line px-3 py-1 text-sm hover:border-amber">
          Sample
        </button>
        {displays.length > 1 ? (
          <select
            className="rounded border border-line bg-ink px-2 py-1 text-xs"
            value={playerDisplayId}
            onChange={(e) => {
              if (!e.target.value) return
              const id = Number(e.target.value)
              setPlayerDisplayId(id)
              void window.tabledm.placePlayerOnDisplay(id)
            }}
          >
            <option value="">Player display…</option>
            {displays.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
                {d.primary ? ' (this PC)' : ''}
              </option>
            ))}
          </select>
        ) : null}
        <div className="text-right text-xs">
          <div className="text-muted">Player screen</div>
          <div>{player.imageTitle || 'Idle'}</div>
        </div>
        <button
          type="button"
          onClick={clearPlayer}
          className="rounded bg-amber px-3 py-1 text-sm font-semibold text-ink disabled:bg-line"
          disabled={!player.imageSrc}
        >
          Clear
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="flex w-64 shrink-0 flex-col border-r border-line">
          <PlayerPreview
            state={player}
            hidden={!showPlayerPreview}
            onClear={() => void clearPlayer()}
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
              selected={selectedImage ?? openPath}
              onOpen={(node) => void openTreeFile(node)}
              onTreeChange={(info, path) => {
                setCampaign(info)
                if (!path) return
                const node = findTreeNode(info.tree, path)
                navigateTo(path, node ? fileKind(node) : 'note')
              }}
            />
          ) : (
            <div className="flex-1 bg-ink px-3 py-4 text-xs text-muted">Open a campaign to see files.</div>
          )}
          <DiceTray />
        </div>
        <SessionNotes
          path={openPath}
          kind={openKind}
          imageUrl={openKind === 'image' || openKind === 'pdf' ? campaignFileUrl(openPath) : undefined}
          images={campaign ? flattenImages(campaign.tree) : []}
          notes={campaign ? flattenNotes(campaign.tree) : []}
          selectedImage={selectedImage}
          disabled={!campaign}
          onSelectImage={setSelectedImage}
          onShowToPlayers={selectedImage || openKind === 'image' ? () => void showSelectedToPlayers() : undefined}
          onOpenNote={openNote}
          onBack={history.length > 0 ? goBack : undefined}
          backLabel={
            history.length > 0
              ? imageTitle(history[history.length - 1].path).replace(/^PC\s+[—–-]\s+/i, '')
              : undefined
          }
          onAddNpcToCombat={addNpcFromSheet}
          onAddEncounter={addEncounterItems}
          onNewCampaign={() => void newCampaign()}
          onOpenCampaign={() => void openFolder()}
          onOpenSample={() => void openSample()}
        />
        {rightPanel === 'combat' ? (
          <CombatTracker
            combat={combat}
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
              onAddMonster={addMonster}
              onSaveToCampaign={saveLookupToCampaign}
              canSaveToCampaign={Boolean(campaign)}
              onClose={() => changeRightPanel(null)}
            />
          </div>
        ) : null}
        {rightPanel === 'help' ? <HelpPanel onClose={() => changeRightPanel(null)} /> : null}
      </div>
    </div>
    </DiceLogProvider>
  )
}
