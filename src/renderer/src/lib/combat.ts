import type { Combatant, CombatState, PlayerInitiativeEntry } from '../../../shared/types'
import { abilityMod, rollD20 } from './dice'

export function initiativeBonus(c: Combatant): number {
  if (typeof c.statBlock?.initiativeBonus === 'number') return c.statBlock.initiativeBonus
  if (typeof c.statBlock?.modifiers?.dexterity === 'number') return c.statBlock.modifiers.dexterity
  if (typeof c.statBlock?.scores?.dexterity === 'number') return abilityMod(c.statBlock.scores.dexterity)
  return 0
}

export function sortCombatants(list: Combatant[]): Combatant[] {
  return [...list].sort(
    (a, b) => b.initiative - a.initiative || initiativeBonus(b) - initiativeBonus(a) || a.name.localeCompare(b.name)
  )
}

export function isBloodied(c: Combatant): boolean {
  return c.hp > 0 && (c.kind === 'npc' || c.kind === 'monster') && c.maxHp > 0 && c.hp < c.maxHp / 2
}

export function combatantCondition(c: Combatant): PlayerInitiativeEntry['condition'] {
  if (c.hp <= 0) return c.kind === 'pc' ? 'unconscious' : 'dead'
  if (isBloodied(c)) return 'bloodied'
  return null
}

export function combatToPlayerInitiative(combat: CombatState): PlayerInitiativeEntry[] {
  const entries = sortCombatants(combat.combatants).map((c) => {
    const condition = combatantCondition(c)
    return {
      id: c.id,
      name: c.name,
      active: Boolean(combat.round > 0 && combat.activeId === c.id),
      bloodied: condition === 'bloodied',
      condition
    }
  })
  const turn = entries.findIndex((entry) => entry.active)
  if (turn <= 0) return entries
  return [...entries.slice(turn), ...entries.slice(0, turn)]
}

/** Start combat or advance to the next combatant (and round when wrapping). */
export function advanceCombatTurn(combat: CombatState): CombatState {
  const ordered = sortCombatants(combat.combatants)
  if (ordered.length === 0) return combat
  const round = combat.round ?? 0
  const started = round > 0
  const turnId =
    started && combat.activeId && ordered.some((c) => c.id === combat.activeId) ? combat.activeId : null
  if (!started || !turnId) {
    return { ...combat, activeId: ordered[0].id, round: Math.max(1, round || 1) }
  }
  const idx = ordered.findIndex((c) => c.id === turnId)
  const nextIdx = (idx + 1) % ordered.length
  return {
    ...combat,
    activeId: ordered[nextIdx].id,
    round: nextIdx === 0 ? round + 1 : round
  }
}

/**
 * Roll initiative for matching combatants.
 * `unrolled-npcs` = non-PCs still at initiative 0 (typical after Add to initiative).
 */
export function rollInitiativeFor(
  combatants: Combatant[],
  which: Combatant['kind'][] | 'all' | 'unrolled-npcs',
  roll: (bonus: number) => number = (bonus) => rollD20(bonus, 'Init').total
): Combatant[] {
  return combatants.map((c) => {
    if (which === 'unrolled-npcs') {
      if (c.kind === 'pc' || c.initiative !== 0) return c
    } else if (which !== 'all' && !which.includes(c.kind)) {
      return c
    }
    return { ...c, initiative: roll(initiativeBonus(c)) }
  })
}
