import { useCallback, useEffect, useState } from 'react'
import {
  emptyMixerClock,
  formatMixerTime,
  mixerIsActive,
  musicTrackLabel,
  type AudioLibrary,
  type MixerClock,
  type MixerLayerClock,
  type MixerPlayback,
  type MixerState
} from '../../../shared/audio'

function knownPlaylistId(playlists: { id: string }[], id: string | null | undefined): string {
  if (id && playlists.some((item) => item.id === id)) return id
  return playlists[0]?.id ?? ''
}

function layerNowPlaying(
  library: AudioLibrary,
  playback: MixerPlayback,
  kind: 'music' | 'ambience'
): string | null {
  if (kind === 'music') {
    if (!playback.musicTrack) return null
    const label = musicTrackLabel(library, playback.musicTrack)
    if (label) return label.playlist ? `${label.playlist} — ${label.track}` : label.track
    return null
  }
  if (!playback.ambiencePlaying) return null
  const playlist = library.ambience.find((item) => item.id === playback.ambiencePlaylistId)
  const track = playlist?.tracks.find((item) => item.relativePath === playback.ambienceTrack)
  if (playlist && track && playlist.name !== track.name) return `${playlist.name} — ${track.name}`
  return track?.name ?? playlist?.name ?? null
}

type AudioOutput = { deviceId: string; label: string }

function useAudioOutputs(): { outputs: AudioOutput[]; refresh: () => void } {
  const [outputs, setOutputs] = useState<AudioOutput[]>([])
  const refresh = useCallback(() => {
    if (!navigator.mediaDevices?.enumerateDevices) return
    void navigator.mediaDevices.enumerateDevices().then((devices) => {
      const seen = new Set<string>()
      const next: AudioOutput[] = []
      for (const device of devices) {
        if (device.kind !== 'audiooutput') continue
        const deviceId = device.deviceId === 'default' ? '' : device.deviceId
        if (seen.has(deviceId)) continue
        seen.add(deviceId)
        next.push({
          deviceId,
          label: device.label || (deviceId ? `Output ${next.length + 1}` : 'System default')
        })
      }
      setOutputs(next)
    })
  }, [])
  useEffect(() => {
    refresh()
    const media = navigator.mediaDevices
    if (!media?.addEventListener) return
    media.addEventListener('devicechange', refresh)
    return () => media.removeEventListener('devicechange', refresh)
  }, [refresh])
  return { outputs, refresh }
}

function ClockLine({ clock }: { clock: MixerLayerClock }) {
  if (!clock) return <span className="text-[10px] text-muted">0:00 / —</span>
  const pct = clock.duration > 0 ? Math.min(100, Math.max(0, (clock.current / clock.duration) * 100)) : 0
  return (
    <div className="mt-0.5">
      <div className="h-1 overflow-hidden rounded bg-line">
        <div className="h-full bg-amber" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-0.5 text-[10px] tabular-nums text-muted">
        {formatMixerTime(clock.current)} / {formatMixerTime(clock.duration)}
      </div>
    </div>
  )
}

function Slider({
  label,
  value,
  muted,
  disabled,
  onVolume,
  onMute
}: {
  label: string
  value: number
  muted: boolean
  disabled?: boolean
  onVolume: (value: number) => void
  onMute: (muted: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2">
      <span className="w-16 shrink-0 text-[10px] uppercase tracking-wider text-muted">{label}</span>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(value * 100)}
        disabled={disabled}
        onChange={(event) => onVolume(Number(event.target.value) / 100)}
        className="min-w-0 flex-1 accent-amber"
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => onMute(!muted)}
        className={`w-8 text-[10px] uppercase ${muted ? 'text-amber' : 'text-muted hover:text-amber'}`}
      >
        {muted ? 'Muted' : 'Mute'}
      </button>
    </label>
  )
}

export default function MusicPanel({
  state,
  clock = emptyMixerClock(),
  disabled
}: {
  state: MixerState
  clock?: MixerClock
  disabled?: boolean
}) {
  const { library, prefs, playback } = state
  const { outputs, refresh } = useAudioOutputs()
  const musicNow = layerNowPlaying(library, playback, 'music')
  const ambienceNow = layerNowPlaying(library, playback, 'ambience')
  const [musicPick, setMusicPick] = useState(
    () => knownPlaylistId(library.music, prefs.lastMusicId ?? playback.musicPlaylistId)
  )
  const [ambiencePick, setAmbiencePick] = useState(
    () => prefs.lastAmbienceId ?? playback.ambiencePlaylistId ?? library.ambience[0]?.id ?? ''
  )

  useEffect(() => {
    const next = knownPlaylistId(library.music, prefs.lastMusicId ?? playback.musicPlaylistId)
    if (next) setMusicPick(next)
  }, [prefs.lastMusicId, playback.musicPlaylistId, library.music])

  useEffect(() => {
    const next = prefs.lastAmbienceId ?? playback.ambiencePlaylistId ?? library.ambience[0]?.id ?? ''
    if (next) setAmbiencePick(next)
  }, [prefs.lastAmbienceId, playback.ambiencePlaylistId, library.ambience])
  const outputOptions =
    prefs.outputDeviceId && !outputs.some((item) => item.deviceId === prefs.outputDeviceId)
      ? [...outputs, { deviceId: prefs.outputDeviceId, label: 'Last used output' }]
      : outputs

  function setPrefs(partial: Parameters<typeof window.tabledm.mixerSetPrefs>[0]): void {
    void window.tabledm.mixerSetPrefs(partial)
  }

  function addAudio(folder: string): void {
    void window.tabledm.addFiles(folder).then(() => window.tabledm.getMixer())
  }

  const musicFolder = musicPick || 'Audio/Music/General'

  return (
    <section className="flex min-h-0 w-[400px] shrink-0 flex-col border-l border-line bg-ink">
      <header className="border-b border-line px-3 py-2">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg text-amber">Music</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={disabled || !mixerIsActive(state)}
              onClick={() => void window.tabledm.mixerStopAll()}
              className="rounded border border-line px-2 py-0.5 text-[11px] hover:border-amber disabled:text-muted"
            >
              Stop all
            </button>
          </div>
        </div>
        <div className="mt-2 space-y-1.5">
          <div className="rounded border border-line/70 bg-panel-2 px-2 py-1.5 text-[11px] text-parchment">
            <div className="text-[10px] uppercase tracking-wider text-muted">Now playing</div>
            <div className="truncate">
              {musicNow
                ? `Music: ${musicNow}${playback.musicPlaying ? '' : ' (paused)'}`
                : 'Music: —'}
            </div>
            {musicNow ? <ClockLine clock={clock.music} /> : null}
            <div className={`truncate ${musicNow ? 'mt-1.5' : ''}`}>
              {ambienceNow ? `Ambience: ${ambienceNow}` : 'Ambience: —'}
            </div>
            {ambienceNow ? <ClockLine clock={clock.ambience} /> : null}
            {playback.error ? <div className="mt-1 text-amber">{playback.error}</div> : null}
          </div>
          {library.skipped > 0 ? (
            <p className="text-[11px] text-amber">
              {library.skipped} audio {library.skipped === 1 ? 'file sits' : 'files sit'} outside Audio/Music,
              Audio/Ambience, or Audio/Sfx — move {library.skipped === 1 ? 'it' : 'them'} into those folders.
            </p>
          ) : null}
          <Slider
            label="Master"
            value={prefs.masterVolume}
            muted={prefs.masterMuted}
            disabled={disabled}
            onVolume={(masterVolume) => setPrefs({ masterVolume })}
            onMute={(masterMuted) => setPrefs({ masterMuted })}
          />
          <label className="block">
            <span className="text-[10px] uppercase tracking-wider text-muted">Output</span>
            <div className="mt-0.5 flex items-center gap-1">
              <select
                disabled={disabled}
                value={prefs.outputDeviceId}
                onChange={(event) => setPrefs({ outputDeviceId: event.target.value })}
                className="min-w-0 flex-1 rounded border border-line bg-ink px-1 py-1 text-[12px] text-parchment outline-none focus:border-amber"
              >
                <option value="">System default</option>
                {outputOptions
                  .filter((item) => item.deviceId)
                  .map((item) => (
                    <option key={item.deviceId} value={item.deviceId}>
                      {item.label}
                    </option>
                  ))}
              </select>
              <button
                type="button"
                disabled={disabled}
                onClick={refresh}
                className="rounded border border-line px-1.5 py-0.5 text-[11px] hover:border-amber disabled:text-muted"
              >
                Refresh
              </button>
            </div>
          </label>
        </div>
      </header>

      <div className="min-h-0 flex-1 space-y-4 overflow-auto px-3 py-3">
        <section>
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Music</h3>
            <button
              type="button"
              disabled={disabled}
              onClick={() => addAudio(musicFolder)}
              className="text-[11px] text-muted hover:text-amber disabled:opacity-50"
            >
              Add audio…
            </button>
          </div>
          {library.music.length === 0 ? (
            <p className="mt-2 text-[12px] text-muted">
              Drop tracks in <span className="text-parchment">Audio/Music/Combat</span>,{' '}
              <span className="text-parchment">Creepy</span>, or <span className="text-parchment">General</span> — or
              Add audio…
            </p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {library.music.map((playlist) => {
                const selected = musicPick === playlist.id
                const playing = playback.musicPlaying && playback.musicPlaylistId === playlist.id
                return (
                  <button
                    key={playlist.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      setMusicPick(playlist.id)
                      setPrefs({ lastMusicId: playlist.id })
                    }}
                    className={`rounded px-2 py-1 text-[12px] ${
                      playing
                        ? 'bg-amber font-semibold text-on-amber'
                        : selected
                          ? 'border border-amber text-amber'
                          : 'border border-line hover:border-amber'
                    }`}
                  >
                    {playlist.name}
                  </button>
                )
              })}
            </div>
          )}
          <div className="mt-2 flex items-center gap-1">
            <button
              type="button"
              disabled={disabled}
              onClick={() => setPrefs({ shuffle: false })}
              className={`rounded px-2 py-0.5 text-[11px] ${
                !prefs.shuffle
                  ? 'bg-amber font-semibold text-on-amber'
                  : 'border border-line text-muted hover:border-amber'
              }`}
            >
              In order
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => setPrefs({ shuffle: true })}
              className={`rounded px-2 py-0.5 text-[11px] ${
                prefs.shuffle
                  ? 'bg-amber font-semibold text-on-amber'
                  : 'border border-line text-muted hover:border-amber'
              }`}
            >
              Shuffle
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              disabled={disabled || !musicPick}
              onClick={() => void window.tabledm.mixerPlayMusic(musicPick)}
              className="rounded bg-amber px-2.5 py-1 text-[12px] font-semibold text-on-amber disabled:bg-line disabled:text-muted"
            >
              Play
            </button>
            <button
              type="button"
              disabled={disabled || !playback.musicPlaying}
              onClick={() => void window.tabledm.mixerPauseMusic()}
              className="rounded border border-line px-2.5 py-1 text-[12px] hover:border-amber disabled:text-muted"
            >
              Pause
            </button>
            <button
              type="button"
              disabled={disabled || !playback.musicPlaylistId}
              onClick={() => void window.tabledm.mixerSkipMusic()}
              className="rounded border border-line px-2.5 py-1 text-[12px] hover:border-amber disabled:text-muted"
            >
              Skip
            </button>
            <button
              type="button"
              disabled={disabled || (!playback.musicPlaying && !playback.musicTrack)}
              onClick={() => void window.tabledm.mixerStopMusic()}
              className="rounded border border-line px-2.5 py-1 text-[12px] hover:border-amber disabled:text-muted"
            >
              Stop
            </button>
          </div>
          <div className="mt-2">
            <Slider
              label="Music"
              value={prefs.musicVolume}
              muted={prefs.musicMuted}
              disabled={disabled}
              onVolume={(musicVolume) => setPrefs({ musicVolume })}
              onMute={(musicMuted) => setPrefs({ musicMuted })}
            />
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Ambience</h3>
            <button
              type="button"
              disabled={disabled}
              onClick={() => addAudio('Audio/Ambience')}
              className="text-[11px] text-muted hover:text-amber disabled:opacity-50"
            >
              Add audio…
            </button>
          </div>
          <div className="mt-2 space-y-2">
            <label className="block">
              <span className="text-[10px] uppercase tracking-wider text-muted">Select</span>
              <select
                disabled={disabled || library.ambience.length === 0}
                value={ambiencePick}
                onChange={(event) => {
                  const id = event.target.value
                  setAmbiencePick(id)
                  setPrefs({ lastAmbienceId: id || null })
                }}
                className="mt-0.5 w-full rounded border border-line bg-ink px-1 py-1.5 text-[13px] text-parchment outline-none focus:border-amber disabled:opacity-60"
              >
                <option value="">
                  {library.ambience.length === 0 ? 'No beds yet — Add audio…' : 'Choose a bed…'}
                </option>
                {library.ambience.map((playlist) => (
                  <option key={playlist.id} value={playlist.id}>
                    {playlist.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={disabled || !ambiencePick}
                onClick={() => void window.tabledm.mixerPlayAmbience(ambiencePick)}
                className="rounded bg-amber px-2.5 py-1 text-[12px] font-semibold text-on-amber disabled:bg-line disabled:text-muted"
              >
                Start
              </button>
              <button
                type="button"
                disabled={disabled || !playback.ambiencePlaying}
                onClick={() => void window.tabledm.mixerStopAmbience()}
                className="rounded border border-line px-2.5 py-1 text-[12px] hover:border-amber disabled:text-muted"
              >
                Stop
              </button>
            </div>
          </div>
          <div className="mt-2">
            <Slider
              label="Ambience"
              value={prefs.ambienceVolume}
              muted={prefs.ambienceMuted}
              disabled={disabled}
              onVolume={(ambienceVolume) => setPrefs({ ambienceVolume })}
              onMute={(ambienceMuted) => setPrefs({ ambienceMuted })}
            />
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Soundboard</h3>
            <button
              type="button"
              disabled={disabled}
              onClick={() => addAudio('Audio/Sfx')}
              className="text-[11px] text-muted hover:text-amber disabled:opacity-50"
            >
              Add audio…
            </button>
          </div>
          {library.sfx.length === 0 ? (
            <p className="mt-2 text-[12px] text-muted">
              Drop one-shots in <span className="text-parchment">Audio/Sfx</span> — or Add audio…
            </p>
          ) : (
            <div className="mt-2 space-y-2">
              {library.sfx.map((group) => (
                <div key={group.id}>
                  <div className="mb-1 text-[10px] uppercase tracking-wider text-muted">{group.name}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {group.tracks.map((track) => (
                      <button
                        key={track.relativePath}
                        type="button"
                        disabled={disabled}
                        onClick={() => void window.tabledm.mixerOneshot(track.relativePath)}
                        className="rounded border border-line px-2 py-1 text-[12px] hover:border-amber disabled:text-muted"
                      >
                        {track.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-2">
            <Slider
              label="Sfx"
              value={prefs.sfxVolume}
              muted={prefs.sfxMuted}
              disabled={disabled}
              onVolume={(sfxVolume) => setPrefs({ sfxVolume })}
              onMute={(sfxMuted) => setPrefs({ sfxMuted })}
            />
          </div>
        </section>
      </div>
    </section>
  )
}
