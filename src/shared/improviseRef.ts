export type HealingPotion = {
  id: string
  name: string
  rarity: string
  dice: string
  average: number
}

export type ImprovisedDamageRow = {
  dice: string
  average: number
  cue: string
}

export type DamageSeverityRow = {
  levels: string
  setback: string
  dangerous: string
  deadly: string
}

/** SRD 5.2 / 2024 potion healing. */
export const HEALING_POTIONS: HealingPotion[] = [
  { id: 'healing', name: 'Potion of Healing', rarity: 'Common', dice: '2d4 + 2', average: 7 },
  { id: 'greater', name: 'Potion of Healing (greater)', rarity: 'Uncommon', dice: '4d4 + 4', average: 14 },
  { id: 'superior', name: 'Potion of Healing (superior)', rarity: 'Rare', dice: '8d4 + 8', average: 28 },
  { id: 'supreme', name: 'Potion of Healing (supreme)', rarity: 'Very Rare', dice: '10d4 + 20', average: 45 }
]

/** 2024 on-the-fly damage steps (d10 ladder). Cues are short table notes, not book prose. */
export const IMPROVISED_DAMAGE: ImprovisedDamageRow[] = [
  { dice: '1d10', average: 6, cue: 'Minor: coals, falling furniture, a needle' },
  { dice: '2d10', average: 11, cue: 'Serious: lightning strike, fire pit' },
  { dice: '4d10', average: 22, cue: 'Severe: collapsing rubble, vat of acid' },
  { dice: '10d10', average: 55, cue: 'Extreme: compacting walls, lava stream' },
  { dice: '18d10', average: 99, cue: 'Catastrophic: submerged in lava' },
  { dice: '24d10', average: 132, cue: 'Legendary: planar fire, godlike crush' }
]

export const DAMAGE_SEVERITY: DamageSeverityRow[] = [
  { levels: '1–4', setback: '1d10', dangerous: '2d10', deadly: '4d10' },
  { levels: '5–10', setback: '2d10', dangerous: '4d10', deadly: '10d10' },
  { levels: '11–16', setback: '4d10', dangerous: '10d10', deadly: '18d10' },
  { levels: '17–20', setback: '10d10', dangerous: '18d10', deadly: '24d10' }
]
