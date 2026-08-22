import { describe, expect, it } from 'vitest'
import { extraItemFacts, cleanWikiText, isPlaceholderSheetValue, isPlaceholderTagline } from './itemFacts'

describe('extraItemFacts', () => {
  it('reads Weight and Cost on their own lines', () => {
    expect(extraItemFacts('Adventuring Gear\nWeight: 1 lb.\nCost: 25 GP')).toEqual([
      { label: 'Weight', value: '1 lb.' },
      { label: 'Cost', value: '25 GP' }
    ])
  })

  it('splits jammed Weight/Cost onto their own facts', () => {
    expect(extraItemFacts('Adventuring Gear Weight: 1 lb. Cost: 25 GP')).toEqual([
      { label: 'Weight', value: '1 lb.' },
      { label: 'Cost', value: '25 GP' }
    ])
  })
})

describe('placeholder sheet fields', () => {
  it('hides unfilled template values and wiki placeholders', () => {
    expect(isPlaceholderSheetValue('Settlement / site / wilderness / dungeon')).toBe(true)
    expect(isPlaceholderSheetValue('[[Faction Name]]')).toBe(true)
    expect(isPlaceholderSheetValue('Settlement')).toBe(false)
    expect(isPlaceholderTagline('What this place is in one line')).toBe(true)
    expect(isPlaceholderTagline('A valley town under a closed sky')).toBe(false)
    expect(cleanWikiText('[[Urwin Martikov|Urwin]]')).toBe('Urwin')
  })
})
