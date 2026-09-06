import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  CALENDAR_HOURS_MAX,
  CALENDAR_HOURS_MIN,
  clampHour,
  clampHoursPerDay,
  findUnitIndex,
  formatCalendar,
  normalizeInstant,
  unitsForYear,
  type CalendarDefinition,
  type CalendarInstant,
  type CalendarTypeId,
  type CalendarUnit
} from '../../../shared/calendar'
import { CALENDAR_TYPE_OPTIONS, calendarPreset } from '../../../shared/calendarPresets'

function unitDays(unit: CalendarUnit, definition: CalendarDefinition, year: number, index: number): number {
  return unitsForYear(definition, year)[index]?.days ?? unit.days
}

export default function CalendarSettings({
  definition,
  now,
  notePath,
  onClose,
  onSave,
  onOpenNote
}: {
  definition: CalendarDefinition
  now: CalendarInstant
  notePath: string
  onClose: () => void
  onSave: (definition: CalendarDefinition, now: CalendarInstant) => Promise<void>
  onOpenNote: () => void
}) {
  const [draft, setDraft] = useState<CalendarDefinition>(definition)
  const [instant, setInstant] = useState<CalendarInstant>(() => normalizeInstant(definition, now))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    function onKey(event: KeyboardEvent): void {
      if (event.key === 'Escape' && !busy) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  const live = useMemo(() => normalizeInstant(draft, instant), [draft, instant])
  const read = useMemo(() => formatCalendar(draft, live), [draft, live])
  const yearUnits = useMemo(() => unitsForYear(draft, live.year), [draft, live.year])
  const currentDays = yearUnits[live.unitIndex]?.days ?? 1

  function applyType(type: CalendarTypeId): void {
    const preset = calendarPreset(type)
    setDraft(preset.definition)
    setInstant(normalizeInstant(preset.definition, preset.now))
    setError('')
  }

  function patchDraft(partial: Partial<CalendarDefinition>): void {
    setDraft((prev) => ({ ...prev, ...partial }))
  }

  function setUnit(index: number, next: CalendarUnit): void {
    setDraft((prev) => {
      const units = prev.units.map((unit, i) => (i === index ? next : unit))
      return { ...prev, units }
    })
  }

  async function save(): Promise<void> {
    setBusy(true)
    setError('')
    try {
      await onSave(draft, live)
    } catch {
      setError('Could not write Calendar/Calendar.md.')
      setBusy(false)
      return
    }
    setBusy(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4" onClick={() => !busy && onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-settings-title"
        className="flex max-h-[min(44rem,92vh)] w-full max-w-xl flex-col rounded border border-line bg-panel"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-line px-4 py-3">
          <h3 id="calendar-settings-title" className="font-display text-lg text-amber">
            Calendar
          </h3>
          <p className="mt-1 text-[12px] text-muted">
            Setup lives in <span className="text-parchment/80">{notePath}</span>. The Quick bar is the live clock — never
            on the player TV.
          </p>
          <p className="mt-2 text-[13px] text-parchment/90">
            {read.weekday ? `${read.weekday} · ` : ''}
            {read.date} · {read.time} · {read.light === 'day' ? 'Day' : read.light === 'night' ? 'Night' : read.light === 'dawn' ? 'Dawn' : 'Dusk'}
          </p>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-auto px-4 py-3">
          <fieldset>
            <legend className="text-[10px] font-semibold uppercase tracking-wider text-muted">Type</legend>
            <div className="mt-1 grid gap-1.5">
              {CALENDAR_TYPE_OPTIONS.map((option) => (
                <label
                  key={option.id}
                  className={`flex cursor-pointer items-start gap-2 rounded border px-2.5 py-1.5 ${
                    draft.type === option.id ? 'border-amber bg-panel-2' : 'border-line hover:border-amber/60'
                  }`}
                >
                  <input
                    type="radio"
                    name="calendar-type"
                    className="mt-1"
                    checked={draft.type === option.id}
                    onChange={() => applyType(option.id)}
                  />
                  <span>
                    <span className="block text-sm font-semibold text-parchment">{option.label}</span>
                    <span className="block text-[11px] text-muted">{option.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Field label="Year">
              <input
                type="number"
                className={fieldClass}
                value={live.year}
                onChange={(event) => setInstant((prev) => ({ ...prev, year: Number(event.target.value) }))}
              />
            </Field>
            <Field label="Month">
              <select
                className={fieldClass}
                value={yearUnits[live.unitIndex]?.name ?? ''}
                onChange={(event) =>
                  setInstant((prev) => ({
                    ...prev,
                    unitIndex: findUnitIndex(draft, live.year, event.target.value)
                  }))
                }
              >
                {yearUnits.map((unit) => (
                  <option key={unit.name} value={unit.name}>
                    {unit.name}
                    {unit.festival ? ' (festival)' : ''}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Day">
              <input
                type="number"
                min={1}
                max={currentDays}
                className={fieldClass}
                value={live.day}
                onChange={(event) => setInstant((prev) => ({ ...prev, day: Number(event.target.value) }))}
              />
            </Field>
            <Field label="Hour">
              <input
                type="number"
                min={0}
                max={clampHoursPerDay(draft.hoursPerDay) - 1}
                className={fieldClass}
                value={live.hour}
                onChange={(event) =>
                  setInstant((prev) => ({
                    ...prev,
                    hour: clampHour(Number(event.target.value), draft.hoursPerDay)
                  }))
                }
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Field label="Hours / day">
              <input
                type="number"
                min={CALENDAR_HOURS_MIN}
                max={CALENDAR_HOURS_MAX}
                className={fieldClass}
                value={draft.hoursPerDay}
                onChange={(event) => patchDraft({ hoursPerDay: clampHoursPerDay(Number(event.target.value)) })}
              />
            </Field>
            <Field label="Dawn hour">
              <input
                type="number"
                min={0}
                max={clampHoursPerDay(draft.hoursPerDay) - 1}
                className={fieldClass}
                value={draft.dawnHour}
                onChange={(event) =>
                  patchDraft({ dawnHour: clampHour(Number(event.target.value), draft.hoursPerDay) })
                }
              />
            </Field>
            <Field label="Dusk hour">
              <input
                type="number"
                min={0}
                max={clampHoursPerDay(draft.hoursPerDay) - 1}
                className={fieldClass}
                value={draft.duskHour}
                onChange={(event) =>
                  patchDraft({ duskHour: clampHour(Number(event.target.value), draft.hoursPerDay) })
                }
              />
            </Field>
            <Field label="Era">
              <input
                className={fieldClass}
                value={draft.era}
                onChange={(event) => patchDraft({ era: event.target.value })}
                placeholder="DR, CY, AF…"
              />
            </Field>
          </div>

          {draft.type === 'custom' ? (
            <>
              <Field label="Weekdays (comma-separated; leave blank for none)">
                <input
                  className={fieldClass}
                  value={draft.weekdays.join(', ')}
                  onChange={(event) =>
                    patchDraft({
                      weekdays: event.target.value
                        .split(/[,;|]/)
                        .map((part) => part.trim())
                        .filter(Boolean)
                    })
                  }
                />
              </Field>
              <fieldset>
                <legend className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                  Months and festivals
                </legend>
                <p className="mt-1 text-[11px] text-muted">
                  Each row is a month or intercalary day. Festival days sit between months (Harptos-style) or as a
                  short week (Greyhawk-style).
                </p>
                <div className="mt-2 space-y-1">
                  {draft.units.map((unit, index) => (
                    <div key={`${unit.name}-${index}`} className="grid grid-cols-[1fr_4.5rem_auto_auto] gap-1">
                      <input
                        className={fieldClass}
                        value={unit.name}
                        aria-label={`Month ${index + 1} name`}
                        onChange={(event) => setUnit(index, { ...unit, name: event.target.value })}
                      />
                      <input
                        type="number"
                        min={1}
                        className={fieldClass}
                        value={unitDays(unit, draft, live.year, index)}
                        aria-label={`${unit.name} days`}
                        onChange={(event) =>
                          setUnit(index, { ...unit, days: Math.max(1, Number(event.target.value) || 1) })
                        }
                      />
                      <label className="flex items-center gap-1 px-1 text-[11px] text-muted">
                        <input
                          type="checkbox"
                          checked={Boolean(unit.festival)}
                          onChange={(event) => setUnit(index, { ...unit, festival: event.target.checked })}
                        />
                        Fest
                      </label>
                      <button
                        type="button"
                        className="rounded border border-line px-1.5 text-[11px] text-muted hover:border-blood hover:text-blood"
                        onClick={() =>
                          setDraft((prev) => ({ ...prev, units: prev.units.filter((_, i) => i !== index) }))
                        }
                      >
                        −
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="mt-2 rounded border border-line px-2 py-1 text-[12px] hover:border-amber"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      units: [...prev.units, { name: 'New month', days: 30 }]
                    }))
                  }
                >
                  Add month
                </button>
              </fieldset>
              <div className="grid grid-cols-3 gap-2">
                <Field label="Leap every (years)">
                  <input
                    type="number"
                    min={0}
                    className={fieldClass}
                    value={draft.leap?.everyYears ?? 0}
                    onChange={(event) => {
                      const everyYears = Math.max(0, Number(event.target.value) || 0)
                      patchDraft({
                        leap:
                          everyYears < 1
                            ? undefined
                            : {
                                everyYears,
                                extraUnitName: draft.leap?.extraUnitName ?? 'Leap day',
                                afterUnit: draft.leap?.afterUnit ?? draft.units[0]?.name ?? ''
                              }
                      })
                    }}
                  />
                </Field>
                <Field label="Leap day name">
                  <input
                    className={fieldClass}
                    value={draft.leap?.extraUnitName ?? ''}
                    disabled={!draft.leap}
                    onChange={(event) =>
                      draft.leap && patchDraft({ leap: { ...draft.leap, extraUnitName: event.target.value } })
                    }
                  />
                </Field>
                <Field label="After">
                  <input
                    className={fieldClass}
                    value={draft.leap?.afterUnit ?? ''}
                    disabled={!draft.leap}
                    onChange={(event) =>
                      draft.leap && patchDraft({ leap: { ...draft.leap, afterUnit: event.target.value } })
                    }
                  />
                </Field>
              </div>
            </>
          ) : (
            <p className="text-[12px] text-muted">
              {draft.type === 'harptos'
                ? 'Twelve 30-day months, five festivals, tendays. Shieldmeet appears every 4 years after Midsummer. Month names are labels only.'
                : draft.type === 'greyhawk'
                  ? 'Twelve 28-day months and four 7-day festival weeks (364 days). Seven named weekdays. Names are labels only.'
                  : 'Earth year: 7-day week, 12 months, leap years on the 400-year rule, 24 hours.'}
            </p>
          )}
          {error ? <p className="text-[12px] text-blood">{error}</p> : null}
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-line px-4 py-3">
          <button
            type="button"
            className="mr-auto rounded border border-line px-3 py-1.5 text-sm hover:border-amber"
            onClick={onOpenNote}
          >
            Open note
          </button>
          <button
            type="button"
            className="rounded border border-line px-3 py-1.5 text-sm hover:border-amber"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded bg-amber px-3 py-1.5 text-sm font-semibold text-on-amber hover:opacity-90 disabled:opacity-50"
            disabled={busy || draft.units.length === 0}
            onClick={() => void save()}
          >
            Save calendar
          </button>
        </div>
      </div>
    </div>
  )
}

const fieldClass =
  'w-full rounded border border-line bg-ink px-2 py-1 text-[13px] text-parchment outline-none focus:border-amber'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</span>
      {children}
    </label>
  )
}
