import { afterEach, describe, expect, it } from 'vitest'
import { searchSrd, setCoreRecords, srdCounts } from './srd'
import { packLookupRecords } from './systemLookup'

describe('system pack lookup', () => {
  afterEach(() => {
    setCoreRecords(null)
  })

  it('keeps the 5e SRD as the default index', () => {
    expect(packLookupRecords('dnd5e').length).toBeGreaterThan(srdCounts.monsters)
    expect(searchSrd('', 'monster').length).toBe(srdCounts.monsters)
  })

  it('loads original PF2e conditions without SRD longswords', () => {
    setCoreRecords(packLookupRecords('pf2e'))
    const names = searchSrd('', 'condition').map((record) => record.name)
    expect(names).toEqual(expect.arrayContaining(['Blinded', 'Off-Guard', 'Wounded', 'Dying']))
    expect(searchSrd('longsword').some((record) => record.name === 'Longsword')).toBe(false)
    expect(searchSrd('', 'monster').map((record) => record.name)).toEqual(
      expect.arrayContaining(['Ridge Wolf', 'Town Guard'])
    )
  })

  it('loads original V5 Hunger / Health / Willpower procedures', () => {
    setCoreRecords(packLookupRecords('v5'))
    expect(searchSrd('', 'topic:hunger').map((record) => record.name)).toEqual(
      expect.arrayContaining(['Hunger', 'Rousing Hunger'])
    )
    expect(searchSrd('', 'topic:health').some((record) => record.name === 'Health')).toBe(true)
    expect(searchSrd('', 'topic:willpower').some((record) => record.name === 'Willpower')).toBe(true)
    expect(searchSrd('brujah').length).toBe(0)
  })
})
