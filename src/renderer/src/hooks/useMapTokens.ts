import { useEffect, useMemo, useRef, useState, type Dispatch, type MutableRefObject, type SetStateAction } from 'react'
import {
  TOKEN_SCALE_DEFAULT,
  clamp01,
  clampTokenScale,
  creatureSpaceFromMarkdown,
  uniquePinId,
  type CreatureSpace,
  type MapNoteData,
  type MapToken
} from '../lib/mapNote'
import type { PickerTab, TokenPick } from '../components/MapViewHelpers'

export interface MapTokens {
  selectedTokenId: string | null
  selectedTokenIds: string[]
  setSelectedTokenId: (id: string | null) => void
  toggleTokenSelected: (id: string) => void
  selectAllTokens: () => void
  selectedToken: MapToken | null
  selectedTokens: MapToken[]
  pendingToken: TokenPick | null
  setPendingToken: Dispatch<SetStateAction<TokenPick | null>>
  pickerTab: PickerTab
  setPickerTab: Dispatch<SetStateAction<PickerTab>>
  tokenQuery: string
  setTokenQuery: Dispatch<SetStateAction<string>>
  scaleDraft: number | null
  setScaleDraft: Dispatch<SetStateAction<number | null>>
  /** Latest draft scale; for live-view / wheel readers that must skip a render. */
  scaleDraftRef: MutableRefObject<number | null>
  tokenScale: number
  filteredPicks: TokenPick[]
  addToken: (point: { x: number; y: number }) => void
  moveToken: (id: string, x: number, y: number) => void
  deleteToken: (id: string) => void
  deleteTokens: (ids: string[]) => void
  setTokenCombatantId: (id: string, combatantId: string) => void
  setTokenCombatantIds: (links: { id: string; combatantId: string }[]) => void
  /** Update the draft and persist after a short debounce. */
  setScale: (size: number) => void
  /** Update the draft and persist immediately (two-click scale / Shift+scroll). */
  applyScaleNow: (size: number, anchor?: { x: number; y: number }) => void
  pickToken: (item: TokenPick) => void
  /** Clear placement / selection / scale draft (call when the open map changes). */
  reset: () => void
}

/**
 * Owns map-token selection, the placement picker, 5 ft cell size, and token CRUD.
 * Persistence is injected so the caller can write tokens/scale through the
 * shared map-note commit path (including current fog).
 */
export function useMapTokens(opts: {
  tokens: MapToken[]
  tokenScale: number | undefined
  dataRef: MutableRefObject<MapNoteData | null>
  catalog: Record<PickerTab, TokenPick[]>
  spaceBySource: Record<string, CreatureSpace>
  setSpaceBySource: Dispatch<SetStateAction<Record<string, CreatureSpace>>>
  persist: (partial: { tokens?: MapToken[]; tokenScale?: number; gridX?: number; gridY?: number }) => void
  onDeselectPins: () => void
}): MapTokens {
  const {
    tokens,
    tokenScale: storedScale,
    dataRef,
    catalog,
    spaceBySource,
    setSpaceBySource,
    persist,
    onDeselectPins
  } = opts

  const [selectedTokenIds, setSelectedTokenIds] = useState<string[]>([])
  const [pendingToken, setPendingToken] = useState<TokenPick | null>(null)
  const [pickerTab, setPickerTab] = useState<PickerTab>('pc')
  const [tokenQuery, setTokenQuery] = useState('')
  const [scaleDraft, setScaleDraft] = useState<number | null>(null)
  const scaleDraftRef = useRef<number | null>(null)
  const scaleTimer = useRef<number | null>(null)
  const persistRef = useRef(persist)
  const onDeselectPinsRef = useRef(onDeselectPins)
  persistRef.current = persist
  onDeselectPinsRef.current = onDeselectPins
  scaleDraftRef.current = scaleDraft

  const tokenScale = scaleDraft ?? storedScale ?? TOKEN_SCALE_DEFAULT
  const selectedTokenId = selectedTokenIds[selectedTokenIds.length - 1] ?? null
  const selectedTokens = selectedTokenIds
    .map((id) => tokens.find((token) => token.id === id))
    .filter((token): token is MapToken => Boolean(token))
  const selectedToken = selectedTokens[selectedTokens.length - 1] ?? null

  function setSelectedTokenId(id: string | null): void {
    setSelectedTokenIds(id ? [id] : [])
  }

  function toggleTokenSelected(id: string): void {
    setSelectedTokenIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  function selectAllTokens(): void {
    setSelectedTokenIds(tokens.map((token) => token.id))
  }

  const filteredPicks = useMemo(() => {
    const q = tokenQuery.trim().toLowerCase()
    const list = catalog[pickerTab].map((item) => ({
      ...item,
      space: spaceBySource[item.source] ?? item.space
    }))
    if (!q) return list
    return list.filter((item) => item.label.toLowerCase().includes(q))
  }, [catalog, pickerTab, tokenQuery, spaceBySource])

  useEffect(() => {
    setSelectedTokenIds((prev) => {
      const next = prev.filter((id) => tokens.some((token) => token.id === id))
      return next.length === prev.length ? prev : next
    })
  }, [tokens])

  useEffect(() => {
    return () => {
      if (scaleTimer.current) window.clearTimeout(scaleTimer.current)
    }
  }, [])

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
    persistRef.current({ tokens: [...current.tokens, token] })
    setSelectedTokenIds([token.id])
    onDeselectPinsRef.current()
  }

  function moveToken(id: string, x: number, y: number): void {
    const current = dataRef.current
    if (!current) return
    persistRef.current({
      tokens: current.tokens.map((token) => (token.id === id ? { ...token, x, y } : token))
    })
  }

  function deleteToken(id: string): void {
    deleteTokens([id])
  }

  function deleteTokens(ids: string[]): void {
    const current = dataRef.current
    if (!current || ids.length === 0) return
    const remove = new Set(ids)
    persistRef.current({ tokens: current.tokens.filter((token) => !remove.has(token.id)) })
    setSelectedTokenIds((prev) => prev.filter((id) => !remove.has(id)))
  }

  function setTokenCombatantId(id: string, combatantId: string): void {
    setTokenCombatantIds([{ id, combatantId }])
  }

  function setTokenCombatantIds(links: { id: string; combatantId: string }[]): void {
    const current = dataRef.current
    if (!current || links.length === 0) return
    const byId = new Map(links.map((link) => [link.id, link.combatantId]))
    persistRef.current({
      tokens: current.tokens.map((token) => {
        const combatantId = byId.get(token.id)
        return combatantId ? { ...token, combatantId } : token
      })
    })
  }

  function setScale(size: number): void {
    const next = clampTokenScale(size)
    const current = dataRef.current
    if (!current) return
    setScaleDraft(next)
    if (scaleTimer.current) window.clearTimeout(scaleTimer.current)
    scaleTimer.current = window.setTimeout(() => {
      persistRef.current({ tokenScale: next })
    }, 150)
  }

  function applyScaleNow(size: number, anchor?: { x: number; y: number }): void {
    const next = clampTokenScale(size)
    const current = dataRef.current
    if (!current) return
    if (scaleTimer.current) window.clearTimeout(scaleTimer.current)
    setScaleDraft(next)
    persistRef.current({
      tokenScale: next,
      ...(anchor ? { gridX: clamp01(anchor.x), gridY: clamp01(anchor.y) } : {})
    })
  }

  function pickToken(item: TokenPick): void {
    const space = spaceBySource[item.source] ?? item.space
    setPendingToken({ ...item, space })
    if (spaceBySource[item.source]) return
    void window.tabledm
      .readFile(item.source)
      .then((text) => {
        const nextSpace = creatureSpaceFromMarkdown(text)
        setSpaceBySource((prev) => ({ ...prev, [item.source]: nextSpace }))
        setPendingToken((prev) => (prev?.source === item.source ? { ...prev, space: nextSpace } : prev))
      })
      .catch(() => undefined)
  }

  function reset(): void {
    setPendingToken(null)
    setSelectedTokenIds([])
    setScaleDraft(null)
  }

  return {
    selectedTokenId,
    selectedTokenIds,
    setSelectedTokenId,
    toggleTokenSelected,
    selectAllTokens,
    selectedToken,
    selectedTokens,
    pendingToken,
    setPendingToken,
    pickerTab,
    setPickerTab,
    tokenQuery,
    setTokenQuery,
    scaleDraft,
    setScaleDraft,
    scaleDraftRef,
    tokenScale,
    filteredPicks,
    addToken,
    moveToken,
    deleteToken,
    deleteTokens,
    setTokenCombatantId,
    setTokenCombatantIds,
    setScale,
    applyScaleNow,
    pickToken,
    reset
  }
}
