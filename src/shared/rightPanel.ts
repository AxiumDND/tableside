export type RightPanelId = 'combat' | 'tools' | 'help' | 'music'

export type ToolsTabId = 'lookup' | 'npc' | 'improvise' | 'dice' | 'timer' | 'links'

export const PREP_TOOLS: { id: ToolsTabId; label: string }[] = [
  { id: 'npc', label: 'NPC' },
  { id: 'improvise', label: 'Improvise' },
  { id: 'links', label: 'Links' }
]

export const TABLE_TOOLS: { id: ToolsTabId; label: string }[] = [
  { id: 'dice', label: 'Dice' },
  { id: 'timer', label: 'Timer' }
]

export const TOOL_TABS: { id: ToolsTabId; label: string }[] = [
  { id: 'lookup', label: 'Lookup' },
  ...PREP_TOOLS,
  ...TABLE_TOOLS
]

export function toolTabLabel(tab: ToolsTabId): string {
  return TOOL_TABS.find((item) => item.id === tab)?.label ?? 'Lookup'
}

/** Map saved prefs, including the old Lookup panel id. */
export function asRightPanelId(value: unknown): RightPanelId | null {
  if (value === 'lookup') return 'tools'
  return value === 'combat' || value === 'tools' || value === 'help' || value === 'music' ? value : null
}

export function asToolsTabId(value: unknown): ToolsTabId {
  if (value === 'doom' || value === 'dice') return 'dice'
  if (value === 'names') return 'npc'
  return value === 'npc' || value === 'improvise' || value === 'timer' || value === 'links'
    ? value
    : 'lookup'
}
