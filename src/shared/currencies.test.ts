import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CURRENCIES,
  formatTreasureCoinLine,
  normalizeCurrencies,
  treasureBlockBodyLines
} from './currencies'

describe('normalizeCurrencies', () => {
  it('returns classic D&D defaults when missing', () => {
    expect(normalizeCurrencies(undefined).map((c) => c.abbr)).toEqual(['pp', 'gp', 'sp', 'cp'])
    expect(normalizeCurrencies([])).toEqual([...DEFAULT_CURRENCIES])
  })

  it('keeps a custom list', () => {
    const next = normalizeCurrencies([
      { id: 'credits', label: 'Credits', abbr: 'cr' },
      { label: 'Script', abbr: 'sc' }
    ])
    expect(next).toEqual([
      { id: 'credits', label: 'Credits', abbr: 'cr' },
      { id: 'script', label: 'Script', abbr: 'sc' }
    ])
  })
})

describe('formatTreasureCoinLine', () => {
  it('includes platinum in the default coin line', () => {
    expect(formatTreasureCoinLine()).toBe('**Coin:** … pp · … gp · … sp · … cp')
  })
})

describe('treasureBlockBodyLines', () => {
  it('starts with the coin line', () => {
    expect(treasureBlockBodyLines()[0]).toBe(formatTreasureCoinLine())
  })
})
