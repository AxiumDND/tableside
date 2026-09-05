// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MapTokenToolbar } from './MapViewPanels'

describe('MapTokenToolbar', () => {
  it('adds the selected token to combat', () => {
    const onAddToCombat = vi.fn()
    render(
      <MapTokenToolbar
        pendingToken={null}
        selectedTokenId="tok-1"
        onDeleteToken={vi.fn()}
        onAddToCombat={onAddToCombat}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Add to combat' }))
    expect(onAddToCombat).toHaveBeenCalledWith('tok-1')
    expect(screen.queryByRole('button', { name: 'Cnd' })).toBeNull()
  })

  it('opens combat and the condition picker for a token already in the fight', () => {
    const onAddToCombat = vi.fn()
    const onOpenConditions = vi.fn()
    render(
      <MapTokenToolbar
        pendingToken={null}
        selectedTokenId="tok-1"
        inCombat
        onDeleteToken={vi.fn()}
        onAddToCombat={onAddToCombat}
        onOpenConditions={onOpenConditions}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Open combat' }))
    expect(onAddToCombat).toHaveBeenCalledWith('tok-1')
    fireEvent.click(screen.getByRole('button', { name: 'Cnd' }))
    expect(onOpenConditions).toHaveBeenCalledWith('tok-1')
  })
})
