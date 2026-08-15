import { useEffect, useState } from 'react'
import type { PlayerState } from '../../../shared/types'
import { emptyPlayerState } from '../../../shared/types'

export default function PlayerApp() {
  const [state, setState] = useState<PlayerState>(emptyPlayerState())

  useEffect(() => {
    let alive = true
    window.tabledm.getPlayerState().then((s) => {
      if (alive) setState(s)
    })
    const off = window.tabledm.onPlayerState(setState)
    return () => {
      alive = false
      off()
    }
  }, [])

  return (
    <div className="relative flex h-full w-full flex-col bg-[#050403] text-parchment">
      <div className="flex min-h-0 flex-1 items-center justify-center p-6">
        {state.imageSrc ? (
          <img
            src={state.imageSrc}
            alt={state.imageTitle}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <div className="text-center">
            <p className="font-display text-5xl tracking-wide text-amber">
              {state.campaignTitle || 'Table DM'}
            </p>
            <p className="mt-3 text-sm uppercase tracking-[0.35em] text-muted">Player view</p>
          </div>
        )}
      </div>

      {state.imageSrc && state.imageTitle ? (
        <div className="pointer-events-none absolute left-6 top-5 rounded bg-black/55 px-3 py-1 text-sm text-parchment/90">
          {state.imageTitle}
        </div>
      ) : null}

      {state.showInitiative && state.initiative.length > 0 ? (
        <div className="flex flex-wrap items-center justify-center gap-2 border-t border-line bg-black/70 px-4 py-3">
          {state.initiative.map((entry) => (
            <span
              key={entry.id}
              className={`rounded-full px-3 py-1 text-sm ${
                entry.active
                  ? 'bg-amber text-ink font-semibold'
                  : 'bg-panel-2 text-parchment/80'
              }`}
            >
              {entry.name}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}
