import { beforeEach, describe, expect, it, vi } from 'vitest'

const { addBrowserView, removeBrowserView, setBounds, loadURL, isDestroyed, close } = vi.hoisted(() => ({
  addBrowserView: vi.fn(),
  removeBrowserView: vi.fn(),
  setBounds: vi.fn(),
  loadURL: vi.fn(),
  isDestroyed: vi.fn(() => false),
  close: vi.fn()
}))

vi.mock('electron', () => {
  class FakeView {
    webContents = {
      isDestroyed,
      loadURL,
      close,
      setWindowOpenHandler: vi.fn(),
      on: vi.fn(),
      getUserAgent: () => 'Mozilla/5.0 Electron/28.0.0 Chrome/120',
      setUserAgent: vi.fn()
    }
    setBounds = setBounds
    setAutoResize = vi.fn()
  }
  return {
    app: { on: vi.fn() },
    BrowserView: FakeView,
    shell: { openExternal: vi.fn() }
  }
})

import {
  asWebSheetBounds,
  disposeWebSheetEmbed,
  embedWebSheet,
  hideWebSheetEmbed,
  sanitizeWebSheetSrc
} from './webSheetWindow'

describe('web-sheet note-pane embed', () => {
  beforeEach(() => {
    disposeWebSheetEmbed()
    vi.clearAllMocks()
    isDestroyed.mockReturnValue(false)
  })

  it('accepts character and monster URLs and rejects everything else', () => {
    expect(sanitizeWebSheetSrc('https://www.dndbeyond.com/characters/42-aria')).toBe(
      'https://www.dndbeyond.com/characters/42'
    )
    expect(sanitizeWebSheetSrc('https://www.dndbeyond.com/monsters/4775812-dire-wolf')).toBe(
      'https://www.dndbeyond.com/monsters/4775812-dire-wolf'
    )
    expect(sanitizeWebSheetSrc('https://www.dndbeyond.com/spells/fireball')).toBeNull()
    expect(sanitizeWebSheetSrc('javascript:alert(1)')).toBeNull()
  })

  it('embeds a monster page on the DM window and can hide it', () => {
    const win = {
      isDestroyed: () => false,
      addBrowserView,
      removeBrowserView
    }
    expect(
      embedWebSheet(win as never, 'https://www.dndbeyond.com/monsters/4775812-dire-wolf', {
        x: 10,
        y: 20,
        width: 800,
        height: 600
      })
    ).toBe(true)
    expect(addBrowserView).toHaveBeenCalled()
    expect(loadURL).toHaveBeenCalledWith('https://www.dndbeyond.com/monsters/4775812-dire-wolf')
    expect(setBounds).toHaveBeenCalledWith({ x: 10, y: 20, width: 800, height: 600 })
    hideWebSheetEmbed()
    expect(removeBrowserView).toHaveBeenCalled()
  })

  it('rejects tiny or junk bounds', () => {
    expect(asWebSheetBounds({ x: 0, y: 0, width: 2, height: 2 })).toBeNull()
    expect(asWebSheetBounds(null)).toBeNull()
  })
})
