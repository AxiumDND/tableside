import { useEffect, useId, useRef, useState } from 'react'
import {
  DICE_LOOK_PRESET_IDS,
  DICE_LOOK_PRESETS,
  type DiceLookPresetId
} from '../../../../shared/diceLookPreset'
import { DiceLookPresetSwatch } from './DiceLookPresetSwatch'

export function DiceLookPresetPicker({
  value,
  onChange,
  variant = 'list',
  'aria-label': ariaLabel = 'Player TV dice bag'
}: {
  value: DiceLookPresetId
  onChange: (id: DiceLookPresetId) => void
  variant?: 'list' | 'compact'
  'aria-label'?: string
}) {
  if (variant === 'compact') {
    return (
      <CompactDiceLookPresetPicker value={value} onChange={onChange} aria-label={ariaLabel} />
    )
  }

  return (
    <div role="radiogroup" aria-label={ariaLabel} className="mt-2 space-y-1.5">
      {DICE_LOOK_PRESET_IDS.map((id) => {
        const selected = value === id
        const preset = DICE_LOOK_PRESETS[id]
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={preset.label}
            onClick={() => onChange(id)}
            className={`flex w-full items-center gap-3 rounded border px-2.5 py-2 text-left transition-colors ${
              selected ? 'border-amber bg-amber/10' : 'border-line hover:border-amber'
            }`}
          >
            <DiceLookPresetSwatch preset={id} size="md" />
            <span className="min-w-0 flex-1">
              <span
                className={`block text-sm font-semibold ${selected ? 'text-amber' : 'text-parchment'}`}
              >
                {preset.label}
              </span>
              <span className="mt-0.5 block text-[12px] leading-snug text-muted">{preset.blurb}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

function CompactDiceLookPresetPicker({
  value,
  onChange,
  'aria-label': ariaLabel
}: {
  value: DiceLookPresetId
  onChange: (id: DiceLookPresetId) => void
  'aria-label': string
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const selected = DICE_LOOK_PRESETS[value]

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent): void {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKey(event: KeyboardEvent): void {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative flex min-w-0 items-center gap-1">
      <span className="shrink-0 text-[10px] text-muted">Bag</span>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => setOpen((prev) => !prev)}
        className="flex max-w-[11rem] items-center gap-1.5 truncate rounded border border-line bg-ink px-1 py-0.5 text-[10px] text-parchment outline-none hover:border-amber focus:border-amber"
      >
        <DiceLookPresetSwatch preset={value} size="sm" />
        <span className="truncate">{selected.label}</span>
      </button>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute left-0 top-full z-40 mt-1 max-h-64 w-56 overflow-y-auto rounded border border-line bg-panel py-1 shadow-lg"
        >
          {DICE_LOOK_PRESET_IDS.map((id) => {
            const preset = DICE_LOOK_PRESETS[id]
            const isSelected = value === id
            return (
              <li key={id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  aria-label={preset.label}
                  onClick={() => {
                    onChange(id)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center gap-2 px-2 py-1.5 text-left text-[11px] ${
                    isSelected
                      ? 'bg-amber/15 text-amber'
                      : 'text-parchment hover:bg-panel-2 hover:text-amber'
                  }`}
                >
                  <DiceLookPresetSwatch preset={id} size="sm" />
                  <span className="truncate font-medium">{preset.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
