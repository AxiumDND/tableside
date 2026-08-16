import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import type { PlayerMapView } from '../../../shared/types'
import { campaignFileUrl, portraitForNote, resolveImageRef, type CampaignImage } from '../lib/images'
import {
  FIT_CAMERA,
  MAX_ZOOM,
  MIN_ZOOM,
  panCamera,
  zoomCameraAt,
  type MapCamera
} from '../lib/mapCamera'
import {
  BRUSH_DEFAULT,
  BRUSH_MAX,
  BRUSH_MIN,
  DEFAULT_FOG_SIZE,
  brushRadius,
  createFog,
  decodeFog,
  encodeFog,
  fogAllClear,
  fogSizeOf,
  paintFogDisk
} from '../lib/mapFog'
import {
  TOKEN_SCALE_DEFAULT,
  TOKEN_SCALE_MAX,
  TOKEN_SCALE_MIN,
  clampTokenScale,
  creatureSpaceFromMarkdown,
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
  type CreatureSpace,
  type MapNoteData,
  type MapPin,
  type MapToken
} from '../lib/mapNote'
import {
  allPartyNotes,
  bestiaryNotes,
  npcNotes,
  sheetDisplayName,
  type CampaignNote
} from '../lib/notes'
import MapStage, { imagePointFromElement } from './MapStage'
import MapTokenMark from './MapTokenMark'

type MapTool = 'pan' | 'pin' | 'token' | 'fog' | 'reveal'
type PinAction = 'view' | 'add' | 'edit' | 'delete'
type PickerTab = 'pc' | 'npc' | 'monster'

interface TokenPick {
  kind: MapToken['kind']
  source: string
  label: string
  imageSrc: string | null
  space: CreatureSpace
}

function liveView(
  camera: MapCamera,
  cells: Uint8Array,
  tokens: MapToken[],
  images: CampaignImage[],
  tokenScale: number,
  dragPos: { id: string; x: number; y: number } | null
): PlayerMapView {
  const placed = dragPos
    ? tokens.map((token) => (token.id === dragPos.id ? { ...token, x: dragPos.x, y: dragPos.y } : token))
    : tokens
  return {
    zoom: camera.zoom,
    centerX: camera.centerX,
    centerY: camera.centerY,
    fog: fogAllClear(cells) ? '' : encodeFog(cells),
    fogSize: fogSizeOf(cells),
    tokens: placed.map((token) => toPlayerMapToken(token, images, tokenScale))
  }
}

function toolButton(active: boolean): string {
  return active
    ? 'rounded bg-amber px-2 py-0.5 font-semibold text-ink'
    : 'rounded border border-line px-2 py-0.5 hover:border-amber'
}

function primaryTool(tool: MapTool): 'pan' | 'pin' | 'token' | 'fog' {
  return tool === 'reveal' ? 'fog' : tool
}

function catalogFromNotes(notes: CampaignNote[], images: CampaignImage[]): Record<PickerTab, TokenPick[]> {
  const toPick = (note: CampaignNote, kind: MapToken['kind']): TokenPick => {
    const portrait = portraitForNote(note.relativePath, images)
    return {
      kind,
      source: note.relativePath,
      label: sheetDisplayName(note.stem),
      imageSrc: portrait ? campaignFileUrl(portrait) : null,
      space: 'medium'
    }
  }
  return {
    pc: allPartyNotes(notes).map((note) => toPick(note, 'pc')),
    npc: npcNotes(notes).map((note) => toPick(note, 'npc')),
    monster: bestiaryNotes(notes).map((note) => toPick(note, 'monster'))
  }
}

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
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null)
  const [draft, setDraft] = useState<{ x: number; y: number } | null>(null)
  const [label, setLabel] = useState('')
  const [heading, setHeading] = useState('')
  const [newHeading, setNewHeading] = useState('')
  const [fogTick, setFogTick] = useState(0)
  const [brushSize, setBrushSize] = useState(BRUSH_DEFAULT)
  const [brushPos, setBrushPos] = useState<{ x: number; y: number } | null>(null)
  const [dragPos, setDragPos] = useState<{ id: string; x: number; y: number } | null>(null)
  const [pendingToken, setPendingToken] = useState<TokenPick | null>(null)
  const [pickerTab, setPickerTab] = useState<PickerTab>('pc')
  const [tokenQuery, setTokenQuery] = useState('')
  const [spaceBySource, setSpaceBySource] = useState<Record<string, CreatureSpace>>({})
  const [scaleDraft, setScaleDraft] = useState<number | null>(null)
  const fogRef = useRef<Uint8Array>(createFog(data?.fogSize || DEFAULT_FOG_SIZE, 0))
  const cameraRef = useRef(camera)
  const toolRef = useRef(tool)
  const brushSizeRef = useRef(brushSize)
  const panRef = useRef<{ x: number; y: number } | null>(null)
  const paintRef = useRef<0 | 1 | null>(null)
  const pinDrag = useRef<{ id: string; moved: boolean } | null>(null)
  const tokenDrag = useRef<{ id: string; moved: boolean } | null>(null)
  const dragPosRef = useRef<{ id: string; x: number; y: number } | null>(null)
  const fogSaveTimer = useRef<number | null>(null)
  const liveTimer = useRef<number | null>(null)
  const onLiveViewRef = useRef(onLiveView)
  const onChangeRef = useRef(onChange)
  const dataRef = useRef(data)
  const imagesRef = useRef(images)
  const markdownRef = useRef(markdown)
  const tokenScaleTimer = useRef<number | null>(null)
  const scaleDraftRef = useRef<number | null>(null)
  const placing = tool === 'pin' && pinAction === 'add'
  const catalog = useMemo(() => catalogFromNotes(notes, images), [notes, images])
  const catalogRef = useRef(catalog)

  cameraRef.current = camera
  toolRef.current = tool
  brushSizeRef.current = brushSize
  onLiveViewRef.current = onLiveView
  onChangeRef.current = onChange
  dataRef.current = data
  catalogRef.current = catalog
  imagesRef.current = images
  markdownRef.current = markdown
  scaleDraftRef.current = scaleDraft

  const headings = useMemo(() => mapHeadings(markdown), [markdown])
  const selected = data?.pins.find((pin) => pin.id === selectedId) ?? null
  const selectedToken = data?.tokens.find((token) => token.id === selectedTokenId) ?? null
  const roomText = selected
    ? mapRoomMarkdown(markdown, selected.heading) ??
      `No heading yet for **${selected.heading || selected.label}**. Edit the note to add \`## ${selected.heading || selected.label}\`.`
    : mapOverviewMarkdown(markdown)
  const filteredPicks = useMemo(() => {
    const q = tokenQuery.trim().toLowerCase()
    const list = catalog[pickerTab].map((item) => ({
      ...item,
      space: spaceBySource[item.source] ?? item.space
    }))
    if (!q) return list
    return list.filter((item) => item.label.toLowerCase().includes(q))
  }, [catalog, pickerTab, tokenQuery, spaceBySource])
  const tokenScale = scaleDraft ?? data?.tokenScale ?? TOKEN_SCALE_DEFAULT

  const emitLive = useCallback((): void => {
    if (!imagePath || !onLiveViewRef.current) return
    if (liveTimer.current) window.cancelAnimationFrame(liveTimer.current)
    liveTimer.current = window.requestAnimationFrame(() => {
      onLiveViewRef.current?.(
        imagePath,
        liveView(
          cameraRef.current,
          fogRef.current,
          dataRef.current?.tokens ?? [],
          imagesRef.current,
          scaleDraftRef.current ?? dataRef.current?.tokenScale ?? TOKEN_SCALE_DEFAULT,
          dragPosRef.current
        )
      )
    })
  }, [imagePath])

  useEffect(() => {
    const size = data?.fogSize || DEFAULT_FOG_SIZE
    fogRef.current = data?.fog ? decodeFog(data.fog, size) : createFog(size, 0)
    setFogTick((n) => n + 1)
    setCamera(FIT_CAMERA)
    setTool('pan')
    setDraft(null)
    setPendingToken(null)
    setSelectedTokenId(null)
    setPinAction('view')
    setScaleDraft(null)
  }, [path, data?.image])

  useEffect(() => {
    emitLive()
  }, [camera, fogTick, emitLive, data?.tokens, data?.tokenScale, dragPos, scaleDraft])

  useEffect(() => {
    if (selectedTokenId && data?.tokens.some((token) => token.id === selectedTokenId)) return
    if (selectedId && data?.pins.some((pin) => pin.id === selectedId)) return
    setSelectedId(data?.pins[0]?.id ?? null)
  }, [data, selectedId, selectedTokenId])

  useEffect(() => {
    if (selectedTokenId && data?.tokens.some((token) => token.id === selectedTokenId)) return
    setSelectedTokenId(null)
  }, [data, selectedTokenId])

  useEffect(() => {
    let cancelled = false
    async function syncSpaces(): Promise<void> {
      const current = dataRef.current
      if (!current?.tokens.length) return
      const found: Record<string, CreatureSpace> = {}
      for (const token of current.tokens) {
        if (!token.source) continue
        try {
          const text = await window.tabledm.readFile(token.source)
          found[token.source] = creatureSpaceFromMarkdown(text)
        } catch {
          /* keep stored space */
        }
      }
      if (cancelled) return
      if (Object.keys(found).length) setSpaceBySource((prev) => ({ ...prev, ...found }))
      const latest = dataRef.current
      if (!latest) return
      const next = latest.tokens.map((token) => {
        const space = found[token.source]
        return space && space !== token.space ? { ...token, space } : token
      })
      if (next.some((token, i) => token.space !== latest.tokens[i].space)) {
        onChangeRef.current(replaceMapFence(markdownRef.current, withCurrentFog({ tokens: next })))
      }
    }
    void syncSpaces()
    return () => {
      cancelled = true
    }
  }, [path])

  useEffect(() => {
    if (tool !== 'token') return
    let cancelled = false
    async function loadCatalogSpaces(): Promise<void> {
      const items = [...catalogRef.current.pc, ...catalogRef.current.npc, ...catalogRef.current.monster]
      const found: Record<string, CreatureSpace> = {}
      await Promise.all(
        items.map(async (item) => {
          try {
            const text = await window.tabledm.readFile(item.source)
            found[item.source] = creatureSpaceFromMarkdown(text)
          } catch {
            found[item.source] = 'medium'
          }
        })
      )
      if (!cancelled) setSpaceBySource((prev) => ({ ...prev, ...found }))
    }
    void loadCatalogSpaces()
    return () => {
      cancelled = true
    }
  }, [tool])

  useEffect(() => {
    const pane = paneRef.current
    if (!pane) return
    const onWheel = (event: WheelEvent): void => {
      event.preventDefault()
      if (
        event.shiftKey &&
        (toolRef.current === 'fog' || toolRef.current === 'reveal')
      ) {
        const delta = event.deltaY < 0 ? 1 : -1
        setBrushSize((size) => Math.min(BRUSH_MAX, Math.max(BRUSH_MIN, size + delta)))
        return
      }
      if (event.shiftKey && (toolRef.current === 'token' || (dataRef.current?.tokens.length ?? 0) > 0)) {
        const delta = event.deltaY < 0 ? 0.005 : -0.005
        const current = dataRef.current
        if (!current) return
        const base = scaleDraftRef.current ?? current.tokenScale ?? TOKEN_SCALE_DEFAULT
        const next = clampTokenScale(base + delta)
        if (tokenScaleTimer.current) window.clearTimeout(tokenScaleTimer.current)
        setScaleDraft(next)
        onChangeRef.current(
          replaceMapFence(markdownRef.current, {
            image: current.image ?? '',
            pins: current.pins ?? [],
            tokens: current.tokens ?? [],
            tokenScale: next,
            pinsLocked: current.pinsLocked ?? true,
            fog: fogAllClear(fogRef.current) ? '' : encodeFog(fogRef.current),
            fogSize: fogSizeOf(fogRef.current)
          })
        )
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
    const onKey = (event: KeyboardEvent): void => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
      if (event.key !== '[' && event.key !== ']') return
      event.preventDefault()
      const delta = event.key === ']' ? 1 : -1
      setBrushSize((size) => Math.min(BRUSH_MAX, Math.max(BRUSH_MIN, size + delta)))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (tool !== 'fog' && tool !== 'reveal' && tool !== 'token') setBrushPos(null)
  }, [tool])

  useEffect(() => {
    return () => {
      if (fogSaveTimer.current) window.clearTimeout(fogSaveTimer.current)
      if (tokenScaleTimer.current) window.clearTimeout(tokenScaleTimer.current)
      if (liveTimer.current) window.cancelAnimationFrame(liveTimer.current)
    }
  }, [])

  function commit(next: MapNoteData, source = markdown): void {
    onChange(replaceMapFence(source, next))
  }

  function withCurrentFog(partial: Partial<MapNoteData>): MapNoteData {
    const current = dataRef.current
    const cells = fogRef.current
    return {
      image: current?.image ?? '',
      pins: current?.pins ?? [],
      tokens: current?.tokens ?? [],
      tokenScale: current?.tokenScale ?? TOKEN_SCALE_DEFAULT,
      pinsLocked: current?.pinsLocked ?? true,
      ...partial,
      fog: fogAllClear(cells) ? '' : encodeFog(cells),
      fogSize: fogSizeOf(cells)
    }
  }

  function persistFog(): void {
    if (!data) return
    commit(withCurrentFog({}))
  }

  function scheduleFogSave(): void {
    if (fogSaveTimer.current) window.clearTimeout(fogSaveTimer.current)
    fogSaveTimer.current = window.setTimeout(() => persistFog(), 400)
  }

  function pointFromEvent(event: { clientX: number; clientY: number }): { x: number; y: number } | null {
    return imagePointFromElement(contentRef.current, event.clientX, event.clientY)
  }

  function stampFog(point: { x: number; y: number }, value: 0 | 1): void {
    const radius = brushRadius(cameraRef.current.zoom, brushSizeRef.current)
    if (paintFogDisk(fogRef.current, point.x, point.y, radius, value)) {
      setFogTick((n) => n + 1)
      scheduleFogSave()
    }
  }

  function startAddPin(): void {
    const pins = data?.pins ?? []
    if ((data?.pinsLocked ?? true) && pins.length > 0) return
    setTool('pin')
    setPinAction('add')
    setDraft(null)
    setPendingToken(null)
    setLabel(nextPinLabel(pins))
    setHeading(headings[0] ?? '')
    setNewHeading('')
  }

  function startEditPin(): void {
    if (data?.pinsLocked !== false || (data.pins.length ?? 0) === 0) return
    setTool('pin')
    setPinAction('edit')
    setDraft(null)
    setPendingToken(null)
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
    setPendingToken(null)
  }

  function selectPrimary(next: 'pan' | 'pin' | 'token' | 'fog'): void {
    if (next !== 'token') setPendingToken(null)
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

  function addToken(point: { x: number; y: number }): void {
    const current = dataRef.current
    if (!current || !pendingToken) return
    const token: MapToken = {
      id: uniquePinId(current.tokens, pendingToken.label),
      kind: pendingToken.kind,
      source: pendingToken.source,
      x: point.x,
      y: point.y,
      space: pendingToken.space,
      label: pendingToken.label,
      image: ''
    }
    commit(withCurrentFog({ tokens: [...current.tokens, token] }))
    setSelectedTokenId(token.id)
    setSelectedId(null)
  }

  function moveToken(id: string, x: number, y: number): void {
    const current = dataRef.current
    if (!current) return
    commit(withCurrentFog({ tokens: current.tokens.map((token) => (token.id === id ? { ...token, x, y } : token)) }))
  }

  function deleteToken(id: string): void {
    const current = dataRef.current
    if (!current) return
    commit(withCurrentFog({ tokens: current.tokens.filter((token) => token.id !== id) }))
    if (selectedTokenId === id) setSelectedTokenId(null)
  }

  function resizeAllTokens(size: number): void {
    const next = clampTokenScale(size)
    const current = dataRef.current
    if (!current) return
    if (tokenScaleTimer.current) window.clearTimeout(tokenScaleTimer.current)
    tokenScaleTimer.current = window.setTimeout(() => {
      commit(withCurrentFog({ tokenScale: next }))
    }, 150)
  }

  function coverAll(): void {
    fogRef.current = createFog(fogSizeOf(fogRef.current), 1)
    setFogTick((n) => n + 1)
    persistFog()
  }

  function clearFog(): void {
    fogRef.current = createFog(fogSizeOf(fogRef.current), 0)
    setFogTick((n) => n + 1)
    persistFog()
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
      setBrushPos(point)
      paintRef.current = tool === 'fog' ? 1 : 0
      event.currentTarget.setPointerCapture(event.pointerId)
      stampFog(point, paintRef.current)
      return
    }
    if (tool === 'token' && event.button === 0) {
      const point = pointFromEvent(event)
      if (point) setBrushPos(point)
      if (point && pendingToken) addToken(point)
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
    if (tool === 'fog' || tool === 'reveal' || (tool === 'token' && pendingToken)) {
      const hover = pointFromEvent(event)
      if (hover) setBrushPos(hover)
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
    if (paintRef.current === null) return
    const point = pointFromEvent(event)
    if (point) stampFog(point, paintRef.current)
  }

  function onBoardPointerUp(): void {
    panRef.current = null
    if (paintRef.current !== null) {
      paintRef.current = null
      persistFog()
    }
  }

  function onBoardPointerLeave(): void {
    if (paintRef.current === null) setBrushPos(null)
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
            (tool === 'token' && pendingToken)
          ? 'crosshair'
          : 'default'

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-line px-3 py-1.5 text-[11px] text-muted">
        <button type="button" onClick={() => selectPrimary('pan')} className={toolButton(primary === 'pan')}>
          Pan
        </button>
        <button type="button" onClick={() => selectPrimary('pin')} className={toolButton(primary === 'pin')}>
          Pin
        </button>
        <button type="button" onClick={() => selectPrimary('token')} className={toolButton(primary === 'token')}>
          Token
        </button>
        <button type="button" onClick={() => selectPrimary('fog')} className={toolButton(primary === 'fog')}>
          Fog
        </button>
      </div>

      {primary === 'pan' ? (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-line bg-panel px-3 py-1.5 text-[11px] text-muted">
          <span>Drag to pan · players see tokens, not pins</span>
          <label className="flex items-center gap-1.5" title="Scroll also zooms toward the cursor">
            Zoom
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.05}
              value={camera.zoom}
              onChange={(event) => {
                const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(event.target.value)))
                setCamera((prev) => ({ ...prev, zoom }))
              }}
              className="h-1 w-28 accent-amber"
            />
            <span className="w-10 tabular-nums text-parchment">{Math.round(camera.zoom * 100)}%</span>
          </label>
          <button
            type="button"
            onClick={() => setCamera(FIT_CAMERA)}
            className="rounded border border-line px-2 py-0.5 hover:border-amber"
          >
            Fit
          </button>
        </div>
      ) : null}

      {primary === 'pin' ? (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-line bg-panel px-3 py-1.5 text-[11px] text-muted">
          <button
            type="button"
            onClick={startAddPin}
            disabled={!canAddPin}
            title={!canAddPin ? 'Unlock pins to add another' : undefined}
            className={canAddPin ? toolButton(pinAction === 'add') : 'rounded border border-line px-2 py-0.5 opacity-40'}
          >
            Add pin
          </button>
          <button
            type="button"
            onClick={startEditPin}
            disabled={!canEditPins}
            title={!canEditPins ? 'Unlock pins to edit' : undefined}
            className={canEditPins ? toolButton(pinAction === 'edit') : 'rounded border border-line px-2 py-0.5 opacity-40'}
          >
            Edit pin
          </button>
          <button
            type="button"
            onClick={startDeletePin}
            disabled={!canEditPins}
            title={!canEditPins ? 'Unlock pins to delete' : undefined}
            className={canEditPins ? toolButton(pinAction === 'delete') : 'rounded border border-line px-2 py-0.5 opacity-40'}
          >
            Delete pin
          </button>
          <button
            type="button"
            onClick={togglePinLock}
            title={pinsLocked ? 'Unlock pins so you can add, edit, or delete' : 'Lock pins so they stay put'}
            className={toolButton(pinsLocked)}
          >
            {pinsLocked ? 'Unlock pins' : 'Lock pins'}
          </button>
          <span>
            {pinsLocked && pinCount > 0
              ? 'Unlock pins to add, edit, or delete'
              : pinAction === 'add'
                ? pinCount === 0
                  ? 'Click the map to place the first pin'
                  : 'Click the map to place a pin'
                : pinAction === 'delete'
                  ? 'Click a pin to delete it'
                  : pinAction === 'edit' && selected
                    ? `Editing ${selected.label}`
                    : pinAction === 'edit'
                      ? 'Click a pin to edit it'
                      : 'Choose add, edit, or delete'}
          </span>
        </div>
      ) : null}

      {primary === 'token' ? (
        <div className="flex flex-col gap-1.5 border-b border-line bg-panel px-3 py-1.5">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
            <span>{pendingToken ? `Click the map to place ${pendingToken.label}` : 'Pick a creature, then click the map'}</span>
            <label
              className="flex items-center gap-1.5"
              title="Scales every token. Large is 2× Medium, Huge 3×, Gargantuan 4×. Shift+scroll."
            >
              Size
              <input
                type="range"
                min={TOKEN_SCALE_MIN}
                max={TOKEN_SCALE_MAX}
                step={0.005}
                value={tokenScale}
                onChange={(event) => {
                  const next = clampTokenScale(Number(event.target.value))
                  setScaleDraft(next)
                  resizeAllTokens(next)
                }}
                className="h-1 w-24 accent-amber"
              />
              <span className="w-8 tabular-nums text-parchment">{Math.round(tokenScale * 100)}%</span>
            </label>
            {selectedToken ? (
              <button
                type="button"
                onClick={() => deleteToken(selectedToken.id)}
                className="rounded border border-line px-2 py-0.5 hover:border-blood"
              >
                Delete token
              </button>
            ) : null}
            {(['pc', 'npc', 'monster'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setPickerTab(tab)}
                className={toolButton(pickerTab === tab)}
              >
                {tab === 'pc' ? 'Party' : tab === 'npc' ? 'NPCs' : 'Monsters'}
                <span className="ml-1 tabular-nums opacity-70">{catalog[tab].length}</span>
              </button>
            ))}
            <input
              value={tokenQuery}
              onChange={(event) => setTokenQuery(event.target.value)}
              placeholder="Filter…"
              className="ml-auto w-36 rounded border border-line bg-ink px-1.5 py-0.5 text-[11px] text-parchment outline-none focus:border-amber"
            />
          </div>
          <div className="flex max-h-20 flex-wrap gap-1 overflow-auto">
            {filteredPicks.length === 0 ? (
              <p className="text-[11px] text-muted">
                {pickerTab === 'pc'
                  ? 'No Party sheets in this campaign.'
                  : pickerTab === 'npc'
                    ? 'No NPC sheets in this campaign.'
                    : 'No Bestiary sheets in this campaign.'}
              </p>
            ) : (
              filteredPicks.map((item) => (
                <button
                  key={item.source}
                  type="button"
                  title={item.label}
                  onClick={() => {
                    const space = spaceBySource[item.source] ?? item.space
                    setPendingToken({ ...item, space })
                    if (spaceBySource[item.source]) return
                    void window.tabledm.readFile(item.source).then((text) => {
                      const nextSpace = creatureSpaceFromMarkdown(text)
                      setSpaceBySource((prev) => ({ ...prev, [item.source]: nextSpace }))
                      setPendingToken((prev) =>
                        prev?.source === item.source ? { ...prev, space: nextSpace } : prev
                      )
                    }).catch(() => undefined)
                  }}
                  className={`flex items-center gap-1.5 rounded-full border py-0.5 pr-2 pl-0.5 text-[11px] ${
                    pendingToken?.source === item.source
                      ? 'border-amber bg-amber text-ink'
                      : 'border-line bg-ink text-parchment hover:border-amber'
                  }`}
                >
                  <span className="h-6 w-6 overflow-hidden rounded-full border border-line bg-panel">
                    {item.imageSrc ? (
                      <img src={item.imageSrc} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-[9px] font-semibold">
                        {item.label.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </span>
                  {item.label}
                  {item.space !== 'medium' ? (
                    <span className="opacity-70">{item.space}</span>
                  ) : null}
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}

      {primary === 'fog' ? (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-line bg-panel px-3 py-1.5 text-[11px] text-muted">
          <button type="button" onClick={() => setTool('fog')} className={toolButton(tool === 'fog')}>
            Hide
          </button>
          <button type="button" onClick={() => setTool('reveal')} className={toolButton(tool === 'reveal')}>
            Reveal
          </button>
          <label className="flex items-center gap-1.5" title="[ smaller · ] bigger · Shift+scroll">
            Brush
            <input
              type="range"
              min={BRUSH_MIN}
              max={BRUSH_MAX}
              step={1}
              value={brushSize}
              onChange={(event) => setBrushSize(Number(event.target.value))}
              className="h-1 w-24 accent-amber"
            />
            <span className="w-3 tabular-nums text-parchment">{brushSize}</span>
          </label>
          <button type="button" onClick={coverAll} className="rounded border border-line px-2 py-0.5 hover:border-amber">
            Cover all
          </button>
          <button type="button" onClick={clearFog} className="rounded border border-line px-2 py-0.5 hover:border-amber">
            Clear fog
          </button>
        </div>
      ) : null}

      <div ref={paneRef} className="relative min-h-0 flex-1 bg-ink">
        {imagePath ? (
          <div className="absolute inset-0 p-2">
            <MapStage
              src={campaignFileUrl(imagePath)}
              camera={camera}
              fogCells={fogRef.current}
              fogTick={fogTick}
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
                    token={toPlayerMapToken(live, images, tokenScale)}
                    selected={token.id === selectedTokenId}
                    interactive={!tokensLocked}
                    onPointerDown={(event) => {
                      if (tokensLocked) return
                      event.preventDefault()
                      event.stopPropagation()
                      setSelectedTokenId(token.id)
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
                        moveToken(token.id, pos.x, pos.y)
                      }
                      setDragPos(null)
                    }}
                  />
                )
              })}
              {tool === 'token' && pendingToken && brushPos ? (
                <MapTokenMark
                  token={{
                    id: 'ghost',
                    x: brushPos.x,
                    y: brushPos.y,
                    size: tokenDiameter(tokenScale, pendingToken.space),
                    label: pendingToken.label,
                    kind: pendingToken.kind,
                    imageSrc: pendingToken.imageSrc
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
                    setSelectedTokenId(null)
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
                    pin.id === selectedId ? 'border-ink bg-amber text-ink' : 'border-amber bg-ink/90 text-amber'
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
              {(tool === 'fog' || tool === 'reveal') && brushPos ? (
                <span
                  className="pointer-events-none absolute z-20 rounded-full border border-amber bg-amber/10"
                  style={{
                    left: `${brushPos.x * 100}%`,
                    top: `${brushPos.y * 100}%`,
                    width: `${brushRadius(camera.zoom, brushSize) * 2 * 100}%`,
                    height: `${brushRadius(camera.zoom, brushSize) * 2 * 100}%`,
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
        <form
          className="flex flex-wrap items-end gap-2 border-t border-line bg-panel px-3 py-2"
          onSubmit={(event) => {
            event.preventDefault()
            if (placing && draft) addPin()
            else savePin()
          }}
        >
          <label className="text-[11px] text-muted">
            Label
            <input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              className="mt-0.5 block w-20 rounded border border-line bg-ink px-1.5 py-1 text-sm outline-none focus:border-amber"
            />
          </label>
          <label className="min-w-40 flex-1 text-[11px] text-muted">
            Room heading
            <select
              value={newHeading || headings.length === 0 ? '__new__' : heading}
              onChange={(event) => {
                if (event.target.value === '__new__') {
                  setNewHeading(newHeading || `Room ${label}`)
                  return
                }
                setNewHeading('')
                setHeading(event.target.value)
              }}
              className="mt-0.5 block w-full rounded border border-line bg-ink px-1.5 py-1 text-sm outline-none focus:border-amber"
            >
              {headings.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
              <option value="__new__">New heading…</option>
            </select>
          </label>
          {newHeading || headings.length === 0 ? (
            <label className="min-w-40 flex-1 text-[11px] text-muted">
              New heading
              <input
                value={newHeading}
                onChange={(event) => setNewHeading(event.target.value)}
                placeholder={`Room ${label}`}
                className="mt-0.5 block w-full rounded border border-line bg-ink px-1.5 py-1 text-sm outline-none focus:border-amber"
              />
            </label>
          ) : null}
          <button type="submit" className="rounded bg-amber px-2.5 py-1 text-xs font-semibold text-ink">
            {placing && draft ? 'Place' : 'Save'}
          </button>
        </form>
      ) : null}

      <div className="max-h-[38%] min-h-24 overflow-auto border-t border-line px-3 py-2">
        <div className="mx-auto max-w-3xl text-sm">
          {selectedToken ? (
            <p className="mb-2 text-[11px] uppercase tracking-wider text-muted">
              Token {selectedToken.label}
              {selectedToken.kind === 'pc' ? ' · player' : selectedToken.kind === 'monster' ? ' · monster' : ' · npc'}
              {` · ${selectedToken.space}`}
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
