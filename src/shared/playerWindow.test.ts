import { describe, expect, it } from 'vitest'
import { shouldShowPlayerWindow } from './playerWindow'

describe('shouldShowPlayerWindow', () => {
  it('stays hidden on a single monitor', () => {
    expect(shouldShowPlayerWindow(false, true)).toBe(false)
    expect(shouldShowPlayerWindow(false, false)).toBe(false)
  })

  it('opens on a second monitor until the DM closes it', () => {
    expect(shouldShowPlayerWindow(true, true)).toBe(true)
    expect(shouldShowPlayerWindow(true, false)).toBe(false)
  })
})
