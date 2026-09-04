import type { RecentCampaign } from './types'

/** Compare campaign folder paths across Windows/POSIX separators. */
export function sameCampaignFolder(a: string, b: string): boolean {
  const norm = (value: string) =>
    value.replaceAll('\\', '/').replace(/\/+$/, '').toLowerCase()
  return norm(a) === norm(b)
}

/**
 * Recents the DM can switch to — excludes the currently open folder.
 * Order is preserved (most recent first from settings).
 */
export function switchableRecentCampaigns(
  recents: RecentCampaign[] | null | undefined,
  currentFolder?: string | null
): RecentCampaign[] {
  const list = recents ?? []
  if (!currentFolder) return list
  return list.filter((item) => !sameCampaignFolder(item.folder, currentFolder))
}

/** Drop one folder from the recents list (e.g. missing on disk). */
export function withoutRecentCampaign(
  recents: RecentCampaign[] | null | undefined,
  folder: string
): RecentCampaign[] {
  return (recents ?? []).filter((item) => !sameCampaignFolder(item.folder, folder))
}
