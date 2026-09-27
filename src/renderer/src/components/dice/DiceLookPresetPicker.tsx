import { useEffect, useId, useRef, useState } from 'react'
import {
  DICE_LOOK_PRESET_IDS,
  DICE_LOOK_PRESETS,
  type DiceLookPresetId
} from '../../../../shared/diceLookPreset'
import { DiceLookPresetSwatch, type DiceLookPresetSwatchSize } from './DiceLookPresetSwatch'

export function DiceLookPresetPicker({
  value,
  onChange,
  variant = 'settings',
  'aria-label': ariaLabel = 'Player TV dice bag'
}: {
  value: DiceLookPresetId
  onChange: (id: DiceLookPresetId) => void
  /** `settings` = full-width dropdown; `compact` = Dice Tray Bag control. */
  variant?: 'settings' | 'compact'
  'aria-label'?: string
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const selected = DICE_LOOK_PRESETS[value]
  const compact = variant === 'compact'
  const swatchSize: DiceLookPresetSwatchSize = compact ? 'sm' : 'md'

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
    <div className={compact ? undefined : 'mt-2 w-full'}>
      <div
        ref={rootRef}
        className={compact ? 'relative flex min-w-0 items-center gap-1' : 'relative w-full'}
      >
        {compact ? <span className="shrink-0 text-[10px] text-muted">Bag</span> : null}
        <button
          type="button"
          aria-label={ariaLabel}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          onClick={() => setOpen((prev) => !prev)}
          className={
            compact
              ? 'flex max-w-[11rem] items-center gap-1.5 truncate rounded border border-line bg-ink px-1 py-0.5 text-[10px] text-parchment outline-none hover:border-amber focus:border-amber'
              : 'flex w-full items-center gap-3 rounded border border-line bg-ink px-2.5 py-2 text-left text-sm text-parchment outline-none hover:border-amber focus:border-amber'
          }
        >
          <DiceLookPresetSwatch preset={value} size={swatchSize} />
          <span className={compact ? 'truncate' : 'min-w-0 flex-1 truncate font-semibold'}>
            {selected.label}
          </span>
          {!compact ? (
            <span className="shrink-0 text-[11px] text-muted" aria-hidden="true">
              ▾
            </span>
          ) : null}
        </button>
        {open ? (
          <ul
            id={listId}
            role="listbox"
            aria-label={ariaLabel}
            className={
              compact
                ? 'absolute left-0 top-full z-40 mt-1 max-h-64 w-56 overflow-y-auto rounded border border-line bg-panel py-1 shadow-lg'
                : 'absolute left-0 right-0 top-full z-40 mt-1 max-h-72 overflow-y-auto rounded border border-line bg-panel py-1 shadow-lg'
            }
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
                    className={
                      compact
                        ? `flex w-full items-center gap-2 px-2 py-1.5 text-left text-[11px] ${
                            isSelected
                              ? 'bg-amber/15 text-amber'
                              : 'text-parchment hover:bg-panel-2 hover:text-amber'
                          }`
                        : `flex w-full items-center gap-3 px-2.5 py-2 text-left ${
                            isSelected
                              ? 'bg-amber/15 text-amber'
                              : 'text-parchment hover:bg-panel-2 hover:text-amber'
                          }`
                    }
                  >
                    <DiceLookPresetSwatch preset={id} size={swatchSize} />
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block truncate ${compact ? 'font-medium' : 'text-sm font-semibold'}`}
                      >
                        {preset.label}
                      </span>
                      {!compact ? (
                        <span className="mt-0.5 block text-[12px] leading-snug text-muted">
                          {preset.blurb}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        ) : null}
      </div>
      {!compact ? (
        <span className="mt-1 block text-[12px] leading-snug text-muted">{selected.blurb}</span>
      ) : null}
    </div>
  )
}
