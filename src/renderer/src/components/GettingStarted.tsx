import type { ReactNode } from 'react'

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
  onOpenSample
}: {
  hasCampaign: boolean
  onNewCampaign?: () => void
  onOpenCampaign?: () => void
  onOpenSample?: () => void
}) {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 py-6 text-parchment">
      <div>
        <h2 className="font-display text-2xl text-amber">
          {hasCampaign ? 'Pick a note to begin' : 'Table DM'}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-parchment/85">
          {hasCampaign
            ? 'Open a session, night sheet, or map from the file tree on the left. Right-click a folder to add players, NPCs, or monsters from Templates.'
            : 'Local dual-monitor tool for in-person 5e-compatible games. Your laptop is the DM console; the second screen shows maps and art — no account, no cloud.'}
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

      <div className="grid gap-2">
        <Step title="1. Show the table">
          Click a map or portrait in a note, then <span className="text-amber">Show to players</span>. The
          player window fades it in on black.
        </Step>
        <Step title="2. Run combat">
          Open <span className="text-amber">Combat</span>. Use night-sheet{' '}
          <span className="text-amber">Add to initiative</span>, or <span className="text-amber">Add all players</span>{' '}
          plus the Bestiary list. Optionally overlay initiative on the player screen.
        </Step>
        <Step title="3. Look up rules">
          <span className="text-amber">Lookup</span> searches the bundled SRD. Drop optional PHB/DMG text in the
          WOTC folder for extra chips — open that folder from Lookup when you need it.
        </Step>
      </div>

      <p className="text-[12px] leading-relaxed text-muted">
        Campaign folders are ordinary Markdown on disk (Obsidian-friendly). Authoring details live in the repo under{' '}
        <span className="text-parchment/70">docs/CAMPAIGN.md</span> and <span className="text-parchment/70">docs/TABLE.md</span>.
      </p>
    </div>
  )
}
