// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useMapLiveView } from './useMapLiveView'
import { FIT_CAMERA, type MapCamera } from '../lib/mapCamera'
import { createFog } from '../lib/mapFog'
import type { MapNoteData, MapToken } from '../lib/mapNote'
import type { Combatant, PlayerMapView } from '../../../shared/types'

function mapData(overrides: Partial<MapNoteData> = {}): MapNoteData {
  return { image: 'cave.png', pins: [], tokens: [], tokenScale: 1, gridX: 0, gridY: 0, pinsLocked: true, fog: '', fogSize: 0, ...overrides }
}

function token(overrides: Partial<MapToken> & { id: string; label: string }): MapToken {
  return {
    kind: 'monster',
    source: `${overrides.label}.md`,
    x: 0.2,
    y: 0.3,
    space: 'medium',
    image: '',
    ...overrides
  }
}

const pending = new Map<number, FrameRequestCallback>()
let nextId = 1

function flushRaf(): void {
  const queued = [...pending.values()]
  pending.clear()
  for (const cb of queued) cb(0)
}

function setup(
  overrides: {
    imagePath?: string | null
    omitOnLiveView?: boolean
    camera?: MapCamera
    tokens?: MapToken[]
    dragPos?: { id: string; x: number; y: number } | null
    combatants?: Combatant[]
    combatSignature?: string
  } = {}
) {
  const onLiveView = vi.fn()
  const camera = overrides.camera ?? FIT_CAMERA
  const tokens = overrides.tokens ?? []
  const dragPos = overrides.dragPos ?? null
  const cameraRef = { current: camera }
  const fogRef = { current: createFog(8, 0) }
  const dataRef = { current: mapData({ tokens, tokenScale: 0.05 }) }
  const scaleDraftRef = { current: null as number | null }
  const dragPosRef = { current: dragPos }
  const view = renderHook(
    (props: {
      camera: MapCamera
      imagePath: string | null
      dragPos: typeof dragPos
      combatants: Combatant[]
      combatSignature: string
    }) =>
      useMapLiveView({
        imagePath: props.imagePath,
        onLiveView: overrides.omitOnLiveView ? undefined : onLiveView,
        camera: props.camera,
        cameraRef,
        fogRef,
        fogTick: 0,
        dataRef,
        images: [],
        tokens,
        tokenScale: 0.05,
        scaleDraft: null,
        scaleDraftRef,
        dragPos: props.dragPos,
        dragPosRef,
        combatants: props.combatants,
        combatSignature: props.combatSignature
      }),
    {
      initialProps: {
        camera,
        imagePath: overrides.imagePath === undefined ? 'Maps/cave.png' : overrides.imagePath,
        dragPos,
        combatants: overrides.combatants ?? [],
        combatSignature: overrides.combatSignature ?? ''
      }
    }
  )
  return { view, onLiveView, cameraRef, dataRef, dragPosRef, fogRef }
}

describe('useMapLiveView', () => {
  beforeEach(() => {
    pending.clear()
    nextId = 1
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      const id = nextId++
      pending.set(id, cb)
      return id
    })
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      pending.delete(id)
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('broadcasts camera + empty fog on the next animation frame', () => {
    const { onLiveView } = setup()
    expect(onLiveView).not.toHaveBeenCalled()
    act(() => flushRaf())
    expect(onLiveView).toHaveBeenCalledTimes(1)
    const [path, view] = onLiveView.mock.calls[0] as [string, PlayerMapView]
    expect(path).toBe('Maps/cave.png')
    expect(view).toMatchObject({ zoom: 1, centerX: 0.5, centerY: 0.5, fog: '' })
  })

  it('skips when there is no image path', () => {
    const { onLiveView } = setup({ imagePath: null })
    act(() => flushRaf())
    expect(onLiveView).not.toHaveBeenCalled()
  })

  it('skips when onLiveView is omitted', () => {
    setup({ omitOnLiveView: true })
    act(() => flushRaf())
    expect(pending.size).toBe(0)
  })

  it('re-broadcasts when the camera changes', () => {
    const { view, onLiveView, cameraRef } = setup()
    act(() => flushRaf())
    const zoomed = { zoom: 2, centerX: 0.4, centerY: 0.6 }
    cameraRef.current = zoomed
    act(() =>
      view.rerender({
        camera: zoomed,
        imagePath: 'Maps/cave.png',
        dragPos: null,
        combatants: [],
        combatSignature: ''
      })
    )
    act(() => flushRaf())
    expect(onLiveView).toHaveBeenCalledTimes(2)
    const viewPayload = onLiveView.mock.calls[1][1] as PlayerMapView
    expect(viewPayload.zoom).toBe(2)
    expect(viewPayload.centerX).toBeCloseTo(0.4)
    expect(viewPayload.centerY).toBeCloseTo(0.6)
  })

  it('uses the live drag position for tokens', () => {
    const placed = token({ id: 't1', label: 'Wolf' })
    const drag = { id: 't1', x: 0.9, y: 0.1 }
    const { onLiveView } = setup({ tokens: [placed], dragPos: drag })
    act(() => flushRaf())
    const viewPayload = onLiveView.mock.calls[0][1] as PlayerMapView
    expect(viewPayload.tokens?.[0]).toMatchObject({ id: 't1', x: 0.9, y: 0.1, label: 'Wolf' })
  })

  it('re-broadcasts condition chips when combat overlay changes', () => {
    const placed = token({
      id: 'wolf-2',
      label: 'Wolf',
      source: 'Bestiary/Wolf.md',
      combatantId: 'c1'
    })
    const combatants = [
      {
        id: 'c1',
        name: 'Wolf',
        kind: 'monster' as const,
        initiative: 10,
        hp: 11,
        maxHp: 11,
        ac: 13,
        conditions: [] as string[]
      }
    ]
    const { view, onLiveView } = setup({
      tokens: [placed],
      combatants,
      combatSignature: 'c1:11:11:'
    })
    act(() => flushRaf())
    expect(onLiveView.mock.calls[0][1].tokens?.[0].overlayTags).toBeUndefined()

    act(() =>
      view.rerender({
        camera: FIT_CAMERA,
        imagePath: 'Maps/cave.png',
        dragPos: null,
        combatants: [{ ...combatants[0], conditions: ['poisoned'] }],
        combatSignature: 'c1:11:11:poisoned'
      })
    )
    act(() => flushRaf())
    const tags = (onLiveView.mock.calls[1][1] as PlayerMapView).tokens?.[0].overlayTags?.map(
      (tag) => tag.label
    )
    expect(tags).toContain('Poisoned')
  })

  it('cancels a pending frame on unmount', () => {
    const { view, onLiveView } = setup()
    expect(pending.size).toBe(1)
    act(() => view.unmount())
    expect(pending.size).toBe(0)
    flushRaf()
    expect(onLiveView).not.toHaveBeenCalled()
  })
})
