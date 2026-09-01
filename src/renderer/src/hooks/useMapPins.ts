import { useEffect, useRef, useState, type Dispatch, type MutableRefObject, type SetStateAction } from 'react'
import {
  ensureHeading,
  nextPinLabel,
  uniquePinId,
  type MapNoteData,
  type MapPin
} from '../lib/mapNote'
import type { MapTool, PinAction } from '../components/MapViewHelpers'

export interface MapPins {
  pinAction: PinAction
  setPinAction: Dispatch<SetStateAction<PinAction>>
  selectedId: string | null
  setSelectedId: Dispatch<SetStateAction<string | null>>
  selected: MapPin | null
  draft: { x: number; y: number } | null
  setDraft: Dispatch<SetStateAction<{ x: number; y: number } | null>>
  label: string
  setLabel: Dispatch<SetStateAction<string>>
  heading: string
  setHeading: Dispatch<SetStateAction<string>>
  newHeading: string
  setNewHeading: Dispatch<SetStateAction<string>>
  placing: boolean
  startAddPin: () => void
  startEditPin: () => void
  startDeletePin: () => void
  addPin: () => void
  savePin: () => void
  movePin: (id: string, x: number, y: number) => void
  deletePin: (id: string) => void
  togglePinLock: () => void
  /** Copy a pin's label/heading into the edit form (clicking a pin while editing). */
  fillForm: (pin: MapPin) => void
  /** Clear the draft and return to view (call when the open map changes). */
  reset: () => void
}

/**
 * Owns map-pin selection, the add/edit form, and pin CRUD. Persistence is
 * injected so the caller can write pins/lock through the shared map-note
 * commit path (including current fog). `sourceMarkdown` is used when a new
 * heading must be appended to the note.
 */
export function useMapPins(opts: {
  pins: MapPin[]
  pinsLocked: boolean
  headings: string[]
  tool: MapTool
  tokenSelected: boolean
  dataRef: MutableRefObject<MapNoteData | null>
  getMarkdown: () => string
  persist: (partial: { pins?: MapPin[]; pinsLocked?: boolean }, sourceMarkdown?: string) => void
  onEnterPinTool: () => void
}): MapPins {
  const { pins, pinsLocked, headings, tool, tokenSelected, dataRef, getMarkdown, persist, onEnterPinTool } = opts

  const [pinAction, setPinAction] = useState<PinAction>('view')
  const [selectedId, setSelectedId] = useState<string | null>(pins[0]?.id ?? null)
  const [draft, setDraft] = useState<{ x: number; y: number } | null>(null)
  const [label, setLabel] = useState('')
  const [heading, setHeading] = useState('')
  const [newHeading, setNewHeading] = useState('')

  const persistRef = useRef(persist)
  const getMarkdownRef = useRef(getMarkdown)
  persistRef.current = persist
  getMarkdownRef.current = getMarkdown

  const selected = pins.find((pin) => pin.id === selectedId) ?? null
  const placing = tool === 'pin' && pinAction === 'add'

  useEffect(() => {
    if (tokenSelected) return
    if (selectedId && pins.some((pin) => pin.id === selectedId)) return
    setSelectedId(pins[0]?.id ?? null)
  }, [pins, selectedId, tokenSelected])

  function startAddPin(): void {
    if (pinsLocked && pins.length > 0) return
    onEnterPinTool()
    setPinAction('add')
    setDraft(null)
    setLabel(nextPinLabel(pins))
    setHeading(headings[0] ?? '')
    setNewHeading('')
  }

  function startEditPin(): void {
    if (pinsLocked || pins.length === 0) return
    onEnterPinTool()
    setPinAction('edit')
    setDraft(null)
    const pin = pins.find((item) => item.id === selectedId) ?? pins[0] ?? null
    if (pin) fillForm(pin)
  }

  function startDeletePin(): void {
    if (pinsLocked || pins.length === 0) return
    onEnterPinTool()
    setPinAction('delete')
    setDraft(null)
  }

  function fillForm(pin: MapPin): void {
    setSelectedId(pin.id)
    setLabel(pin.label)
    setHeading(pin.heading)
    setNewHeading(headings.includes(pin.heading) ? '' : pin.heading)
  }

  function addPin(): void {
    const current = dataRef.current
    if (!current || !draft) return
    if (current.pinsLocked && current.pins.length > 0) return
    const headingName = newHeading.trim() || heading.trim() || `Room ${label || nextPinLabel(current.pins)}`
    const pin: MapPin = {
      id: uniquePinId(current.pins, label || headingName),
      x: draft.x,
      y: draft.y,
      label: (label || nextPinLabel(current.pins)).trim(),
      heading: headingName
    }
    persistRef.current({ pins: [...current.pins, pin] }, ensureHeading(getMarkdownRef.current(), headingName))
    setSelectedId(pin.id)
    setDraft(null)
    setLabel(nextPinLabel([...current.pins, pin]))
    setHeading(headings[0] ?? headingName)
    setNewHeading('')
    if (current.pinsLocked && current.pins.length === 0) setPinAction('view')
  }

  function savePin(): void {
    const current = dataRef.current
    if (!current || !selected || current.pinsLocked) return
    const headingName = newHeading.trim() || heading.trim() || selected.heading
    const nextLabel = label.trim() || selected.label
    persistRef.current(
      {
        pins: current.pins.map((pin) =>
          pin.id === selected.id ? { ...pin, label: nextLabel, heading: headingName } : pin
        )
      },
      ensureHeading(getMarkdownRef.current(), headingName)
    )
  }

  function movePin(id: string, x: number, y: number): void {
    const current = dataRef.current
    if (!current) return
    persistRef.current({ pins: current.pins.map((pin) => (pin.id === id ? { ...pin, x, y } : pin)) })
  }

  function deletePin(id: string): void {
    const current = dataRef.current
    if (!current || current.pinsLocked) return
    persistRef.current({ pins: current.pins.filter((pin) => pin.id !== id) })
    if (selectedId === id) setSelectedId(null)
  }

  function togglePinLock(): void {
    const current = dataRef.current
    if (!current) return
    const nextLocked = !current.pinsLocked
    persistRef.current({ pinsLocked: nextLocked })
    if (nextLocked) {
      setPinAction('view')
      setDraft(null)
    }
  }

  function reset(): void {
    setDraft(null)
    setPinAction('view')
  }

  return {
    pinAction,
    setPinAction,
    selectedId,
    setSelectedId,
    selected,
    draft,
    setDraft,
    label,
    setLabel,
    heading,
    setHeading,
    newHeading,
    setNewHeading,
    placing,
    startAddPin,
    startEditPin,
    startDeletePin,
    addPin,
    savePin,
    movePin,
    deletePin,
    togglePinLock,
    fillForm,
    reset
  }
}
