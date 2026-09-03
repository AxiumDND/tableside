// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { D20ModeDialog } from './D20ModeDialog'

describe('D20ModeDialog', () => {
  it('offers normal, advantage, and disadvantage', async () => {
    const user = userEvent.setup()
    const onChoose = vi.fn()
    const onClose = vi.fn()
    render(<D20ModeDialog title="DEX save" subtitle="1d20+2" onChoose={onChoose} onClose={onClose} />)

    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.getByText('DEX save')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Advantage — Keep higher' }))
    expect(onChoose).toHaveBeenCalledWith('advantage')

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
