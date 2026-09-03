// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RollableStatBlock from './RollableStatBlock'

vi.mock('./DiceTray', () => ({
  useDiceLog: () => ({
    record: vi.fn(),
    allowCrit: true
  })
}))

const block = {
  name: 'Goblin',
  size: 'Small',
  type: 'humanoid',
  alignment: 'neutral evil',
  cr: '0.25',
  ac: '15',
  hp: 7,
  stats: [8, 14, 10, 10, 8, 8],
  saves: {},
  skills: {},
  traits: [],
  actions: [
    {
      name: 'Scimitar',
      desc: 'Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 5 (1d6 + 2) slashing damage.'
    }
  ],
  bonusActions: [],
  reactions: [],
  legendary: []
}

describe('RollableStatBlock', () => {
  it('asks for normal, advantage, or disadvantage before a d20 roll', async () => {
    const user = userEvent.setup()
    render(<RollableStatBlock block={block} hideToolbar />)

    await user.click(screen.getByTitle('DEX check'))
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'DEX check' })).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Advantage — Keep higher' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByText(/Mod \+2/)).toBeTruthy()
  })

  it('asks before to-hit rolls on action chips', async () => {
    const user = userEvent.setup()
    render(<RollableStatBlock block={block} hideToolbar />)

    await user.click(screen.getByRole('button', { name: /To hit 1d20/i }))
    expect(screen.getByRole('dialog')).toBeTruthy()
  })
})
