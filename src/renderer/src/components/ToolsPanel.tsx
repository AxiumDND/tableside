import type { ToolsTabId } from '../../../shared/rightPanel'
import type { PlayerBoxOfDoom } from '../../../shared/types'
import type { SrdRecord } from '../lib/srd'
import BoxOfDoomPanel from './BoxOfDoomPanel'
import ImprovisePanel from './ImprovisePanel'
import NpcPanel, { type NpcQuickCreateInput } from './NpcPanel'
import RulesSearch from './RulesSearch'

const TOOLS: { id: ToolsTabId; label: string }[] = [
  { id: 'lookup', label: 'Lookup' },
  { id: 'npc', label: 'NPC' },
  { id: 'improvise', label: 'Improvise' },
  { id: 'dice', label: 'Dice' }
]

export default function ToolsPanel({
  tab,
  onTabChange,
  system,
  canCreateNpc,
  onCreateNpc,
  hideNpcPortraits,
  onHideNpcPortraits,
  onAddMonster,
  onSaveToCampaign,
  canSaveToCampaign,
  boxOfDoom,
  diceCheckSound,
  onDiceCheckSound
}: {
  tab: ToolsTabId
  onTabChange: (tab: ToolsTabId) => void
  system?: string | null
  canCreateNpc: boolean
  onCreateNpc: (input: NpcQuickCreateInput) => void | Promise<void>
  hideNpcPortraits: boolean
  onHideNpcPortraits: (hide: boolean) => void
  onAddMonster?: (record: SrdRecord) => void
  onSaveToCampaign?: (record: SrdRecord) => Promise<'added' | 'exists' | void> | 'added' | 'exists' | void
  canSaveToCampaign?: boolean
  boxOfDoom: PlayerBoxOfDoom | null
  diceCheckSound: boolean
  onDiceCheckSound: (on: boolean) => void
}) {
  return (
    <section className="flex min-h-0 flex-1 flex-col border-l border-line bg-panel">
      <header className="flex items-center gap-2 border-b border-line px-3 py-1.5">
        <h2 className="shrink-0 font-display text-base text-amber">Tools</h2>
        <nav className="flex min-w-0 flex-1 flex-nowrap gap-1 overflow-x-auto" aria-label="Tools">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => onTabChange(tool.id)}
              className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${
                tab === tool.id ? 'bg-amber font-semibold text-on-amber' : 'bg-panel-2 text-muted hover:text-parchment'
              }`}
            >
              {tool.label}
            </button>
          ))}
        </nav>
      </header>
      {tab === 'lookup' ? (
        <RulesSearch
          embedded
          system={system}
          onAddMonster={onAddMonster}
          onSaveToCampaign={onSaveToCampaign}
          canSaveToCampaign={canSaveToCampaign}
        />
      ) : tab === 'npc' ? (
        <NpcPanel
          system={system}
          canCreate={canCreateNpc}
          hidePortraits={hideNpcPortraits}
          onHidePortraitsChange={onHideNpcPortraits}
          onCreateNpc={onCreateNpc}
        />
      ) : tab === 'improvise' ? (
        <ImprovisePanel />
      ) : (
        <BoxOfDoomPanel
          overlay={boxOfDoom}
          soundEnabled={diceCheckSound}
          onSoundEnabled={onDiceCheckSound}
        />
      )}
    </section>
  )
}
