import { describe, expect, it } from 'vitest'
import { asRightPanelId, asToolsTabId } from './rightPanel'

describe('asRightPanelId', () => {
  it('keeps current panel ids', () => {
    expect(asRightPanelId('tools')).toBe('tools')
    expect(asRightPanelId('combat')).toBe('combat')
    expect(asRightPanelId('music')).toBe('music')
    expect(asRightPanelId('help')).toBe('help')
  })

  it('maps the old Lookup panel id onto Tools', () => {
    expect(asRightPanelId('lookup')).toBe('tools')
  })

  it('rejects unknown values', () => {
    expect(asRightPanelId('dice')).toBeNull()
    expect(asRightPanelId(null)).toBeNull()
  })
})

describe('asToolsTabId', () => {
  it('defaults to Lookup', () => {
    expect(asToolsTabId(undefined)).toBe('lookup')
    expect(asToolsTabId('lookup')).toBe('lookup')
  })

  it('restores NPC, Improvise, and Dice tabs', () => {
    expect(asToolsTabId('names')).toBe('npc')
    expect(asToolsTabId('npc')).toBe('npc')
    expect(asToolsTabId('improvise')).toBe('improvise')
    expect(asToolsTabId('dice')).toBe('dice')
    expect(asToolsTabId('doom')).toBe('dice')
  })
})
