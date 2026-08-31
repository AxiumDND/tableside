import { useEffect, useState } from 'react'
import type { PlayerGallery } from '../../../shared/types'

export default function OpeningGallery({ gallery }: { gallery: PlayerGallery }) {
  const slide = gallery.slides[gallery.index]
  const stopping = gallery.stoppingAt != null
  const [visible, setVisible] = useState(true)
  const [shownSrc, setShownSrc] = useState(slide?.src ?? '')
  const showTitle = Boolean(gallery.showTitle && gallery.title?.trim())

  useEffect(() => {
    const next = gallery.slides[gallery.index]?.src ?? ''
    if (!next || next === shownSrc) {
      setShownSrc(next)
      setVisible(true)
      return
    }
    setVisible(false)
    const t = window.setTimeout(() => {
      setShownSrc(next)
      setVisible(true)
    }, 280)
    return () => window.clearTimeout(t)
  }, [gallery.index, gallery.slides, shownSrc])

  if (!shownSrc) {
    return <div className={`opening-gallery${stopping ? ' is-done' : ' player-fade-in'}`} aria-label="Gallery" />
  }

  return (
    <div
      className={`opening-gallery${stopping ? ' is-done' : ' player-fade-in'}`}
      aria-label={gallery.title || 'Gallery'}
    >
      <img
        key={shownSrc}
        src={shownSrc}
        alt=""
        className={`opening-gallery-slide${visible ? ' is-in' : ' is-out'}`}
      />
      {showTitle ? (
        <div className="opening-gallery-caption">
          <span>{gallery.title}</span>
        </div>
      ) : null}
    </div>
  )
}
