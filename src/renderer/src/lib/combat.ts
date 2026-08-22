import type { Combatant, CombatState, PlayerInitiativeEntry } from '../../../shared/types'
import { conditionLabel, getSystemPack, type CombatProfile, type OverlayTag } from '../../../shared/systemPack'
import { abilityMod, rollD20 } from './dice'

export function combatProfileFor(system?: string | null): CombatProfile {
  return getSystemPack(system).combat
}

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

export function isHalfHp(c: Combatant): boolean {
  return c.hp > 0 && (c.kind === 'npc' || c.kind === 'monster') && c.maxHp > 0 && c.hp < c.maxHp / 2
}

export function isBloodied(c: Combatant, profile?: CombatProfile): boolean {
  const used = profile ?? combatProfileFor('dnd5e')
  return used.halfHpTag === 'bloodied' && isHalfHp(c)
}

export function combatantCondition(
  c: Combatant,
  profile?: CombatProfile
): PlayerInitiativeEntry['condition'] {
  const used = profile ?? combatProfileFor('dnd5e')
  if (c.hp <= 0) return c.kind === 'pc' ? used.zeroHpPc : used.zeroHpNpc
  if (used.halfHpTag && isHalfHp(c)) return used.halfHpTag
  return null
}

function overlayTagsFor(c: Combatant, profile: CombatProfile): OverlayTag[] {
  const tags: OverlayTag[] = []
  const condition = combatantCondition(c, profile)
  const label = conditionLabel(condition)
  if (label) tags.push({ label, tone: 'blood' })
  if (profile.showWillpower) {
    const current = c.willpower ?? c.maxWillpower ?? 0
    const max = c.maxWillpower ?? current
    tags.push({ label: `WP ${current}/${max}`, tone: current <= 0 ? 'blood' : 'muted' })
  }
  if (profile.showHunger) {
    const hunger = Math.min(5, Math.max(0, c.hunger ?? 0))
    tags.push({ label: `Hunger ${hunger}`, tone: hunger >= 4 ? 'blood' : 'muted' })
  }
  if (profile.hpLabel !== 'HP' && !condition) {
    tags.push({ label: `${profile.hpLabel} ${c.hp}/${c.maxHp}`, tone: c.hp <= 0 ? 'blood' : 'muted' })
  } else if (profile.hpLabel !== 'HP' && condition) {
    tags.unshift({ label: `${profile.hpLabel} ${c.hp}/${c.maxHp}`, tone: c.hp <= 0 ? 'blood' : 'muted' })
  }
  return tags
}

export function combatToPlayerInitiative(
  combat: CombatState,
  profile?: CombatProfile
): PlayerInitiativeEntry[] {
  const used = profile ?? combatProfileFor('dnd5e')
  const entries = sortCombatants(combat.combatants).map((c) => {
    const condition = combatantCondition(c, used)
    return {
      id: c.id,
      name: c.name,
      active: Boolean(combat.round > 0 && combat.activeId === c.id),
      bloodied: condition === 'bloodied',
      condition,
      hunger: used.showHunger ? (c.hunger ?? 0) : null,
      willpower: used.showWillpower ? (c.willpower ?? null) : null,
      maxWillpower: used.showWillpower ? (c.maxWillpower ?? null) : null,
      overlayTags: overlayTagsFor(c, used)
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
