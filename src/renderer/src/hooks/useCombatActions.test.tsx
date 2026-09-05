// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCombatActions } from './useCombatActions'
import type { SrdRecord } from '../lib/srd'
import type { CampaignInfo, Combatant } from '../../../shared/types'
import type { EncounterAddItem } from '../lib/sessionNoteEncounter'

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

function campaignWith(combatants: Combatant[], combat?: Partial<CampaignInfo['combat']>): CampaignInfo {
  return {
    tree: [],
    party: [],
    combat: { combatants, activeId: null, round: 0, showOrderToPlayers: false, ...combat }
  } as unknown as CampaignInfo
}

function statefulCampaign(initial: CampaignInfo | null) {
  let campaign = initial
  const setCampaign = vi.fn((update: CampaignInfo | null | ((prev: CampaignInfo | null) => CampaignInfo | null)) => {
    campaign = typeof update === 'function' ? update(campaign) : update
  })
  return {
    setCampaign,
    getCampaign: () => campaign
  }
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

  it('applies combat locally before the IPC save returns', async () => {
    const wolf: Combatant = {
      id: 'w',
      name: 'Dire Wolf',
      kind: 'npc',
      initiative: 15,
      hp: 37,
      maxHp: 37,
      ac: 14
    }
    const started = {
      combatants: [wolf],
      activeId: 'w',
      round: 1,
      showOrderToPlayers: false
    }
    let finish!: (info: CampaignInfo) => void
    saveCombat.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve }))
    const { setCampaign, getCampaign } = statefulCampaign(campaignWith([wolf]))
    const { result } = renderHook(() =>
      useCombatActions({
        campaign: campaignWith([wolf]),
        setCampaign,
        getPartyFromNote: () => '',
        onOpenCombatPanel: vi.fn()
      })
    )

    await act(async () => {
      void result.current.saveCombat(started)
    })
    expect(getCampaign()?.combat?.round).toBe(1)
    expect(getCampaign()?.combat?.activeId).toBe('w')

    await act(async () => {
      finish(campaignWith([wolf], { activeId: 'w', round: 1 }))
    })
  })

  it('does not let a stale save overwrite a newer combat', async () => {
    const wolf: Combatant = {
      id: 'w',
      name: 'Dire Wolf',
      kind: 'npc',
      initiative: 15,
      hp: 37,
      maxHp: 37,
      ac: 14
    }
    const started = {
      combatants: [wolf],
      activeId: 'w',
      round: 1,
      showOrderToPlayers: false
    }
    const poisoned = {
      combatants: [{ ...wolf, conditions: ['poisoned'] }],
      activeId: 'w',
      round: 1,
      showOrderToPlayers: false
    }
    let finishStart!: (info: CampaignInfo) => void
    saveCombat
      .mockImplementationOnce(() => new Promise((resolve) => { finishStart = resolve }))
      .mockImplementationOnce(async (next) => campaignWith(next.combatants, next))

    const { setCampaign, getCampaign } = statefulCampaign(campaignWith([wolf]))
    const { result } = renderHook(() =>
      useCombatActions({
        campaign: campaignWith([wolf]),
        setCampaign,
        getPartyFromNote: () => '',
        onOpenCombatPanel: vi.fn()
      })
    )

    await act(async () => {
      const startWrite = result.current.saveCombat(started)
      const poisonWrite = result.current.saveCombat(poisoned)
      finishStart(campaignWith([wolf], { activeId: 'w', round: 1 }))
      await Promise.all([startWrite, poisonWrite])
    })

    expect(getCampaign()?.combat?.combatants[0]?.conditions).toEqual(['poisoned'])
    expect(getCampaign()?.combat?.round).toBe(1)
  })

  it('addTokenToCombat creates a row keyed by the token and returns its id', async () => {
    readFile.mockResolvedValue('```statblock\nname: Wolf\nac: 13\nhp: 11\n```')
    const { result, onOpenCombatPanel } = setup(campaignWith([]))
    let id: string | null = null
    await act(async () => {
      id = await result.current.addTokenToCombat({
        id: 'wolf-2',
        kind: 'monster',
        source: 'Bestiary/Wolf.md',
        x: 0.4,
        y: 0.5,
        space: 'medium',
        label: 'Wolf',
        image: ''
      })
    })
    expect(id).toBeTruthy()
    expect(saveCombat).toHaveBeenCalledOnce()
    const saved = saveCombat.mock.calls[0][0]
    expect(saved.combatants[0].sourceId).toBe('Bestiary/Wolf.md#wolf-2')
    expect(saved.combatants[0].name).toBe('Wolf')
    expect(onOpenCombatPanel).toHaveBeenCalled()
  })

  it('addTokenToCombat reuses a live combatant instead of adding a second row', async () => {
    const existing: Combatant = {
      id: 'live',
      name: 'Wolf',
      kind: 'monster',
      initiative: 12,
      hp: 11,
      maxHp: 11,
      ac: 13,
      sourceId: 'Bestiary/Wolf.md#wolf-2'
    }
    const { result } = setup(campaignWith([existing]))
    let id: string | null = null
    await act(async () => {
      id = await result.current.addTokenToCombat({
        id: 'wolf-2',
        kind: 'monster',
        source: 'Bestiary/Wolf.md',
        x: 0.4,
        y: 0.5,
        space: 'medium',
        label: 'Wolf',
        image: ''
      })
    })
    expect(id).toBe('live')
    expect(saveCombat).not.toHaveBeenCalled()
  })
})
