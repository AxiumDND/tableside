import type { CampaignInfo } from '../../../shared/types'
import { getSystemPack } from '../../../shared/systemPack'
import { APP_NAME, APP_VERSION } from '../../../shared/version'
import appIcon from '../assets/icon.png'

export type RightPanel = 'combat' | 'lookup' | 'help' | 'music' | null

function buttonClass(active: boolean): string {
  return `rounded px-3 py-1 text-sm ${
    active ? 'bg-amber font-semibold text-on-amber' : 'border border-line hover:border-amber'
  }`
}

export default function DmHeader({
  campaign,
  rightPanel,
  combatCount,
  mixerActive,
  onNewCampaign,
  onOpenCampaign,
  onToggleLookup,
  onToggleCombat,
  onToggleMusic,
  onToggleHelp
}: {
  campaign: CampaignInfo | null
  rightPanel: RightPanel
  combatCount: number
  mixerActive: boolean
  onNewCampaign: () => void
  onOpenCampaign: () => void
  onToggleLookup: () => void
  onToggleCombat: () => void
  onToggleMusic: () => void
  onToggleHelp: () => void
}) {
  return (
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
          {campaign
            ? `${getSystemPack(campaign.system).shortLabel} · second-monitor player view`
            : 'Table tool · second-monitor player view'}
        </div>
      </div>
      <div className="ml-4 min-w-0 flex-1">
        <div className="truncate text-sm">{campaign?.name ?? 'No campaign open'}</div>
        <div className="truncate text-[11px] text-muted">{campaign?.folder ?? 'Choose a folder to begin'}</div>
      </div>
      <button type="button" onClick={onNewCampaign} className="rounded border border-line px-3 py-1 text-sm hover:border-amber">
        New campaign
      </button>
      <button type="button" onClick={onOpenCampaign} className="rounded border border-line px-3 py-1 text-sm hover:border-amber">
        Open campaign
      </button>
      <button type="button" onClick={onToggleLookup} className={buttonClass(rightPanel === 'lookup')}>
        Lookup
      </button>
      <button type="button" onClick={onToggleCombat} className={buttonClass(rightPanel === 'combat')}>
        Combat
        {combatCount > 0 ? ` (${combatCount})` : ''}
      </button>
      <button type="button" onClick={onToggleMusic} className={buttonClass(rightPanel === 'music')}>
        Music
        {mixerActive ? ' ·' : ''}
      </button>
      <button type="button" onClick={onToggleHelp} className={buttonClass(rightPanel === 'help')}>
        Help &amp; settings
      </button>
    </header>
  )
}
