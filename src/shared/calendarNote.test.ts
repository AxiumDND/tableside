import { describe, expect, it } from 'vitest'
import { addDays, findUnitIndex, formatCalendar } from './calendar'
import {
  calendarNoteTemplate,
  parseCalendarType,
  parseCampaignCalendar,
  parseCalendarBlock,
  writeCalendarIntoNote
} from './calendarNote'
import { calendarPreset } from './calendarPresets'

describe('parseCalendarType', () => {
  it('accepts setting aliases', () => {
    expect(parseCalendarType('Forgotten Realms')).toBe('harptos')
    expect(parseCalendarType('greyhawk')).toBe('greyhawk')
    expect(parseCalendarType('earth')).toBe('gregorian')
    expect(parseCalendarType('homebrew')).toBe('custom')
  })
})

describe('calendar note', () => {
  it('round-trips a Greyhawk clock through the fenced note', () => {
    const { definition, now } = calendarPreset('greyhawk')
    const note = calendarNoteTemplate(definition, now)
    expect(note).toContain('[!calendar]')
    expect(note).toContain('[!/calendar]')
    const parsed = parseCampaignCalendar(note)
    expect(parsed?.definition.type).toBe('greyhawk')
    expect(parsed?.now).toMatchObject({ year: 576, day: 1, hour: 9 })
    expect(formatCalendar(parsed!.definition, parsed!.now).date).toBe('1 Fireseek 576 CY')
  })

  it('rewrites only the calendar fence when the hour advances', () => {
    const { definition, now } = calendarPreset('custom')
    const start = calendarNoteTemplate(definition, now)
    const next = addDays(definition, now, 1)
    const written = writeCalendarIntoNote(start, definition, next)
    const parsed = parseCampaignCalendar(written)
    expect(parsed?.now.day).toBe(2)
    expect(written).toContain('# Calendar')
    expect(written.match(/\[!calendar\]/g)?.length).toBe(1)
  })

  it('keeps Shieldmeet as the current month on a leap year', () => {
    const { definition } = calendarPreset('harptos')
    const midsummer = findUnitIndex(definition, 1492, 'Midsummer')
    const shieldmeet = addDays(definition, { year: 1492, unitIndex: midsummer, day: 1, hour: 9 }, 1)
    const note = calendarNoteTemplate(definition, shieldmeet)
    const parsed = parseCampaignCalendar(note)
    expect(parsed?.now.year).toBe(1492)
    expect(formatCalendar(parsed!.definition, parsed!.now).unitName).toBe('Shieldmeet')
    expect(formatCalendar(parsed!.definition, parsed!.now).festival).toBe(true)
  })

  it('reads custom weekdays, month lengths, and a 10-hour day', () => {
    const body = [
      'type: custom',
      'era: AF',
      'year: 412',
      'month: Highsun',
      'day: 12',
      'hour: 7',
      'hoursPerDay: 10',
      'dawn: 2',
      'dusk: 8',
      'weekdays: Moon, Tide, Ember, Stone, Vein, Rest, Hearth, Veil',
      'months:',
      '- Seedmoon: 30',
      '- Thawmere: 28',
      '- Highsun: 30',
      '- Year-turn: 5 festival'
    ].join('\n')
    const parsed = parseCalendarBlock(body)
    expect(parsed.definition.hoursPerDay).toBe(10)
    expect(parsed.definition.weekdays).toHaveLength(8)
    expect(parsed.definition.units[1]).toMatchObject({ name: 'Thawmere', days: 28 })
    expect(parsed.now).toMatchObject({ day: 12, hour: 7 })
    expect(formatCalendar(parsed.definition, parsed.now).time).toBe('Hour 8/10')
  })
})
