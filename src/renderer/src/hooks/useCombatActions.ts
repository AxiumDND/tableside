import { useCallback, useRef, type Dispatch, type SetStateAction } from 'react'
import type { CampaignInfo, CombatState, Combatant } from '../../../shared/types'
import { emptyCombat } from '../../../shared/types'
import type { EncounterAddItem } from '../lib/sessionNoteEncounter'
import { monsterToStatBlock, type SrdRecord } from '../lib/srd'
import {
  extractStatblock,
  fallbackStatblock,
  parsedToStatBlock,
  type ParsedStatblock
} from '../lib/statblock'
import { flattenNotes, partyNotes, pcCombatName, sameCombatantName, sheetDisplayName } from '../lib/notes'
import { rollInitiativeFor } from '../lib/combat'

export interface CombatActions {
  saveCombat: (next: CombatState) => Promise<void>
  addMonster: (record: SrdRecord) => void
  addNpcFromSheet: (block: ParsedStatblock, notePath?: string) => void
  addPartyToCombat: () => void
  addBestiaryToCombat: (notePath: string) => Promise<void>
  addEncounterItems: (items: EncounterAddItem[], extra?: Combatant, includeParty?: boolean) => Promise<void>
}

/**
 * Combat/encounter actions for the DM console. Pure with respect to component
 * state — it reads the current campaign, writes back through `setCampaign`, and
 * uses two injected callbacks (which note to pull party members from, and how
 * to reveal the combat panel) so it carries no navigation or UI state itself.
 */
export function useCombatActions({
  campaign,
  setCampaign,
  getPartyFromNote,
  onOpenCombatPanel
}: {
  campaign: CampaignInfo | null
  setCampaign: Dispatch<SetStateAction<CampaignInfo | null>>
  getPartyFromNote: () => string
  onOpenCombatPanel: () => void
}): CombatActions {
  const combatWriteId = useRef(0)
  const saveCombat = useCallback(
    async (next: CombatState): Promise<void> => {
      const writeId = ++combatWriteId.current
      setCampaign((prev) => (prev ? { ...prev, combat: next } : prev))
      const info = await window.tabledm.saveCombat(next)
      if (!info) return
      setCampaign((prev) => {
        if (writeId !== combatWriteId.current) {
          return prev ? { ...info, combat: prev.combat } : info
        }
        return info
      })
    },
    [setCampaign]
  )

  const loadPartyItems = useCallback(async (): Promise<EncounterAddItem[]> => {
    if (!campaign) return []
    const notes = flattenNotes(campaign.tree)
    const from = getPartyFromNote()
    const items: EncounterAddItem[] = []
    const seen = new Set<string>()
    for (const pc of partyNotes(from, notes)) {
      const text = await window.tabledm.readFile(pc.relativePath)
      const parsed = extractStatblock(text)?.block ?? fallbackStatblock(pc.relativePath, text)
      items.push({
        block: parsed,
        kind: 'pc',
        sourceId: pc.relativePath,
        name: pcCombatName(pc.relativePath)
      })
      seen.add(parsed.name.toLowerCase())
    }
    for (const pc of campaign.party) {
      if (seen.has(pc.name.toLowerCase())) continue
      items.push({
        block: {
          name: pc.name,
          ac: String(pc.ac),
          hp: pc.maxHp,
          stats: [10, 10, 10, 10, 10, 10],
          saves: {},
          skills: {},
          traits: [],
          actions: [],
          bonusActions: [],
          reactions: [],
          legendary: []
        },
        kind: 'pc',
        sourceId: pc.id,
        name: pcCombatName(pc.name)
      })
    }
    return items
  }, [campaign, getPartyFromNote])

  const addEncounterItems = useCallback(
    async (items: EncounterAddItem[], extra?: Combatant, includeParty = true): Promise<void> => {
      const party = includeParty ? await loadPartyItems() : []
      const combined = [...party, ...items]
      const combat = campaign?.combat ?? emptyCombat()
      const next = [...combat.combatants]
      let added = 0
      for (const item of combined) {
        const existing =
          item.kind === 'monster'
            ? next.find((c) => c.sourceId && item.sourceId && c.sourceId === item.sourceId)
            : next.find(
                (c) =>
                  (c.sourceId && item.sourceId && c.sourceId === item.sourceId) ||
                  sameCombatantName(c.name, item.name)
              )
        if (existing) {
          if (existing.name !== item.name) {
            existing.name = item.name
            added += 1
          }
          continue
        }
        const statBlock = parsedToStatBlock(item.block)
        next.push({
          id: crypto.randomUUID(),
          name: item.name,
          kind: item.kind,
          initiative: 0,
          hp: statBlock.hp ?? 10,
          maxHp: statBlock.hp ?? 10,
          ac: statBlock.ac ?? 10,
          willpower: item.block.willpower,
          maxWillpower: item.block.maxWillpower ?? item.block.willpower,
          hunger: item.block.hunger,
          sourceId: item.sourceId,
          statBlock
        })
        added += 1
      }
      if (extra && !next.some((c) => c.sourceId === extra.sourceId || c.id === extra.id)) {
        next.push(extra)
        added += 1
      }
      if (added > 0) {
        const withInit = rollInitiativeFor(next, 'unrolled-npcs')
        await saveCombat({
          ...combat,
          combatants: withInit,
          activeId: combat.activeId
        })
      }
      onOpenCombatPanel()
    },
    [campaign, loadPartyItems, saveCombat, onOpenCombatPanel]
  )

  const addMonster = useCallback(
    (record: SrdRecord): void => {
      const block = monsterToStatBlock(record.data)
      const hp = Number(block.hp ?? 10)
      const willpower = typeof record.data.willpower === 'number' ? record.data.willpower : undefined
      const hunger = typeof record.data.hunger === 'number' ? record.data.hunger : undefined
      void addEncounterItems([], {
        id: crypto.randomUUID(),
        name: block.name,
        kind: 'monster',
        initiative: 0,
        hp,
        maxHp: hp,
        ac: Number(block.ac ?? 10),
        willpower,
        maxWillpower: willpower,
        hunger,
        statBlock: block,
        sourceId: record.id
      })
    },
    [addEncounterItems]
  )

  const addNpcFromSheet = useCallback(
    (block: ParsedStatblock, notePath?: string): void => {
      const sourceId = notePath || `sheet:${block.name}`
      const name = notePath ? sheetDisplayName(notePath) : block.name
      void addEncounterItems([{ block, kind: 'npc', sourceId, name }])
    },
    [addEncounterItems]
  )

  const addPartyToCombat = useCallback((): void => {
    void addEncounterItems([])
  }, [addEncounterItems])

  const addBestiaryToCombat = useCallback(
    async (notePath: string): Promise<void> => {
      const text = await window.tabledm.readFile(notePath)
      const parsed = extractStatblock(text)?.block ?? fallbackStatblock(notePath, text)
      const live = campaign?.combat ?? emptyCombat()
      const name = nextCopyName(sheetDisplayName(notePath), live.combatants)
      await addEncounterItems(
        [{ block: parsed, kind: 'monster', sourceId: `${notePath}#${name}`, name }],
        undefined,
        false
      )
    },
    [addEncounterItems, campaign]
  )

  return { saveCombat, addMonster, addNpcFromSheet, addPartyToCombat, addBestiaryToCombat, addEncounterItems }
}

function nextCopyName(base: string, existing: Combatant[]): string {
  if (!existing.some((c) => c.name === base)) return base
  let n = 2
  while (existing.some((c) => c.name === `${base} ${n}`)) n += 1
  return `${base} ${n}`
}
