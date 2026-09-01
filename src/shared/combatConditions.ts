import { parseSystemId, type SystemId } from './systemPack'

/** A toggleable status on a combat tracker row (not the HP-derived Bloodied / Dead tag). */
export interface CombatStatus {
  id: string
  name: string
}

const DND5E_STATUSES: CombatStatus[] = [
  { id: 'blinded', name: 'Blinded' },
  { id: 'charmed', name: 'Charmed' },
  { id: 'deafened', name: 'Deafened' },
  { id: 'exhaustion', name: 'Exhaustion' },
  { id: 'frightened', name: 'Frightened' },
  { id: 'grappled', name: 'Grappled' },
  { id: 'incapacitated', name: 'Incapacitated' },
  { id: 'invisible', name: 'Invisible' },
  { id: 'paralyzed', name: 'Paralyzed' },
  { id: 'petrified', name: 'Petrified' },
  { id: 'poisoned', name: 'Poisoned' },
  { id: 'prone', name: 'Prone' },
  { id: 'restrained', name: 'Restrained' },
  { id: 'stunned', name: 'Stunned' },
  { id: 'unconscious', name: 'Unconscious' }
]

const PF2E_STATUSES: CombatStatus[] = [
  { id: 'pf2e-blinded', name: 'Blinded' },
  { id: 'pf2e-clumsy', name: 'Clumsy' },
  { id: 'pf2e-concealed', name: 'Concealed' },
  { id: 'pf2e-confused', name: 'Confused' },
  { id: 'pf2e-dazzled', name: 'Dazzled' },
  { id: 'pf2e-deafened', name: 'Deafened' },
  { id: 'pf2e-drained', name: 'Drained' },
  { id: 'pf2e-enfeebled', name: 'Enfeebled' },
  { id: 'pf2e-fascinated', name: 'Fascinated' },
  { id: 'pf2e-fatigued', name: 'Fatigued' },
  { id: 'pf2e-frightened', name: 'Frightened' },
  { id: 'pf2e-grabbed', name: 'Grabbed' },
  { id: 'pf2e-hidden', name: 'Hidden' },
  { id: 'pf2e-immobilized', name: 'Immobilized' },
  { id: 'pf2e-invisible', name: 'Invisible' },
  { id: 'pf2e-off-guard', name: 'Off-Guard' },
  { id: 'pf2e-paralyzed', name: 'Paralyzed' },
  { id: 'pf2e-petrified', name: 'Petrified' },
  { id: 'pf2e-prone', name: 'Prone' },
  { id: 'pf2e-sickened', name: 'Sickened' },
  { id: 'pf2e-slowed', name: 'Slowed' },
  { id: 'pf2e-stunned', name: 'Stunned' },
  { id: 'pf2e-stupefied', name: 'Stupefied' },
  { id: 'pf2e-unconscious', name: 'Unconscious' }
]

const V5_STATUSES: CombatStatus[] = [
  { id: 'v5-hunger-frenzy', name: 'Frenzy' },
  { id: 'v5-impaired', name: 'Impaired' },
  { id: 'v5-immobilized', name: 'Immobilized' },
  { id: 'prone', name: 'Prone' }
]

const BY_SYSTEM: Record<SystemId, CombatStatus[]> = {
  dnd5e: DND5E_STATUSES,
  pf2e: PF2E_STATUSES,
  v5: V5_STATUSES
}

export function combatStatusesFor(system?: string | null): CombatStatus[] {
  return BY_SYSTEM[parseSystemId(system)]
}

export function statusLabel(id: string, catalog: readonly CombatStatus[]): string {
  const hit = catalog.find((item) => item.id === id)
  if (hit) return hit.name
  const text = id.replace(/^(pf2e|v5)-/, '').replace(/[-_]/g, ' ').trim()
  return text.replace(/\b\w/g, (ch) => ch.toUpperCase()) || id
}

export function normalizeStatuses(list: string[] | undefined): string[] {
  if (!list?.length) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of list) {
    const id = raw.trim().toLowerCase()
    if (!id || seen.has(id)) continue
    seen.add(id)
    out.push(id)
  }
  return out
}

export function toggleStatus(list: string[] | undefined, id: string): string[] {
  const current = normalizeStatuses(list)
  const key = id.trim().toLowerCase()
  if (!key) return current
  return current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
}

export function orderedStatuses(list: string[] | undefined, catalog: readonly CombatStatus[]): string[] {
  const current = normalizeStatuses(list)
  const rank = new Map(catalog.map((item, index) => [item.id, index]))
  return [...current].sort((a, b) => {
    const ia = rank.get(a)
    const ib = rank.get(b)
    if (ia == null && ib == null) return a.localeCompare(b)
    if (ia == null) return 1
    if (ib == null) return -1
    return ia - ib
  })
}
