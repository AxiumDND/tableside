import { describe, expect, it } from 'vitest'
import { playerWindowNeedsRebuild, shouldShowPlayerWindow } from './playerWindow'

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

describe('playerWindowNeedsRebuild', () => {
  it('rebuilds when the window is missing or the TV changed', () => {
    expect(playerWindowNeedsRebuild(null, { id: 2, scaleFactor: 1 })).toBe(true)
    expect(playerWindowNeedsRebuild({ id: 1, scaleFactor: 2 }, { id: 2, scaleFactor: 1 })).toBe(true)
    expect(playerWindowNeedsRebuild({ id: 2, scaleFactor: 1.5 }, { id: 2, scaleFactor: 1 })).toBe(true)
  })

  it('keeps the window when the same TV and scale are still in use', () => {
    expect(playerWindowNeedsRebuild({ id: 2, scaleFactor: 1 }, { id: 2, scaleFactor: 1 })).toBe(false)
  })
})
