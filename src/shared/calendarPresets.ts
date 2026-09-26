import type { CalendarDefinition, CalendarInstant, CalendarTypeId } from './calendar'

const GREGORIAN_WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const GREGORIAN_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]

/** Common table month / festival names for the Calendar of Harptos. Labels only — no setting lore. */
const HARPTOS_UNITS: CalendarDefinition['units'] = [
  { name: 'Hammer', days: 30 },
  { name: 'Midwinter', days: 1, festival: true },
  { name: 'Alturiak', days: 30 },
  { name: 'Ches', days: 30 },
  { name: 'Tarsakh', days: 30 },
  { name: 'Greengrass', days: 1, festival: true },
  { name: 'Mirtul', days: 30 },
  { name: 'Kythorn', days: 30 },
  { name: 'Flamerule', days: 30 },
  { name: 'Midsummer', days: 1, festival: true },
  { name: 'Eleasis', days: 30 },
  { name: 'Eleint', days: 30 },
  { name: 'Highharvestide', days: 1, festival: true },
  { name: 'Marpenoth', days: 30 },
  { name: 'Uktar', days: 30 },
  { name: 'Feast of the Moon', days: 1, festival: true },
  { name: 'Nightal', days: 30 }
]

/** Common table month / festival / weekday names for the Flanaess calendar. Labels only. */
const GREYHAWK_WEEKDAYS = ['Starday', 'Sunday', 'Moonday', 'Godsday', 'Waterday', 'Earthday', 'Freeday']
const GREYHAWK_UNITS: CalendarDefinition['units'] = [
  { name: 'Needfest', days: 7, festival: true },
  { name: 'Fireseek', days: 28 },
  { name: 'Readying', days: 28 },
  { name: 'Coldeven', days: 28 },
  { name: 'Growfest', days: 7, festival: true },
  { name: 'Planting', days: 28 },
  { name: 'Flocktime', days: 28 },
  { name: 'Wealsun', days: 28 },
  { name: 'Richfest', days: 7, festival: true },
  { name: 'Reaping', days: 28 },
  { name: 'Goodmonth', days: 28 },
  { name: 'Harvester', days: 28 },
  { name: 'Brewfest', days: 7, festival: true },
  { name: 'Patchwall', days: 28 },
  { name: "Ready'reat", days: 28 },
  { name: 'Sunsebb', days: 28 }
]

/** Original Tableside year — 8-day week, 12×30 plus five year-turn days. */
const CUSTOM_WEEKDAYS = ['Moon', 'Tide', 'Ember', 'Stone', 'Vein', 'Rest', 'Hearth', 'Veil']
const CUSTOM_UNITS: CalendarDefinition['units'] = [
  { name: 'Seedmoon', days: 30 },
  { name: 'Thawmere', days: 30 },
  { name: 'Greenwake', days: 30 },
  { name: 'Highsun', days: 30 },
  { name: 'Goldensheaf', days: 30 },
  { name: 'Ashfall', days: 30 },
  { name: 'Emberwane', days: 30 },
  { name: 'Frostgate', days: 30 },
  { name: 'Hearthdeep', days: 30 },
  { name: 'Veilnight', days: 30 },
  { name: 'Ironwake', days: 30 },
  { name: 'Lastwatch', days: 30 },
  { name: 'Year-turn', days: 5, festival: true }
]

function civilNow(): CalendarInstant {
  const now = new Date()
  return {
    year: now.getFullYear(),
    unitIndex: now.getMonth(),
    day: now.getDate(),
    hour: 9
  }
}

export const CALENDAR_TYPE_OPTIONS: { id: CalendarTypeId; label: string; hint: string }[] = [
  { id: 'gregorian', label: 'Gregorian', hint: 'Earth year — 7-day week, 12 months, 24 hours' },
  { id: 'harptos', label: 'Forgotten Realms', hint: '12×30 days, five festivals, tendays, Shieldmeet every 4 years' },
  { id: 'greyhawk', label: 'Greyhawk', hint: '12×28 days, four festival weeks, 7 named weekdays' },
  { id: 'custom', label: 'Custom', hint: 'Your weekdays, month lengths, and hours in a day' }
]

export function calendarPreset(type: CalendarTypeId): { definition: CalendarDefinition; now: CalendarInstant } {
  if (type === 'gregorian') {
    return {
      definition: {
        type: 'gregorian',
        era: '',
        weekdays: GREGORIAN_WEEKDAYS,
        units: GREGORIAN_MONTHS.map((name) => ({ name, days: 31 })),
        hoursPerDay: 24,
        dawnHour: 6,
        duskHour: 18
      },
      now: civilNow()
    }
  }
  if (type === 'harptos') {
    return {
      definition: {
        type: 'harptos',
        era: 'DR',
        weekdays: [],
        units: HARPTOS_UNITS,
        hoursPerDay: 24,
        dawnHour: 6,
        duskHour: 18,
        leap: { everyYears: 4, extraUnitName: 'Shieldmeet', afterUnit: 'Midsummer' }
      },
      now: { year: 1492, unitIndex: 0, day: 1, hour: 9 }
    }
  }
  if (type === 'greyhawk') {
    return {
      definition: {
        type: 'greyhawk',
        era: 'CY',
        weekdays: GREYHAWK_WEEKDAYS,
        units: GREYHAWK_UNITS,
        hoursPerDay: 24,
        dawnHour: 6,
        duskHour: 18
      },
      now: { year: 576, unitIndex: 1, day: 1, hour: 9 }
    }
  }
  return {
    definition: {
      type: 'custom',
      era: 'AF',
      weekdays: CUSTOM_WEEKDAYS,
      units: CUSTOM_UNITS,
      hoursPerDay: 24,
      dawnHour: 6,
      duskHour: 18
    },
    now: { year: 412, unitIndex: 0, day: 1, hour: 9 }
  }
}
