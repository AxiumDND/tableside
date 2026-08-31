import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import type { PlayerMapView } from '../../../shared/types'
import { campaignFileUrl, resolveImageRef, type CampaignImage } from '../lib/images'
import {
  FIT_CAMERA,
  MAX_ZOOM,
  MIN_ZOOM,
  panCamera,
  zoomCameraAt,
  type MapCamera
} from '../lib/mapCamera'
import { useMapFog } from '../hooks/useMapFog'
import { useCreatureSpaces } from '../hooks/useCreatureSpaces'
import { useMapTokens } from '../hooks/useMapTokens'
import {
  TOKEN_SCALE_DEFAULT,
  ensureHeading,
  extractMapNote,
  mapHeadings,
  mapOverviewMarkdown,
  mapRoomMarkdown,
  nextPinLabel,
  replaceMapFence,
  tokenDiameter,
  toPlayerMapToken,
  uniquePinId,
  type MapNoteData,
  type MapPin
} from '../lib/mapNote'
import { type CampaignNote } from '../lib/notes'
import MapStage, { imagePointFromElement } from './MapStage'
import MapTokenMark from './MapTokenMark'
import {
  catalogFromNotes,
  liveView,
  primaryTool,
  type MapTool,
  type PinAction
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
  const [camera, setCamera] = useState<MapCamera>(FIT_CAMERA)
  const [tool, setTool] = useState<MapTool>('pan')
  const [pinAction, setPinAction] = useState<PinAction>('view')
  const [selectedId, setSelectedId] = useState<string | null>(data?.pins[0]?.id ?? null)
  const [draft, setDraft] = useState<{ x: number; y: number } | null>(null)
  const [label, setLabel] = useState('')
  const [heading, setHeading] = useState('')
  const [newHeading, setNewHeading] = useState('')
  const [dragPos, setDragPos] = useState<{ id: string; x: number; y: number } | null>(null)
  const cameraRef = useRef(camera)
  const toolRef = useRef(tool)
  const panRef = useRef<{ x: number; y: number } | null>(null)
  const pinDrag = useRef<{ id: string; moved: boolean } | null>(null)
  const tokenDrag = useRef<{ id: string; moved: boolean } | null>(null)
  const dragPosRef = useRef<{ id: string; x: number; y: number } | null>(null)
  const liveTimer = useRef<number | null>(null)
  const onLiveViewRef = useRef(onLiveView)
  const onChangeRef = useRef(onChange)
  const dataRef = useRef(data)
  const imagesRef = useRef(images)
  const markdownRef = useRef(markdown)
  const placing = tool === 'pin' && pinAction === 'add'
  const catalog = useMemo(() => catalogFromNotes(notes, images), [notes, images])
  const catalogRef = useRef(catalog)

  cameraRef.current = camera
  toolRef.current = tool
  onLiveViewRef.current = onLiveView
  onChangeRef.current = onChange
  dataRef.current = data
  catalogRef.current = catalog
  imagesRef.current = images
  markdownRef.current = markdown

  const fog = useMapFog({ getZoom: () => cameraRef.current.zoom, onCommit: () => persistFog() })
  const fogApiRef = useRef(fog)
  fogApiRef.current = fog

  const { spaceBySource, setSpaceBySource } = useCreatureSpaces({
    path,
    tool,
    dataRef,
    catalogRef,
    persistTokenSpaces: (tokens) =>
      onChangeRef.current(replaceMapFence(markdownRef.current, withCurrentFog({ tokens })))
  })

  const tokens = useMapTokens({
    tokens: data?.tokens ?? [],
    tokenScale: data?.tokenScale,
    dataRef,
    catalog,
    spaceBySource,
    setSpaceBySource,
    persist: (partial) => onChangeRef.current(replaceMapFence(markdownRef.current, withCurrentFog(partial))),
    onDeselectPins: () => setSelectedId(null)
  })
  const tokensApiRef = useRef(tokens)
  tokensApiRef.current = tokens

  const headings = useMemo(() => mapHeadings(markdown), [markdown])
  const selected = data?.pins.find((pin) => pin.id === selectedId) ?? null
  const roomText = selected
    ? mapRoomMarkdown(markdown, selected.heading) ??
      `No heading yet for **${selected.heading || selected.label}**. Edit the note to add \`## ${selected.heading || selected.label}\`.`
    : mapOverviewMarkdown(markdown)

  const emitLive = useCallback((): void => {
    if (!imagePath || !onLiveViewRef.current) return
    if (liveTimer.current) window.cancelAnimationFrame(liveTimer.current)
    liveTimer.current = window.requestAnimationFrame(() => {
      onLiveViewRef.current?.(
        imagePath,
        liveView(
          cameraRef.current,
          fog.fogRef.current,
          dataRef.current?.tokens ?? [],
          imagesRef.current,
          tokens.scaleDraftRef.current ?? dataRef.current?.tokenScale ?? TOKEN_SCALE_DEFAULT,
          dragPosRef.current
        )
      )
    })
  }, [imagePath, fog.fogRef, tokens.scaleDraftRef])

  useEffect(() => {
    fog.reset(data)
    setCamera(FIT_CAMERA)
    setTool('pan')
    setDraft(null)
    tokensApiRef.current.reset()
    setPinAction('view')
    // Re-seed fog and reset the view only when the open map (path/image) changes.
    // Including data.fog / data.fogSize here would wipe fog mid-paint on every edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, data?.image])

  useEffect(() => {
    emitLive()
  }, [camera, fog.fogTick, emitLive, data?.tokens, data?.tokenScale, dragPos, tokens.scaleDraft])

  useEffect(() => {
    if (tokens.selectedTokenId && data?.tokens.some((token) => token.id === tokens.selectedTokenId)) return
    if (selectedId && data?.pins.some((pin) => pin.id === selectedId)) return
    setSelectedId(data?.pins[0]?.id ?? null)
  }, [data, selectedId, tokens.selectedTokenId])

  useEffect(() => {
    const pane = paneRef.current
    if (!pane) return
    const onWheel = (event: WheelEvent): void => {
      event.preventDefault()
      if (
        event.shiftKey &&
        (toolRef.current === 'fog' || toolRef.current === 'reveal')
      ) {
        fogApiRef.current.bumpBrush(event.deltaY < 0 ? 1 : -1)
        return
      }
      if (event.shiftKey && (toolRef.current === 'token' || (dataRef.current?.tokens.length ?? 0) > 0)) {
        const current = dataRef.current
        if (!current) return
        const base = tokensApiRef.current.scaleDraftRef.current ?? current.tokenScale ?? TOKEN_SCALE_DEFAULT
        tokensApiRef.current.applyScaleNow(base + (event.deltaY < 0 ? 0.005 : -0.005))
        return
      }
      const content = contentRef.current
      const view = viewportRef.current ?? paneRef.current
      const point = imagePointFromElement(content, event.clientX, event.clientY)
      if (!point || !content || !view) return
      const contentRect = content.getBoundingClientRect()
      const paneRect = view.getBoundingClientRect()
      if (contentRect.width <= 0 || paneRect.width <= 0) return
      const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12
      const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, cameraRef.current.zoom * factor))
      setCamera(
        zoomCameraAt(
          cameraRef.current,
          point.x,
          point.y,
          event.clientX,
          event.clientY,
          paneRect,
          contentRect,
          nextZoom
        )
      )
    }
    pane.addEventListener('wheel', onWheel, { passive: false })
    return () => pane.removeEventListener('wheel', onWheel)
  }, [])

  useEffect(() => {
    if (tool !== 'fog' && tool !== 'reveal' && tool !== 'token') fogApiRef.current.setBrushPos(null)
  }, [tool])

  useEffect(() => {
    return () => {
      if (liveTimer.current) window.cancelAnimationFrame(liveTimer.current)
    }
  }, [])

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
      ...fogApiRef.current.fields()
    }
  }

  function persistFog(): void {
    if (!data) return
    commit(withCurrentFog({}))
  }

  function pointFromEvent(event: { clientX: number; clientY: number }): { x: number; y: number } | null {
    return imagePointFromElement(contentRef.current, event.clientX, event.clientY)
  }

  function startAddPin(): void {
    const pins = data?.pins ?? []
    if ((data?.pinsLocked ?? true) && pins.length > 0) return
    setTool('pin')
    setPinAction('add')
    setDraft(null)
    tokens.setPendingToken(null)
    setLabel(nextPinLabel(pins))
    setHeading(headings[0] ?? '')
    setNewHeading('')
  }

  function startEditPin(): void {
    if (data?.pinsLocked !== false || (data.pins.length ?? 0) === 0) return
    setTool('pin')
    setPinAction('edit')
    setDraft(null)
    tokens.setPendingToken(null)
    const pin = data.pins.find((item) => item.id === selectedId) ?? data.pins[0] ?? null
    if (pin) {
      setSelectedId(pin.id)
      setLabel(pin.label)
      setHeading(pin.heading)
      setNewHeading(headings.includes(pin.heading) ? '' : pin.heading)
    }
  }

  function startDeletePin(): void {
    if (data?.pinsLocked !== false || (data.pins.length ?? 0) === 0) return
    setTool('pin')
    setPinAction('delete')
    setDraft(null)
    tokens.setPendingToken(null)
  }

  function selectPrimary(next: 'pan' | 'pin' | 'token' | 'fog'): void {
    if (next !== 'token') tokens.setPendingToken(null)
    if (next !== 'pin') setDraft(null)
    if (next === 'pin') {
      setTool('pin')
      if (tool !== 'pin') {
        const empty = (data?.pins.length ?? 0) === 0
        if (empty) startAddPin()
        else if (data?.pinsLocked !== false) setPinAction('view')
        else setPinAction('edit')
      }
      return
    }
    if (next === 'fog') {
      if (tool !== 'reveal') setTool('fog')
      return
    }
    setTool(next)
  }

  function addPin(): void {
    if (!data || !draft) return
    if (data.pinsLocked && data.pins.length > 0) return
    const headingName = newHeading.trim() || heading.trim() || `Room ${label || nextPinLabel(data.pins)}`
    const pin: MapPin = {
      id: uniquePinId(data.pins, label || headingName),
      x: draft.x,
      y: draft.y,
      label: (label || nextPinLabel(data.pins)).trim(),
      heading: headingName
    }
    const withHeading = ensureHeading(markdown, headingName)
    commit(withCurrentFog({ pins: [...data.pins, pin] }), withHeading)
    setSelectedId(pin.id)
    setDraft(null)
    setLabel(nextPinLabel([...data.pins, pin]))
    setHeading(headings[0] ?? headingName)
    setNewHeading('')
    if (data.pinsLocked && data.pins.length === 0) setPinAction('view')
  }

  function savePin(): void {
    if (!data || !selected || data.pinsLocked) return
    const headingName = newHeading.trim() || heading.trim() || selected.heading
    const nextLabel = label.trim() || selected.label
    commit(
      withCurrentFog({
        pins: data.pins.map((pin) =>
          pin.id === selected.id ? { ...pin, label: nextLabel, heading: headingName } : pin
        )
      }),
      ensureHeading(markdown, headingName)
    )
  }

  function movePin(id: string, x: number, y: number): void {
    if (!data) return
    commit(withCurrentFog({ pins: data.pins.map((pin) => (pin.id === id ? { ...pin, x, y } : pin)) }))
  }

  function deletePin(id: string): void {
    if (!data || data.pinsLocked) return
    commit(withCurrentFog({ pins: data.pins.filter((pin) => pin.id !== id) }))
    if (selectedId === id) setSelectedId(null)
  }

  function togglePinLock(): void {
    if (!data) return
    const nextLocked = !data.pinsLocked
    commit(withCurrentFog({ pinsLocked: nextLocked }))
    if (nextLocked) {
      setPinAction('view')
      setDraft(null)
    }
  }

  function onBoardPointerDown(event: ReactPointerEvent<HTMLDivElement>): void {
    if (event.button === 1 || event.altKey || (tool === 'pan' && event.button === 0)) {
      event.preventDefault()
      panRef.current = { x: event.clientX, y: event.clientY }
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
      if (point) fog.setBrushPos(point)
      if (point && tokens.pendingToken) tokens.addToken(point)
      return
    }
    if (tool === 'pin' && pinAction === 'add' && event.button === 0) {
      const current = dataRef.current
      if ((current?.pinsLocked ?? true) && (current?.pins.length ?? 0) > 0) return
      const point = pointFromEvent(event)
      if (point) setDraft(point)
    }
  }

  function onBoardPointerMove(event: ReactPointerEvent<HTMLDivElement>): void {
    if (tool === 'fog' || tool === 'reveal' || (tool === 'token' && tokens.pendingToken)) {
      const hover = pointFromEvent(event)
      if (hover) fog.setBrushPos(hover)
    }
    if (panRef.current) {
      const dx = event.clientX - panRef.current.x
      const dy = event.clientY - panRef.current.y
      panRef.current = { x: event.clientX, y: event.clientY }
      const content = contentRef.current
      const pane = viewportRef.current ?? paneRef.current
      if (!content || !pane) return
      const contentRect = content.getBoundingClientRect()
      setCamera((prev) =>
        panCamera(prev, dx, dy, contentRect.width, contentRect.height, pane.clientWidth, pane.clientHeight)
      )
      return
    }
    if (fog.paintRef.current === null) return
    const point = pointFromEvent(event)
    if (point) fog.stamp(point, fog.paintRef.current)
  }

  function onBoardPointerUp(): void {
    panRef.current = null
    if (fog.paintRef.current !== null) {
      fog.paintRef.current = null
      persistFog()
    }
  }

  function onBoardPointerLeave(): void {
    if (fog.paintRef.current === null) fog.setBrushPos(null)
    onBoardPointerUp()
  }

  const primary = primaryTool(tool)
  const pinsLocked = data?.pinsLocked ?? true
  const pinCount = data?.pins.length ?? 0
  const canAddPin = !pinsLocked || pinCount === 0
  const canEditPins = !pinsLocked && pinCount > 0
  const tokensLocked = tool === 'fog' || tool === 'reveal' || tool === 'pin'
  const cursor =
    panRef.current
      ? 'grabbing'
      : tool === 'pan'
        ? 'grab'
        : (tool === 'pin' && (pinAction === 'add' || pinAction === 'delete')) ||
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
          onZoomChange={(zoom) => setCamera((prev) => ({ ...prev, zoom }))}
          onFit={() => setCamera(FIT_CAMERA)}
        />
      ) : null}

      {primary === 'pin' ? (
        <MapPinToolbar
          pinAction={pinAction}
          pinsLocked={pinsLocked}
          pinCount={pinCount}
          canAddPin={canAddPin}
          canEditPins={canEditPins}
          selected={selected}
          onStartAddPin={startAddPin}
          onStartEditPin={startEditPin}
          onStartDeletePin={startDeletePin}
          onTogglePinLock={togglePinLock}
        />
      ) : null}

      {primary === 'token' ? (
        <div className="flex flex-col gap-1.5 border-b border-line bg-panel px-3 py-1.5">
          <MapTokenToolbar
            pendingToken={tokens.pendingToken}
            tokenScale={tokens.tokenScale}
            selectedTokenId={tokens.selectedTokenId}
            onTokenScaleChange={tokens.setScale}
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
              onPointerDown={onBoardPointerDown}
              onPointerMove={onBoardPointerMove}
              onPointerUp={onBoardPointerUp}
              onPointerLeave={onBoardPointerLeave}
            >
              {(data?.tokens ?? []).map((token) => {
                const live = dragPos?.id === token.id ? { ...token, x: dragPos.x, y: dragPos.y } : token
                return (
                  <MapTokenMark
                    key={token.id}
                    token={toPlayerMapToken(live, images, tokens.tokenScale)}
                    selected={token.id === tokens.selectedTokenId}
                    interactive={!tokensLocked}
                    onPointerDown={(event) => {
                      if (tokensLocked) return
                      event.preventDefault()
                      event.stopPropagation()
                      tokens.setSelectedTokenId(token.id)
                      setSelectedId(null)
                      tokenDrag.current = { id: token.id, moved: false }
                      event.currentTarget.setPointerCapture(event.pointerId)
                    }}
                    onPointerMove={(event) => {
                      if (!tokenDrag.current || tokenDrag.current.id !== token.id) return
                      const point = pointFromEvent(event)
                      if (!point) return
                      tokenDrag.current.moved = true
                      dragPosRef.current = { id: token.id, x: point.x, y: point.y }
                      setDragPos({ id: token.id, x: point.x, y: point.y })
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
                    if (tool === 'pin' && pinAction === 'delete') {
                      if (!pinsLocked) deletePin(pin.id)
                      return
                    }
                    setSelectedId(pin.id)
                    if (tool === 'pin' && pinAction === 'edit') {
                      setLabel(pin.label)
                      setHeading(pin.heading)
                      setNewHeading(headings.includes(pin.heading) ? '' : pin.heading)
                    }
                    if (data?.pinsLocked || (tool === 'pin' && pinAction !== 'edit')) return
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
                      movePin(pin.id, pos.x, pos.y)
                    }
                    setDragPos(null)
                  }}
                  className={`absolute z-10 flex h-6 min-w-7 items-center justify-center whitespace-nowrap rounded-full border px-1.5 text-[11px] font-semibold tabular-nums leading-none shadow ${
                    pin.id === selectedId ? 'border-ink bg-amber text-on-amber' : 'border-amber bg-ink/90 text-amber'
                  }`}
                  style={{
                    left: `${(dragPos?.id === pin.id ? dragPos.x : pin.x) * 100}%`,
                    top: `${(dragPos?.id === pin.id ? dragPos.y : pin.y) * 100}%`,
                    transform: 'translate(-50%, -50%) scale(calc(1 / var(--map-scale, 1)))',
                    cursor:
                      tool === 'pin' && pinAction === 'delete'
                        ? 'pointer'
                        : data?.pinsLocked
                          ? 'pointer'
                          : 'grab',
                    pointerEvents: tool === 'fog' || tool === 'reveal' || tool === 'token' ? 'none' : 'auto'
                  }}
                >
                  {pin.label}
                </button>
              ))}
              {placing && draft ? (
                <span
                  className="absolute z-10 flex h-6 min-w-7 items-center justify-center whitespace-nowrap rounded-full border border-dashed border-amber px-1.5 text-[11px] font-semibold tabular-nums leading-none text-amber"
                  style={{
                    left: `${draft.x * 100}%`,
                    top: `${draft.y * 100}%`,
                    transform: 'translate(-50%, -50%) scale(calc(1 / var(--map-scale, 1)))'
                  }}
                >
                  {label || '+'}
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

      {(placing && draft) || (tool === 'pin' && pinAction === 'edit' && selected) ? (
        <MapPinEditorForm
          placing={placing}
          draft={draft}
          label={label}
          heading={heading}
          newHeading={newHeading}
          headings={headings}
          onLabelChange={setLabel}
          onHeadingChange={setHeading}
          onNewHeadingChange={setNewHeading}
          onSubmit={() => {
            if (placing && draft) addPin()
            else savePin()
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
