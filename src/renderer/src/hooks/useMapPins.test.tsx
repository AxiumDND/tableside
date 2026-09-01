// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useMapPins } from './useMapPins'
import type { MapNoteData, MapPin } from '../lib/mapNote'

function pin(overrides: Partial<MapPin> & { id: string; label: string }): MapPin {
  return { x: 0.4, y: 0.5, heading: overrides.label, ...overrides }
}

function mapData(overrides: Partial<MapNoteData> = {}): MapNoteData {
  return { image: '', pins: [], tokens: [], tokenScale: 1, pinsLocked: false, fog: '', fogSize: 0, ...overrides }
}

function setup(overrides: { pins?: MapPin[]; pinsLocked?: boolean; tokenSelected?: boolean; markdown?: string } = {}) {
  const persist = vi.fn()
  const onEnterPinTool = vi.fn()
  const pins = overrides.pins ?? []
  const pinsLocked = overrides.pinsLocked ?? false
  const dataRef = { current: mapData({ pins, pinsLocked }) }
  const markdown = overrides.markdown ?? '# Cave\n\n```map\nimage: cave.png\npins: []\n```\n'
  const view = renderHook(
    (props: { pins: MapPin[]; tokenSelected: boolean }) =>
      useMapPins({
        pins: props.pins,
        pinsLocked,
        headings: ['Mouth', 'Camp'],
        tool: 'pin',
        tokenSelected: props.tokenSelected,
        dataRef,
        getMarkdown: () => markdown,
        persist,
        onEnterPinTool
      }),
    { initialProps: { pins, tokenSelected: overrides.tokenSelected ?? false } }
  )
  return { view, persist, onEnterPinTool, dataRef }
}

describe('useMapPins', () => {
  it('startAddPin enters add mode and seeds the next label', () => {
    const { view, onEnterPinTool } = setup()
    act(() => view.result.current.startAddPin())
    expect(onEnterPinTool).toHaveBeenCalledTimes(1)
    expect(view.result.current.pinAction).toBe('add')
    expect(view.result.current.placing).toBe(true)
    expect(view.result.current.label).toBe('A1')
    expect(view.result.current.heading).toBe('Mouth')
  })

  it('startAddPin is a no-op when pins are locked and one already exists', () => {
    const existing = pin({ id: 'a', label: 'A' })
    const { view, onEnterPinTool } = setup({ pins: [existing], pinsLocked: true })
    act(() => view.result.current.startAddPin())
    expect(onEnterPinTool).not.toHaveBeenCalled()
    expect(view.result.current.pinAction).toBe('view')
  })

  it('startAddPin still works on a locked empty map (first pin)', () => {
    const { view, onEnterPinTool } = setup({ pinsLocked: true })
    act(() => view.result.current.startAddPin())
    expect(onEnterPinTool).toHaveBeenCalledTimes(1)
    expect(view.result.current.pinAction).toBe('add')
  })

  it('startEditPin fills the form from the selected pin', () => {
    const existing = pin({ id: 'a', label: 'A', heading: 'Mouth' })
    const { view, onEnterPinTool } = setup({ pins: [existing] })
    act(() => view.result.current.startEditPin())
    expect(onEnterPinTool).toHaveBeenCalledTimes(1)
    expect(view.result.current.pinAction).toBe('edit')
    expect(view.result.current.label).toBe('A')
    expect(view.result.current.heading).toBe('Mouth')
  })

  it('startEditPin is a no-op when pins are locked', () => {
    const existing = pin({ id: 'a', label: 'A' })
    const { view, onEnterPinTool } = setup({ pins: [existing], pinsLocked: true })
    act(() => view.result.current.startEditPin())
    expect(onEnterPinTool).not.toHaveBeenCalled()
    expect(view.result.current.pinAction).toBe('view')
  })

  it('addPin persists a pin and appends a missing heading', () => {
    const { view, persist } = setup()
    act(() => view.result.current.startAddPin())
    act(() => view.result.current.setDraft({ x: 0.2, y: 0.8 }))
    act(() => view.result.current.addPin())

    expect(persist).toHaveBeenCalledTimes(1)
    const [partial, source] = persist.mock.calls[0] as [{ pins: MapPin[] }, string]
    expect(partial.pins).toHaveLength(1)
    expect(partial.pins[0]).toMatchObject({ x: 0.2, y: 0.8, heading: 'Mouth' })
    expect(source).toContain('## Mouth')
    expect(view.result.current.draft).toBeNull()
  })

  it('savePin persists an updated label and heading', () => {
    const existing = pin({ id: 'a', label: 'A', heading: 'Mouth' })
    const { view, persist } = setup({ pins: [existing] })
    act(() => {
      view.result.current.startEditPin()
      view.result.current.setLabel('A2')
      view.result.current.setNewHeading('Camp')
    })
    act(() => view.result.current.savePin())
    expect(persist).toHaveBeenCalledTimes(1)
    const [partial, source] = persist.mock.calls[0] as [{ pins: MapPin[] }, string]
    expect(partial.pins[0]).toMatchObject({ id: 'a', label: 'A2', heading: 'Camp' })
    expect(source).toContain('## Camp')
  })

  it('savePin is a no-op when pins are locked', () => {
    const existing = pin({ id: 'a', label: 'A' })
    const { view, persist } = setup({ pins: [existing], pinsLocked: true })
    act(() => view.result.current.setSelectedId('a'))
    act(() => view.result.current.savePin())
    expect(persist).not.toHaveBeenCalled()
  })

  it('deletePin removes the pin and clears selection', () => {
    const existing = pin({ id: 'a', label: 'A' })
    const { view, persist, dataRef } = setup({ pins: [existing] })
    act(() => view.result.current.setSelectedId('a'))
    act(() => {
      view.result.current.deletePin('a')
      dataRef.current = mapData({ pins: [], pinsLocked: false })
      // Parent would re-render with the persisted list in the same turn.
      // Without that, the stale-selection effect re-picks pins[0].
      view.rerender({ pins: [], tokenSelected: false })
    })
    expect(persist).toHaveBeenCalledWith({ pins: [] })
    expect(view.result.current.selectedId).toBeNull()
  })

  it('deletePin is a no-op when pins are locked', () => {
    const existing = pin({ id: 'a', label: 'A' })
    const { view, persist } = setup({ pins: [existing], pinsLocked: true })
    act(() => view.result.current.deletePin('a'))
    expect(persist).not.toHaveBeenCalled()
  })

  it('togglePinLock persists the flipped lock and exits add/edit', () => {
    const existing = pin({ id: 'a', label: 'A' })
    const { view, persist } = setup({ pins: [existing] })
    act(() => view.result.current.startAddPin())
    act(() => view.result.current.togglePinLock())
    expect(persist).toHaveBeenCalledWith({ pinsLocked: true })
    expect(view.result.current.pinAction).toBe('view')
    expect(view.result.current.draft).toBeNull()
  })

  it('does not steal pin selection while a token is selected', async () => {
    const existing = pin({ id: 'a', label: 'A' })
    const { view } = setup({ pins: [existing], tokenSelected: true })
    act(() => view.result.current.setSelectedId(null))
    await waitFor(() => expect(view.result.current.selectedId).toBeNull())
  })

  it('reset returns to view and drops the draft', () => {
    const { view } = setup()
    act(() => {
      view.result.current.startAddPin()
      view.result.current.setDraft({ x: 0.1, y: 0.2 })
    })
    act(() => view.result.current.reset())
    expect(view.result.current.pinAction).toBe('view')
    expect(view.result.current.draft).toBeNull()
  })
})
