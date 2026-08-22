import type { AppUpdateNotice } from '../../../shared/appUpdate'

export default function UpdateBanner({
  notice,
  onUpdate,
  onDismiss
}: {
  notice: AppUpdateNotice | null
  onUpdate: () => void
  onDismiss: () => void
}) {
  if (!notice) return null
  if (notice.kind === 'current' || notice.kind === 'offline' || notice.kind === 'dev') return null

  const text =
    notice.kind === 'downloading'
      ? `Downloading Tableside ${notice.version}… ${Math.round(notice.percent)}%`
      : notice.kind === 'installing'
        ? `Installing Tableside ${notice.version}…`
        : notice.kind === 'failed'
          ? 'Update download failed. Try again when you are online.'
          : `Tableside ${notice.version} is available`

  const canInstall = notice.kind === 'available' || notice.kind === 'failed'

  return (
    <div className="flex items-center gap-3 border-b border-line bg-panel-2 px-4 py-1.5 text-[13px]">
      <span className="min-w-0 flex-1 text-parchment/90">
        {notice.kind === 'available' ? (
          <>
            Tableside {notice.version} is available —{' '}
            <button type="button" className="font-semibold text-amber hover:underline" onClick={onUpdate}>
              Update
            </button>
          </>
        ) : (
          text
        )}
      </span>
      {canInstall && notice.kind === 'failed' ? (
        <button type="button" className="text-sm text-amber hover:underline" onClick={onUpdate}>
          Retry
        </button>
      ) : null}
      {notice.kind === 'available' || notice.kind === 'failed' ? (
        <button type="button" className="text-xs text-muted hover:text-amber" onClick={onDismiss}>
          Not now
        </button>
      ) : null}
    </div>
  )
}
