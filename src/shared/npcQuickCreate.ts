/** Simple SRD stat blocks for Tools → NPC quick create (D&D 5e 2024). */
export type NpcStatOption = {
  id: string
  label: string
  hint: string
}

export const NPC_STAT_OPTIONS: NpcStatOption[] = [
  { id: 'srd-2024_commoner', label: 'Commoner', hint: 'CR 0' },
  { id: 'srd-2024_guard', label: 'Guard', hint: 'CR 1/8' },
  { id: 'srd-2024_bandit', label: 'Bandit', hint: 'CR 1/8' },
  { id: 'srd-2024_scout', label: 'Scout', hint: 'CR 1/2' },
  { id: 'srd-2024_thug', label: 'Tough', hint: 'CR 1' },
  { id: 'srd-2024_gladiator', label: 'Gladiator', hint: 'CR 5' },
  { id: 'srd-2024_knight', label: 'Knight', hint: 'CR 3' },
  { id: 'srd-2024_noble', label: 'Noble', hint: 'CR 1/8' },
  { id: 'srd-2024_spy', label: 'Spy', hint: 'CR 1' },
  { id: 'srd-2024_cultist', label: 'Cultist', hint: 'CR 1/8' },
  { id: 'srd-2024_berserker', label: 'Berserker', hint: 'CR 2' }
]

export function defaultNpcStatId(): string {
  return NPC_STAT_OPTIONS[0]?.id ?? 'srd-2024_commoner'
}

/** Replace the statblock fence on an NPC sheet. */
export function replaceNpcStatblockFence(markdown: string, fence: string): string {
  if (/```statblock\r?\n[\s\S]*?```/i.test(markdown)) {
    return markdown.replace(/```statblock\r?\n[\s\S]*?```/i, fence.trim())
  }
  return `${markdown.trim()}\n\n${fence.trim()}\n`
}

/** Set the CR row in the NPC facts table when present. */
export function applyNpcCr(markdown: string, cr: string): string {
  const value = cr.trim() || '—'
  if (/^\|\s*\*\*CR\*\*\s*\|/m.test(markdown)) {
    return markdown.replace(/^\|\s*\*\*CR\*\*\s*\|.*\|$/m, `| **CR** | ${value} |`)
  }
  return markdown
}
