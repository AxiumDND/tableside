import { replaceNthCallout, serializeFencedCallout, splitCalloutBlocks } from './callouts'
import {
  CALENDAR_NOTE_PATH,
  clampHour,
  clampHoursPerDay,
  findUnitIndex,
  normalizeInstant,
  unitsForYear,
  type CalendarDefinition,
  type CalendarInstant,
  type CalendarTypeId,
  type CalendarUnit
} from './calendar'
import { calendarPreset } from './calendarPresets'

const TYPE_ALIASES: Record<string, CalendarTypeId> = {
  gregorian: 'gregorian',
  earth: 'gregorian',
  modern: 'gregorian',
  harptos: 'harptos',
  realms: 'harptos',
  'forgotten realms': 'harptos',
  faerun: 'harptos',
  greyhawk: 'greyhawk',
  flanaess: 'greyhawk',
  oerth: 'greyhawk',
  custom: 'custom',
  homebrew: 'custom'
}

export function parseCalendarType(raw: string | undefined): CalendarTypeId | null {
  if (!raw) return null
  return TYPE_ALIASES[raw.toLowerCase().replace(/[_-]+/g, ' ').trim()] ?? null
}

function parseNumber(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback
  const n = Number(raw.trim())
  return Number.isFinite(n) ? n : fallback
}

function parseList(raw: string | undefined): string[] {
  if (!raw) return []
  return raw
    .split(/[,;|]/)
    .map((part) => part.trim())
    .filter(Boolean)
}

function parseUnitLine(line: string): CalendarUnit | null {
  const match = /^\s*-\s*(.+?)\s*:\s*(\d+)\s*(festival|fest|intercalary)?\s*$/i.exec(line)
  if (!match) return null
  return {
    name: match[1].trim(),
    days: Math.max(1, Number(match[2])),
    festival: Boolean(match[3])
  }
}

export type ParsedCampaignCalendar = {
  definition: CalendarDefinition
  now: CalendarInstant
}

export function parseCalendarBlock(body: string): ParsedCampaignCalendar {
  const presetType = parseCalendarType(
    /^(?:type|kind|calendar)\s*:\s*(.+)$/im.exec(body)?.[1]
  ) ?? 'custom'
  const base = calendarPreset(presetType)
  const fields: Record<string, string> = {}
  const customUnits: CalendarUnit[] = []
  for (const line of body.replace(/\r/g, '').split('\n')) {
    const unit = parseUnitLine(line)
    if (unit) {
      customUnits.push(unit)
      continue
    }
    const field = /^(era|year|month|unit|day|hour|hoursPerDay|hours|dawn|dusk|weekdays|leapEvery|leapDay|leapAfter)\s*:\s*(.+)$/i.exec(
      line.trim()
    )
    if (field?.[1]) fields[field[1].toLowerCase()] = field[2].trim()
  }

  const hoursPerDay = clampHoursPerDay(parseNumber(fields.hoursperday ?? fields.hours, base.definition.hoursPerDay))
  const weekdays = fields.weekdays ? parseList(fields.weekdays) : base.definition.weekdays
  const units = customUnits.length > 0 ? customUnits : base.definition.units
  const definition: CalendarDefinition = {
    ...base.definition,
    type: presetType,
    era: fields.era ?? base.definition.era,
    weekdays,
    units,
    hoursPerDay,
    dawnHour: clampHour(parseNumber(fields.dawn, base.definition.dawnHour), hoursPerDay),
    duskHour: clampHour(parseNumber(fields.dusk, base.definition.duskHour), hoursPerDay),
    leap:
      fields.leapevery || fields.leapday
        ? {
            everyYears: Math.max(1, parseNumber(fields.leapevery, base.definition.leap?.everyYears ?? 4)),
            extraUnitName: fields.leapday ?? base.definition.leap?.extraUnitName ?? 'Leap day',
            afterUnit: fields.leapafter ?? base.definition.leap?.afterUnit ?? units[0]?.name ?? ''
          }
        : base.definition.leap
  }

  const year = parseNumber(fields.year, base.now.year)
  const unitName = fields.month ?? fields.unit
  const unitIndex = unitName ? findUnitIndex(definition, year, unitName) : base.now.unitIndex
  const now = normalizeInstant(definition, {
    year,
    unitIndex,
    day: parseNumber(fields.day, base.now.day),
    hour: parseNumber(fields.hour, base.now.hour)
  })
  return { definition, now }
}

export const CALENDAR_CALLOUT_TYPES = ['calendar', 'almanac', 'datebook'] as const

export function extractCalendarBlock(markdown: string): { index: number; body: string; title?: string } | null {
  const parts = splitCalloutBlocks(markdown)
  for (const part of parts) {
    if (part.kind !== 'calendar') continue
    return { index: 0, body: part.markdown, title: part.title }
  }
  return null
}

export function parseCampaignCalendar(markdown: string): ParsedCampaignCalendar | null {
  const block = extractCalendarBlock(markdown)
  if (!block) return null
  return parseCalendarBlock(block.body)
}

function unitLine(unit: CalendarUnit): string {
  return `- ${unit.name}: ${unit.days}${unit.festival ? ' festival' : ''}`
}

export function serializeCalendarBlock(definition: CalendarDefinition, now: CalendarInstant): string {
  const instant = normalizeInstant(definition, now)
  const unit = currentUnit(definition, instant)
  const lines = [
    `type: ${definition.type}`,
    definition.era ? `era: ${definition.era}` : 'era:',
    `year: ${instant.year}`,
    `month: ${unit.name}`,
    `day: ${instant.day}`,
    `hour: ${instant.hour}`,
    `hoursPerDay: ${clampHoursPerDay(definition.hoursPerDay)}`,
    `dawn: ${definition.dawnHour}`,
    `dusk: ${definition.duskHour}`
  ]
  if (definition.weekdays.length > 0) lines.push(`weekdays: ${definition.weekdays.join(', ')}`)
  if (definition.leap) {
    lines.push(`leapEvery: ${definition.leap.everyYears}`)
    lines.push(`leapDay: ${definition.leap.extraUnitName}`)
    lines.push(`leapAfter: ${definition.leap.afterUnit}`)
  }
  lines.push('months:')
  for (const item of definition.units) lines.push(unitLine(item))
  return lines.join('\n')
}

function currentUnit(definition: CalendarDefinition, instant: CalendarInstant): CalendarUnit {
  const units = unitsForYear(definition, instant.year)
  return (
    units[instant.unitIndex] ??
    definition.units[0] ?? {
      name: 'Month',
      days: 30
    }
  )
}

function calendarFence(title: string | undefined, body: string): string {
  return serializeFencedCallout('calendar', title, body.split('\n'))
}

export function writeCalendarIntoNote(
  markdown: string,
  definition: CalendarDefinition,
  now: CalendarInstant
): string {
  const body = serializeCalendarBlock(definition, now)
  const existing = extractCalendarBlock(markdown)
  const fence = calendarFence(existing?.title, body)
  if (existing) {
    return replaceNthCallout(markdown, [...CALENDAR_CALLOUT_TYPES], existing.index, fence)
  }
  const trimmed = markdown.replace(/\s+$/, '')
  return trimmed ? `${trimmed}\n\n${fence}\n` : `${fence}\n`
}

export function calendarNoteTemplate(definition: CalendarDefinition, now: CalendarInstant): string {
  return [
    '# Calendar',
    '',
    'The live date sits on the Quick bar. Advance hours and days there. This note is the setup — type, months, weekdays, and how long a day is.',
    '',
    calendarFence(undefined, serializeCalendarBlock(definition, now)),
    ''
  ].join('\n')
}

export function isCalendarNotePath(path: string): boolean {
  const posix = path.replaceAll('\\', '/')
  if (posix === CALENDAR_NOTE_PATH) return true
  return /(^|\/)calendar\//i.test(posix) && /\.(md|markdown|txt)$/i.test(posix)
}

export function preferredCalendarNotePath(paths: string[]): string {
  const notes = paths.map((path) => path.replaceAll('\\', '/'))
  const exact = notes.find((path) => path.toLowerCase() === CALENDAR_NOTE_PATH.toLowerCase())
  if (exact) return exact
  const inFolder = notes.find((path) => isCalendarNotePath(path))
  return inFolder ?? CALENDAR_NOTE_PATH
}
