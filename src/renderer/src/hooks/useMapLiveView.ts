import { useEffect, useRef, type MutableRefObject } from 'react'
import type { Combatant, PlayerMapView } from '../../../shared/types'
import type { CampaignImage } from '../lib/images'
import type { MapCamera } from '../lib/mapCamera'
import { TOKEN_SCALE_DEFAULT, type MapNoteData, type MapToken } from '../lib/mapNote'
import { liveView } from '../components/MapViewHelpers'

/**
 * Throttles the player-window map broadcast to one rAF per change burst.
 * Reads camera/fog/tokens/drag from refs so the payload is the latest frame,
 * not the render that scheduled it.
 */
export function useMapLiveView(opts: {
  imagePath: string | null
  onLiveView?: (imagePath: string, view: PlayerMapView) => void
  camera: MapCamera
  cameraRef: MutableRefObject<MapCamera>
  fogRef: MutableRefObject<Uint8Array>
  fogTick: number
  dataRef: MutableRefObject<MapNoteData | null>
  images: CampaignImage[]
  tokens: MapToken[] | undefined
  tokenScale: number | undefined
  scaleDraft: number | null
  scaleDraftRef: MutableRefObject<number | null>
  dragPos: { id: string; x: number; y: number } | null
  dragPosRef: MutableRefObject<{ id: string; x: number; y: number } | null>
  hideBundled?: boolean
  combatants?: Combatant[]
  system?: string | null
  combatSignature?: string
}): void {
  const {
    imagePath,
    onLiveView,
    camera,
    cameraRef,
    fogRef,
    fogTick,
    dataRef,
    images,
    tokens,
    tokenScale,
    scaleDraft,
    scaleDraftRef,
    dragPos,
    dragPosRef,
    hideBundled = false,
    combatants = [],
    system,
    combatSignature = ''
  } = opts

  const liveTimer = useRef<number | null>(null)
  const onLiveViewRef = useRef(onLiveView)
  const imagePathRef = useRef(imagePath)
  const imagesRef = useRef(images)
  const hideBundledRef = useRef(hideBundled)
  const combatantsRef = useRef(combatants)
  const systemRef = useRef(system)
  onLiveViewRef.current = onLiveView
  imagePathRef.current = imagePath
  imagesRef.current = images
  hideBundledRef.current = hideBundled
  combatantsRef.current = combatants
  systemRef.current = system

  useEffect(() => {
    if (!imagePathRef.current || !onLiveViewRef.current) return
    if (liveTimer.current) window.cancelAnimationFrame(liveTimer.current)
    liveTimer.current = window.requestAnimationFrame(() => {
      const path = imagePathRef.current
      const send = onLiveViewRef.current
      if (!path || !send) return
      send(
        path,
        liveView(
          cameraRef.current,
          fogRef.current,
          dataRef.current?.tokens ?? [],
          imagesRef.current,
          scaleDraftRef.current ?? dataRef.current?.tokenScale ?? TOKEN_SCALE_DEFAULT,
          dragPosRef.current,
          hideBundledRef.current,
          combatantsRef.current,
          systemRef.current
        )
      )
    })
  }, [imagePath, camera, fogTick, tokens, tokenScale, dragPos, scaleDraft, hideBundled, combatSignature, cameraRef, fogRef, dataRef, scaleDraftRef, dragPosRef])

  useEffect(() => {
    return () => {
      if (liveTimer.current) window.cancelAnimationFrame(liveTimer.current)
    }
  }, [])
}
