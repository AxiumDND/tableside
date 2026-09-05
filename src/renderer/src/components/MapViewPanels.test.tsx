// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MapTokenToolbar } from './MapViewPanels'

describe('MapTokenToolbar', () => {
  it('adds the selected token to combat', () => {
    const onAddSelectedToCombat = vi.fn()
    render(
      <MapTokenToolbar
        pendingToken={null}
        selectedCount={1}
        tokenCount={1}
        selectedInCombat={0}
        onDeleteSelected={vi.fn()}
        onAddSelectedToCombat={onAddSelectedToCombat}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Add to combat' }))
    expect(onAddSelectedToCombat).toHaveBeenCalledOnce()
    expect(screen.queryByRole('button', { name: 'Cnd' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Add all to combat' })).toBeNull()
  })

  it('opens combat and the condition picker for a token already in the fight', () => {
    const onAddSelectedToCombat = vi.fn()
    const onOpenConditions = vi.fn()
    render(
      <MapTokenToolbar
        pendingToken={null}
        selectedCount={1}
        tokenCount={1}
        selectedInCombat={1}
        onDeleteSelected={vi.fn()}
        onAddSelectedToCombat={onAddSelectedToCombat}
        onOpenConditions={onOpenConditions}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Open combat' }))
    expect(onAddSelectedToCombat).toHaveBeenCalledOnce()
    fireEvent.click(screen.getByRole('button', { name: 'Cnd' }))
    expect(onOpenConditions).toHaveBeenCalledOnce()
  })

  it('selects every token and adds all of them to combat', () => {
    const onSelectAll = vi.fn()
    const onAddAllToCombat = vi.fn()
    const onAddSelectedToCombat = vi.fn()
    render(
      <MapTokenToolbar
        pendingToken={null}
        selectedCount={2}
        tokenCount={4}
        selectedInCombat={0}
        onDeleteSelected={vi.fn()}
        onAddSelectedToCombat={onAddSelectedToCombat}
        onAddAllToCombat={onAddAllToCombat}
        onSelectAll={onSelectAll}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Select all' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add all to combat' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add selected (2)' }))
    expect(onSelectAll).toHaveBeenCalledOnce()
    expect(onAddAllToCombat).toHaveBeenCalledOnce()
    expect(onAddSelectedToCombat).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: 'Delete 2 tokens' })).toBeTruthy()
  })
})
