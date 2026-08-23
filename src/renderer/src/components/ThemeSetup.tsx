import { useState } from 'react'
import { THEME_BLURBS, THEME_IDS, THEME_LABELS, type ThemeId, type ThemeOptions } from '../../../shared/theme'

export default function ThemeSetup({
  onPick,
  onBack,
  onCancel
}: {
  onPick: (theme: ThemeId, options: ThemeOptions) => void
  onBack: () => void
  onCancel: () => void
}) {
  const [selected, setSelected] = useState<ThemeId | null>(null)
  const [holoPortraits, setHoloPortraits] = useState(true)
  const [digitalRain, setDigitalRain] = useState(true)

  function choose(id: ThemeId): void {
    setSelected(id)
    setHoloPortraits(true)
    setDigitalRain(true)
  }

  function confirm(): void {
    if (!selected) return
    onPick(selected, {
      holoPortraits: selected === 'scifi' ? holoPortraits : undefined,
      digitalRain: selected === 'matrix' ? digitalRain : undefined
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="theme-setup-title"
        className="w-full max-w-lg rounded border border-line bg-panel p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="theme-setup-title" className="font-display text-lg text-amber">
          Choose a look
        </h3>
        <p className="mt-2 text-sm text-parchment/90">
          Saved with this folder and remembered when you open it again. You can change it later from Start Here or
          Help & settings. The player TV stays black.
        </p>
        <ul className="mt-3 space-y-2">
          {THEME_IDS.map((id) => {
            const active = selected === id
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => choose(id)}
                  className={`w-full rounded border px-3 py-2.5 text-left ${
                    active ? 'border-amber bg-amber/10' : 'border-line hover:border-amber'
                  }`}
                >
                  <span className={`block text-sm font-semibold ${active ? 'text-amber' : 'text-parchment'}`}>
                    {THEME_LABELS[id]}
                  </span>
                  <span className="mt-0.5 block text-[12px] leading-snug text-muted">{THEME_BLURBS[id]}</span>
                </button>
              </li>
            )
          })}
        </ul>
        {selected === 'scifi' ? (
          <label className="mt-3 flex items-start gap-2 text-[13px] text-parchment/90">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={holoPortraits}
              onChange={(event) => setHoloPortraits(event.target.checked)}
            />
            <span>
              <span className="font-semibold text-parchment">Hologram portraits</span>
              <span className="mt-0.5 block text-[12px] leading-snug text-muted">
                Player, NPC, beast, and gear art as a projector plate.
              </span>
            </span>
          </label>
        ) : null}
        {selected === 'matrix' ? (
          <label className="mt-3 flex items-start gap-2 text-[13px] text-parchment/90">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={digitalRain}
              onChange={(event) => setDigitalRain(event.target.checked)}
            />
            <span>
              <span className="font-semibold text-parchment">Falling code</span>
              <span className="mt-0.5 block text-[12px] leading-snug text-muted">
                Slow wallpaper in the file list and notes.
              </span>
            </span>
          </label>
        ) : null}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onBack}
            className="rounded border border-line px-3 py-1.5 text-sm hover:border-amber"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-line px-3 py-1.5 text-sm hover:border-amber"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selected}
            onClick={confirm}
            className="rounded bg-amber px-3 py-1.5 text-sm font-semibold text-on-amber disabled:bg-line"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}
