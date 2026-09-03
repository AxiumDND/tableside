import { useEffect, useRef } from 'react'
import type { PlayerVideo } from '../../../shared/types'
import { useAudioOutput } from '../hooks/useAudioOutput'
import { applyAudioSink } from '../lib/audioSink'

export default function OpeningVideo({ video }: { video: PlayerVideo }) {
  const ref = useRef<HTMLVideoElement>(null)
  const outputDeviceId = useAudioOutput()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.load()
    void applyAudioSink(el, outputDeviceId)
      .then(() => el.play())
      .catch(() => undefined)
  }, [outputDeviceId, video.src, video.startedAt])

  return (
    <div className="opening-video" aria-label={video.title || 'Video'}>
      <video
        ref={ref}
        className="opening-video-el"
        src={video.src}
        muted={video.muted}
        playsInline
        autoPlay
        controls={false}
      />
      {video.title ? <div className="opening-video-caption">{video.title}</div> : null}
    </div>
  )
}
