import { useEffect, useState } from 'react'
import { campaignFileUrl, imageTitle, type CampaignImage } from '../lib/images'
import { HYPERSPACE_DEFAULT_PLANET, HYPERSPACE_DEFAULT_SHIP } from '../lib/hyperspaceDefaults'

function campaignArtUrl(ref: string | null, images: CampaignImage[]): string | null {
  if (!ref?.trim()) return null
  const match = images.find((img) => img.relativePath === ref || img.name === ref)
  return match ? campaignFileUrl(match.relativePath) : null
}

type HyperspaceFields = {
  title: string
  shipRef: string | null
  planetRef: string | null
  enterSoundRef: string | null
  loopSoundRef: string | null
  exitSoundRef: string | null
}

export default function HyperspaceCard({
  title,
  shipRef,
  planetRef,
  enterSoundRef,
  loopSoundRef,
  exitSoundRef,
  images,
  disabled,
  editing = false,
  onChange,
  onPlay,
  onArrive,
  onStop,
  jumpActive,
  jumpArrived,
  onLoadShip,
  onLoadPlanet,
  onLoadSound
}: {
  title?: string
  shipRef: string | null
  planetRef: string | null
  enterSoundRef: string | null
  loopSoundRef: string | null
  exitSoundRef: string | null
  images: CampaignImage[]
  disabled?: boolean
  editing?: boolean
  onChange: (next: HyperspaceFields) => void
  onPlay?: (fields: HyperspaceFields) => void
  onArrive?: () => void
  onStop?: () => void
  jumpActive?: boolean
  jumpArrived?: boolean
  onLoadShip?: () => Promise<string | null>
  onLoadPlanet?: () => Promise<string | null>
  onLoadSound?: () => Promise<string | null>
}) {
  const [titleValue, setTitleValue] = useState(title ?? '')
  const [shipValue, setShipValue] = useState(shipRef)
  const [planetValue, setPlanetValue] = useState(planetRef)
  const [enterSoundValue, setEnterSoundValue] = useState(enterSoundRef)
  const [loopSoundValue, setLoopSoundValue] = useState(loopSoundRef)
  const [exitSoundValue, setExitSoundValue] = useState(exitSoundRef)
  const [busy, setBusy] = useState<'ship' | 'planet' | 'enter' | 'loop' | 'exit' | null>(null)

  useEffect(() => {
    setTitleValue(title ?? '')
    setShipValue(shipRef)
    setPlanetValue(planetRef)
    setEnterSoundValue(enterSoundRef)
    setLoopSoundValue(loopSoundRef)
    setExitSoundValue(exitSoundRef)
  }, [title, shipRef, planetRef, enterSoundRef, loopSoundRef, exitSoundRef])

  function commit(partial?: Partial<HyperspaceFields>): void {
    onChange({
      title: partial?.title ?? titleValue,
      shipRef: partial && 'shipRef' in partial ? partial.shipRef ?? null : shipValue,
      planetRef: partial && 'planetRef' in partial ? partial.planetRef ?? null : planetValue,
      enterSoundRef:
        partial && 'enterSoundRef' in partial ? partial.enterSoundRef ?? null : enterSoundValue,
      loopSoundRef: partial && 'loopSoundRef' in partial ? partial.loopSoundRef ?? null : loopSoundValue,
      exitSoundRef: partial && 'exitSoundRef' in partial ? partial.exitSoundRef ?? null : exitSoundValue
    })
  }

  async function load(which: 'ship' | 'planet' | 'enter' | 'loop' | 'exit'): Promise<void> {
    const loader =
      which === 'ship' ? onLoadShip : which === 'planet' ? onLoadPlanet : onLoadSound
    if (!loader) return
    setBusy(which)
    try {
      const next = await loader()
      if (!next) return
      if (which === 'ship') {
        setShipValue(next)
        commit({ shipRef: next })
      } else if (which === 'planet') {
        setPlanetValue(next)
        commit({ planetRef: next })
      } else if (which === 'enter') {
        setEnterSoundValue(next)
        commit({ enterSoundRef: next })
      } else if (which === 'loop') {
        setLoopSoundValue(next)
        commit({ loopSoundRef: next })
      } else {
        setExitSoundValue(next)
        commit({ exitSoundRef: next })
      }
    } finally {
      setBusy(null)
    }
  }

  const fields = (): HyperspaceFields => ({
    title: titleValue,
    shipRef: shipValue,
    planetRef: planetValue,
    enterSoundRef: enterSoundValue,
    loopSoundRef: loopSoundValue,
    exitSoundRef: exitSoundValue
  })

  return (
    <section className="player-hyperspace-card my-5">
      <div className="relative rounded-md border border-amber/40 bg-panel-2 px-4 pb-4 pt-5">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l-md bg-amber" />
        <div className="absolute -top-3 left-3 flex items-center gap-1.5 bg-panel px-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber">Hyperspace</span>
          {!editing && titleValue.trim() ? (
            <span className="max-w-[14rem] truncate text-[11px] font-normal italic text-muted">{titleValue}</span>
          ) : null}
        </div>
        {editing ? (
          <div className="space-y-3 pl-2">
            <label className="block">
              <span className="text-[10px] uppercase tracking-wider text-muted">Jump name</span>
              <input
                value={titleValue}
                disabled={disabled}
                onChange={(event) => setTitleValue(event.target.value)}
                onBlur={() => commit()}
                className="mt-0.5 w-full rounded border border-line bg-ink px-2 py-1 text-sm text-parchment outline-none focus:border-amber disabled:opacity-50"
              />
            </label>
            <ImagePick
              label="Ship in hyperspace"
              hint="Fullscreen still after you enter hyperspace. Generic ship until you pick one."
              value={shipValue}
              previewUrl={campaignArtUrl(shipValue, images)}
              fallbackSrc={HYPERSPACE_DEFAULT_SHIP}
              disabled={disabled || jumpActive}
              busy={busy === 'ship'}
              onLoad={() => void load('ship')}
              onClear={() => {
                setShipValue(null)
                commit({ shipRef: null })
              }}
              canLoad={Boolean(onLoadShip)}
            />
            <ImagePick
              label="Arrival planet"
              hint="Fades in after Exit hyperspace. Generic world until you pick one."
              value={planetValue}
              previewUrl={campaignArtUrl(planetValue, images)}
              fallbackSrc={HYPERSPACE_DEFAULT_PLANET}
              disabled={disabled || jumpActive}
              busy={busy === 'planet'}
              onLoad={() => void load('planet')}
              onClear={() => {
                setPlanetValue(null)
                commit({ planetRef: null })
              }}
              canLoad={Boolean(onLoadPlanet)}
            />
            <SoundPick
              label="Enter sound"
              hint="Plays once when the tunnel starts."
              value={enterSoundValue}
              disabled={disabled || jumpActive}
              busy={busy === 'enter'}
              onLoad={() => void load('enter')}
              onClear={() => {
                setEnterSoundValue(null)
                commit({ enterSoundRef: null })
              }}
              canLoad={Boolean(onLoadSound)}
            />
            <SoundPick
              label="In hyperspace"
              hint="Loops while the ship still is up."
              value={loopSoundValue}
              disabled={disabled || jumpActive}
              busy={busy === 'loop'}
              onLoad={() => void load('loop')}
              onClear={() => {
                setLoopSoundValue(null)
                commit({ loopSoundRef: null })
              }}
              canLoad={Boolean(onLoadSound)}
            />
            <SoundPick
              label="Exit sound"
              hint="Plays once when you exit."
              value={exitSoundValue}
              disabled={disabled || jumpActive}
              busy={busy === 'exit'}
              onLoad={() => void load('exit')}
              onClear={() => {
                setExitSoundValue(null)
                commit({ exitSoundRef: null })
              }}
              canLoad={Boolean(onLoadSound)}
            />
          </div>
        ) : (
          <div className="flex flex-wrap gap-3 pl-2">
            <Thumb
              label="Ship"
              path={shipValue}
              previewUrl={campaignArtUrl(shipValue, images)}
              fallbackSrc={HYPERSPACE_DEFAULT_SHIP}
            />
            <Thumb
              label="Planet"
              path={planetValue}
              previewUrl={campaignArtUrl(planetValue, images)}
              fallbackSrc={HYPERSPACE_DEFAULT_PLANET}
            />
            <SoundThumb label="Enter" path={enterSoundValue} />
            <SoundThumb label="Loop" path={loopSoundValue} />
            <SoundThumb label="Exit" path={exitSoundValue} />
          </div>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2 pl-2">
          {jumpActive && !jumpArrived ? (
            <>
              <button
                type="button"
                onClick={() => onArrive?.()}
                disabled={!onArrive}
                className="rounded bg-amber px-2.5 py-1 text-xs font-semibold text-on-amber disabled:bg-line disabled:text-muted"
              >
                Exit hyperspace
              </button>
              <button
                type="button"
                onClick={() => onStop?.()}
                disabled={!onStop}
                className="rounded border border-line px-2.5 py-1 text-xs font-semibold hover:border-amber disabled:text-muted"
              >
                Abort
              </button>
            </>
          ) : jumpActive && jumpArrived ? (
            <span className="text-[11px] text-moss">Arriving…</span>
          ) : (
            <button
              type="button"
              onClick={() => {
                const next = fields()
                onChange(next)
                onPlay?.(next)
              }}
              disabled={!onPlay}
              className="rounded bg-amber px-2.5 py-1 text-xs font-semibold text-on-amber disabled:bg-line disabled:text-muted"
            >
              Enter hyperspace
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

function ImagePick({
  label,
  hint,
  value,
  previewUrl,
  fallbackSrc,
  disabled,
  busy,
  onLoad,
  onClear,
  canLoad
}: {
  label: string
  hint: string
  value: string | null
  previewUrl: string | null
  fallbackSrc: string
  disabled?: boolean
  busy?: boolean
  onLoad: () => void
  onClear: () => void
  canLoad?: boolean
}) {
  return (
    <div>
      <span className="text-[10px] uppercase tracking-wider text-muted">{label}</span>
      <p className="mt-0.5 text-[11px] text-muted">{hint}</p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <img src={previewUrl ?? fallbackSrc} alt="" className="h-14 w-20 rounded object-cover" />
        <button
          type="button"
          disabled={disabled || busy || !canLoad}
          onClick={onLoad}
          className="rounded border border-line px-2 py-0.5 text-[11px] hover:border-amber disabled:text-muted"
        >
          {busy ? 'Saving…' : value ? 'Change…' : 'Choose…'}
        </button>
        {value ? (
          <button
            type="button"
            disabled={disabled}
            onClick={onClear}
            className="rounded border border-line px-2 py-0.5 text-[11px] hover:border-amber disabled:text-muted"
          >
            Clear
          </button>
        ) : null}
      </div>
      <p className="mt-1 truncate text-[11px] text-muted">
        {previewUrl && value ? imageTitle(value) : 'Default'}
      </p>
    </div>
  )
}

function Thumb({
  label,
  path,
  previewUrl,
  fallbackSrc
}: {
  label: string
  path: string | null
  previewUrl: string | null
  fallbackSrc: string
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wider text-muted">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <img src={previewUrl ?? fallbackSrc} alt="" className="h-12 w-16 rounded object-cover" />
        <p className="truncate text-[11px] text-parchment">
          {previewUrl && path ? imageTitle(path) : 'Default'}
        </p>
      </div>
    </div>
  )
}

function SoundPick({
  label,
  hint,
  value,
  disabled,
  busy,
  onLoad,
  onClear,
  canLoad
}: {
  label: string
  hint: string
  value: string | null
  disabled?: boolean
  busy?: boolean
  onLoad: () => void
  onClear: () => void
  canLoad?: boolean
}) {
  return (
    <div>
      <span className="text-[10px] uppercase tracking-wider text-muted">{label}</span>
      <p className="mt-0.5 text-[11px] text-muted">{hint}</p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={disabled || busy || !canLoad}
          onClick={onLoad}
          className="rounded border border-line px-2 py-0.5 text-[11px] hover:border-amber disabled:text-muted"
        >
          {busy ? 'Saving…' : value ? 'Change…' : 'Choose…'}
        </button>
        {value ? (
          <button
            type="button"
            disabled={disabled}
            onClick={onClear}
            className="rounded border border-line px-2 py-0.5 text-[11px] hover:border-amber disabled:text-muted"
          >
            Clear
          </button>
        ) : null}
      </div>
      <p className="mt-1 truncate text-[11px] text-muted">{value ? imageTitle(value) : 'None'}</p>
    </div>
  )
}

function SoundThumb({ label, path }: { label: string; path: string | null }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 truncate text-[11px] text-parchment">{path ? imageTitle(path) : 'None'}</p>
    </div>
  )
}
