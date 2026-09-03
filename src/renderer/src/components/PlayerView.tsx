import { useEffect, useMemo, useRef, useState } from 'react'
import type { PlayerMapView, PlayerState } from '../../../shared/types'
import { decodeFog } from '../lib/mapFog'
import MapStage from './MapStage'
import MapTokenMark from './MapTokenMark'
import OpeningCrawl from './OpeningCrawl'
import OpeningLegend from './OpeningLegend'
import OpeningGallery from './OpeningGallery'
import OpeningVideo from './OpeningVideo'
import OpeningPhone from './OpeningPhone'
import OpeningHyperspace from './OpeningHyperspace'
import OpeningBoxOfDoom from './OpeningBoxOfDoom'
import OpeningDiceShow from './OpeningDiceShow'
import { playerInitiativeVisible } from '../../../shared/playerInitiative'

const FADE_MS = 5000

interface Layer {
  id: number
  src: string
  fromBlack?: boolean
  mapView?: PlayerMapView | null
}

export default function PlayerView({
  state,
  compact,
  suppressSound
}: {
  state: PlayerState
  compact?: boolean
  suppressSound?: boolean
}) {
  const incoming = state.imageSrc
  const nextId = useRef(1)
  const [layers, setLayers] = useState<Layer[]>([])
  const [clearing, setClearing] = useState(false)
  const [handoutScene, setHandoutScene] = useState<{
    id: number
    handout: NonNullable<PlayerState['handout']>
    fromBlack: boolean
    fadingOut: boolean
  } | null>(null)
  const handoutKey = state.handout
    ? `${state.handout.title}\0${state.handout.subtitle ?? ''}\0${state.handout.body ?? ''}\0${
        state.handout.includeSecrets ? '1' : '0'
      }\0${(state.handout.facts ?? []).map((f) => `${f.label}:${f.value}`).join('\n')}`
    : ''

  useEffect(() => {
    if (!incoming) {
      setClearing(true)
      const t = window.setTimeout(() => {
        setLayers([])
        setClearing(false)
      }, FADE_MS)
      return () => clearTimeout(t)
    }

    setClearing(false)
    setLayers((prev) => {
      const last = prev.at(-1)
      if (last?.src === incoming) {
        return prev.map((layer, index) =>
          index === prev.length - 1 ? { ...layer, mapView: state.mapView ?? null } : layer
        )
      }
      const layer: Layer = {
        id: nextId.current++,
        src: incoming,
        fromBlack: prev.length === 0,
        mapView: state.mapView ?? null
      }
      return [...prev.slice(-1), layer]
    })
  }, [incoming, state.mapView])

  const lastLayerId = layers.at(-1)?.id
  const layerCount = layers.length
  useEffect(() => {
    if (layerCount <= 1) return
    const t = window.setTimeout(() => {
      setLayers((prev) => prev.slice(-1))
    }, FADE_MS)
    return () => clearTimeout(t)
  }, [lastLayerId, layerCount])

  useEffect(() => {
    const next = state.handout
    if (!next || state.crawl || state.legend || state.gallery || state.video || state.phone || state.hyperspace) {
      setHandoutScene((prev) => {
        if (!prev || prev.fadingOut) return prev
        return { ...prev, fadingOut: true }
      })
      return
    }
    setHandoutScene((prev) => {
      const same =
        prev &&
        !prev.fadingOut &&
        prev.handout.title === next.title &&
        prev.handout.subtitle === next.subtitle &&
        prev.handout.body === next.body &&
        prev.handout.includeSecrets === next.includeSecrets &&
        JSON.stringify(prev.handout.facts ?? []) === JSON.stringify(next.facts ?? [])
      if (same) return prev
      return {
        id: nextId.current++,
        handout: next,
        fromBlack: true,
        fadingOut: false
      }
    })
  }, [handoutKey, state.crawl, state.legend, state.gallery, state.video, state.phone, state.hyperspace, state.handout])

  useEffect(() => {
    if (!handoutScene?.fadingOut) return
    const t = window.setTimeout(() => {
      setHandoutScene((prev) => (prev?.fadingOut ? null : prev))
    }, FADE_MS)
    return () => clearTimeout(t)
  }, [handoutScene?.id, handoutScene?.fadingOut])

  const showInit = playerInitiativeVisible(state)

  const splitForHandout = Boolean(handoutScene && !handoutScene.fadingOut)
  const handoutOnly = splitForHandout && !incoming && layers.length === 0

  return (
    <div
      className={`player-stage${compact ? ' player-stage-compact' : ''}${
        splitForHandout && !handoutOnly ? ' has-handout' : ''
      }${handoutOnly ? ' handout-only' : ''}`}
    >
      {layers.map((layer, index) => {
        const top = index === layers.length - 1
        const fadeIn = top && !clearing && (index > 0 || Boolean(layer.fromBlack))
        const fadeOut = top && clearing
        return (
          <div
            key={layer.id}
            className={`player-layer${fadeIn ? ' player-fade-in' : ''}${fadeOut ? ' player-fade-out' : ''}`}
          >
            {layer.mapView ? (
              <PlayerMapLayer src={layer.src} mapView={layer.mapView} />
            ) : (
              <img src={layer.src} alt="" />
            )}
          </div>
        )
      })}
      {state.crawl ? <OpeningCrawl crawl={state.crawl} /> : null}
      {state.legend ? <OpeningLegend legend={state.legend} /> : null}
      {state.gallery ? <OpeningGallery gallery={state.gallery} /> : null}
      {state.video ? <OpeningVideo video={state.video} /> : null}
      {state.phone ? <OpeningPhone phone={state.phone} /> : null}
      {state.hyperspace ? <OpeningHyperspace jump={state.hyperspace} /> : null}
      {state.boxOfDoom ? <OpeningBoxOfDoom roll={state.boxOfDoom} suppressSound={suppressSound} /> : null}
      {state.diceShow ? <OpeningDiceShow show={state.diceShow} /> : null}
      {handoutScene ? (
        <aside
          key={handoutScene.id}
          className={`player-handout${
            handoutScene.fadingOut
              ? ' player-fade-out'
              : handoutScene.fromBlack
                ? ' player-fade-in'
                : ''
          }`}
          aria-label={handoutScene.handout.title}
        >
          <h2 className="player-handout-title">{handoutScene.handout.title}</h2>
          {handoutScene.handout.subtitle ? (
            <p className="player-handout-sub">{handoutScene.handout.subtitle}</p>
          ) : null}
          {handoutScene.handout.facts && handoutScene.handout.facts.length > 0 ? (
            <dl className="player-handout-facts">
              {handoutScene.handout.facts.map((fact) => (
                <div key={fact.label} className="player-handout-fact">
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {handoutScene.handout.body ? (
            <div className="player-handout-body">
              {handoutScene.handout.body.split(/\n{2,}/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          ) : null}
        </aside>
      ) : null}
      {showInit ? (
        <div className="player-init" aria-label="Initiative order">
          <div className="player-init-round">
            {state.initiativeRound && state.initiativeRound > 0 ? `Round ${state.initiativeRound}` : 'Initiative'}
          </div>
          <ol className="player-init-list">
            {state.initiative.map((entry) => (
              <li
                key={entry.id}
                className={`player-init-item${entry.active ? ' is-turn' : ''}${
                  entry.condition === 'dead'
                    ? ' is-dead'
                    : entry.condition === 'unconscious' || entry.condition === 'dying'
                      ? ' is-unconscious'
                      : entry.condition === 'bloodied' || entry.condition === 'wounded' || entry.bloodied
                        ? ' is-bloodied'
                        : ''
                }`}
              >
                <span className="player-init-name">{entry.name}</span>
                {entry.active ? <span className="player-init-tag">Turn</span> : null}
                {entry.overlayTags && entry.overlayTags.length > 0
                  ? entry.overlayTags.map((tag) => (
                      <span
                        key={tag.label}
                        className={`player-init-tag${tag.tone === 'blood' ? ' is-blood' : ''}`}
                      >
                        {tag.label}
                      </span>
                    ))
                  : (
                    <>
                      {entry.condition === 'dead' ? <span className="player-init-tag is-blood">Dead</span> : null}
                      {entry.condition === 'unconscious' ? (
                        <span className="player-init-tag is-blood">Unconscious</span>
                      ) : null}
                      {entry.condition === 'dying' ? <span className="player-init-tag is-blood">Dying</span> : null}
                      {entry.condition === 'wounded' ? <span className="player-init-tag is-blood">Wounded</span> : null}
                      {entry.condition === 'bloodied' || (entry.bloodied && !entry.condition) ? (
                        <span className="player-init-tag is-blood">Bloodied</span>
                      ) : null}
                    </>
                  )}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  )
}

function PlayerMapLayer({ src, mapView }: { src: string; mapView: PlayerMapView }) {
  const camera = {
    zoom: mapView.zoom,
    centerX: mapView.centerX,
    centerY: mapView.centerY
  }
  const fogCells = useMemo(
    () => (mapView.fog ? decodeFog(mapView.fog, mapView.fogSize) : null),
    [mapView.fog, mapView.fogSize]
  )
  return (
    <MapStage
      src={src}
      camera={camera}
      fogCells={fogCells}
      fogOpacity={1}
      fogOnTop
      underlay={(mapView.tokens ?? []).map((token) => (
        <MapTokenMark key={token.id} token={token} />
      ))}
    />
  )
}
