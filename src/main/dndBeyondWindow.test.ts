import { beforeEach, describe, expect, it, vi } from 'vitest'

const { loadURL, focus, show, restore, isMinimized, isDestroyed, setTitle, getUserAgent, setUserAgent } =
  vi.hoisted(() => ({
    loadURL: vi.fn(),
    focus: vi.fn(),
    show: vi.fn(),
    restore: vi.fn(),
    isMinimized: vi.fn(() => false),
    isDestroyed: vi.fn(() => false),
    setTitle: vi.fn(),
    getUserAgent: vi.fn(() => 'Mozilla/5.0 Electron/28.0.0 Chrome/120'),
    setUserAgent: vi.fn()
  }))

vi.mock('electron', () => {
  class FakeWindow {
    webContents = {
      getUserAgent,
      setUserAgent,
      setWindowOpenHandler: vi.fn(),
      on: vi.fn()
    }
    loadURL = loadURL
    focus = focus
    show = show
    restore = restore
    isMinimized = isMinimized
    isDestroyed = isDestroyed
    setTitle = setTitle
    on = vi.fn()
    close = vi.fn()
  }
  return {
    BrowserWindow: FakeWindow,
    shell: { openExternal: vi.fn() }
  }
})

import { disposeDndBeyondWindow, openDndBeyondSheet } from './dndBeyondWindow'

describe('openDndBeyondSheet', () => {
  beforeEach(() => {
    disposeDndBeyondWindow()
    vi.clearAllMocks()
    isDestroyed.mockReturnValue(false)
  })

  it('opens the canonical character URL and rejects junk', () => {
    expect(openDndBeyondSheet('https://www.dndbeyond.com/characters/42-aria')).toBe(true)
    expect(loadURL).toHaveBeenCalledWith('https://www.dndbeyond.com/characters/42')
    expect(openDndBeyondSheet('https://www.dndbeyond.com/spells/fireball')).toBe(false)
    expect(openDndBeyondSheet('javascript:alert(1)')).toBe(false)
  })
})
