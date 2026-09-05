// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render } from '@testing-library/react'
import HelpPanel from './HelpPanel'

describe('HelpPanel picture padding', () => {
  beforeEach(() => {
    window.tabledm = {
      getAppFolders: vi.fn(async () => ({
        appFolder: '',
        userDataFolder: '',
        booksFolder: '',
        campaignFolder: '',
        convertGuidePath: ''
      })),
      getSettings: vi.fn(async () => ({ playerImagePadPct: 4 })),
      saveSettings: vi.fn(async (partial: { playerImagePadPct?: number }) => partial)
    } as unknown as Window['tabledm']
  })

  afterEach(() => {
    Reflect.deleteProperty(window, 'tabledm')
  })

  it('saves picture padding from the settings slider', async () => {
    const view = render(<HelpPanel />)
    await act(async () => {
      await Promise.resolve()
    })
    const slider = view.getByRole('slider', { name: 'Picture padding' })
    fireEvent.change(slider, { target: { value: '10' } })
    expect(window.tabledm.saveSettings).toHaveBeenCalledWith({ playerImagePadPct: 10 })
  })
})
