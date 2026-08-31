import { useEffect, useRef, useState, type Dispatch, type MutableRefObject, type SetStateAction } from 'react'
import { creatureSpaceFromMarkdown, type CreatureSpace, type MapNoteData, type MapToken } from '../lib/mapNote'
import type { MapTool, PickerTab, TokenPick } from '../components/MapViewHelpers'

export interface CreatureSpaces {
  /** Creature size keyed by note path, resolved from token/catalog sheets. */
  spaceBySource: Record<string, CreatureSpace>
  setSpaceBySource: Dispatch<SetStateAction<Record<string, CreatureSpace>>>
}

/**
 * Resolves creature sizes for the current map's tokens and (while the token tool
 * is active) the placement catalog, reading each sheet's statblock. When a
 * placed token's size no longer matches its sheet, `persistTokenSpaces` is
 * called with the corrected token list so the map note stays in sync.
 */
export function useCreatureSpaces(opts: {
  path: string
  tool: MapTool
  dataRef: MutableRefObject<MapNoteData | null>
  catalogRef: MutableRefObject<Record<PickerTab, TokenPick[]>>
  persistTokenSpaces: (tokens: MapToken[]) => void
}): CreatureSpaces {
  const { path, tool, dataRef, catalogRef } = opts
  const [spaceBySource, setSpaceBySource] = useState<Record<string, CreatureSpace>>({})
  const persistRef = useRef(opts.persistTokenSpaces)
  persistRef.current = opts.persistTokenSpaces

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
        persistRef.current(next)
      }
    }
    void syncSpaces()
    return () => {
      cancelled = true
    }
  }, [path, dataRef])

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
  }, [tool, catalogRef])

  return { spaceBySource, setSpaceBySource }
}
