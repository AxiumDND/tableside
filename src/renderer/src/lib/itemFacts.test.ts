import { describe, expect, it } from 'vitest'
import { extraItemFacts } from './itemFacts'

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
