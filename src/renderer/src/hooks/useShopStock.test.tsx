// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useShopStock } from './useShopStock'

function setup(path: string) {
  const markdownRef = { current: '' }
  const persistMarkdown = vi.fn().mockResolvedValue(undefined)
  const { result } = renderHook(() => useShopStock({ path, markdownRef, persistMarkdown }))
  return { result, persistMarkdown }
}

describe('useShopStock', () => {
  it('rerollShopStock does nothing without a path', async () => {
    const { result, persistMarkdown } = setup('')
    await act(async () => {
      await result.current.rerollShopStock()
    })
    expect(persistMarkdown).not.toHaveBeenCalled()
  })

  it('rerollShopStock persists generated inventory for a shop note', async () => {
    const { result, persistMarkdown } = setup('Places/The Grey Mare.md')
    await act(async () => {
      await result.current.rerollShopStock()
    })
    expect(persistMarkdown).toHaveBeenCalledOnce()
    expect(typeof persistMarkdown.mock.calls[0][0]).toBe('string')
  })

  it('changeShopStock persists the applied stock', async () => {
    const { result, persistMarkdown } = setup('Places/x.md')
    await act(async () => {
      await result.current.changeShopStock([])
    })
    expect(persistMarkdown).toHaveBeenCalledOnce()
  })
})
