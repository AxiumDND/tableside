import { describe, expect, it } from 'vitest'
import { DEFAULT_CURRENCIES } from './currencies'
import {
  parseTreasureFields,
  serializeTreasureBody,
  serializeTreasureCallout
} from './treasureFields'

describe('parseTreasureFields', () => {
  it('reads coin amounts and bullet items', () => {
    const body = [
      '**Coin:** 2 pp · 40 gp · … sp · 5 cp',
      '**Mundane:**',
      '- [[Rope]]',
      '- traveler kit',
      '**Magic:**',
      '- [[Cloak of Elvenkind]] (attunement)',
      '**Hidden:** Investigation DC 14',
      '**Notes:**',
      'Under the hearth.'
    ].join('\n')
    const fields = parseTreasureFields('Hearth cache', body, [...DEFAULT_CURRENCIES])
    expect(fields.title).toBe('Hearth cache')
    expect(fields.coins).toEqual({ pp: '2', gp: '40', sp: '', cp: '5' })
    expect(fields.mundane).toEqual(['[[Rope]]', 'traveler kit'])
    expect(fields.magic).toEqual(['[[Cloak of Elvenkind]] (attunement)'])
    expect(fields.hidden).toBe('Investigation DC 14')
    expect(fields.notes).toBe('Under the hearth.')
  })

  it('splits legacy mid-dot item lines and drops placeholders', () => {
    const fields = parseTreasureFields('', '**Mundane:** [[Rope]] · …\n**Magic:** [[Potion]]', [
      ...DEFAULT_CURRENCIES
    ])
    expect(fields.mundane).toEqual(['[[Rope]]'])
    expect(fields.magic).toEqual(['[[Potion]]'])
  })

  it('rejoins wiki links broken across lines and restores #note links', () => {
    const body = [
      '**Magic:**',
      '- [Cloak of Elvenkind]',
      '(#note:Gear%2FMagic%20Items%2FCloak%20of%20Elvenkind.md) (attunement) — who notices'
    ].join('\n')
    const fields = parseTreasureFields('', body, [...DEFAULT_CURRENCIES])
    expect(fields.magic).toEqual(['[[Cloak of Elvenkind]] (attunement) — who notices'])
  })

  it('drops default template item stubs', () => {
    const body = [
      '**Mundane:**',
      '- [[Item Name]]',
      '- Item Name',
      '- [[Rope]]',
      '**Magic:**',
      '- [[Magic Item]] (attunement?) — where / who notices',
      '- [[Chime of Last Rites]]'
    ].join('\n')
    const fields = parseTreasureFields('', body, [...DEFAULT_CURRENCIES])
    expect(fields.mundane).toEqual(['[[Rope]]'])
    expect(fields.magic).toEqual(['[[Chime of Last Rites]]'])
  })

  it('keeps empty Mundane/Magic sections from swallowing the next label', () => {
    const body = [
      '**Coin:** 1 gp',
      '**Mundane:**',
      '**Magic:**',
      '**Hidden:**',
      '**Notes:**'
    ].join('\n')
    const fields = parseTreasureFields('Cache', body, [...DEFAULT_CURRENCIES])
    expect(fields.mundane).toEqual([])
    expect(fields.magic).toEqual([])
    expect(fields.coins.gp).toBe('1')
  })

  it('strips leaked **Magic:** lines from item lists', () => {
    const body = [
      '**Mundane:**',
      '- **Magic:**',
      '- [[Rope]]',
      '**Magic:**',
      '- **Magic:**'
    ].join('\n')
    const fields = parseTreasureFields('', body, [...DEFAULT_CURRENCIES])
    expect(fields.mundane).toEqual(['[[Rope]]'])
    expect(fields.magic).toEqual([])
  })

  it('treats default Hidden stub as empty', () => {
    const fields = parseTreasureFields(
      '',
      '**Hidden:** Perception / Investigation DC …',
      [...DEFAULT_CURRENCIES]
    )
    expect(fields.hidden).toBe('')
  })
})

describe('serializeTreasureBody', () => {
  it('writes coin boxes and item lists', () => {
    const body = serializeTreasureBody(
      {
        title: 'Cache',
        coins: { pp: '1', gp: '10', sp: '', cp: '' },
        mundane: ['[[Rope]]'],
        magic: ['[[Wand]]'],
        hidden: 'DC 12',
        notes: 'Dusty.'
      },
      [...DEFAULT_CURRENCIES]
    )
    expect(body).toContain('**Coin:** 1 pp · 10 gp · … sp · … cp')
    expect(body).toContain('**Mundane:**\n- [[Rope]]')
    expect(body).toContain('**Magic:**\n- [[Wand]]')
    expect(serializeTreasureCallout(
      {
        title: 'Cache',
        coins: { pp: '', gp: '', sp: '', cp: '' },
        mundane: [],
        magic: [],
        hidden: '',
        notes: ''
      },
      [...DEFAULT_CURRENCIES]
    )).toContain('[!treasure] Cache')
  })
})
