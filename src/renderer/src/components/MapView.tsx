import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import type { PlayerMapView } from '../../../shared/types'
import { campaignFileUrl, resolveImageRef, type CampaignImage } from '../lib/images'
import { useMapCamera } from '../hooks/useMapCamera'
import { useMapFog } from '../hooks/useMapFog'
import { useMapLiveView } from '../hooks/useMapLiveView'
import { useCreatureSpaces } from '../hooks/useCreatureSpaces'
import { useMapTokens, type MapTokens } from '../hooks/useMapTokens'
import { useMapPins, type MapPins } from '../hooks/useMapPins'
import { cellFromSpan, clampScaleFeet, FEET_PER_SQUARE, imageAspect, snapTokenPoint } from '../lib/mapGrid'
import {
  clampMeasureFeet,
  MEASURE_FEET_DEFAULT,
  measureShape,
  type MeasureKind
} from '../lib/mapMeasure'
import {
  TOKEN_SCALE_DEFAULT,
  extractMapNote,
  mapHeadings,
  mapOverviewMarkdown,
  mapRoomMarkdown,
  replaceMapFence,
  tokenDiameter,
  toPlayerMapToken,
  type CreatureSpace,
  type MapNoteData
} from '../lib/mapNote'
import { type CampaignNote } from '../lib/notes'
import MapGridOverlay from './MapGridOverlay'
import MapMeasureOverlay from './MapMeasureOverlay'
import MapStage, { imagePointFromElement } from './MapStage'
import MapTokenMark from './MapTokenMark'
import {
  catalogFromNotes,
  primaryTool,
  type MapTool
} from './MapViewHelpers'
import {
  MapFogToolbar,
  MapPanToolbar,
  MapPinEditorForm,
  MapPinToolbar,
  MapPrimaryToolbar,
  MapTokenPickerPanel,
  MapTokenToolbar
} from './MapViewPanels'

export default function MapView({
  markdown,
  path,
  images,
  notes = [],
  renderRoom,
  onChange,
  onLiveView
}: {
  markdown: string
  path: string
  images: CampaignImage[]
  notes?: CampaignNote[]
  renderRoom: (markdown: string) => ReactNode
  onChange: (next: string) => void
  onLiveView?: (imagePath: string, view: PlayerMapView) => void
}) {
  const data = useMemo(() => extractMapNote(markdown), [markdown])
  const imagePath = data?.image ? resolveImageRef(data.image, path, images) : null
  const paneRef = useRef<HTMLDivElement | null>(null)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const [tool, setTool] = useState<MapTool>('pan')
  const [dragPos, setDragPos] = useState<{ id: string; x: number; y: number } | null>(null)
  const [scaleArmed, setScaleArmed] = useState(false)
  const [scaleFeet, setScaleFeet] = useState(FEET_PER_SQUARE)
  const [scaleFirst, setScaleFirst] = useState<{ x: number; y: number } | null>(null)
  const [scaleHover, setScaleHover] = useState<{ x: number; y: number } | null>(null)
  const [imageSize, setImageSize] = useState<{ w: number; h: number } | null>(null)
  const [measureKind, setMeasureKind] = useState<MeasureKind | null>(null)
  const [measureFeet, setMeasureFeet] = useState(MEASURE_FEET_DEFAULT)
  const [measureOrigin, setMeasureOrigin] = useState<{ x: number; y: number } | null>(null)
  const [measureAim, setMeasureAim] = useState<{ x: number; y: number } | null>(null)
  const toolRef = useRef(tool)
  const scaleArmedRef = useRef(scaleArmed)
  const measureKindRef = useRef(measureKind)
  const measureDrag = useRef(false)
  const pinDrag = useRef<{ id: string; moved: boolean } | null>(null)
  const tokenDrag = useRef<{ id: string; moved: boolean } | null>(null)
  const dragPosRef = useRef<{ id: string; x: number; y: number } | null>(null)
  const onChangeRef = useRef(onChange)
  const dataRef = useRef(data)
  const markdownRef = useRef(markdown)
  const catalog = useMemo(() => catalogFromNotes(notes, images), [notes, images])
  const catalogRef = useRef(catalog)

  toolRef.current = tool
  scaleArmedRef.current = scaleArmed
  measureKindRef.current = measureKind
  onChangeRef.current = onChange
  dataRef.current = data
  catalogRef.current = catalog
  markdownRef.current = markdown

  const fogApiRef = useRef<ReturnType<typeof useMapFog> | null>(null)
  const tokensApiRef = useRef<MapTokens | null>(null)

  const {
    camera,
    cameraRef,
    setZoom,
    fit,
    reset: resetCamera,
    panRef,
    beginPan,
    movePan,
    endPan
  } = useMapCamera({
    paneRef,
    contentRef,
    viewportRef,
    onShiftWheel: (event) => {
      if (toolRef.current === 'fog' || toolRef.current === 'reveal') {
        fogApiRef.current?.bumpBrush(event.deltaY < 0 ? 1 : -1)
        return true
      }
      if (scaleArmedRef.current) {
        const current = dataRef.current
        const tokens = tokensApiRef.current
        if (!current || !tokens) return true
        const base = tokens.scaleDraftRef.current ?? current.tokenScale ?? TOKEN_SCALE_DEFAULT
        tokens.applyScaleNow(base + (event.deltaY < 0 ? 0.002 : -0.002))
        return true
      }
      if (measureKindRef.current) {
        setMeasureFeet((feet) => clampMeasureFeet(feet + (event.deltaY < 0 ? 5 : -5)))
        return true
      }
      return false
    }
  })

  const fog = useMapFog({ getZoom: () => cameraRef.current.zoom, onCommit: () => persistFog() })
  fogApiRef.current = fog

  const { spaceBySource, setSpaceBySource } = useCreatureSpaces({
    path,
    tool,
    dataRef,
    catalogRef,
    persistTokenSpaces: (tokens) =>
      onChangeRef.current(replaceMapFence(markdownRef.current, withCurrentFog({ tokens })))
  })

  const pinsApiRef = useRef<MapPins | null>(null)
  const tokens = useMapTokens({
    tokens: data?.tokens ?? [],
    tokenScale: data?.tokenScale,
    dataRef,
    catalog,
    spaceBySource,
    setSpaceBySource,
    persist: (partial) => onChangeRef.current(replaceMapFence(markdownRef.current, withCurrentFog(partial))),
    onDeselectPins: () => pinsApiRef.current?.setSelectedId(null)
  })
  tokensApiRef.current = tokens

  const headings = useMemo(() => mapHeadings(markdown), [markdown])
  const pins = useMapPins({
    pins: data?.pins ?? [],
    pinsLocked: data?.pinsLocked ?? true,
    headings,
    tool,
    tokenSelected: Boolean(tokens.selectedToken),
    dataRef,
    getMarkdown: () => markdownRef.current,
    persist: (partial, source) =>
      onChangeRef.current(replaceMapFence(source ?? markdownRef.current, withCurrentFog(partial))),
    onEnterPinTool: () => {
      setTool('pin')
      tokens.setPendingToken(null)
    }
  })
  pinsApiRef.current = pins
  const selected = pins.selected
  const roomText = selected
    ? mapRoomMarkdown(markdown, selected.heading) ??
      `No heading yet for **${selected.heading || selected.label}**. Edit the note to add \`## ${selected.heading || selected.label}\`.`
    : mapOverviewMarkdown(markdown)

  useMapLiveView({
    imagePath,
    onLiveView,
    camera,
    cameraRef,
    fogRef: fog.fogRef,
    fogTick: fog.fogTick,
    dataRef,
    images,
    tokens: data?.tokens,
    tokenScale: data?.tokenScale,
    scaleDraft: tokens.scaleDraft,
    scaleDraftRef: tokens.scaleDraftRef,
    dragPos,
    dragPosRef
  })

  useEffect(() => {
    fog.reset(data)
    resetCamera()
    setTool('pan')
    setScaleArmed(false)
    setScaleFirst(null)
    setScaleHover(null)
    setMeasureKind(null)
    setMeasureOrigin(null)
    setMeasureAim(null)
    measureDrag.current = false
    tokensApiRef.current?.reset()
    pinsApiRef.current?.reset()
    // Re-seed fog and reset the view only when the open map (path/image) changes.
    // Including data.fog / data.fogSize here would wipe fog mid-paint on every edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, data?.image])

  useEffect(() => {
    if (!scaleArmed && !measureKind) return
    function onKey(event: KeyboardEvent): void {
      if (event.key !== 'Escape') return
      setScaleArmed(false)
      setScaleFirst(null)
      setScaleHover(null)
      setMeasureKind(null)
      setMeasureOrigin(null)
      setMeasureAim(null)
      measureDrag.current = false
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [scaleArmed, measureKind])

  useEffect(() => {
    if (tool !== 'fog' && tool !== 'reveal' && tool !== 'token') fogApiRef.current?.setBrushPos(null)
  }, [tool])

  function commit(next: MapNoteData, source = markdown): void {
    onChange(replaceMapFence(source, next))
  }

  function withCurrentFog(partial: Partial<MapNoteData>): MapNoteData {
    const current = dataRef.current
    return {
      image: current?.image ?? '',
      pins: current?.pins ?? [],
      tokens: current?.tokens ?? [],
      tokenScale: current?.tokenScale ?? TOKEN_SCALE_DEFAULT,
      pinsLocked: current?.pinsLocked ?? true,
      ...partial,
      ...(fogApiRef.current?.fields() ?? { fog: '', fogSize: 0 })
    }
  }

  function persistFog(): void {
    if (!data) return
    commit(withCurrentFog({}))
  }

  function pointFromEvent(event: { clientX: number; clientY: number }): { x: number; y: number } | null {
    return imagePointFromElement(contentRef.current, event.clientX, event.clientY)
  }

  function snapPoint(point: { x: number; y: number }, space: CreatureSpace): { x: number; y: number } {
    return snapTokenPoint(point.x, point.y, tokens.tokenScale, space, imageAspect(imageSize))
  }

  function cancelScale(): void {
    setScaleArmed(false)
    setScaleFirst(null)
    setScaleHover(null)
  }

  function cancelMeasure(): void {
    measureDrag.current = false
    setMeasureKind(null)
    setMeasureOrigin(null)
    setMeasureAim(null)
  }

  function selectMeasure(kind: MeasureKind): void {
    cancelScale()
    if (measureKind === kind) {
      cancelMeasure()
      return
    }
    setMeasureKind(kind)
    setMeasureOrigin(null)
    setMeasureAim(null)
  }

  function applyScaleFromSpan(a: { x: number; y: number }, b: { x: number; y: number }): void {
    tokens.applyScaleNow(cellFromSpan(a, b, clampScaleFeet(scaleFeet), imageAspect(imageSize)))
    cancelScale()
  }

  function selectPrimary(next: 'pan' | 'pin' | 'token' | 'fog'): void {
    if (next !== 'pan') {
      cancelScale()
      cancelMeasure()
    }
    if (next !== 'token') tokens.setPendingToken(null)
    if (next !== 'pin') pins.setDraft(null)
    if (next === 'pin') {
      setTool('pin')
      if (tool !== 'pin') {
        const empty = (data?.pins.length ?? 0) === 0
        if (empty) pins.startAddPin()
        else if (data?.pinsLocked !== false) pins.setPinAction('view')
        else pins.setPinAction('edit')
      }
      return
    }
    if (next === 'fog') {
      if (tool !== 'reveal') setTool('fog')
      return
    }
    setTool(next)
  }

  function onBoardPointerDown(event: ReactPointerEvent<HTMLDivElement>): void {
    if (scaleArmed && event.button === 0 && !event.altKey) {
      event.preventDefault()
      const point = pointFromEvent(event)
      if (!point) return
      if (!scaleFirst) {
        setScaleFirst(point)
        setScaleHover(point)
        return
      }
      applyScaleFromSpan(scaleFirst, point)
      return
    }
    if (measureKind && event.button === 0 && !event.altKey) {
      event.preventDefault()
      const point = pointFromEvent(event)
      if (!point) return
      measureDrag.current = true
      setMeasureOrigin(point)
      setMeasureAim(point)
      event.currentTarget.setPointerCapture(event.pointerId)
      return
    }
    if (event.button === 1 || event.altKey || (tool === 'pan' && event.button === 0)) {
      event.preventDefault()
      beginPan(event.clientX, event.clientY)
      event.currentTarget.setPointerCapture(event.pointerId)
      return
    }
    if (tool === 'fog' || tool === 'reveal') {
      event.preventDefault()
      const point = pointFromEvent(event)
      if (!point) return
      fog.setBrushPos(point)
      fog.paintRef.current = tool === 'fog' ? 1 : 0
      event.currentTarget.setPointerCapture(event.pointerId)
      fog.stamp(point, fog.paintRef.current)
      return
    }
    if (tool === 'token' && event.button === 0) {
      const point = pointFromEvent(event)
      if (point && tokens.pendingToken) {
        const snapped = snapPoint(point, tokens.pendingToken.space)
        fog.setBrushPos(snapped)
        tokens.addToken(snapped)
        return
      }
      if (point) fog.setBrushPos(point)
      return
    }
    if (tool === 'pin' && pins.pinAction === 'add' && event.button === 0) {
      const current = dataRef.current
      if ((current?.pinsLocked ?? true) && (current?.pins.length ?? 0) > 0) return
      const point = pointFromEvent(event)
      if (point) pins.setDraft(point)
    }
  }

  function onBoardPointerMove(event: ReactPointerEvent<HTMLDivElement>): void {
    if (scaleArmed) {
      const hover = pointFromEvent(event)
      if (hover) setScaleHover(hover)
    }
    if (measureKind && measureOrigin && measureDrag.current) {
      const hover = pointFromEvent(event)
      if (hover) setMeasureAim(hover)
    }
    if (tool === 'fog' || tool === 'reveal' || (tool === 'token' && tokens.pendingToken)) {
      const hover = pointFromEvent(event)
      if (hover) {
        fog.setBrushPos(
          tool === 'token' && tokens.pendingToken ? snapPoint(hover, tokens.pendingToken.space) : hover
        )
      }
    }
    if (panRef.current) {
      movePan(event.clientX, event.clientY)
      return
    }
    if (fog.paintRef.current === null) return
    const point = pointFromEvent(event)
    if (point) fog.stamp(point, fog.paintRef.current)
  }

  function onBoardPointerUp(): void {
    measureDrag.current = false
    endPan()
    if (fog.paintRef.current !== null) {
      fog.paintRef.current = null
      persistFog()
    }
  }

  function onBoardPointerLeave(): void {
    if (fog.paintRef.current === null) fog.setBrushPos(null)
    if (!scaleArmed) setScaleHover(null)
    onBoardPointerUp()
  }

  const primary = primaryTool(tool)
  const pinsLocked = data?.pinsLocked ?? true
  const pinCount = data?.pins.length ?? 0
  const canAddPin = !pinsLocked || pinCount === 0
  const canEditPins = !pinsLocked && pinCount > 0
  const tokensLocked = tool === 'fog' || tool === 'reveal' || tool === 'pin'
  const placingOnBoard = scaleArmed || Boolean(measureKind)
  const scaleHint = scaleArmed
    ? scaleFirst
      ? `Click the second point (${clampScaleFeet(scaleFeet)} ft)`
      : `Click two points that are ${clampScaleFeet(scaleFeet)} ft apart`
    : measureKind === 'round'
      ? `Click the center (${clampMeasureFeet(measureFeet)} ft radius)`
      : measureKind === 'cone'
        ? `Click origin, drag to aim (${clampMeasureFeet(measureFeet)} ft cone)`
        : measureKind === 'line'
          ? `Click origin, drag to aim (${clampMeasureFeet(measureFeet)} ft line)`
          : 'Drag to pan · Scale map sets 5 ft squares'
  const cursor =
    panRef.current
      ? 'grabbing'
      : scaleArmed || measureKind
        ? 'crosshair'
        : tool === 'pan'
          ? 'grab'
          : (tool === 'pin' && (pins.pinAction === 'add' || pins.pinAction === 'delete')) ||
              tool === 'fog' ||
              tool === 'reveal' ||
              (tool === 'token' && tokens.pendingToken)
            ? 'crosshair'
            : 'default'

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <MapPrimaryToolbar primary={primary} onSelectPrimary={selectPrimary} />

      {primary === 'pan' ? (
        <MapPanToolbar
          zoom={camera.zoom}
          scaleArmed={scaleArmed}
          scaleFeet={scaleFeet}
          scaleHint={scaleHint}
          measureKind={measureKind}
          measureFeet={measureFeet}
          onZoomChange={setZoom}
          onFit={fit}
          onToggleScale={() => {
            cancelMeasure()
            if (scaleArmed) cancelScale()
            else {
              setScaleArmed(true)
              setScaleFirst(null)
            }
          }}
          onScaleFeetChange={setScaleFeet}
          onMeasureKind={selectMeasure}
          onMeasureFeetChange={(feet) => setMeasureFeet(clampMeasureFeet(feet))}
        />
      ) : null}

      {primary === 'pin' ? (
        <MapPinToolbar
          pinAction={pins.pinAction}
          pinsLocked={pinsLocked}
          pinCount={pinCount}
          canAddPin={canAddPin}
          canEditPins={canEditPins}
          selected={selected}
          onStartAddPin={pins.startAddPin}
          onStartEditPin={pins.startEditPin}
          onStartDeletePin={pins.startDeletePin}
          onTogglePinLock={pins.togglePinLock}
        />
      ) : null}

      {primary === 'token' ? (
        <div className="flex flex-col gap-1.5 border-b border-line bg-panel px-3 py-1.5">
          <MapTokenToolbar
            pendingToken={tokens.pendingToken}
            selectedTokenId={tokens.selectedTokenId}
            onDeleteToken={tokens.deleteToken}
          />
          <MapTokenPickerPanel
            pickerTab={tokens.pickerTab}
            tokenQuery={tokens.tokenQuery}
            catalog={catalog}
            filteredPicks={tokens.filteredPicks}
            pendingToken={tokens.pendingToken}
            onPickerTabChange={tokens.setPickerTab}
            onTokenQueryChange={tokens.setTokenQuery}
            onPickToken={tokens.pickToken}
          />
        </div>
      ) : null}

      {primary === 'fog' ? (
        <MapFogToolbar
          tool={tool}
          brushSize={fog.brushSize}
          onToolChange={setTool}
          onBrushSizeChange={fog.setBrushSize}
          onCoverAll={fog.coverAll}
          onClearFog={fog.clearFog}
        />
      ) : null}

      <div ref={paneRef} className="relative min-h-0 flex-1 bg-ink">
        {imagePath ? (
          <div className="absolute inset-0 p-2">
            <MapStage
              src={campaignFileUrl(imagePath)}
              camera={camera}
              fogCells={fog.fogRef.current}
              fogTick={fog.fogTick}
              fogOpacity={0.72}
              cursor={cursor}
              viewportRef={viewportRef}
              contentRef={contentRef}
              onNaturalSize={setImageSize}
              onPointerDown={onBoardPointerDown}
              onPointerMove={onBoardPointerMove}
              onPointerUp={onBoardPointerUp}
              onPointerLeave={onBoardPointerLeave}
            >
              <MapGridOverlay cell={tokens.tokenScale} aspect={imageAspect(imageSize)} />
              {scaleArmed && scaleFirst ? (
                <svg
                  className="pointer-events-none absolute inset-0 z-[6] h-full w-full"
                  viewBox="0 0 1 1"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <line
                    x1={scaleFirst.x}
                    y1={scaleFirst.y}
                    x2={(scaleHover ?? scaleFirst).x}
                    y2={(scaleHover ?? scaleFirst).y}
                    stroke="rgb(232 201 140 / 0.95)"
                    strokeWidth={0.006}
                    strokeDasharray="0.02 0.015"
                  />
                  <circle cx={scaleFirst.x} cy={scaleFirst.y} r={0.012} fill="rgb(232 201 140)" />
                  {scaleHover ? (
                    <circle cx={scaleHover.x} cy={scaleHover.y} r={0.012} fill="rgb(232 201 140 / 0.7)" />
                  ) : null}
                </svg>
              ) : null}
              {(data?.tokens ?? []).map((token) => {
                const live = dragPos?.id === token.id ? { ...token, x: dragPos.x, y: dragPos.y } : token
                return (
                  <MapTokenMark
                    key={token.id}
                    token={toPlayerMapToken(live, images, tokens.tokenScale)}
                    selected={token.id === tokens.selectedTokenId}
                    interactive={!tokensLocked && !placingOnBoard}
                    onPointerDown={(event) => {
                      if (tokensLocked) return
                      event.preventDefault()
                      event.stopPropagation()
                      tokens.setSelectedTokenId(token.id)
                      pins.setSelectedId(null)
                      tokenDrag.current = { id: token.id, moved: false }
                      event.currentTarget.setPointerCapture(event.pointerId)
                    }}
                    onPointerMove={(event) => {
                      if (!tokenDrag.current || tokenDrag.current.id !== token.id) return
                      const point = pointFromEvent(event)
                      if (!point) return
                      const snapped = snapPoint(point, token.space)
                      tokenDrag.current.moved = true
                      dragPosRef.current = { id: token.id, x: snapped.x, y: snapped.y }
                      setDragPos({ id: token.id, x: snapped.x, y: snapped.y })
                    }}
                    onPointerUp={() => {
                      const active = tokenDrag.current
                      const pos = dragPosRef.current
                      tokenDrag.current = null
                      dragPosRef.current = null
                      if (active?.moved && pos && pos.id === token.id) {
                        tokens.moveToken(token.id, pos.x, pos.y)
                      }
                      setDragPos(null)
                    }}
                  />
                )
              })}
              {measureKind && measureOrigin ? (
                <MapMeasureOverlay
                  kind={measureKind}
                  feet={measureFeet}
                  origin={measureOrigin}
                  shape={measureShape(
                    measureKind,
                    measureOrigin,
                    measureAim,
                    measureFeet,
                    tokens.tokenScale,
                    imageAspect(imageSize)
                  )}
                />
              ) : null}
              {tool === 'token' && tokens.pendingToken && fog.brushPos ? (
                <MapTokenMark
                  token={{
                    id: 'ghost',
                    x: fog.brushPos.x,
                    y: fog.brushPos.y,
                    size: tokenDiameter(tokens.tokenScale, tokens.pendingToken.space),
                    label: tokens.pendingToken.label,
                    kind: tokens.pendingToken.kind,
                    imageSrc: tokens.pendingToken.imageSrc
                  }}
                  ghost
                />
              ) : null}
              {(data?.pins ?? []).map((pin) => (
                <button
                  key={pin.id}
                  type="button"
                  title={data?.pinsLocked ? `${pin.heading || pin.label} (locked)` : pin.heading || pin.label}
                  onPointerDown={(event) => {
                    if (tool === 'fog' || tool === 'reveal' || tool === 'token') return
                    event.preventDefault()
                    event.stopPropagation()
                    tokens.setSelectedTokenId(null)
                    if (tool === 'pin' && pins.pinAction === 'delete') {
                      if (!pinsLocked) pins.deletePin(pin.id)
                      return
                    }
                    if (tool === 'pin' && pins.pinAction === 'edit') {
                      pins.fillForm(pin)
                    } else {
                      pins.setSelectedId(pin.id)
                    }
                    if (data?.pinsLocked || (tool === 'pin' && pins.pinAction !== 'edit')) return
                    pinDrag.current = { id: pin.id, moved: false }
                    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
                  }}
                  onPointerMove={(event) => {
                    if (data?.pinsLocked) return
                    if (!pinDrag.current || pinDrag.current.id !== pin.id) return
                    const point = pointFromEvent(event)
                    if (!point) return
                    pinDrag.current.moved = true
                    dragPosRef.current = { id: pin.id, x: point.x, y: point.y }
                    setDragPos({ id: pin.id, x: point.x, y: point.y })
                  }}
                  onPointerUp={() => {
                    const active = pinDrag.current
                    const pos = dragPosRef.current
                    pinDrag.current = null
                    dragPosRef.current = null
                    if (active?.moved && pos && pos.id === pin.id) {
                      pins.movePin(pin.id, pos.x, pos.y)
                    }
                    setDragPos(null)
                  }}
                  className={`absolute z-10 flex h-6 min-w-7 items-center justify-center whitespace-nowrap rounded-full border px-1.5 text-[11px] font-semibold tabular-nums leading-none shadow ${
                    pin.id === pins.selectedId ? 'border-ink bg-amber text-on-amber' : 'border-amber bg-ink/90 text-amber'
                  }`}
                  style={{
                    left: `${(dragPos?.id === pin.id ? dragPos.x : pin.x) * 100}%`,
                    top: `${(dragPos?.id === pin.id ? dragPos.y : pin.y) * 100}%`,
                    transform: 'translate(-50%, -50%) scale(calc(1 / var(--map-scale, 1)))',
                    cursor:
                      tool === 'pin' && pins.pinAction === 'delete'
                        ? 'pointer'
                        : data?.pinsLocked
                          ? 'pointer'
                          : 'grab',
                    pointerEvents:
                      tool === 'fog' || tool === 'reveal' || tool === 'token' || placingOnBoard ? 'none' : 'auto'
                  }}
                >
                  {pin.label}
                </button>
              ))}
              {pins.placing && pins.draft ? (
                <span
                  className="absolute z-10 flex h-6 min-w-7 items-center justify-center whitespace-nowrap rounded-full border border-dashed border-amber px-1.5 text-[11px] font-semibold tabular-nums leading-none text-amber"
                  style={{
                    left: `${pins.draft.x * 100}%`,
                    top: `${pins.draft.y * 100}%`,
                    transform: 'translate(-50%, -50%) scale(calc(1 / var(--map-scale, 1)))'
                  }}
                >
                  {pins.label || '+'}
                </span>
              ) : null}
              {(tool === 'fog' || tool === 'reveal') && fog.brushPos ? (
                <span
                  className="pointer-events-none absolute z-20 rounded-full border border-amber bg-amber/10"
                  style={{
                    left: `${fog.brushPos.x * 100}%`,
                    top: `${fog.brushPos.y * 100}%`,
                    width: `${fog.brushRadiusAt(camera.zoom) * 2 * 100}%`,
                    height: `${fog.brushRadiusAt(camera.zoom) * 2 * 100}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                />
              ) : null}
            </MapStage>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted">
            {data?.image
              ? `Missing map image “${data.image}”. Put it in Maps/Art/ (or next to this note).`
              : 'Set `image:` in the map block, then Edit if you need to type it.'}
          </div>
        )}
      </div>

      {(pins.placing && pins.draft) || (tool === 'pin' && pins.pinAction === 'edit' && selected) ? (
        <MapPinEditorForm
          placing={pins.placing}
          draft={pins.draft}
          label={pins.label}
          heading={pins.heading}
          newHeading={pins.newHeading}
          headings={headings}
          onLabelChange={pins.setLabel}
          onHeadingChange={pins.setHeading}
          onNewHeadingChange={pins.setNewHeading}
          onSubmit={() => {
            if (pins.placing && pins.draft) pins.addPin()
            else pins.savePin()
          }}
        />
      ) : null}

      <div className="max-h-[38%] min-h-24 overflow-auto border-t border-line px-3 py-2">
        <div className="mx-auto max-w-3xl text-sm">
          {tokens.selectedToken ? (
            <p className="mb-2 text-[11px] uppercase tracking-wider text-muted">
              Token {tokens.selectedToken.label}
              {tokens.selectedToken.kind === 'pc' ? ' · player' : tokens.selectedToken.kind === 'monster' ? ' · monster' : ' · npc'}
              {` · ${tokens.selectedToken.space}`}
            </p>
          ) : selected ? (
            <p className="mb-2 text-[11px] uppercase tracking-wider text-muted">
              Pin {selected.label}
              {selected.heading ? ` · ${selected.heading}` : ''}
            </p>
          ) : (
            <p className="mb-2 text-[11px] uppercase tracking-wider text-muted">Map notes</p>
          )}
          {renderRoom(roomText || '_No room text yet. Edit the note to add headings._')}
        </div>
      </div>
    </div>
  )
}
