/** In-app updater channel. Stable (default) is GitHub Latest; beta includes Pre-releases. */
export const UPDATE_CHANNELS = ['stable', 'beta'] as const

export type UpdateChannel = (typeof UPDATE_CHANNELS)[number]

export const DEFAULT_UPDATE_CHANNEL: UpdateChannel = 'stable'

export function parseUpdateChannel(value?: string | null): UpdateChannel {
  return value === 'beta' ? 'beta' : 'stable'
}

export function allowPrereleaseUpdates(channel: UpdateChannel): boolean {
  return channel === 'beta'
}

export function updateInstallPromptDetail(channel: UpdateChannel): string {
  return channel === 'beta'
    ? 'This may be a test (beta) build. Install now? Tableside will download the update and restart.'
    : 'Install now? Tableside will download the update and restart.'
}
