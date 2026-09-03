export type RightPanelId = 'combat' | 'tools' | 'help' | 'music'

export type ToolsTabId = 'lookup' | 'npc' | 'improvise' | 'dice' | 'links'

/** Map saved prefs, including the old Lookup panel id. */
export function asRightPanelId(value: unknown): RightPanelId | null {
  if (value === 'lookup') return 'tools'
  return value === 'combat' || value === 'tools' || value === 'help' || value === 'music' ? value : null
}

export function asToolsTabId(value: unknown): ToolsTabId {
  if (value === 'doom' || value === 'dice') return 'dice'
  if (value === 'names') return 'npc'
  return value === 'npc' || value === 'improvise' || value === 'links' ? value : 'lookup'
}
