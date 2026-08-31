import { useEffect, useState } from 'react'
import type { CampaignVideo } from '../lib/images'

type VideoFields = {
  title: string
  videoRef: string | null
  muted: boolean
}

export default function VideoCard({
  title,
  videoRef,
  muted,
  videos,
  disabled,
  editing = false,
  onChange,
  onPlay,
  onStop,
  videoActive,
  onLoadVideo
}: {
  title?: string
  videoRef: string | null
  muted: boolean
  videos: CampaignVideo[]
  disabled?: boolean
  editing?: boolean
  onChange: (next: VideoFields) => void
  onPlay?: (fields: VideoFields) => void
  onStop?: () => void
  videoActive?: boolean
  onLoadVideo?: () => Promise<string | null>
}) {
  const [titleValue, setTitleValue] = useState(title ?? '')
  const [refValue, setRefValue] = useState(videoRef)
  const [muteValue, setMuteValue] = useState(muted)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setTitleValue(title ?? '')
    setRefValue(videoRef)
    setMuteValue(muted)
  }, [title, videoRef, muted])

  function commit(partial?: { title?: string; videoRef?: string | null; muted?: boolean }): void {
    onChange({
      title: partial?.title ?? titleValue,
      videoRef: partial && 'videoRef' in partial ? partial.videoRef ?? null : refValue,
      muted: partial?.muted ?? muteValue
    })
  }

  async function loadVideo(): Promise<void> {
    if (!onLoadVideo) return
    setBusy(true)
    try {
      const next = await onLoadVideo()
      if (next) {
        setRefValue(next)
        commit({ videoRef: next })
      }
    } finally {
      setBusy(false)
    }
  }

  const known = videos.some((v) => v.relativePath === refValue)
  const canPlay = Boolean(refValue?.trim())

  return (
    <section className="player-video-card my-5">
      <div className="relative rounded-md border border-amber/40 bg-panel-2 px-4 pb-4 pt-5">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l-md bg-amber" />
        <div className="absolute -top-3 left-3 flex items-center gap-1.5 bg-panel px-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber">Video</span>
          {!editing && titleValue.trim() ? (
            <span className="max-w-[14rem] truncate text-[11px] font-normal italic text-muted">{titleValue}</span>
          ) : null}
        </div>
        {editing ? (
        <div className="space-y-3 pl-2">
          <label className="block">
            <span className="text-[10px] uppercase tracking-wider text-muted">Title</span>
            <input
              value={titleValue}
              disabled={disabled}
              onChange={(event) => setTitleValue(event.target.value)}
              onBlur={() => commit()}
              className="mt-0.5 w-full rounded border border-line bg-ink px-2 py-1 text-sm text-parchment outline-none focus:border-amber disabled:opacity-50"
            />
          </label>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-muted">Clip</span>
            <p className="mt-0.5 text-[11px] text-muted">Local campaign file (.mp4, .webm, .mov).</p>
            <div className="mt-1 flex flex-wrap items-center gap-1">
              <select
                disabled={disabled || busy || videoActive}
                value={refValue ?? ''}
                onChange={(event) => {
                  const value = event.target.value || null
                  setRefValue(value)
                  commit({ videoRef: value })
                }}
                className="min-w-0 flex-1 rounded border border-line bg-ink px-1 py-1 text-[11px] text-parchment outline-none focus:border-amber disabled:opacity-50"
              >
                <option value="">Choose video…</option>
                {refValue && !known ? <option value={refValue}>{refValue}</option> : null}
                {videos.map((clip) => (
                  <option key={clip.relativePath} value={clip.relativePath}>
                    {clip.relativePath}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={disabled || busy || videoActive || !onLoadVideo}
                onClick={() => void loadVideo()}
                className="rounded border border-line px-2 py-0.5 text-[11px] hover:border-amber disabled:text-muted"
              >
                {busy ? 'Saving…' : 'Load video…'}
              </button>
            </div>
          </div>
          <label className="flex items-center gap-2 text-[12px] text-parchment">
            <input
              type="checkbox"
              checked={muteValue}
              disabled={disabled || videoActive}
              onChange={(event) => {
                const next = event.target.checked
                setMuteValue(next)
                commit({ muted: next })
              }}
            />
            Mute clip audio (keep mood music)
          </label>
        </div>
        ) : (
          <div className="space-y-2 pl-2">
            <p className="text-sm text-parchment">{refValue?.split(/[\\/]/).pop() ?? 'No video selected'}</p>
            {muteValue ? <p className="text-[11px] text-muted">Muted on player</p> : null}
          </div>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2 pl-2">
          {videoActive ? (
            <button
              type="button"
              onClick={() => onStop?.()}
              disabled={!onStop}
              className="rounded border border-line px-2.5 py-1 text-xs font-semibold hover:border-amber disabled:text-muted"
            >
              Stop
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                const fields = { title: titleValue, videoRef: refValue, muted: muteValue }
                onChange(fields)
                onPlay?.(fields)
              }}
              disabled={!canPlay || !onPlay}
              className="rounded bg-amber px-2.5 py-1 text-xs font-semibold text-on-amber disabled:bg-line disabled:text-muted"
            >
              Play
            </button>
          )}
          {!canPlay ? <span className="text-[11px] text-muted">Pick a video file</span> : null}
        </div>
      </div>
    </section>
  )
}
