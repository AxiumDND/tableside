import { describe, expect, it } from 'vitest'
import { asRightPanelId, asToolsTabId, groupToolLabel } from './rightPanel'

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

  it('restores NPC, Improvise, Dice, Timer, and Links tabs', () => {
    expect(asToolsTabId('names')).toBe('npc')
    expect(asToolsTabId('npc')).toBe('npc')
    expect(asToolsTabId('improvise')).toBe('improvise')
    expect(asToolsTabId('dice')).toBe('dice')
    expect(asToolsTabId('doom')).toBe('dice')
    expect(asToolsTabId('timer')).toBe('timer')
    expect(asToolsTabId('links')).toBe('links')
  })
})

describe('groupToolLabel', () => {
  it('names the open tool, otherwise the group', () => {
    const prep = [
      { id: 'npc' as const, label: 'NPC' },
      { id: 'links' as const, label: 'Links' }
    ]
    expect(groupToolLabel(prep, 'Prep', null)).toBe('Prep')
    expect(groupToolLabel(prep, 'Prep', 'npc')).toBe('NPC')
    expect(groupToolLabel(prep, 'Prep', 'lookup')).toBe('Prep')
  })
})
