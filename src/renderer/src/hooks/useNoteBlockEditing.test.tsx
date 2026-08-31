// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useNoteBlockEditing } from './useNoteBlockEditing'
import { buildBlockIndex } from '../../../shared/blockIndex'

function setup(markdown = '') {
  const markdownRef = { current: markdown }
  const persistMarkdown = vi.fn().mockResolvedValue(undefined)
  const blockIndex = buildBlockIndex(markdown)
  const { result } = renderHook(() =>
    useNoteBlockEditing({ markdownRef, blockIndex, currencies: undefined, persistMarkdown })
  )
  return { result, persistMarkdown }
}

describe('useNoteBlockEditing', () => {
  it('toggleBlockEdit adds then removes a block key', () => {
    const { result } = setup()
    act(() => result.current.toggleBlockEdit('block:1'))
    expect(result.current.editingBlocks.has('block:1')).toBe(true)
    act(() => result.current.toggleBlockEdit('block:1'))
    expect(result.current.editingBlocks.has('block:1')).toBe(false)
  })

  it('resetBlockEditing clears the open set', () => {
    const { result } = setup()
    act(() => result.current.toggleBlockEdit('a'))
    act(() => result.current.toggleBlockEdit('b'))
    expect(result.current.editingBlocks.size).toBe(2)
    act(() => result.current.resetBlockEditing())
    expect(result.current.editingBlocks.size).toBe(0)
  })

  it('deleteSheetBlock is a no-op (no save) when the key is not present', async () => {
    const { result, persistMarkdown } = setup('')
    await act(async () => {
      await result.current.deleteSheetBlock('missing:key')
    })
    expect(persistMarkdown).not.toHaveBeenCalled()
  })
})
