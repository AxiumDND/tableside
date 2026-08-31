// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useCreatureSpaces } from './useCreatureSpaces'
import type { MapNoteData, MapToken } from '../lib/mapNote'
import type { PickerTab, TokenPick } from '../components/MapViewHelpers'

function mapData(overrides: Partial<MapNoteData> = {}): MapNoteData {
  return { image: '', pins: [], tokens: [], tokenScale: 1, pinsLocked: true, fog: '', fogSize: 0, ...overrides }
}

function statblock(size: string): string {
  return ['```statblock', 'name: Creature', `size: ${size}`, '```'].join('\n')
}

function emptyCatalog(): Record<PickerTab, TokenPick[]> {
  return { pc: [], npc: [], monster: [] }
}

beforeEach(() => {
  ;(globalThis as unknown as { window: Window }).window.tabledm = {} as Window['tabledm']
})

describe('useCreatureSpaces', () => {
  it('resolves token sizes from sheets and writes back corrected spaces', async () => {
    const readFile = vi.fn().mockResolvedValue(statblock('Large'))
    ;(window as unknown as { tabledm: { readFile: typeof readFile } }).tabledm = { readFile }
    const persist = vi.fn()
    const token: MapToken = {
      id: 't1',
      kind: 'monster',
      source: 'Ogre.md',
      x: 0.5,
      y: 0.5,
      space: 'medium',
      label: 'Ogre',
      image: ''
    }
    const dataRef = { current: mapData({ tokens: [token] }) }
    const catalogRef = { current: emptyCatalog() }

    const { result } = renderHook(() =>
      useCreatureSpaces({ path: 'Maps/A.md', tool: 'pan', dataRef, catalogRef, persistTokenSpaces: persist })
    )

    await waitFor(() => expect(result.current.spaceBySource['Ogre.md']).toBe('large'))
    await waitFor(() => expect(persist).toHaveBeenCalled())
    const written = persist.mock.calls.at(-1)![0] as MapToken[]
    expect(written[0].space).toBe('large')
  })

  it('loads catalog sizes only while the token tool is active', async () => {
    const readFile = vi.fn().mockResolvedValue(statblock('Huge'))
    ;(window as unknown as { tabledm: { readFile: typeof readFile } }).tabledm = { readFile }
    const pick: TokenPick = { kind: 'pc', source: 'Wolf.md', label: 'Wolf', imageSrc: null, space: 'medium' }
    const catalogRef = { current: { ...emptyCatalog(), pc: [pick] } }
    const dataRef = { current: mapData() }

    const { result } = renderHook(() =>
      useCreatureSpaces({ path: 'Maps/A.md', tool: 'token', dataRef, catalogRef, persistTokenSpaces: vi.fn() })
    )

    await waitFor(() => expect(result.current.spaceBySource['Wolf.md']).toBe('huge'))
  })

  it('does not read catalog sheets when the token tool is inactive', () => {
    const readFile = vi.fn().mockResolvedValue(statblock('Large'))
    ;(window as unknown as { tabledm: { readFile: typeof readFile } }).tabledm = { readFile }
    const pick: TokenPick = { kind: 'pc', source: 'Wolf.md', label: 'Wolf', imageSrc: null, space: 'medium' }
    const catalogRef = { current: { ...emptyCatalog(), pc: [pick] } }
    const dataRef = { current: mapData() }

    renderHook(() =>
      useCreatureSpaces({ path: 'Maps/A.md', tool: 'pan', dataRef, catalogRef, persistTokenSpaces: vi.fn() })
    )

    expect(readFile).not.toHaveBeenCalled()
  })
})
