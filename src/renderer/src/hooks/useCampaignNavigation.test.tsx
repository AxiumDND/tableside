// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCampaignNavigation } from './useCampaignNavigation'

beforeEach(() => {
  Object.defineProperty(window, 'tabledm', {
    value: { saveSettings: vi.fn().mockResolvedValue(undefined) },
    configurable: true,
    writable: true
  })
})

describe('useCampaignNavigation', () => {
  it('navigateTo pushes history and goBack pops', () => {
    const { result } = renderHook(() => useCampaignNavigation(null))
    act(() => result.current.navigateTo('a.md', 'note'))
    expect(result.current.openPath).toBe('a.md')
    expect(result.current.history).toHaveLength(0)

    act(() => result.current.navigateTo('b.md', 'note'))
    expect(result.current.openPath).toBe('b.md')
    expect(result.current.history.map((h) => h.path)).toEqual(['a.md'])

    act(() => result.current.goBack())
    expect(result.current.openPath).toBe('a.md')
    expect(result.current.history).toHaveLength(0)
  })

  it('openNote infers image vs note kind', () => {
    const { result } = renderHook(() => useCampaignNavigation(null))
    act(() => result.current.openNote('Art/map.png'))
    expect(result.current.openKind).toBe('image')
    expect(result.current.selectedImage).toBe('Art/map.png')

    act(() => result.current.openNote('Notes/intro.md'))
    expect(result.current.openKind).toBe('note')
    expect(result.current.selectedImage).toBeNull()
  })

  it('resetNavigation opens the note and clears history', () => {
    const { result } = renderHook(() => useCampaignNavigation(null))
    act(() => result.current.navigateTo('a.md', 'note'))
    act(() => result.current.navigateTo('b.md', 'note'))
    act(() => result.current.resetNavigation('start.md'))
    expect(result.current.openPath).toBe('start.md')
    expect(result.current.openKind).toBe('note')
    expect(result.current.history).toHaveLength(0)
  })

  it('pruneHistory drops entries that no longer pass the predicate', () => {
    const { result } = renderHook(() => useCampaignNavigation(null))
    act(() => result.current.navigateTo('a.md', 'note'))
    act(() => result.current.navigateTo('b.md', 'note'))
    act(() => result.current.navigateTo('c.md', 'note'))
    act(() => result.current.pruneHistory((p) => p !== 'a.md'))
    expect(result.current.history.map((h) => h.path)).toEqual(['b.md'])
  })
})
