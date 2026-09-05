import { type MapPin } from '../lib/mapNote'
import { BRUSH_MAX, BRUSH_MIN } from '../lib/mapFog'
import { MAX_ZOOM, MIN_ZOOM } from '../lib/mapCamera'
import { toolButton, type MapTool, type PinAction, type PickerTab, type TokenPick } from './MapViewHelpers'
import type { MeasureKind } from '../lib/mapMeasure'
import { MEASURE_FEET_MAX, MEASURE_FEET_MIN } from '../lib/mapMeasure'

export function MapPrimaryToolbar({
  primary,
  onSelectPrimary
}: {
  primary: 'pan' | 'pin' | 'token' | 'fog'
  onSelectPrimary: (tool: 'pan' | 'pin' | 'token' | 'fog') => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-line px-3 py-1.5 text-[11px] text-muted">
      <button type="button" onClick={() => onSelectPrimary('pan')} className={toolButton(primary === 'pan')}>
        Pan
      </button>
      <button type="button" onClick={() => onSelectPrimary('pin')} className={toolButton(primary === 'pin')}>
        Pin
      </button>
      <button type="button" onClick={() => onSelectPrimary('token')} className={toolButton(primary === 'token')}>
        Token
      </button>
      <button type="button" onClick={() => onSelectPrimary('fog')} className={toolButton(primary === 'fog')}>
        Fog
      </button>
    </div>
  )
}

export function MapPanToolbar({
  zoom,
  scaleArmed,
  scaleFeet,
  scaleHint,
  measureKind,
  measureFeet,
  onZoomChange,
  onFit,
  onToggleScale,
  onScaleFeetChange,
  onMeasureKind,
  onMeasureFeetChange
}: {
  zoom: number
  scaleArmed: boolean
  scaleFeet: number
  scaleHint: string
  measureKind: MeasureKind | null
  measureFeet: number
  onZoomChange: (zoom: number) => void
  onFit: () => void
  onToggleScale: () => void
  onScaleFeetChange: (feet: number) => void
  onMeasureKind: (kind: MeasureKind) => void
  onMeasureFeetChange: (feet: number) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-line bg-panel px-3 py-1.5 text-[11px] text-muted">
      <span>{scaleHint}</span>
      <button
        type="button"
        onClick={onToggleScale}
        title="Click two printed grid corners that are this many feet apart. The overlay lines up with the first click."
        className={toolButton(scaleArmed)}
      >
        Scale map
      </button>
      <label className="flex items-center gap-1" title="Length of the span you will click">
        <input
          type="number"
          min={5}
          max={200}
          step={5}
          value={scaleFeet}
          onChange={(event) => onScaleFeetChange(Number(event.target.value))}
          className="h-6 w-12 rounded border border-line bg-ink px-1 text-parchment tabular-nums"
        />
        ft
      </label>
      <span className="text-line">·</span>
      <button
        type="button"
        title="5 ft wide line"
        onClick={() => onMeasureKind('line')}
        className={toolButton(measureKind === 'line')}
      >
        Line
      </button>
      <button
        type="button"
        title="90° cone"
        onClick={() => onMeasureKind('cone')}
        className={toolButton(measureKind === 'cone')}
      >
        Cone
      </button>
      <button
        type="button"
        title="Radius circle"
        onClick={() => onMeasureKind('round')}
        className={toolButton(measureKind === 'round')}
      >
        Round
      </button>
      <button
        type="button"
        title="Cube — side length in feet, centered on the click"
        onClick={() => onMeasureKind('square')}
        className={toolButton(measureKind === 'square')}
      >
        Square
      </button>
      <label className="flex items-center gap-1" title="Template length or radius">
        <input
          type="number"
          min={MEASURE_FEET_MIN}
          max={MEASURE_FEET_MAX}
          step={5}
          value={measureFeet}
          onChange={(event) => onMeasureFeetChange(Number(event.target.value))}
          className="h-6 w-12 rounded border border-line bg-ink px-1 text-parchment tabular-nums"
        />
        ft
      </label>
      <label className="flex items-center gap-1.5" title="Scroll also zooms toward the cursor">
        Zoom
        <input
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={0.05}
          value={zoom}
          onChange={(event) => {
            const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(event.target.value)))
            onZoomChange(next)
          }}
          className="h-1 w-28 accent-amber"
        />
        <span className="w-10 tabular-nums text-parchment">{Math.round(zoom * 100)}%</span>
      </label>
      <button
        type="button"
        onClick={onFit}
        className="rounded border border-line px-2 py-0.5 hover:border-amber"
      >
        Fit
      </button>
    </div>
  )
}

export function MapPinToolbar({
  pinAction,
  pinsLocked,
  pinCount,
  canAddPin,
  canEditPins,
  selected,
  onStartAddPin,
  onStartEditPin,
  onStartDeletePin,
  onTogglePinLock
}: {
  pinAction: PinAction
  pinsLocked: boolean
  pinCount: number
  canAddPin: boolean
  canEditPins: boolean
  selected: MapPin | null
  onStartAddPin: () => void
  onStartEditPin: () => void
  onStartDeletePin: () => void
  onTogglePinLock: () => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-line bg-panel px-3 py-1.5 text-[11px] text-muted">
      <button
        type="button"
        onClick={onStartAddPin}
        disabled={!canAddPin}
        title={!canAddPin ? 'Unlock pins to add another' : undefined}
        className={canAddPin ? toolButton(pinAction === 'add') : 'rounded border border-line px-2 py-0.5 opacity-40'}
      >
        Add pin
      </button>
      <button
        type="button"
        onClick={onStartEditPin}
        disabled={!canEditPins}
        title={!canEditPins ? 'Unlock pins to edit' : undefined}
        className={canEditPins ? toolButton(pinAction === 'edit') : 'rounded border border-line px-2 py-0.5 opacity-40'}
      >
        Edit pin
      </button>
      <button
        type="button"
        onClick={onStartDeletePin}
        disabled={!canEditPins}
        title={!canEditPins ? 'Unlock pins to delete' : undefined}
        className={canEditPins ? toolButton(pinAction === 'delete') : 'rounded border border-line px-2 py-0.5 opacity-40'}
      >
        Delete pin
      </button>
      <button
        type="button"
        onClick={onTogglePinLock}
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
  )
}

export function MapTokenToolbar({
  pendingToken,
  selectedCount,
  tokenCount,
  selectedInCombat,
  onDeleteSelected,
  onAddSelectedToCombat,
  onAddAllToCombat,
  onSelectAll,
  onOpenConditions
}: {
  pendingToken: TokenPick | null
  selectedCount: number
  tokenCount: number
  selectedInCombat: number
  onDeleteSelected: () => void
  onAddSelectedToCombat?: () => void
  onAddAllToCombat?: () => void
  onSelectAll?: () => void
  onOpenConditions?: () => void
}) {
  const hint = pendingToken
    ? tokenCount >= 2
      ? `Click the map to place ${pendingToken.label} · Shift+click to select more`
      : `Click the map to place ${pendingToken.label}`
    : tokenCount >= 2
      ? 'Pick a creature, then click the map · Shift+click to select more'
      : 'Pick a creature, then click the map'
  const selectedAddLabel =
    selectedCount > 1
      ? selectedInCombat === selectedCount
        ? 'Open combat'
        : `Add selected (${selectedCount})`
      : selectedInCombat === 1
        ? 'Open combat'
        : 'Add to combat'
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
      <span>{hint}</span>
      {tokenCount >= 2 && onSelectAll && selectedCount < tokenCount ? (
        <button
          type="button"
          onClick={onSelectAll}
          className="rounded border border-line px-2 py-0.5 hover:border-amber"
        >
          Select all
        </button>
      ) : null}
      {tokenCount >= 2 && onAddAllToCombat ? (
        <button
          type="button"
          onClick={onAddAllToCombat}
          className="rounded border border-line px-2 py-0.5 hover:border-amber"
        >
          Add all to combat
        </button>
      ) : null}
      {selectedCount > 0 && onAddSelectedToCombat ? (
        <button
          type="button"
          onClick={onAddSelectedToCombat}
          className="rounded border border-line px-2 py-0.5 hover:border-amber"
        >
          {selectedAddLabel}
        </button>
      ) : null}
      {selectedCount === 1 && selectedInCombat === 1 && onOpenConditions ? (
        <button
          type="button"
          onClick={onOpenConditions}
          className="rounded border border-line px-2 py-0.5 hover:border-amber"
        >
          Cnd
        </button>
      ) : null}
      {selectedCount > 0 ? (
        <button
          type="button"
          onClick={onDeleteSelected}
          className="rounded border border-line px-2 py-0.5 hover:border-blood"
        >
          {selectedCount > 1 ? `Delete ${selectedCount} tokens` : 'Delete token'}
        </button>
      ) : null}
    </div>
  )
}

export function MapTokenPickerPanel({
  pickerTab,
  tokenQuery,
  catalog,
  filteredPicks,
  pendingToken,
  onPickerTabChange,
  onTokenQueryChange,
  onPickToken
}: {
  pickerTab: PickerTab
  tokenQuery: string
  catalog: Record<PickerTab, TokenPick[]>
  filteredPicks: TokenPick[]
  pendingToken: TokenPick | null
  onPickerTabChange: (tab: PickerTab) => void
  onTokenQueryChange: (query: string) => void
  onPickToken: (item: TokenPick) => void
}) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
        {(['pc', 'npc', 'monster'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onPickerTabChange(tab)}
            className={toolButton(pickerTab === tab)}
          >
            {tab === 'pc' ? 'Party' : tab === 'npc' ? 'NPCs' : 'Monsters'}
            <span className="ml-1 tabular-nums opacity-70">{catalog[tab].length}</span>
          </button>
        ))}
        <input
          value={tokenQuery}
          onChange={(event) => onTokenQueryChange(event.target.value)}
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
              onClick={() => onPickToken(item)}
              className={`flex items-center gap-1.5 rounded-full border py-0.5 pr-2 pl-0.5 text-[11px] ${
                pendingToken?.source === item.source
                  ? 'border-amber bg-amber text-on-amber'
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
    </>
  )
}

export function MapFogToolbar({
  tool,
  brushSize,
  onToolChange,
  onBrushSizeChange,
  onCoverAll,
  onClearFog
}: {
  tool: MapTool
  brushSize: number
  onToolChange: (tool: 'fog' | 'reveal') => void
  onBrushSizeChange: (size: number) => void
  onCoverAll: () => void
  onClearFog: () => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-line bg-panel px-3 py-1.5 text-[11px] text-muted">
      <button type="button" onClick={() => onToolChange('fog')} className={toolButton(tool === 'fog')}>
        Hide
      </button>
      <button type="button" onClick={() => onToolChange('reveal')} className={toolButton(tool === 'reveal')}>
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
          onChange={(event) => onBrushSizeChange(Number(event.target.value))}
          className="h-1 w-24 accent-amber"
        />
        <span className="w-3 tabular-nums text-parchment">{brushSize}</span>
      </label>
      <button type="button" onClick={onCoverAll} className="rounded border border-line px-2 py-0.5 hover:border-amber">
        Cover all
      </button>
      <button type="button" onClick={onClearFog} className="rounded border border-line px-2 py-0.5 hover:border-amber">
        Clear fog
      </button>
    </div>
  )
}

export function MapPinEditorForm({
  placing,
  draft,
  label,
  heading,
  newHeading,
  headings,
  onLabelChange,
  onHeadingChange,
  onNewHeadingChange,
  onSubmit
}: {
  placing: boolean
  draft: { x: number; y: number } | null
  label: string
  heading: string
  newHeading: string
  headings: string[]
  onLabelChange: (label: string) => void
  onHeadingChange: (heading: string) => void
  onNewHeadingChange: (newHeading: string) => void
  onSubmit: () => void
}) {
  return (
    <form
      className="flex flex-wrap items-end gap-2 border-t border-line bg-panel px-3 py-2"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <label className="text-[11px] text-muted">
        Label
        <input
          value={label}
          onChange={(event) => onLabelChange(event.target.value)}
          className="mt-0.5 block w-20 rounded border border-line bg-ink px-1.5 py-1 text-sm outline-none focus:border-amber"
        />
      </label>
      <label className="min-w-40 flex-1 text-[11px] text-muted">
        Room heading
        <select
          value={newHeading || headings.length === 0 ? '__new__' : heading}
          onChange={(event) => {
            if (event.target.value === '__new__') {
              onNewHeadingChange(newHeading || `Room ${label}`)
              return
            }
            onNewHeadingChange('')
            onHeadingChange(event.target.value)
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
            onChange={(event) => onNewHeadingChange(event.target.value)}
            placeholder={`Room ${label}`}
            className="mt-0.5 block w-full rounded border border-line bg-ink px-1.5 py-1 text-sm outline-none focus:border-amber"
          />
        </label>
      ) : null}
      <button type="submit" className="rounded bg-amber px-2.5 py-1 text-xs font-semibold text-on-amber">
        {placing && draft ? 'Place' : 'Save'}
      </button>
    </form>
  )
}
