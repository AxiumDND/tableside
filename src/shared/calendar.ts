/** In-world campaign calendar — date math only. The live clock is a note, not the wall clock. */

export type CalendarTypeId = 'gregorian' | 'harptos' | 'greyhawk' | 'custom'

export type CalendarUnit = {
  name: string
  days: number
  festival?: boolean
}

export type CalendarLeap = {
  everyYears: number
  extraUnitName: string
  afterUnit: string
}

export type CalendarDefinition = {
  type: CalendarTypeId
  era: string
  weekdays: string[]
  units: CalendarUnit[]
  hoursPerDay: number
  dawnHour: number
  duskHour: number
  leap?: CalendarLeap
}

export type CalendarInstant = {
  year: number
  unitIndex: number
  day: number
  hour: number
}

export type CalendarLight = 'dawn' | 'day' | 'dusk' | 'night'

export type CalendarReadout = {
  date: string
  time: string
  light: CalendarLight
  weekday: string
  unitName: string
  day: number
  year: number
  era: string
  festival: boolean
}

export const CALENDAR_NOTE_PATH = 'Calendar/Calendar.md'
export const CALENDAR_HOURS_MIN = 4
export const CALENDAR_HOURS_MAX = 48

export function clampHoursPerDay(value: number): number {
  if (!Number.isFinite(value)) return 24
  return Math.min(CALENDAR_HOURS_MAX, Math.max(CALENDAR_HOURS_MIN, Math.round(value)))
}

export function clampHour(hour: number, hoursPerDay: number): number {
  const span = clampHoursPerDay(hoursPerDay)
  if (!Number.isFinite(hour)) return 0
  const wrapped = ((Math.round(hour) % span) + span) % span
  return wrapped
}

export function foldCalendarName(value: string): string {
  return value.toLowerCase().replace(/['’]/g, '').replace(/\s+/g, ' ').trim()
}

export function isGregorianLeap(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

function gregorianMonthDays(year: number, monthIndex: number): number {
  const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  if (monthIndex === 1 && isGregorianLeap(year)) return 29
  return days[monthIndex] ?? 30
}

export function unitsForYear(definition: CalendarDefinition, year: number): CalendarUnit[] {
  if (definition.type === 'gregorian') {
    return definition.units.map((unit, index) => ({
      ...unit,
      days: gregorianMonthDays(year, index)
    }))
  }
  const units = definition.units.map((unit) => ({ ...unit }))
  const leap = definition.leap
  if (!leap || leap.everyYears < 1) return units
  if (((year % leap.everyYears) + leap.everyYears) % leap.everyYears !== 0) return units
  const after = units.findIndex((unit) => foldCalendarName(unit.name) === foldCalendarName(leap.afterUnit))
  if (after < 0) return units
  if (units.some((unit) => foldCalendarName(unit.name) === foldCalendarName(leap.extraUnitName))) return units
  units.splice(after + 1, 0, { name: leap.extraUnitName, days: 1, festival: true })
  return units
}

export function yearLength(definition: CalendarDefinition, year: number): number {
  return unitsForYear(definition, year).reduce((sum, unit) => sum + unit.days, 0)
}

export function normalizeInstant(definition: CalendarDefinition, instant: CalendarInstant): CalendarInstant {
  const hours = clampHoursPerDay(definition.hoursPerDay)
  let year = Number.isFinite(instant.year) ? Math.trunc(instant.year) : 1
  let unitIndex = Number.isFinite(instant.unitIndex) ? Math.trunc(instant.unitIndex) : 0
  let day = Number.isFinite(instant.day) ? Math.trunc(instant.day) : 1
  const hour = clampHour(instant.hour, hours)
  let units = unitsForYear(definition, year)
  if (units.length === 0) return { year, unitIndex: 0, day: 1, hour }

  while (unitIndex < 0) {
    year -= 1
    units = unitsForYear(definition, year)
    unitIndex += units.length
  }
  while (unitIndex >= units.length) {
    unitIndex -= units.length
    year += 1
    units = unitsForYear(definition, year)
  }

  const days = units[unitIndex]?.days ?? 1
  if (day < 1) day = 1
  if (day > days) day = days
  return { year, unitIndex, day, hour }
}

function shiftDays(definition: CalendarDefinition, instant: CalendarInstant, delta: number): CalendarInstant {
  let next = normalizeInstant(definition, instant)
  if (delta === 0) return next
  let remaining = delta
  while (remaining !== 0) {
    let units = unitsForYear(definition, next.year)
    const step = remaining > 0 ? 1 : -1
    next = { ...next, day: next.day + step }
    remaining -= step
    if (next.day > (units[next.unitIndex]?.days ?? 1)) {
      next = { ...next, unitIndex: next.unitIndex + 1, day: 1 }
      if (next.unitIndex >= units.length) {
        next = { ...next, year: next.year + 1, unitIndex: 0, day: 1 }
      }
    } else if (next.day < 1) {
      next = { ...next, unitIndex: next.unitIndex - 1 }
      if (next.unitIndex < 0) {
        next = { ...next, year: next.year - 1 }
        units = unitsForYear(definition, next.year)
        next = { ...next, unitIndex: units.length - 1 }
      }
      units = unitsForYear(definition, next.year)
      next = { ...next, day: units[next.unitIndex]?.days ?? 1 }
    }
  }
  return normalizeInstant(definition, next)
}

export function addHours(definition: CalendarDefinition, instant: CalendarInstant, hours: number): CalendarInstant {
  const span = clampHoursPerDay(definition.hoursPerDay)
  const start = normalizeInstant(definition, instant)
  if (!Number.isFinite(hours) || hours === 0) return start
  let hour = start.hour + Math.trunc(hours)
  let dayDelta = 0
  while (hour >= span) {
    hour -= span
    dayDelta += 1
  }
  while (hour < 0) {
    hour += span
    dayDelta -= 1
  }
  const dated = dayDelta === 0 ? start : shiftDays(definition, start, dayDelta)
  return { ...dated, hour }
}

export function addDays(definition: CalendarDefinition, instant: CalendarInstant, days: number): CalendarInstant {
  const start = normalizeInstant(definition, instant)
  if (!Number.isFinite(days) || days === 0) return start
  return { ...shiftDays(definition, start, Math.trunc(days)), hour: start.hour }
}

/** Jump to the next dawn. Before dawn stays on this date; at or after dawn goes to tomorrow. */
export function nextMorning(definition: CalendarDefinition, instant: CalendarInstant): CalendarInstant {
  const start = normalizeInstant(definition, instant)
  const dawn = clampHour(definition.dawnHour, definition.hoursPerDay)
  if (start.hour < dawn) return { ...start, hour: dawn }
  return { ...addDays(definition, start, 1), hour: dawn }
}

export function calendarLight(definition: CalendarDefinition, hour: number): CalendarLight {
  const span = clampHoursPerDay(definition.hoursPerDay)
  const now = clampHour(hour, span)
  const dawn = clampHour(definition.dawnHour, span)
  const dusk = clampHour(definition.duskHour, span)
  if (now === dawn) return 'dawn'
  if (now === dusk) return 'dusk'
  if (dawn === dusk) return now === dawn ? 'dawn' : 'day'
  if (dawn < dusk) return now > dawn && now < dusk ? 'day' : 'night'
  return now > dawn || now < dusk ? 'day' : 'night'
}

function ordinal(n: number): string {
  const rem100 = n % 100
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`
  if (n % 10 === 1) return `${n}st`
  if (n % 10 === 2) return `${n}nd`
  if (n % 10 === 3) return `${n}rd`
  return `${n}th`
}

function formatHour(hour: number, hoursPerDay: number): string {
  const span = clampHoursPerDay(hoursPerDay)
  const h = clampHour(hour, span)
  if (span === 24) {
    const period = h < 12 ? 'am' : 'pm'
    const twelve = h % 12 === 0 ? 12 : h % 12
    return `${twelve}${period}`
  }
  return `Hour ${h + 1}/${span}`
}

function weekdayIndex(definition: CalendarDefinition, instant: CalendarInstant): number {
  if (definition.weekdays.length === 0) return -1
  if (definition.type === 'gregorian') {
    const unit = unitsForYear(definition, instant.year)[instant.unitIndex]
    const month = instant.unitIndex
    const date = new Date(Date.UTC(instant.year, month, instant.day))
    if (unit && !Number.isNaN(date.getTime())) return date.getUTCDay()
  }
  let days = 0
  if (instant.year >= 1) {
    for (let year = 1; year < instant.year; year += 1) days += yearLength(definition, year)
  } else {
    for (let year = instant.year; year < 1; year += 1) days -= yearLength(definition, year)
  }
  const units = unitsForYear(definition, instant.year)
  for (let i = 0; i < instant.unitIndex; i += 1) days += units[i]?.days ?? 0
  days += instant.day - 1
  const week = definition.weekdays.length
  return ((days % week) + week) % week
}

function tendayLabel(day: number): string {
  const which = Math.min(3, Math.max(1, Math.ceil(day / 10)))
  return `${ordinal(which)} tenday`
}

export function formatCalendar(definition: CalendarDefinition, instant: CalendarInstant): CalendarReadout {
  const now = normalizeInstant(definition, instant)
  const units = unitsForYear(definition, now.year)
  const unit = units[now.unitIndex] ?? { name: 'Unknown', days: 1 }
  const light = calendarLight(definition, now.hour)
  const wd = weekdayIndex(definition, now)
  const weekday =
    wd >= 0 && definition.weekdays[wd]
      ? definition.weekdays[wd]
      : definition.type === 'harptos' && !unit.festival
        ? tendayLabel(now.day)
        : ''
  const date = unit.festival
    ? `${unit.name} ${now.year}${definition.era ? ` ${definition.era}` : ''}`
    : `${now.day} ${unit.name} ${now.year}${definition.era ? ` ` : ''}${definition.era}`.trim()
  return {
    date,
    time: formatHour(now.hour, definition.hoursPerDay),
    light,
    weekday,
    unitName: unit.name,
    day: now.day,
    year: now.year,
    era: definition.era,
    festival: Boolean(unit.festival)
  }
}

export function calendarLightLabel(light: CalendarLight): string {
  if (light === 'day') return 'Day'
  if (light === 'night') return 'Night'
  if (light === 'dawn') return 'Dawn'
  return 'Dusk'
}

export function calendarBarLabel(definition: CalendarDefinition, instant: CalendarInstant): string {
  const read = formatCalendar(definition, instant)
  const weekday = read.weekday ? `${read.weekday} · ` : ''
  return `${weekday}${read.date} · ${read.time} · ${calendarLightLabel(read.light)}`
}

export function findUnitIndex(definition: CalendarDefinition, year: number, name: string): number {
  const folded = foldCalendarName(name)
  if (!folded) return 0
  return Math.max(
    0,
    unitsForYear(definition, year).findIndex((unit) => foldCalendarName(unit.name) === folded)
  )
}
