// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCampaignOpen } from './useCampaignOpen'

const api = {
  pickCampaignFolder: vi.fn(),
  openSampleCampaign: vi.fn(),
  openCampaignPath: vi.fn(),
  newCampaign: vi.fn()
}

beforeEach(() => {
  Object.values(api).forEach((fn) => fn.mockReset().mockResolvedValue({ name: 'X' }))
  Object.defineProperty(window, 'tabledm', { value: api, configurable: true, writable: true })
})

function setup() {
  const applyCampaign = vi.fn()
  const syncAfterOpen = vi.fn().mockResolvedValue(undefined)
  const { result } = renderHook(() => useCampaignOpen({ applyCampaign, syncAfterOpen }))
  return { result, applyCampaign, syncAfterOpen }
}

describe('useCampaignOpen', () => {
  it('newCampaign walks system -> theme -> create', async () => {
    const { result, applyCampaign, syncAfterOpen } = setup()

    await act(async () => {
      await result.current.newCampaign()
    })
    expect(result.current.campaignSetup).toEqual({ step: 'system' })
    expect(applyCampaign).not.toHaveBeenCalled()

    await act(async () => {
      await result.current.newCampaign('dnd5e')
    })
    expect(result.current.campaignSetup).toEqual({ step: 'theme', system: 'dnd5e' })
    expect(api.newCampaign).not.toHaveBeenCalled()

    await act(async () => {
      await result.current.newCampaign('dnd5e', 'classic')
    })
    expect(api.newCampaign).toHaveBeenCalledWith('dnd5e', 'classic', undefined)
    expect(applyCampaign).toHaveBeenCalledWith({ name: 'X' }, 'classic')
    expect(syncAfterOpen).toHaveBeenCalled()
    expect(result.current.campaignSetup).toBeNull()
  })

  it('openFolder loads a campaign and syncs', async () => {
    const { result, applyCampaign, syncAfterOpen } = setup()
    await act(async () => {
      await result.current.openFolder()
    })
    expect(api.pickCampaignFolder).toHaveBeenCalledOnce()
    expect(applyCampaign).toHaveBeenCalledWith({ name: 'X' })
    expect(syncAfterOpen).toHaveBeenCalledOnce()
  })
})
