// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DICE_LOOK_PRESET_IDS, DICE_LOOK_PRESETS } from '../../../../shared/diceLookPreset'
import { DiceLookPresetPicker } from './DiceLookPresetPicker'
import { DiceLookPresetSwatch } from './DiceLookPresetSwatch'

describe('DiceLookPresetSwatch', () => {
  it('renders a decorative d20 svg for the preset colors', () => {
    const { container } = render(<DiceLookPresetSwatch preset="ruby" size="md" />)
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
    expect(svg?.getAttribute('aria-hidden')).toBe('true')
    expect(svg?.textContent).toContain('20')
  })
})

describe('DiceLookPresetPicker', () => {
  it('lists every bag with a name and swatch in settings', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<DiceLookPresetPicker value="ivory" onChange={onChange} />)

    const group = screen.getByRole('radiogroup', { name: 'Player TV dice bag' })
    expect(group).toBeTruthy()
    for (const id of DICE_LOOK_PRESET_IDS) {
      expect(screen.getByRole('radio', { name: DICE_LOOK_PRESETS[id].label })).toBeTruthy()
    }
    expect(group.querySelectorAll('svg')).toHaveLength(DICE_LOOK_PRESET_IDS.length)

    await user.click(screen.getByRole('radio', { name: 'Obsidian' }))
    expect(onChange).toHaveBeenCalledWith('obsidian')
  })

  it('shows a compact bag button with a preview swatch in the tray', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(
      <DiceLookPresetPicker value="steel" onChange={onChange} variant="compact" aria-label="Dice bag look" />
    )

    const trigger = screen.getByRole('button', { name: 'Dice bag look' })
    expect(trigger.textContent).toMatch(/Steel/)
    expect(trigger.querySelector('svg')).toBeTruthy()

    await user.click(trigger)
    await user.click(screen.getByRole('option', { name: 'Jade' }))
    expect(onChange).toHaveBeenCalledWith('jade')
  })
})
