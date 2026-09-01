// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useMapTokens } from './useMapTokens'
import type { MapNoteData, MapToken } from '../lib/mapNote'
import type { PickerTab, TokenPick } from '../components/MapViewHelpers'

function token(overrides: Partial<MapToken> & { id: string; label: string }): MapToken {
  return {
    kind: 'monster',
    source: `${overrides.label}.md`,
    x: 0.4,
    y: 0.5,
    space: 'medium',
    image: '',
    ...overrides
  }
}

function mapData(overrides: Partial<MapNoteData> = {}): MapNoteData {
  return { image: '', pins: [], tokens: [], tokenScale: 1, pinsLocked: true, fog: '', fogSize: 0, ...overrides }
}

function emptyCatalog(): Record<PickerTab, TokenPick[]> {
  return { pc: [], npc: [], monster: [] }
}

const wolfPick: TokenPick = {
  kind: 'monster',
  source: 'Wolf.md',
  label: 'Wolf',
  imageSrc: null,
  space: 'medium'
}

function setup(overrides: { tokens?: MapToken[]; catalog?: Record<PickerTab, TokenPick[]> } = {}) {
  const persist = vi.fn()
  const onDeselectPins = vi.fn()
  const setSpaceBySource = vi.fn()
  const tokens = overrides.tokens ?? []
  const dataRef = { current: mapData({ tokens }) }
  const view = renderHook(
    (props: { tokens: MapToken[] }) =>
      useMapTokens({
        tokens: props.tokens,
        tokenScale: 1,
        dataRef,
        catalog: overrides.catalog ?? emptyCatalog(),
        spaceBySource: {},
        setSpaceBySource,
        persist,
        onDeselectPins
      }),
    { initialProps: { tokens } }
  )
  return { view, persist, onDeselectPins, dataRef, setSpaceBySource }
}

beforeEach(() => {
  ;(globalThis as unknown as { window: Window }).window.tabledm = {
    readFile: vi.fn().mockResolvedValue('')
  } as unknown as Window['tabledm']
})

describe('useMapTokens', () => {
  it('addToken persists a placed token, selects it, and deselects pins', () => {
    const { view, persist, onDeselectPins } = setup()
    act(() => view.result.current.setPendingToken(wolfPick))
    act(() => {
      view.result.current.addToken({ x: 0.25, y: 0.75 })
      const written = persist.mock.calls[0][0] as { tokens: MapToken[] }
      // Parent would re-render with the persisted list in the same turn.
      view.rerender({ tokens: written.tokens })
    })

    expect(persist).toHaveBeenCalledTimes(1)
    const written = persist.mock.calls[0][0] as { tokens: MapToken[] }
    expect(written.tokens).toHaveLength(1)
    expect(written.tokens[0]).toMatchObject({ label: 'Wolf', x: 0.25, y: 0.75, space: 'medium' })
    expect(onDeselectPins).toHaveBeenCalledTimes(1)
    expect(view.result.current.selectedTokenId).toBe(written.tokens[0].id)
  })

  it('addToken is a no-op without a pending pick', () => {
    const { view, persist } = setup()
    act(() => view.result.current.addToken({ x: 0.5, y: 0.5 }))
    expect(persist).not.toHaveBeenCalled()
  })

  it('deleteToken removes the token and clears selection', () => {
    const placed = token({ id: 't1', label: 'Wolf' })
    const { view, persist } = setup({ tokens: [placed] })
    act(() => view.result.current.setSelectedTokenId('t1'))
    act(() => view.result.current.deleteToken('t1'))

    expect(persist).toHaveBeenCalledWith({ tokens: [] })
    expect(view.result.current.selectedTokenId).toBeNull()
  })

  it('moveToken writes the new coordinates', () => {
    const placed = token({ id: 't1', label: 'Wolf', x: 0.2, y: 0.3 })
    const { view, persist } = setup({ tokens: [placed] })
    act(() => view.result.current.moveToken('t1', 0.8, 0.9))

    const written = persist.mock.calls[0][0] as { tokens: MapToken[] }
    expect(written.tokens[0]).toMatchObject({ id: 't1', x: 0.8, y: 0.9 })
  })

  it('applyScaleNow persists tokenScale immediately', () => {
    const { view, persist } = setup()
    act(() => view.result.current.applyScaleNow(0.08))
    expect(persist).toHaveBeenCalledWith({ tokenScale: 0.08 })
    expect(view.result.current.tokenScale).toBe(0.08)
  })

  it('filters catalog picks by the query', () => {
    const catalog = {
      ...emptyCatalog(),
      monster: [
        wolfPick,
        { kind: 'monster' as const, source: 'Ogre.md', label: 'Ogre', imageSrc: null, space: 'large' as const }
      ]
    }
    const { view } = setup({ catalog })
    act(() => view.result.current.setPickerTab('monster'))
    act(() => view.result.current.setTokenQuery('og'))
    expect(view.result.current.filteredPicks.map((item) => item.label)).toEqual(['Ogre'])
  })

  it('clears a stale selection when the token list no longer contains it', async () => {
    const placed = token({ id: 't1', label: 'Wolf' })
    const { view } = setup({ tokens: [placed] })
    act(() => view.result.current.setSelectedTokenId('t1'))
    view.rerender({ tokens: [] })
    await waitFor(() => expect(view.result.current.selectedTokenId).toBeNull())
  })

  it('reset clears pending pick, selection, and scale draft', () => {
    const { view } = setup()
    act(() => {
      view.result.current.setPendingToken(wolfPick)
      view.result.current.setSelectedTokenId('t1')
      view.result.current.setScaleDraft(2)
    })
    act(() => view.result.current.reset())
    expect(view.result.current.pendingToken).toBeNull()
    expect(view.result.current.selectedTokenId).toBeNull()
    expect(view.result.current.scaleDraft).toBeNull()
  })
})
