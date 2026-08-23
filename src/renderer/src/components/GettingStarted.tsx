import type { ReactNode } from 'react'
import type { RecentCampaign } from '../../../shared/types'
import { APP_NAME } from '../../../shared/version'

function Step({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded border border-line/80 bg-ink/40 px-3 py-2.5">
      <div className="text-sm font-semibold text-amber">{title}</div>
      <div className="mt-1 text-[13px] leading-relaxed text-parchment/85">{children}</div>
    </div>
  )
}

export default function GettingStarted({
  hasCampaign,
  onNewCampaign,
  onOpenCampaign,
  onOpenSample,
  recentCampaigns = [],
  onOpenRecent
}: {
  hasCampaign: boolean
  onNewCampaign?: () => void
  onOpenCampaign?: () => void
  onOpenSample?: () => void
  recentCampaigns?: RecentCampaign[]
  onOpenRecent?: (folder: string) => void
}) {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 py-6 text-parchment">
      <div>
        <h2 className="font-display text-2xl text-amber">
          {hasCampaign ? 'Pick a note to begin' : APP_NAME}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-parchment/85">
          {hasCampaign
            ? 'Start Here has the overview. Then open a session, game night sheet, or map from the file tree. Right-click a folder to add players, NPCs, places, or shops.'
            : 'Local dual-monitor tool for in-person games. Pick a system when you create a campaign (D&D 5e, Pathfinder 2e, or Vampire 5th). Your laptop is the DM console; the second screen shows maps and art — no account, no cloud. First launch opens Greystead, a D&D 5e level-1 one-shot; Sample loads the same folder.'}
        </p>
      </div>

      {!hasCampaign ? (
        <div className="flex flex-wrap gap-2">
          {onOpenSample ? (
            <button
              type="button"
              onClick={onOpenSample}
              className="rounded bg-amber px-3 py-1.5 text-sm font-semibold text-ink"
            >
              Open Sample
            </button>
          ) : null}
          {onOpenCampaign ? (
            <button
              type="button"
              onClick={onOpenCampaign}
              className="rounded border border-line px-3 py-1.5 text-sm hover:border-amber"
            >
              Open campaign
            </button>
          ) : null}
          {onNewCampaign ? (
            <button
              type="button"
              onClick={onNewCampaign}
              className="rounded border border-line px-3 py-1.5 text-sm hover:border-amber"
            >
              New campaign
            </button>
          ) : null}
        </div>
      ) : null}

      {!hasCampaign && recentCampaigns.length > 0 ? (
        <div className="rounded border border-line/80 bg-ink/40 px-3 py-2.5">
          <div className="text-sm font-semibold text-amber">Recent campaigns</div>
          <ul className="mt-2 space-y-1">
            {recentCampaigns.map((item) => (
              <li key={item.folder}>
                <button
                  type="button"
                  onClick={() => onOpenRecent?.(item.folder)}
                  className="w-full truncate rounded px-1.5 py-1 text-left text-[13px] text-parchment/90 hover:bg-panel-2 hover:text-amber"
                  title={item.folder}
                >
                  {item.name}
                  <span className="mt-0.5 block truncate text-[11px] text-muted">{item.folder}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-2">
        <Step title="1. Show the table">
          Click a map or portrait in a note, then <span className="text-amber">Show to players</span> (or{' '}
          <span className="text-amber">Alt+S</span>).
        </Step>
        <Step title="2. Run combat">
          Open <span className="text-amber">Combat</span>. Use night-sheet{' '}
          <span className="text-amber">Add to initiative</span> (NPCs auto-roll), or{' '}
          <span className="text-amber">Add all players</span> plus the Bestiary list. Next turn:{' '}
          <span className="text-amber">Alt+T</span>.
        </Step>
        <Step title="3. Look up rules">
          <span className="text-amber">Lookup</span> searches the pack for this campaign. D&D 5e uses the bundled
          SRD; optional PHB/DMG text in Additional books adds extra chips. Pathfinder 2e and Vampire 5th use a small
          original core — add your own notes for book text.
        </Step>
      </div>

      <p className="text-[12px] leading-relaxed text-muted">
        Open <span className="text-amber">Help</span> in the header for night-sheet and Lookup recipes. Campaign folders
        are ordinary Markdown on disk (Obsidian-friendly) — see{' '}
        <span className="text-parchment/70">docs/RECIPES.md</span> in the repo for the same steps in writing.
      </p>
    </div>
  )
}
