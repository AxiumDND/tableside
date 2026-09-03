import { useEffect } from 'react'
import type { DiceMode } from '../lib/dice'

const MODES: { id: Extract<DiceMode, 'normal' | 'advantage' | 'disadvantage'>; label: string; hint: string }[] = [
  { id: 'normal', label: 'Normal', hint: 'One d20' },
  { id: 'advantage', label: 'Advantage', hint: 'Keep higher' },
  { id: 'disadvantage', label: 'Disadvantage', hint: 'Keep lower' }
]

export function D20ModeDialog({
  title,
  subtitle,
  onChoose,
  onClose
}: {
  title: string
  subtitle?: string
  onChoose: (mode: Extract<DiceMode, 'normal' | 'advantage' | 'disadvantage'>) => void
  onClose: () => void
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent): void {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="d20-mode-title"
        className="w-full max-w-sm rounded border border-line bg-panel p-4"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id="d20-mode-title" className="font-display text-lg text-amber">
          {title}
        </h3>
        {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
        <div className="mt-4 grid gap-2">
          {MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              autoFocus={mode.id === 'normal'}
              aria-label={`${mode.label} — ${mode.hint}`}
              onClick={() => onChoose(mode.id)}
              className="rounded border border-line px-3 py-2 text-left hover:border-amber"
            >
              <span className="block text-sm font-semibold text-parchment">{mode.label}</span>
              <span className="mt-0.5 block text-[11px] text-muted">{mode.hint}</span>
            </button>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-line px-3 py-1.5 text-sm hover:border-amber"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
