import { useEffect, useState } from 'react'
import type { PlayerGallery } from '../../../shared/types'

export default function OpeningGallery({ gallery }: { gallery: PlayerGallery }) {
  const slide = gallery.slides[gallery.index]
  const [visible, setVisible] = useState(true)
  const [shownSrc, setShownSrc] = useState(slide?.src ?? '')

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
    return <div className="opening-gallery" aria-label="Gallery" />
  }

  return (
    <div className="opening-gallery" aria-label={gallery.title || 'Gallery'}>
      <img
        key={shownSrc}
        src={shownSrc}
        alt=""
        className={`opening-gallery-slide${visible ? ' is-in' : ' is-out'}`}
      />
      {gallery.title ? (
        <div className="opening-gallery-caption">
          <span>{gallery.title}</span>
          <span className="opening-gallery-count">
            {gallery.index + 1} / {gallery.slides.length}
          </span>
        </div>
      ) : (
        <div className="opening-gallery-caption opening-gallery-caption-only">
          <span className="opening-gallery-count">
            {gallery.index + 1} / {gallery.slides.length}
          </span>
        </div>
      )}
    </div>
  )
}
