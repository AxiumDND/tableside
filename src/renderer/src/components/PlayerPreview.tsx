import type { PlayerState } from '../../../shared/types'
import PlayerView from './PlayerView'

export default function PlayerPreview({
  state,
  hidden,
  onClear,
  onToggle
}: {
  state: PlayerState
  hidden?: boolean
  onClear: () => void
  onToggle: () => void
}) {
  return (
    <div className="shrink-0 border-b border-line bg-ink">
      <header className="flex items-center justify-between gap-2 px-2 py-1.5">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-muted">Players see</div>
          <div className="truncate text-xs">{state.imageTitle || 'Nothing showing'}</div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {hidden ? null : (
            <button
              type="button"
              onClick={onClear}
              disabled={!state.imageSrc}
              className="rounded border border-line px-2 py-0.5 text-[11px] hover:border-amber disabled:text-muted"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={onToggle}
            className="rounded border border-line px-2 py-0.5 text-[11px] hover:border-amber"
          >
            {hidden ? 'Show' : 'Hide'}
          </button>
        </div>
      </header>
      {hidden ? null : (
        <div className="mx-2 mb-2 aspect-video overflow-hidden rounded border border-amber-dim/70">
          <PlayerView state={state} compact />
        </div>
      )}
    </div>
  )
}
