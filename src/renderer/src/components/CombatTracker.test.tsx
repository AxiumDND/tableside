// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CombatTracker from './CombatTracker'
import { COMBAT_MUSIC_PLAYLIST_ID, GENERAL_MUSIC_PLAYLIST_ID } from '../../../shared/audio'
import { emptyCombat, type CombatState, type Combatant } from '../../../shared/types'

function combatant(overrides: Partial<Combatant> & { id: string; name: string }): Combatant {
  return {
    kind: 'npc',
    initiative: 0,
    hp: 10,
    maxHp: 10,
    ac: 12,
    ...overrides
  }
}

function makeCombat(combatants: Combatant[]): CombatState {
  return { ...emptyCombat(), combatants }
}

describe('CombatTracker', () => {
  afterEach(() => {
    Reflect.deleteProperty(window, 'tabledm')
  })

  it('renders each combatant name in the tracker', () => {
    const combat = makeCombat([
      combatant({ id: 'a', name: 'Goblin Scout', initiative: 12 }),
      combatant({ id: 'b', name: 'Bandit Captain', initiative: 18 })
    ])
    render(<CombatTracker combat={combat} onChange={() => {}} />)

    // The highest-initiative combatant is also shown in the detail panel, so a
    // name can appear more than once — assert each renders at least once.
    expect(screen.getAllByText('Goblin Scout').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Bandit Captain').length).toBeGreaterThan(0)
  })

  it('starts combat on the highest-initiative combatant', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const combat = makeCombat([
      combatant({ id: 'low', name: 'Goblin Scout', initiative: 12 }),
      combatant({ id: 'high', name: 'Bandit Captain', initiative: 18 })
    ])
    render(<CombatTracker combat={combat} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: /start combat/i }))

    expect(onChange).toHaveBeenCalledTimes(1)
    const next = onChange.mock.calls[0][0] as CombatState
    expect(next.round).toBe(1)
    expect(next.activeId).toBe('high')
  })

  it('adds a manual combatant from the form', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<CombatTracker combat={makeCombat([])} onChange={onChange} />)

    await user.type(screen.getByPlaceholderText('Name'), 'Dire Wolf')
    await user.type(screen.getByPlaceholderText('Init'), '15')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(onChange).toHaveBeenCalledTimes(1)
    const next = onChange.mock.calls[0][0] as CombatState
    expect(next.combatants).toHaveLength(1)
    expect(next.combatants[0]).toMatchObject({ name: 'Dire Wolf', initiative: 15 })
  })

  it('keeps the bestiary list collapsed until shown', async () => {
    const user = userEvent.setup()
    const onAddBestiary = vi.fn()
    render(
      <CombatTracker
        combat={makeCombat([])}
        bestiary={[{ path: 'Bestiary/Goblin.md', name: 'Goblin' }]}
        onAddBestiary={onAddBestiary}
        onChange={() => {}}
      />
    )

    expect(screen.queryByRole('button', { name: /goblin/i })).toBeNull()

    await user.click(screen.getByRole('button', { name: /bestiary/i }))
    await user.click(screen.getByRole('button', { name: /goblin/i }))

    expect(onAddBestiary).toHaveBeenCalledWith('Bestiary/Goblin.md')
  })

  it('opens a damage/heal window from the HP total', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const combat = makeCombat([combatant({ id: 'a', name: 'Goblin Scout', hp: 10, maxHp: 10 })])
    render(<CombatTracker combat={combat} onChange={onChange} />)

    expect(screen.queryByRole('button', { name: 'Damage' })).toBeNull()

    await user.click(screen.getByRole('button', { name: /goblin scout hp 10 of 10/i }))
    await user.type(screen.getByLabelText(/goblin scout hp amount/i), '4')
    await user.click(screen.getByRole('button', { name: 'Damage' }))

    expect(onChange).toHaveBeenCalled()
    const next = onChange.mock.calls.at(-1)![0] as CombatState
    expect(next.combatants[0].hp).toBe(6)
    expect(screen.queryByRole('button', { name: 'Damage' })).toBeNull()
  })

  it('adds and clears a condition on a combatant', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const combat = makeCombat([combatant({ id: 'a', name: 'Goblin Scout', hp: 10, maxHp: 10 })])
    const { rerender } = render(<CombatTracker combat={combat} onChange={onChange} />)

    expect(screen.queryByRole('button', { name: 'Poisoned' })).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Conditions for Goblin Scout' }))
    await user.click(screen.getByRole('button', { name: 'Poisoned' }))

    const next = onChange.mock.calls.at(-1)![0] as CombatState
    expect(next.combatants[0].conditions).toEqual(['poisoned'])

    rerender(<CombatTracker combat={next} onChange={onChange} />)
    expect(screen.getByRole('button', { name: 'Poisoned' }).getAttribute('aria-pressed')).toBe('true')
    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(screen.getByRole('button', { name: 'Clear Poisoned' })).toBeTruthy()
  })

  it('renames Clear to End combat and asks before emptying the tracker', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const combat = makeCombat([combatant({ id: 'a', name: 'Goblin Scout', initiative: 12 })])
    render(<CombatTracker combat={combat} onChange={onChange} />)

    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull()
    await user.click(screen.getByRole('button', { name: 'End combat' }))
    expect(screen.getByRole('dialog', { name: 'End combat?' })).toBeTruthy()
    expect(onChange).not.toHaveBeenCalled()

    await user.click(within(screen.getByRole('dialog', { name: 'End combat?' })).getByRole('button', { name: 'End combat' }))
    expect(onChange).toHaveBeenCalledTimes(1)
    const next = onChange.mock.calls[0][0] as CombatState
    expect(next.combatants).toEqual([])
    expect(next.round).toBe(0)
  })

  it('plays Combat music on start and General on end when the cue is on', async () => {
    const user = userEvent.setup()
    const mixerPlayMusic = vi.fn().mockResolvedValue({})
    const mixerSetPrefs = vi.fn().mockResolvedValue({})
    window.tabledm = {
      getMixer: vi.fn().mockResolvedValue({ prefs: { combatMusicCues: true } }),
      mixerPlayMusic,
      mixerSetPrefs,
      onMixerState: vi.fn(() => () => {})
    } as unknown as Window['tabledm']

    const onChange = vi.fn()
    const combat = makeCombat([
      combatant({ id: 'high', name: 'Bandit Captain', initiative: 18 })
    ])
    render(<CombatTracker combat={combat} onChange={onChange} />)

    expect(screen.getByRole('checkbox', { name: /combat music/i })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: /start combat/i }))
    expect(mixerPlayMusic).toHaveBeenCalledWith(COMBAT_MUSIC_PLAYLIST_ID)

    await user.click(screen.getByRole('button', { name: 'End combat' }))
    await user.click(within(screen.getByRole('dialog', { name: 'End combat?' })).getByRole('button', { name: 'End combat' }))
    expect(mixerPlayMusic).toHaveBeenCalledWith(GENERAL_MUSIC_PLAYLIST_ID)
  })

  it('skips combat music cues when the checkbox is unticked', async () => {
    const user = userEvent.setup()
    const mixerPlayMusic = vi.fn().mockResolvedValue({})
    const mixerSetPrefs = vi.fn().mockResolvedValue({})
    window.tabledm = {
      getMixer: vi.fn().mockResolvedValue({ prefs: { combatMusicCues: true } }),
      mixerPlayMusic,
      mixerSetPrefs,
      onMixerState: vi.fn(() => () => {})
    } as unknown as Window['tabledm']

    const combat = makeCombat([combatant({ id: 'high', name: 'Bandit Captain', initiative: 18 })])
    render(<CombatTracker combat={combat} onChange={() => {}} />)

    await user.click(screen.getByRole('checkbox', { name: /combat music/i }))
    expect(mixerSetPrefs).toHaveBeenCalledWith({ combatMusicCues: false })

    await user.click(screen.getByRole('button', { name: /start combat/i }))
    expect(mixerPlayMusic).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'End combat' }))
    await user.click(within(screen.getByRole('dialog', { name: 'End combat?' })).getByRole('button', { name: 'End combat' }))
    expect(mixerPlayMusic).not.toHaveBeenCalled()
  })
})
