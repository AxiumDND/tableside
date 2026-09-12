import { describe, expect, it } from 'vitest'
import {
  addDays,
  addHours,
  calendarBarLabel,
  calendarLight,
  findUnitIndex,
  formatCalendar,
  normalizeInstant,
  unitsForYear,
  yearLength
} from './calendar'
import { calendarPreset } from './calendarPresets'

describe('gregorian', () => {
  const { definition } = calendarPreset('gregorian')

  it('gives February 29 in a leap year and 28 otherwise', () => {
    expect(unitsForYear(definition, 2024)[1]?.days).toBe(29)
    expect(unitsForYear(definition, 2023)[1]?.days).toBe(28)
    expect(unitsForYear(definition, 1900)[1]?.days).toBe(28)
    expect(unitsForYear(definition, 2000)[1]?.days).toBe(29)
  })

  it('rolls February 28 into March except on leap years', () => {
    const leap = addDays(definition, { year: 2024, unitIndex: 1, day: 28, hour: 9 }, 1)
    expect(leap).toMatchObject({ year: 2024, unitIndex: 1, day: 29 })
    const next = addDays(definition, leap, 1)
    expect(next).toMatchObject({ year: 2024, unitIndex: 2, day: 1 })
    const common = addDays(definition, { year: 2023, unitIndex: 1, day: 28, hour: 9 }, 1)
    expect(common).toMatchObject({ year: 2023, unitIndex: 2, day: 1 })
  })

  it('wraps December into the next year', () => {
    const next = addDays(definition, { year: 2024, unitIndex: 11, day: 31, hour: 9 }, 1)
    expect(next).toMatchObject({ year: 2025, unitIndex: 0, day: 1, hour: 9 })
  })
})

describe('hours and light', () => {
  const { definition } = calendarPreset('gregorian')

  it('wraps the last hour of a 24-hour day into tomorrow', () => {
    const next = addHours(definition, { year: 2026, unitIndex: 0, day: 1, hour: 23 }, 1)
    expect(next).toMatchObject({ year: 2026, unitIndex: 0, day: 2, hour: 0 })
    const back = addHours(definition, { year: 2026, unitIndex: 0, day: 1, hour: 0 }, -1)
    expect(back).toMatchObject({ year: 2025, unitIndex: 11, day: 31, hour: 23 })
  })

  it('keeps the hour when advancing a day', () => {
    const next = addDays(definition, { year: 2026, unitIndex: 5, day: 6, hour: 14 }, 1)
    expect(next).toMatchObject({ year: 2026, unitIndex: 5, day: 7, hour: 14 })
  })

  it('labels dawn, day, dusk, and night', () => {
    expect(calendarLight(definition, 6)).toBe('dawn')
    expect(calendarLight(definition, 9)).toBe('day')
    expect(calendarLight(definition, 18)).toBe('dusk')
    expect(calendarLight(definition, 22)).toBe('night')
  })

  it('prints Hour n/span when a day is not 24 hours', () => {
    const ten = { ...definition, hoursPerDay: 10, dawnHour: 2, duskHour: 8 }
    const read = formatCalendar(ten, { year: 1, unitIndex: 0, day: 1, hour: 7 })
    expect(read.time).toBe('Hour 8/10')
    expect(read.light).toBe('day')
  })
})

describe('harptos', () => {
  const { definition, now } = calendarPreset('harptos')

  it('is 365 days, plus Shieldmeet every 4 years after Midsummer', () => {
    expect(yearLength(definition, 1491)).toBe(365)
    expect(yearLength(definition, 1492)).toBe(366)
    expect(unitsForYear(definition, 1491).some((unit) => unit.name === 'Shieldmeet')).toBe(false)
    expect(unitsForYear(definition, 1492).map((unit) => unit.name)).toContain('Shieldmeet')
  })

  it('steps Midsummer of a leap year onto Shieldmeet, then Eleasis', () => {
    const midsummer = findUnitIndex(definition, 1492, 'Midsummer')
    const leapDay = addDays(definition, { year: 1492, unitIndex: midsummer, day: 1, hour: 9 }, 1)
    expect(unitsForYear(definition, 1492)[leapDay.unitIndex]?.name).toBe('Shieldmeet')
    const after = addDays(definition, leapDay, 1)
    expect(unitsForYear(definition, 1492)[after.unitIndex]?.name).toBe('Eleasis')
    expect(after.day).toBe(1)
  })

  it('skips Shieldmeet in a common year', () => {
    const midsummer = findUnitIndex(definition, 1493, 'Midsummer')
    const after = addDays(definition, { year: 1493, unitIndex: midsummer, day: 1, hour: 9 }, 1)
    expect(unitsForYear(definition, 1493)[after.unitIndex]?.name).toBe('Eleasis')
  })

  it('uses tenday labels instead of weekdays', () => {
    const read = formatCalendar(definition, now)
    expect(read.weekday).toBe('1st tenday')
    expect(calendarBarLabel(definition, now)).toMatch(/1 Hammer 1492 DR/)
    expect(calendarBarLabel(definition, now)).toMatch(/9am/)
  })
})

describe('greyhawk', () => {
  const { definition, now } = calendarPreset('greyhawk')

  it('is 364 days with four festival weeks', () => {
    expect(yearLength(definition, 576)).toBe(364)
    expect(definition.weekdays).toHaveLength(7)
    expect(definition.units.filter((unit) => unit.festival).map((unit) => unit.name)).toEqual([
      'Needfest',
      'Growfest',
      'Richfest',
      'Brewfest'
    ])
  })

  it('starts Fireseek 576 on Starday', () => {
    const read = formatCalendar(definition, normalizeInstant(definition, now))
    expect(read.weekday).toBe('Starday')
    expect(read.date).toBe('1 Fireseek 576 CY')
  })
})

describe('custom', () => {
  const { definition, now } = calendarPreset('custom')

  it('uses an 8-day week and a 5-day year-turn', () => {
    expect(definition.weekdays).toHaveLength(8)
    expect(yearLength(definition, 412)).toBe(365)
    expect(definition.units.at(-1)).toMatchObject({ name: 'Year-turn', days: 5, festival: true })
  })

  it('names the weekday from the accumulated day count', () => {
    const read = formatCalendar(definition, now)
    expect(read.weekday).toBeTruthy()
    expect(definition.weekdays).toContain(read.weekday)
    expect(calendarBarLabel(definition, now)).toMatch(/1 Seedmoon 412 AF/)
  })
})
