import type { Combatant, PlayerOverlayTag } from '../../../shared/types'
import { combatOverlayTags, combatProfileFor } from './combat'
import type { MapToken } from './mapNote'

export type TokenCombatLink = Pick<MapToken, 'id' | 'source' | 'combatantId'>

/** Per-token combat source so two tokens from one sheet stay distinct. */
export function mapTokenSourceId(token: TokenCombatLink): string {
  return token.source ? `${token.source}#${token.id}` : `token:${token.id}`
}

/**
 * Resolve the combat row for a map token: explicit id, then this token's
 * sourceId, then a single combatant that was added from the same sheet.
 */
export function combatantForToken(
  combatants: Combatant[],
  token: TokenCombatLink
): Combatant | undefined {
  if (token.combatantId) {
    const linked = combatants.find((row) => row.id === token.combatantId)
    if (linked) return linked
  }
  const tokenSource = mapTokenSourceId(token)
  const byToken = combatants.find((row) => row.sourceId === tokenSource)
  if (byToken) return byToken
  if (!token.source) return undefined
  const fromSheet = combatants.filter((row) => row.sourceId === token.source)
  return fromSheet.length === 1 ? fromSheet[0] : undefined
}

/** Cheap dependency so the player map re-broadcasts when HP or conditions change. */
export function combatOverlaySignature(combatants: Combatant[]): string {
  return combatants
    .map((row) => `${row.id}:${row.hp}:${row.maxHp}:${(row.conditions ?? []).join(',')}`)
    .join('|')
}

/** Condition chips for a token — statuses + Bloodied/Dead, no HP/WP numbers. */
export function tokenOverlayTags(
  token: TokenCombatLink,
  combatants: Combatant[],
  system?: string | null
): PlayerOverlayTag[] {
  const row = combatantForToken(combatants, token)
  if (!row) return []
  return combatOverlayTags(row, combatProfileFor(system), { includeVitals: false })
}
