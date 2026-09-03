import { useEffect, useRef, useState } from 'react'
import type { DisplayInfo, PlayerState } from '../../../shared/types'
import PlayerView from './PlayerView'

/** Virtual stage size for the preview — scaled down so layout matches the TV. */
const PREVIEW_STAGE_W = 1920
const PREVIEW_STAGE_H = 1080

function MonitorList({
  displays,
  playerDisplayId,
  onPick
}: {
  displays: DisplayInfo[]
  playerDisplayId: number | ''
  onPick: (displayId: number) => void
}) {
  if (displays.length === 0) {
    return <p className="text-[11px] text-muted">No monitors found.</p>
  }
  return (
    <>
      {displays.map((display) => {
        const selected = display.id === playerDisplayId
        return (
          <button
            key={display.id}
            type="button"
            onClick={() => onPick(display.id)}
            className={`mb-1 block w-full truncate rounded px-2 py-1 text-left text-[11px] last:mb-0 ${
              selected ? 'bg-amber font-semibold text-on-amber' : 'border border-line hover:border-amber'
            }`}
          >
            {display.label}
            {display.dm ? ' (DM)' : ''}
          </button>
        )
      })}
    </>
  )
}

function ScaledPlayerPreview({ state }: { state: PlayerState }) {
  const frameRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.2)

  useEffect(() => {
    const el = frameRef.current
    if (!el) return
    const update = (): void => {
      const width = el.clientWidth
      if (width <= 0) return
      setScale(width / PREVIEW_STAGE_W)
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={frameRef} className="player-preview-frame aspect-video overflow-hidden bg-black">
      <div
        className="player-preview-stage"
        style={{
          width: PREVIEW_STAGE_W,
          height: PREVIEW_STAGE_H,
          transform: `scale(${scale})`
        }}
      >
        <PlayerView state={state} suppressSound />
      </div>
    </div>
  )
}

export default function PlayerPreview({
  state,
  hidden,
  playerWindowOpen = false,
  displays,
  playerDisplayId,
  onClear,
  onToggle,
  onPickDisplay,
  onCloseWindow,
  onRefreshDisplays
}: {
  state: PlayerState
  hidden?: boolean
  playerWindowOpen?: boolean
  displays: DisplayInfo[]
  playerDisplayId: number | ''
  onClear: () => void
  onToggle: () => void
  onPickDisplay: (displayId: number) => void
  onCloseWindow?: () => void
  onRefreshDisplays: () => Promise<void>
}) {
  const [picking, setPicking] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!picking) return
    const close = (event: MouseEvent): void => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setPicking(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [picking])

  async function togglePicker(): Promise<void> {
    if (picking) {
      setPicking(false)
      return
    }
    await onRefreshDisplays()
    setPicking(true)
  }

  function pick(displayId: number): void {
    onPickDisplay(displayId)
    setPicking(false)
  }

  return (
    <div ref={rootRef} className="relative shrink-0 border-b border-line bg-ink">
      <header className="flex items-center justify-between gap-2 px-2 py-1.5">
        <button type="button" onClick={() => void togglePicker()} className="min-w-0 text-left hover:text-amber">
          <div className="text-[10px] uppercase tracking-wider text-muted">Players see</div>
          <div className="truncate text-xs">
            {state.crawl
              ? state.crawl.title || 'Opening crawl'
              : state.legend
                ? state.legend.title || 'Campfire chronicle'
                : state.gallery
                  ? state.gallery.title || 'Gallery'
                  : state.video
                    ? state.video.title || 'Video'
                    : state.phone
                      ? state.phone.title || 'Incoming call'
                      : state.hyperspace
                        ? state.hyperspace.arrivedAt
                          ? state.hyperspace.title || 'Arrival'
                          : state.hyperspace.title || 'Hyperspace'
                        : state.handout
                          ? state.handout.title
                          : state.imageTitle || 'Nothing showing'}
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-1">
          {hidden ? null : (
            <button
              type="button"
              onClick={onClear}
              disabled={
                !state.imageSrc &&
                !state.crawl &&
                !state.legend &&
                !state.gallery &&
                !state.video &&
                !state.phone &&
                !state.hyperspace &&
                !state.handout
              }
              className="rounded border border-line px-2 py-0.5 text-[11px] hover:border-amber disabled:text-muted"
            >
              Clear
            </button>
          )}
          {onCloseWindow ? (
            <button
              type="button"
              onClick={onCloseWindow}
              className="rounded border border-line px-2 py-0.5 text-[11px] hover:border-amber"
              title="Close the player window on the other monitor"
            >
              Close
            </button>
          ) : null}
          <button
            type="button"
            onClick={onToggle}
            className="rounded border border-line px-2 py-0.5 text-[11px] hover:border-amber"
          >
            {hidden ? 'Show' : 'Hide'}
          </button>
        </div>
      </header>
      {hidden ? (
        picking ? (
          <div className="absolute inset-x-2 z-10 mt-1 rounded border border-line bg-ink p-1.5 shadow-lg">
            <div className="mb-1 px-1 text-[10px] uppercase tracking-wider text-muted">Show on</div>
            <MonitorList displays={displays} playerDisplayId={playerDisplayId} onPick={pick} />
          </div>
        ) : null
      ) : (
        <div className="relative mx-2 mb-2">
          <button
            type="button"
            onClick={() => void togglePicker()}
            className="block w-full overflow-hidden rounded border border-amber-dim/70"
          >
            <ScaledPlayerPreview state={state} />
          </button>
          <p className="mt-1 text-center text-[10px] text-muted">
            {displays.length < 2
              ? 'Player screen waits for a second monitor'
              : picking
                ? 'Choose a monitor'
                : playerWindowOpen
                  ? 'Click to choose monitor'
                  : 'Player window closed — click to reopen'}
          </p>
          {picking ? (
            <div className="absolute inset-0 z-10 flex flex-col justify-end rounded bg-ink/95 p-1.5">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-muted">Show on</div>
              <MonitorList displays={displays} playerDisplayId={playerDisplayId} onPick={pick} />
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
