import { useState } from 'react'
import type { CampaignInfo } from '../../../shared/types'
import type { SystemId } from '../../../shared/systemPack'
import type { ThemeId, ThemeOptions } from '../../../shared/theme'
import { withoutRecentCampaign } from '../../../shared/recentCampaigns'

export type CampaignSetup = null | { step: 'system' } | { step: 'theme'; system: SystemId }

export interface CampaignOpen {
  campaignSetup: CampaignSetup
  setCampaignSetup: (setup: CampaignSetup) => void
  openFolder: () => Promise<void>
  newCampaign: (system?: SystemId, themeId?: ThemeId, options?: ThemeOptions) => Promise<void>
  openSample: () => Promise<void>
  openRecent: (folder: string) => Promise<void>
}

/**
 * Campaign open/create lifecycle for the DM console, plus the two-step
 * new-campaign wizard (pick system, then theme). Each entry point loads a
 * campaign, hands it to `applyCampaign` (which owns resetting the rest of the
 * console), then runs the shared post-open sync (player/mixer/recents).
 */
export function useCampaignOpen({
  applyCampaign,
  syncAfterOpen
}: {
  applyCampaign: (info: CampaignInfo | null, appTheme?: string | null) => void
  syncAfterOpen: () => Promise<void>
}): CampaignOpen {
  const [campaignSetup, setCampaignSetup] = useState<CampaignSetup>(null)

  async function openFolder(): Promise<void> {
    const info = await window.tabledm.pickCampaignFolder()
    applyCampaign(info)
    await syncAfterOpen()
  }

  async function openSample(): Promise<void> {
    const info = await window.tabledm.openSampleCampaign()
    applyCampaign(info)
    await syncAfterOpen()
  }

  async function openRecent(folder: string): Promise<void> {
    const info = await window.tabledm.openCampaignPath(folder)
    if (!info) {
      const settings = await window.tabledm.getSettings()
      const next = withoutRecentCampaign(settings.recentCampaigns, folder)
      await window.tabledm.saveSettings({ recentCampaigns: next })
      await syncAfterOpen()
      return
    }
    applyCampaign(info)
    await syncAfterOpen()
  }

  async function newCampaign(system?: SystemId, themeId?: ThemeId, options?: ThemeOptions): Promise<void> {
    if (!system) {
      setCampaignSetup({ step: 'system' })
      return
    }
    if (!themeId) {
      setCampaignSetup({ step: 'theme', system })
      return
    }
    setCampaignSetup(null)
    const info = await window.tabledm.newCampaign(system, themeId, options)
    applyCampaign(info, themeId)
    await syncAfterOpen()
  }

  return { campaignSetup, setCampaignSetup, openFolder, newCampaign, openSample, openRecent }
}
