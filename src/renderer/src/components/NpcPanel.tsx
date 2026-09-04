import { useEffect, useMemo, useState } from 'react'
import type { CreateNoteMapImage } from '../../../shared/types'
import type { NpcPortraitRef } from '../../../shared/npcPortraits'
import { npcPortraitUrl, pickNpcPortraitRefs, portraitRaceForList } from '../../../shared/npcPortraits'
import {
  defaultNpcStatId,
  NPC_STAT_OPTIONS,
  type NpcStatOption
} from '../../../shared/npcQuickCreate'
import type { NameStyle } from '../../../shared/npcNames'
import {
  listHasStyleSplits,
  nameListById,
  npcNameCatalog,
  pickNpcNames
} from '../../../shared/npcNames'
import {
  NAME_FLAVOR_OPTIONS,
  nameListForFlavor,
  systemSupportsNameFlavors,
  type NameFlavorId
} from '../../../shared/npcNameFlavors'
import { parseSystemId } from '../../../shared/systemPack'

const ROLL_COUNT = 5

export type NpcQuickCreateInput = {
  name: string
  species: string
  portrait?: Extract<CreateNoteMapImage, { kind: 'npc-portrait' }>
  statBlockId?: string
}

export default function NpcPanel({
  system,
  canCreate,
  hidePortraits,
  onHidePortraitsChange,
  onCreateNpc
}: {
  system?: string | null
  canCreate: boolean
  hidePortraits: boolean
  onHidePortraitsChange: (hide: boolean) => void
  onCreateNpc: (input: NpcQuickCreateInput) => void | Promise<void>
}) {
  const catalog = useMemo(() => npcNameCatalog(system), [system])
  const showStats = parseSystemId(system) === 'dnd5e'
  const showFlavors = systemSupportsNameFlavors(system)
  const [listId, setListId] = useState(catalog.lists[0]?.id ?? '')
  const [flavorId, setFlavorId] = useState<NameFlavorId>('classic')
  const [style, setStyle] = useState<NameStyle>('any')
  const [names, setNames] = useState<string[]>([])
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [portraits, setPortraits] = useState<NpcPortraitRef[]>([])
  const [selectedPortrait, setSelectedPortrait] = useState<NpcPortraitRef | null>(null)
  const [statBlockId, setStatBlockId] = useState(defaultNpcStatId())
  const [copied, setCopied] = useState<string | null>(null)
  const [creating, setCreating] = useState<string | null>(null)

  const raceList = nameListById(catalog, listId)
  const activeFlavor = showFlavors ? flavorId : 'classic'
  const rollList = nameListForFlavor(raceList, activeFlavor)
  const showStyle = listHasStyleSplits(rollList)
  const portraitRace = portraitRaceForList(raceList.id)
  const showPortraitGallery = !hidePortraits

  useEffect(() => {
    setListId(catalog.lists[0]?.id ?? '')
    setFlavorId('classic')
    setStyle('any')
  }, [catalog])

  useEffect(() => {
    if (!showFlavors && flavorId !== 'classic') setFlavorId('classic')
  }, [showFlavors, flavorId])

  useEffect(() => {
    setNames(pickNpcNames(rollList, ROLL_COUNT, showStyle ? style : 'any'))
    setSelectedName(null)
    setCopied(null)
  }, [rollList, showStyle, style])

  useEffect(() => {
    if (!showPortraitGallery) {
      setPortraits([])
      setSelectedPortrait(null)
      return
    }
    const next = pickNpcPortraitRefs(portraitRace, showStyle ? style : 'any')
    setPortraits(next)
    setSelectedPortrait(next[0] ?? null)
  }, [portraitRace, showPortraitGallery, showStyle, style, raceList.id])

  function rollNames(): void {
    setNames(pickNpcNames(rollList, ROLL_COUNT, showStyle ? style : 'any'))
    setSelectedName(null)
    setCopied(null)
  }

  function rollPortraits(): void {
    const next = pickNpcPortraitRefs(portraitRace, showStyle ? style : 'any', 4, portraits)
    setPortraits(next)
    setSelectedPortrait(next[0] ?? null)
  }

  async function copyName(name: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(name)
      setCopied(name)
    } catch {
      setCopied(null)
    }
  }

  function portraitPayload(ref: NpcPortraitRef): Extract<CreateNoteMapImage, { kind: 'npc-portrait' }> {
    return { kind: 'npc-portrait', race: ref.race, gender: ref.gender, id: ref.id }
  }

  async function createNpc(name: string): Promise<void> {
    if (!canCreate) return
    if (showPortraitGallery && !selectedPortrait) return
    setCreating(name)
    try {
      await onCreateNpc({
        name,
        species: raceList.label,
        portrait: showPortraitGallery && selectedPortrait ? portraitPayload(selectedPortrait) : undefined,
        statBlockId: showStats ? statBlockId : undefined
      })
    } finally {
      setCreating(null)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-2 border-b border-line px-3 py-2">
        <label className="block text-[11px] uppercase tracking-wider text-muted">
          {catalog.pickerLabel}
          <select
            value={raceList.id}
            onChange={(event) => setListId(event.target.value)}
            className="mt-1 w-full rounded border border-line bg-ink px-2 py-1.5 text-sm text-parchment outline-none focus:border-amber"
          >
            {catalog.lists.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </select>
        </label>
        {showFlavors ? (
          <label className="block text-[11px] uppercase tracking-wider text-muted">
            Name flavor
            <select
              value={flavorId}
              onChange={(event) => setFlavorId(event.target.value as NameFlavorId)}
              className="mt-1 w-full rounded border border-line bg-ink px-2 py-1.5 text-sm text-parchment outline-none focus:border-amber"
            >
              {NAME_FLAVOR_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {showStyle ? (
          <label className="block text-[11px] uppercase tracking-wider text-muted">
            Style
            <select
              value={style}
              onChange={(event) => setStyle(event.target.value as NameStyle)}
              className="mt-1 w-full rounded border border-line bg-ink px-2 py-1.5 text-sm text-parchment outline-none focus:border-amber"
            >
              <option value="any">Any</option>
              <option value="feminine">Feminine</option>
              <option value="masculine">Masculine</option>
            </select>
          </label>
        ) : null}
        {showStats ? (
          <label className="block text-[11px] uppercase tracking-wider text-muted">
            Stat block
            <select
              value={statBlockId}
              onChange={(event) => setStatBlockId(event.target.value)}
              className="mt-1 w-full rounded border border-line bg-ink px-2 py-1.5 text-sm text-parchment outline-none focus:border-amber"
            >
              {NPC_STAT_OPTIONS.map((option: NpcStatOption) => (
                <option key={option.id} value={option.id}>
                  {option.label} ({option.hint})
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="flex items-start gap-2 text-[12px] text-parchment/90">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={hidePortraits}
            onChange={(event) => onHidePortraitsChange(event.target.checked)}
          />
          <span>
            <span className="font-semibold text-parchment">Hide bundled artwork here</span>
            <span className="mt-0.5 block text-[11px] leading-snug text-muted">
              Same as <strong>Help & settings → Settings → Artwork</strong>. Hides AI picks, Lookup SRD art, and bundled
              sheet portraits.
            </span>
          </span>
        </label>
        <button
          type="button"
          onClick={rollNames}
          className="rounded border border-line px-3 py-1 text-sm hover:border-amber"
        >
          Roll names
        </button>
      </div>

      <ul className="min-h-0 flex-1 overflow-auto p-3">
        {names.map((name, index) => {
          const selected = selectedName === name
          return (
            <li
              key={`${name}-${index}`}
              className={`mb-2 rounded border px-2 py-2 last:mb-0 ${
                selected ? 'border-amber bg-amber/5' : 'border-line bg-panel-2'
              }`}
            >
              <button
                type="button"
                onClick={() => setSelectedName(name)}
                className="w-full text-left font-display text-base text-amber"
              >
                {name}
              </button>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void copyName(name)}
                  className="rounded border border-line px-2 py-0.5 text-[11px] hover:border-amber"
                >
                  {copied === name ? 'Copied' : 'Copy'}
                </button>
                <button
                  type="button"
                  disabled={!canCreate || creating !== null || (showPortraitGallery && !selectedPortrait)}
                  title={canCreate ? 'Create an NPCs/ sheet with this name' : 'Open a campaign first'}
                  onClick={() => void createNpc(name)}
                  className="rounded border border-line px-2 py-0.5 text-[11px] hover:border-amber disabled:opacity-50"
                >
                  {creating === name ? 'Creating…' : 'New NPC…'}
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      {showPortraitGallery ? (
        <div className="shrink-0 border-t border-line px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted">AI portrait picks</p>
              <p className="mt-0.5 text-[10px] leading-snug text-muted">
                Bundled AI-generated art — swap later on the sheet if you prefer.
              </p>
            </div>
            <button
              type="button"
              onClick={rollPortraits}
              className="rounded border border-line px-2 py-0.5 text-[11px] hover:border-amber"
            >
              Reroll portraits
            </button>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {portraits.map((ref) => {
              const selected =
                selectedPortrait?.race === ref.race &&
                selectedPortrait?.gender === ref.gender &&
                selectedPortrait?.id === ref.id
              return (
                <button
                  key={`${ref.race}-${ref.gender}-${ref.id}`}
                  type="button"
                  onClick={() => setSelectedPortrait(ref)}
                  className={`overflow-hidden rounded border bg-panel-2 ${
                    selected ? 'border-amber ring-1 ring-amber/60' : 'border-line hover:border-amber'
                  }`}
                  title={`${ref.race} ${ref.gender} ${ref.id}`}
                >
                  <img
                    src={npcPortraitUrl(ref)}
                    alt=""
                    className="aspect-[3/4] w-full object-cover"
                  />
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
