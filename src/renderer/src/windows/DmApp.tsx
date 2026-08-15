import { useCallback, useEffect, useState } from 'react'
import type { CampaignInfo, Character, CombatState, DisplayInfo, MediaItem, PlayerState } from '../../../shared/types'
import { emptyCombat, emptyPlayerState } from '../../../shared/types'
import CombatTracker from '../components/CombatTracker'
import MediaLibrary from '../components/MediaLibrary'
import RulesSearch from '../components/RulesSearch'
import SessionNotes from '../components/SessionNotes'
import { monsterToStatBlock, type SrdRecord } from '../lib/srd'

export default function DmApp() {
  const [campaign, setCampaign] = useState<CampaignInfo | null>(null)
  const [player, setPlayer] = useState<PlayerState>(emptyPlayerState())
  const [displays, setDisplays] = useState<DisplayInfo[]>([])

  const refresh = useCallback(async () => {
    const [info, state, screens] = await Promise.all([
      window.tabledm.getCampaign(),
      window.tabledm.getPlayerState(),
      window.tabledm.getDisplays()
    ])
    setCampaign(info)
    setPlayer(state)
    setDisplays(screens)
  }, [])

  useEffect(() => {
    refresh()
    return window.tabledm.onPlayerState(setPlayer)
  }, [refresh])

  async function openFolder(): Promise<void> {
    const info = await window.tabledm.pickCampaignFolder()
    setCampaign(info)
    setPlayer(await window.tabledm.getPlayerState())
  }

  async function openSample(): Promise<void> {
    const info = await window.tabledm.openSampleCampaign()
    setCampaign(info)
    setPlayer(await window.tabledm.getPlayerState())
  }

  async function showMedia(item: MediaItem): Promise<void> {
    setPlayer(await window.tabledm.showImage(item.url, item.name))
  }

  async function clearPlayer(): Promise<void> {
    setPlayer(await window.tabledm.clearPlayer())
  }

  async function saveCombat(next: CombatState): Promise<void> {
    const info = await window.tabledm.saveCombat(next)
    if (info) setCampaign(info)
  }

  function addMonster(record: SrdRecord): void {
    const block = monsterToStatBlock(record.data)
    const hp = Number(block.hp ?? 10)
    const combat = campaign?.combat ?? emptyCombat()
    const combatant = {
      id: crypto.randomUUID(),
      name: block.name,
      kind: 'monster' as const,
      initiative: 0,
      hp,
      maxHp: hp,
      ac: Number(block.ac ?? 10),
      statBlock: block,
      sourceId: record.id
    }
    void saveCombat({
      ...combat,
      combatants: [...combat.combatants, combatant],
      activeId: combat.activeId ?? combatant.id
    })
  }

  function selectCharacter(character: Character): void {
    const combat = campaign?.combat ?? emptyCombat()
    const existing = combat.combatants.find((c) => c.sourceId === character.id)
    if (existing) {
      void saveCombat({ ...combat, activeId: existing.id })
    }
  }

  const combat = campaign?.combat ?? emptyCombat()

  return (
    <div className="flex h-full flex-col bg-ink text-parchment">
      <header className="flex items-center gap-3 border-b border-line bg-panel px-4 py-2">
        <div>
          <div className="font-display text-xl leading-none text-amber">Table DM</div>
          <div className="text-[11px] text-muted">5e compatible · second-monitor player view</div>
        </div>
        <div className="ml-4 min-w-0 flex-1">
          <div className="truncate text-sm">{campaign?.name ?? 'No campaign open'}</div>
          <div className="truncate text-[11px] text-muted">{campaign?.folder ?? 'Choose a folder to begin'}</div>
        </div>
        <button type="button" onClick={openFolder} className="rounded border border-line px-3 py-1 text-sm hover:border-amber">
          Open campaign
        </button>
        <button type="button" onClick={openSample} className="rounded border border-line px-3 py-1 text-sm hover:border-amber">
          Sample
        </button>
        {displays.length > 1 ? (
          <select
            className="rounded border border-line bg-ink px-2 py-1 text-xs"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) void window.tabledm.placePlayerOnDisplay(Number(e.target.value))
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

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(260px,1fr)_minmax(360px,1.25fr)_minmax(300px,1fr)]">
        <SessionNotes sessions={campaign?.sessions ?? []} disabled={!campaign} />
        <CombatTracker
          party={campaign?.party ?? []}
          npcs={campaign?.npcs ?? []}
          combat={combat}
          onChange={(next) => void saveCombat(next)}
          onSelectCharacter={selectCharacter}
        />
        <RulesSearch onAddMonster={addMonster} />
      </div>

      <MediaLibrary
        items={campaign?.media ?? []}
        currentTitle={player.imageTitle}
        disabled={!campaign}
        onShow={(item) => void showMedia(item)}
        onClear={() => void clearPlayer()}
      />
    </div>
  )
}
