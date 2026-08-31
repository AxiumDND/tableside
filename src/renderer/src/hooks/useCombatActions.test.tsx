// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCombatActions } from './useCombatActions'
import type { SrdRecord } from '../lib/srd'
import type { CampaignInfo, Combatant } from '../../../shared/types'
import type { EncounterAddItem } from '../components/SessionNotes'

const saveCombat = vi.fn()
const readFile = vi.fn()

beforeEach(() => {
  saveCombat.mockReset().mockResolvedValue(null)
  readFile.mockReset().mockResolvedValue('')
  Object.defineProperty(window, 'tabledm', {
    value: { saveCombat, readFile },
    configurable: true,
    writable: true
  })
})

function setup(campaign: CampaignInfo | null) {
  const setCampaign = vi.fn()
  const onOpenCombatPanel = vi.fn()
  const { result } = renderHook(() =>
    useCombatActions({ campaign, setCampaign, getPartyFromNote: () => '', onOpenCombatPanel })
  )
  return { result, setCampaign, onOpenCombatPanel }
}

function monsterItem(sourceId: string, name: string): EncounterAddItem {
  return {
    block: {
      name,
      ac: '13',
      hp: 15,
      stats: [10, 10, 10, 10, 10, 10],
      saves: {},
      skills: {},
      traits: [],
      actions: [],
      bonusActions: [],
      reactions: [],
      legendary: []
    },
    kind: 'monster',
    sourceId,
    name
  }
}

function campaignWith(combatants: Combatant[]): CampaignInfo {
  return {
    tree: [],
    party: [],
    combat: { combatants, activeId: null, round: 0, showOrderToPlayers: false }
  } as unknown as CampaignInfo
}

describe('useCombatActions', () => {
  it('addMonster saves a combatant built from the SRD record and opens the panel', async () => {
    const { result, onOpenCombatPanel } = setup(null)
    const record = {
      id: 'srd_goblin',
      name: 'Goblin',
      kind: 'monster',
      data: { name: 'Goblin', ac: 15, hp: 7 }
    } as unknown as SrdRecord

    await act(async () => {
      result.current.addMonster(record)
    })

    expect(saveCombat).toHaveBeenCalledOnce()
    const saved = saveCombat.mock.calls[0][0]
    expect(saved.combatants.some((c: Combatant) => c.name === 'Goblin' && c.sourceId === 'srd_goblin')).toBe(true)
    expect(onOpenCombatPanel).toHaveBeenCalled()
  })

  it('addEncounterItems appends a new combatant', async () => {
    const { result } = setup(campaignWith([]))
    await act(async () => {
      await result.current.addEncounterItems([monsterItem('orc-1', 'Orc')], undefined, false)
    })
    expect(saveCombat).toHaveBeenCalledOnce()
    const saved = saveCombat.mock.calls[0][0]
    expect(saved.combatants.filter((c: Combatant) => c.sourceId === 'orc-1')).toHaveLength(1)
  })

  it('addEncounterItems dedups an already-present combatant (no save)', async () => {
    const existing: Combatant = {
      id: 'x',
      name: 'Orc',
      kind: 'monster',
      initiative: 0,
      hp: 15,
      maxHp: 15,
      ac: 13,
      sourceId: 'orc-1'
    }
    const { result } = setup(campaignWith([existing]))
    await act(async () => {
      await result.current.addEncounterItems([monsterItem('orc-1', 'Orc')], undefined, false)
    })
    expect(saveCombat).not.toHaveBeenCalled()
  })
})
