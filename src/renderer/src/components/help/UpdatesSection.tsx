import type { AppUpdateNotice } from '../../../../shared/appUpdate'
import type { UpdateChannel } from '../../../../shared/updateChannel'
import { APP_VERSION } from '../../../../shared/version'
import { Action, Code } from './HelpComponents'

export function UpdatesSection({
  updateChannel,
  saveUpdateChannel,
  updateNotice,
  onCheckUpdate,
  onStartUpdate
}: {
  updateChannel: UpdateChannel
  saveUpdateChannel: (next: UpdateChannel) => void
  updateNotice?: AppUpdateNotice | null
  onCheckUpdate?: () => void
  onStartUpdate?: () => void
}) {
  return (
    <>
      <p>
        Installed copies check GitHub at launch. By default they only offer the latest stable release. If a newer
        Tableside exists, the app asks to install it. Nothing downloads until you press <Action>Install</Action>.
        Offline (at the table) the check is skipped and the app stays quiet.
      </p>
      <label className="mt-2 flex items-start gap-2 text-[13px] text-parchment/90">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={updateChannel === 'beta'}
          onChange={(event) => saveUpdateChannel(event.target.checked ? 'beta' : 'stable')}
        />
        <span>
          <span className="font-semibold text-parchment">Include test (beta) updates</span>
          <span className="mt-0.5 block text-[12px] leading-snug text-muted">
            Also offer GitHub Pre-releases. Leave this off unless you want to try builds before they are marked
            Latest. Turning it off later does not roll you back.
          </span>
        </span>
      </label>
      <p className="text-[12px] text-muted">You are on {APP_VERSION}. Windows may still ask SmartScreen on the new installer — More info, then Run anyway.</p>
      {onCheckUpdate ? (
        <button
          type="button"
          onClick={onCheckUpdate}
          className="mt-2 rounded border border-line px-3 py-1.5 text-sm hover:border-amber"
        >
          Check for updates
        </button>
      ) : null}
      {updateNotice?.kind === 'available' ? (
        <p className="mt-2 text-sm">
          Tableside {updateNotice.version} is available.{' '}
          {onStartUpdate ? (
            <button type="button" className="text-amber hover:underline" onClick={onStartUpdate}>
              Update
            </button>
          ) : null}
        </p>
      ) : null}
      {updateNotice?.kind === 'current' ? (
        <p className="mt-2 text-sm text-muted">
          {updateChannel === 'beta'
            ? 'You already have the latest update on the test channel.'
            : 'You already have the latest release.'}
        </p>
      ) : null}
      {updateNotice?.kind === 'offline' ? (
        <p className="mt-2 text-sm text-muted">Could not reach GitHub. Try again when you are online.</p>
      ) : null}
      {updateNotice?.kind === 'dev' ? (
        <p className="mt-2 text-sm text-muted">
          Update checks run in the installed app, not in <Code>npm run dev</Code>.
        </p>
      ) : null}
      {updateNotice?.kind === 'downloading' ? (
        <p className="mt-2 text-sm">Downloading {updateNotice.version}… {Math.round(updateNotice.percent)}%</p>
      ) : null}
      {updateNotice?.kind === 'failed' ? (
        <p className="mt-2 text-sm text-muted">Download failed. Try again when you are online.</p>
      ) : null}
    </>
  )
}
