import { describe, expect, it } from 'vitest'
import {
  sameCampaignFolder,
  switchableRecentCampaigns,
  withoutRecentCampaign
} from './recentCampaigns'

describe('sameCampaignFolder', () => {
  it('treats slash variants and trailing slashes as the same', () => {
    expect(sameCampaignFolder('C:\\Games\\Greystead', 'C:/Games/Greystead/')).toBe(true)
    expect(sameCampaignFolder('/a/b', '/a/c')).toBe(false)
  })
})

describe('switchableRecentCampaigns', () => {
  const recents = [
    { name: 'Greystead', folder: '/data/greystead' },
    { name: 'Night City', folder: '/data/night-city' },
    { name: 'Old', folder: '/data/old/' }
  ]

  it('returns all recents when nothing is open', () => {
    expect(switchableRecentCampaigns(recents, null)).toEqual(recents)
    expect(switchableRecentCampaigns(recents)).toEqual(recents)
  })

  it('excludes the currently open campaign', () => {
    expect(switchableRecentCampaigns(recents, '/data/greystead')).toEqual([
      { name: 'Night City', folder: '/data/night-city' },
      { name: 'Old', folder: '/data/old/' }
    ])
    expect(switchableRecentCampaigns(recents, '/data/old')).toEqual([
      { name: 'Greystead', folder: '/data/greystead' },
      { name: 'Night City', folder: '/data/night-city' }
    ])
  })
})

describe('withoutRecentCampaign', () => {
  it('removes a stale folder entry', () => {
    const recents = [
      { name: 'A', folder: '/a' },
      { name: 'B', folder: '/b' }
    ]
    expect(withoutRecentCampaign(recents, '/a')).toEqual([{ name: 'B', folder: '/b' }])
  })
})
