import { useEffect, useRef } from 'react'
import type { PlayerVideo } from '../../../shared/types'

export default function OpeningVideo({ video }: { video: PlayerVideo }) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.load()
    void el.play().catch(() => undefined)
  }, [video.startedAt, video.src])

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
