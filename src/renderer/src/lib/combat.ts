import type { Combatant, CombatState, PlayerInitiativeEntry } from '../../../shared/types';
import { abilityMod } from './dice';

export function initiativeBonus(c: Combatant): number {
  if (typeof c.statBlock?.initiativeBonus === 'number') return c.statBlock.initiativeBonus;
  if (typeof c.statBlock?.modifiers?.dexterity === 'number') return c.statBlock.modifiers.dexterity;
  if (typeof c.statBlock?.scores?.dexterity === 'number')
    return abilityMod(c.statBlock.scores.dexterity);
  return 0;
}

export function sortCombatants(list: Combatant[]): Combatant[] {
  return [...list].sort(
    (a, b) =>
      b.initiative - a.initiative ||
      initiativeBonus(b) - initiativeBonus(a) ||
      a.name.localeCompare(b.name)
  );
}

export function isBloodied(c: Combatant): boolean {
  return (
    c.hp > 0 && (c.kind === 'npc' || c.kind === 'monster') && c.maxHp > 0 && c.hp < c.maxHp / 2
  );
}

export function combatantCondition(c: Combatant): PlayerInitiativeEntry['condition'] {
  if (c.hp <= 0) return c.kind === 'pc' ? 'unconscious' : 'dead';
  if (isBloodied(c)) return 'bloodied';
  return null;
}

export function combatToPlayerInitiative(combat: CombatState): PlayerInitiativeEntry[] {
  const entries = sortCombatants(combat.combatants).map((c) => {
    const condition = combatantCondition(c);
    return {
      id: c.id,
      name: c.name,
      active: Boolean(combat.round > 0 && combat.activeId === c.id),
      bloodied: condition === 'bloodied',
      condition,
    };
  });
  const turn = entries.findIndex((entry) => entry.active);
  if (turn <= 0) return entries;
  return [...entries.slice(turn), ...entries.slice(0, turn)];
}
