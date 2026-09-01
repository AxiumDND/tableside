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

function iconButtonClass(active: boolean): string {
  return `rounded border p-1.5 ${
    active ? 'border-amber text-amber' : 'border-line text-muted hover:border-amber hover:text-amber'
  }`
}

function PanelGlyph({ side }: { side: 'left' | 'right' }) {
  const filled =
    side === 'left'
      ? 'M5.5 5.75h5.25v12.5H5.5A.75.75 0 0 1 4.75 18V6a.75.75 0 0 1 .75-.75z'
      : 'M13.25 5.75H18.5A.75.75 0 0 1 19.25 6v12a.75.75 0 0 1-.75.75h-5.25V5.75z'
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
        d="M5.5 4.5h13a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18V6a1.5 1.5 0 0 1 1.5-1.5z"
      />
      <path fill="currentColor" d={filled} />
    </svg>
  )
}

export default function DmHeader({
  campaign,
  rightPanel,
  combatCount,
  mixerActive,
  sidebarOpen,
  onNewCampaign,
  onOpenCampaign,
  onToggleSidebar,
  onToggleRightPanel,
  onToggleLookup,
  onToggleCombat,
  onToggleMusic,
  onToggleHelp
}: {
  campaign: CampaignInfo | null
  rightPanel: RightPanel
  combatCount: number
  mixerActive: boolean
  sidebarOpen: boolean
  onNewCampaign: () => void
  onOpenCampaign: () => void
  onToggleSidebar: () => void
  onToggleRightPanel: () => void
  onToggleLookup: () => void
  onToggleCombat: () => void
  onToggleMusic: () => void
  onToggleHelp: () => void
}) {
  const sidebarLabel = sidebarOpen ? 'Hide sidebar' : 'Show sidebar'
  const rightOpen = rightPanel !== null
  const rightLabel = rightOpen ? 'Hide right panel' : 'Show right panel'
  return (
    <header className="flex items-center gap-3 border-b border-line bg-panel px-4 py-2">
      <button
        type="button"
        onClick={onToggleSidebar}
        className={iconButtonClass(sidebarOpen)}
        title={sidebarLabel}
        aria-label={sidebarLabel}
        aria-pressed={sidebarOpen}
      >
        <PanelGlyph side="left" />
      </button>
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
      <button
        type="button"
        onClick={onToggleRightPanel}
        className={iconButtonClass(rightOpen)}
        title={rightLabel}
        aria-label={rightLabel}
        aria-pressed={rightOpen}
      >
        <PanelGlyph side="right" />
      </button>
    </header>
  )
}
