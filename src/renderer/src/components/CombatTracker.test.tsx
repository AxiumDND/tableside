// @vitest-environment jsdom
import { useState } from 'react'
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
    expect(screen.getByRole('button', { name: 'Goblin Scout' }).textContent).toBe('Goblin Scout')
    expect(screen.queryByRole('button', { name: /goblin scout npc/i })).toBeNull()
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

  it('shows the current combatant full name in the header and a name tooltip', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const combat = makeCombat([
      combatant({ id: 'low', name: 'Swarm of Bats 1', initiative: 12 }),
      combatant({ id: 'high', name: 'Swarm of Bats 2', initiative: 18 })
    ])
    const { rerender } = render(<CombatTracker combat={combat} onChange={onChange} />)

    expect(document.querySelector('header .font-display.text-base')).toBeNull()
    await user.click(screen.getByRole('button', { name: /start combat/i }))
    const started = onChange.mock.calls[0][0] as CombatState
    rerender(<CombatTracker combat={started} onChange={onChange} />)

    const heading = document.querySelector('header p.font-display')
    expect(heading?.textContent).toBe('Swarm of Bats 2')
    expect(document.querySelector('button[title="Swarm of Bats 1"]')).toBeTruthy()
    expect(document.querySelector('button[title="Swarm of Bats 2"]')).toBeTruthy()
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

  it('opens an initiative editor from the number box', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    function Harness() {
      const [combat, setCombat] = useState(
        makeCombat([
          combatant({
            id: 'a',
            name: 'Goblin Scout',
            initiative: 12,
            statBlock: { name: 'Goblin Scout', initiativeBonus: 2 }
          })
        ])
      )
      return (
        <CombatTracker
          combat={combat}
          onChange={(next) => {
            onChange(next)
            setCombat(next)
          }}
        />
      )
    }
    render(<Harness />)

    expect(screen.queryByRole('button', { name: 'Roll' })).toBeNull()
    expect(screen.queryByRole('dialog', { name: 'Goblin Scout' })).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Goblin Scout initiative 12' }))
    const dialog = screen.getByRole('dialog', { name: 'Goblin Scout' })
    expect(within(dialog).getByLabelText('Goblin Scout initiative bonus')).toHaveProperty('value', '2')

    await user.click(screen.getByRole('button', { name: 'Increase Goblin Scout initiative' }))
    expect(screen.getByRole('button', { name: 'Goblin Scout initiative 13' })).toBeTruthy()

    await user.clear(within(dialog).getByLabelText('Goblin Scout initiative'))
    await user.type(within(dialog).getByLabelText('Goblin Scout initiative'), '18')
    expect(screen.getByRole('button', { name: 'Goblin Scout initiative 18' })).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Roll 1d20+2' }))
    const rolled = onChange.mock.calls.at(-1)![0] as CombatState
    expect(rolled.combatants[0].initiative).toBeGreaterThanOrEqual(3)
    expect(rolled.combatants[0].initiative).toBeLessThanOrEqual(22)

    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(screen.queryByRole('dialog', { name: 'Goblin Scout' })).toBeNull()
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

  it('steps back up the turn list after Next turn', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const combat = makeCombat([
      combatant({ id: 'low', name: 'Goblin Scout', initiative: 12 }),
      combatant({ id: 'high', name: 'Bandit Captain', initiative: 18 })
    ])
    const { rerender } = render(<CombatTracker combat={combat} onChange={onChange} />)

    expect(screen.getByRole('button', { name: 'Previous turn' })).toHaveProperty('disabled', true)
    await user.click(screen.getByRole('button', { name: /start combat/i }))
    const started = onChange.mock.calls[0][0] as CombatState
    expect(started.activeId).toBe('high')

    rerender(<CombatTracker combat={started} onChange={onChange} />)
    expect(screen.getByRole('button', { name: 'Previous turn' })).toHaveProperty('disabled', true)
    await user.click(screen.getByRole('button', { name: 'Next turn' }))
    const advanced = onChange.mock.calls[1][0] as CombatState
    expect(advanced.activeId).toBe('low')
    expect(advanced.round).toBe(1)

    rerender(<CombatTracker combat={advanced} onChange={onChange} />)
    expect(screen.getByRole('button', { name: 'Previous turn' })).toHaveProperty('disabled', false)
    await user.click(screen.getByRole('button', { name: 'Previous turn' }))
    const rewound = onChange.mock.calls[2][0] as CombatState
    expect(rewound.activeId).toBe('high')
    expect(rewound.round).toBe(1)
  })

  it('moves the turn to the next combatant when the current one is removed', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const combat = {
      ...makeCombat([
        combatant({ id: 'low', name: 'Goblin Scout', initiative: 12 }),
        combatant({ id: 'high', name: 'Bandit Captain', initiative: 18 })
      ]),
      activeId: 'high',
      round: 1
    }
    const { rerender } = render(<CombatTracker combat={combat} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: 'Remove Bandit Captain' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Remove' }))

    const next = onChange.mock.calls.at(-1)![0] as CombatState
    expect(next.combatants.map((row) => row.id)).toEqual(['low'])
    expect(next.activeId).toBe('low')
    expect(next.round).toBe(1)

    rerender(<CombatTracker combat={next} onChange={onChange} />)
    expect(document.querySelector('header p.font-display')?.textContent).toBe('Goblin Scout')
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
