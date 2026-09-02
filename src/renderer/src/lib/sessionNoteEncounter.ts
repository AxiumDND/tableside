import { combatantLabel, partyNotes, type CampaignNote, type NightEncounter } from './notes'
import { extractStatblock, fallbackStatblock, type ParsedStatblock } from './statblock'

export interface EncounterAddItem {
  block: ParsedStatblock
  kind: 'pc' | 'npc' | 'monster'
  sourceId: string
  name: string
}

/**
 * Resolve a night-sheet encounter into combat-tracker rows: listed combatants
 * plus any Party sheets not already in the block, with duplicate counts labeled.
 */
export async function collectEncounterAddItems(
  encounter: NightEncounter,
  fromPath: string,
  noteIndex: CampaignNote[],
  readFile: (path: string) => Promise<string>
): Promise<EncounterAddItem[]> {
  const refs = [...encounter.combatants]
  for (const pc of partyNotes(fromPath, noteIndex)) {
    if (!refs.some((combatant) => combatant.notePath === pc.relativePath)) {
      refs.push({ notePath: pc.relativePath, name: pc.stem, count: 1, kind: 'pc' })
    }
  }
  const items: EncounterAddItem[] = []
  for (const ref of refs) {
    const text = await readFile(ref.notePath)
    const parsed = extractStatblock(text)?.block ?? fallbackStatblock(ref.notePath, text)
    for (let i = 1; i <= ref.count; i += 1) {
      const sourceId = ref.count > 1 ? `${ref.notePath}#${i}` : ref.notePath
      const label = combatantLabel(ref.kind, ref.name, parsed.name)
      items.push({
        block: parsed,
        kind: ref.kind,
        sourceId,
        name: ref.count > 1 ? `${label} ${i}` : label
      })
    }
  }
  return items
}
