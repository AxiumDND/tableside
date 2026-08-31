// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { useConsoleHotkeys, type ConsoleHotkeyHandlers } from './useConsoleHotkeys'

function makeHandlers(): { [K in keyof ConsoleHotkeyHandlers]: ReturnType<typeof vi.fn> } {
  return {
    onBack: vi.fn(),
    onNext: vi.fn(),
    onShowArt: vi.fn(),
    onShowHandout: vi.fn(),
    onClearPlayer: vi.fn(),
    onAdvanceTurn: vi.fn()
  }
}

function Harness({ handlers }: { handlers: ConsoleHotkeyHandlers }) {
  useConsoleHotkeys(handlers)
  return null
}

function pressKey(init: KeyboardEventInit): void {
  window.dispatchEvent(new KeyboardEvent('keydown', init))
}

describe('useConsoleHotkeys', () => {
  it('maps Alt+Arrow keys to back and next', () => {
    const h = makeHandlers()
    render(<Harness handlers={h} />)
    pressKey({ key: 'ArrowLeft', altKey: true })
    pressKey({ key: 'ArrowRight', altKey: true })
    expect(h.onBack).toHaveBeenCalledOnce()
    expect(h.onNext).toHaveBeenCalledOnce()
  })

  it('maps Alt+S/I/X/T to the player and combat actions', () => {
    const h = makeHandlers()
    render(<Harness handlers={h} />)
    pressKey({ key: 's', altKey: true })
    pressKey({ key: 'i', altKey: true, shiftKey: true })
    pressKey({ key: 'x', altKey: true })
    pressKey({ key: 't', altKey: true })
    expect(h.onShowArt).toHaveBeenCalledOnce()
    expect(h.onShowHandout).toHaveBeenCalledWith(true)
    expect(h.onClearPlayer).toHaveBeenCalledOnce()
    expect(h.onAdvanceTurn).toHaveBeenCalledOnce()
  })

  it('ignores hotkeys without Alt and while typing in a field', () => {
    const h = makeHandlers()
    render(<Harness handlers={h} />)
    pressKey({ key: 's' })
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 's', altKey: true, bubbles: true }))
    input.remove()
    expect(h.onShowArt).not.toHaveBeenCalled()
  })

  it('maps mouse back/forward buttons', () => {
    const h = makeHandlers()
    render(<Harness handlers={h} />)
    window.dispatchEvent(new MouseEvent('mouseup', { button: 3 }))
    window.dispatchEvent(new MouseEvent('mouseup', { button: 4 }))
    expect(h.onBack).toHaveBeenCalledOnce()
    expect(h.onNext).toHaveBeenCalledOnce()
  })

  it('always calls the latest handlers (no stale closure)', () => {
    const first = makeHandlers()
    const { rerender } = render(<Harness handlers={first} />)
    const second = makeHandlers()
    rerender(<Harness handlers={second} />)
    pressKey({ key: 'ArrowLeft', altKey: true })
    expect(first.onBack).not.toHaveBeenCalled()
    expect(second.onBack).toHaveBeenCalledOnce()
  })
})
