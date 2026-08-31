import { useEffect, useMemo, useRef, useState } from 'react'
import { isHoloPortraitPath, isStartHerePath, pathHasFolder } from '../../../shared/campaignLayout'
import { holoPortraitsEnabled, type ThemeId } from '../../../shared/theme'
import type { CampaignInfo, Character, CreateNoteMapImage, PlayerMapView } from '../../../shared/types'
import type { AudioTrack } from '../../../shared/audio'
import {
  imageTitle,
  prepareNoteMarkdown,
  type CampaignImage,
  type CampaignVideo
} from '../lib/images'
import {
  combatantLabel,
  flattenNotes,
  headingId,
  linkWikiNotes,
  parseNightEncounters,
  partyNotes,
  type CampaignNote,
  type NightEncounter
} from '../lib/notes'
import { extractStatblock, fallbackStatblock, isNpcSheet, type ParsedStatblock } from '../lib/statblock'
import { isMapNote, mapImagePath } from '../lib/mapNote'
import GettingStarted from './GettingStarted'
import StartHereTheme from './StartHereTheme'
import MapView from './MapView'
import ItemSheet from './ItemSheet'
import NpcSheet from './NpcSheet'
import { CharacterCard } from './StatBlock'
import { createSessionNoteMarkdown } from './SessionNoteMarkdown'
import { useOpeningSequenceCards } from '../hooks/useOpeningSequenceCards'
import { useNoteBlockEditing } from '../hooks/useNoteBlockEditing'
import { useShopStock } from '../hooks/useShopStock'
import { useNoteAutosave } from '../hooks/useNoteAutosave'
import type { FileKind } from './CampaignFiles'
import { looksLikeShopNote } from '../../../shared/shopStock'
import { buildBlockIndex } from '../../../shared/blockIndex'

interface Heading {
  id: string
  text: string
  level: number
}

export interface EncounterAddItem {
  block: ParsedStatblock
  kind: 'pc' | 'npc' | 'monster'
  sourceId: string
  name: string
}

function headingsFrom(markdown: string): Heading[] {
  return markdown
    .split('\n')
    .map((line) => {
      const match = /^(#{1,3})\s+(.+)$/.exec(line.trim())
      if (!match) return null
      const text = match[2].replace(/[#*_`]/g, '').trim()
      return {
        id: headingId(text),
        text,
        level: match[1].length
      }
    })
    .filter((h): h is Heading => Boolean(h))
}

export default function SessionNotes({
  path,
  kind,
  imageUrl,
  images,
  notes,
  selectedImage,
  disabled,
  onSelectImage,
  onShowToPlayers,
  onPlayCrawl,
  onStopCrawl,
  activeCrawl,
  playerCrawl,
  onPlayLegend,
  onStopLegend,
  activeLegend,
  playerLegend,
  onPlayGallery,
  onStopGallery,
  onGalleryPrev,
  onGalleryNext,
  activeGallery,
  playerGallery,
  onPlayVideo,
  onStopVideo,
  activeVideo,
  playerVideo,
  videos,
  musicTracks,
  onMapLiveView,
  onOpenNote,
  onBack,
  backLabel,
  onNext,
  nextLabel,
  onAddNpcToCombat,
  onAddEncounter,
  onNewCampaign,
  onOpenCampaign,
  onOpenSample,
  recentCampaigns,
  onOpenRecent,
  onCampaignChange,
  shopsEnabled = true,
  theme,
  onThemeChange,
  holoPortraits = false,
  digitalRain = false,
  onHoloPortraitsChange,
  onDigitalRainChange,
  currencies,
  system,
  onEnsureGear,
  onEnsureMonster
}: {
  path: string
  kind: FileKind
  imageUrl?: string
  images: CampaignImage[]
  notes?: CampaignNote[]
  selectedImage?: string | null
  disabled?: boolean
  onSelectImage?: (path: string) => void
  onShowToPlayers?: (options?: {
    includeSecrets?: boolean
    markdown?: string
    mode?: 'art' | 'handout'
  }) => void
  onPlayCrawl?: (
    title: string | undefined,
    body: string,
    logoSrc?: string | null,
    preface?: string | null,
    musicPath?: string | null,
    endSrc?: string | null
  ) => void
  onStopCrawl?: () => void
  activeCrawl?: { title?: string; body: string } | null
  playerCrawl?: import('../../../shared/types').PlayerCrawl | null
  onPlayLegend?: (
    title: string | undefined,
    body: string,
    logoSrc?: string | null,
    preface?: string | null,
    musicPath?: string | null,
    endSrc?: string | null,
    look?: import('../../../shared/types').LegendLookId
  ) => void
  onStopLegend?: () => void
  activeLegend?: { title?: string; body: string } | null
  playerLegend?: import('../../../shared/types').PlayerLegend | null
  onPlayGallery?: (
    title: string | undefined,
    slides: { src: string; label?: string }[],
    imageRefs: string[],
    intervalSec?: number | null,
    loop?: boolean,
    showTitle?: boolean
  ) => void
  onStopGallery?: () => void
  onGalleryPrev?: () => void
  onGalleryNext?: () => void
  activeGallery?: { title?: string; imageRefs: string[] } | null
  playerGallery?: import('../../../shared/types').PlayerGallery | null
  onPlayVideo?: (title: string | undefined, src: string, muted: boolean, videoRef: string) => void
  onStopVideo?: () => void
  activeVideo?: { title?: string; videoRef: string } | null
  playerVideo?: import('../../../shared/types').PlayerVideo | null
  videos?: CampaignVideo[]
  musicTracks?: AudioTrack[]
  onMapLiveView?: (imagePath: string, view: PlayerMapView) => void
  onOpenNote?: (path: string) => void
  onBack?: () => void
  backLabel?: string
  onNext?: () => void
  nextLabel?: string
  onAddNpcToCombat?: (block: ParsedStatblock, notePath: string) => void
  onAddEncounter?: (items: EncounterAddItem[]) => void
  onNewCampaign?: () => void
  onOpenCampaign?: () => void
  onOpenSample?: () => void
  recentCampaigns?: import('../../../shared/types').RecentCampaign[]
  onOpenRecent?: (folder: string) => void
  onCampaignChange?: (campaign: CampaignInfo) => void
  shopsEnabled?: boolean
  theme?: ThemeId
  onThemeChange?: (theme: ThemeId) => void
  holoPortraits?: boolean
  digitalRain?: boolean
  onHoloPortraitsChange?: (enabled: boolean) => void
  onDigitalRainChange?: (enabled: boolean) => void
  currencies?: import('../../../shared/currencies').CampaignCurrency[]
  system?: string | null
  onEnsureGear?: (
    record: import('../lib/srd').SrdRecord
  ) => Promise<'added' | 'exists' | void> | 'added' | 'exists' | void
  onEnsureMonster?: (
    record: import('../lib/srd').SrdRecord
  ) => Promise<'added' | 'exists' | void> | 'added' | 'exists' | void
}) {
  const [markdown, setMarkdown] = useState('')
  const [original, setOriginal] = useState('')
  const [character, setCharacter] = useState<Character | null>(null)
  const [editing, setEditing] = useState(false)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [saveError, setSaveError] = useState('')
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [showLinks, setShowLinks] = useState(false)
  const editorRef = useRef<HTMLTextAreaElement | null>(null)
  const markdownRef = useRef('')
  const originalRef = useRef('')
  const pathRef = useRef(path)
  markdownRef.current = markdown
  originalRef.current = original
  const dirty = markdown !== original
  const noteIndex = notes ?? flattenNotes([])
  const rendered = useMemo(() => {
    const withImages = prepareNoteMarkdown(markdown, path, images)
    return linkWikiNotes(withImages, path, noteIndex)
  }, [markdown, path, images, noteIndex])
  const parsedNpc = useMemo(() => {
    const extracted = extractStatblock(markdown)
    if (extracted) return extracted
    if (kind === 'note' && isNpcSheet(markdown, path)) {
      return { block: fallbackStatblock(path, markdown), rest: markdown }
    }
    return null
  }, [kind, markdown, path])
  const npcMode = Boolean(parsedNpc && kind === 'note' && !editing && isNpcSheet(markdown, path))
  const itemMode =
    kind === 'note' &&
    Boolean(path) &&
    !editing &&
    (pathHasFolder(path, 'gear') ||
      pathHasFolder(path, 'spells') ||
      pathHasFolder(path, 'places') ||
      pathHasFolder(path, 'factions'))
  const sheetChrome = npcMode || itemMode
  const mapMode = kind === 'note' && !editing && isMapNote(markdown)
  const mapImage = useMemo(
    () => (kind === 'note' && isMapNote(markdown) ? mapImagePath(markdown, path, images) : null),
    [kind, markdown, path, images]
  )
  const headings = useMemo(() => headingsFrom(markdown), [markdown])
  const encounters = useMemo(
    () => (kind === 'note' && !editing ? parseNightEncounters(markdown, path, noteIndex) : []),
    [kind, editing, markdown, path, noteIndex]
  )
  const blockIndex = useMemo(() => buildBlockIndex(markdown), [markdown])
  const blockEditEnabled = kind === 'note' && !editing && !sheetChrome && !mapMode
  const { editingBlocks, toggleBlockEdit, saveSheetBlock, insertSheetBlock, deleteSheetBlock, resetBlockEditing } =
    useNoteBlockEditing({
      markdownRef,
      blockIndex,
      currencies,
      persistMarkdown: (next) => persistShopMarkdown(next)
    })
  const { rerollShopStock, changeShopStock, changeShopStanding } = useShopStock({
    path,
    markdownRef,
    persistMarkdown: (next) => persistShopMarkdown(next)
  })

  const { commitSave, flushOpenNote } = useNoteAutosave({
    markdownRef,
    originalRef,
    pathRef,
    setOriginal,
    setSaveError,
    onCampaignChange,
    onOpenNote
  })

  useEffect(() => {
    const prevPath = pathRef.current
    if (prevPath && prevPath !== path) {
      void flushOpenNote(prevPath)
    }
    pathRef.current = path
    setEditing(false)
    resetBlockEditing()
    setConfirmDiscard(false)
    setSaveError('')
    setShowLinks(false)
    setCharacter(null)
    if (!path || kind === 'image' || kind === 'pdf' || kind === 'audio' || kind === 'other') {
      setMarkdown('')
      setOriginal('')
      return
    }
    let alive = true
    window.tabledm.readFile(path).then((text) => {
      if (!alive) return
      if (kind === 'character') {
        try {
          const data = JSON.parse(text) as Character
          setCharacter(data)
          setMarkdown('')
          setOriginal('')
        } catch {
          setMarkdown(text)
          setOriginal(text)
        }
        return
      }
      setMarkdown(text)
      setOriginal(text)
    })
    return () => {
      alive = false
    }
  }, [path, kind])

  useEffect(() => {
    if (editing) editorRef.current?.focus()
  }, [editing])

  useEffect(() => {
    if (!editing) return
    const onKey = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        void save()
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        requestCloseEditor()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editing, markdown, path])

  async function save(): Promise<void> {
    if (!path) return
    try {
      const savedPath = await commitSave(path, markdown)
      if (!savedPath) {
        setSaveError('Could not save this file.')
        return
      }
      setOriginal(markdown)
      setSaveError('')
      setEditing(false)
      setConfirmDiscard(false)
    } catch {
      setSaveError('Could not save this file.')
    }
  }

  function discardEdits(): void {
    setMarkdown(original)
    setEditing(false)
    setConfirmDiscard(false)
    setSaveError('')
  }

  function requestCloseEditor(): void {
    if (markdown !== original) {
      setConfirmDiscard(true)
      return
    }
    setEditing(false)
  }

  const sequenceCards = useOpeningSequenceCards({
    path,
    images,
    markdownRef,
    persistMarkdown: (next) => persistShopMarkdown(next),
    onCampaignChange,
    onPlayCrawl,
    onPlayLegend,
    onPlayGallery,
    onPlayVideo
  })

  async function persistShopMarkdown(next: string): Promise<void> {
    if (!path) return
    const savedPath = await commitSave(path, next)
    if (!savedPath) return
    setMarkdown(next)
    setOriginal(next)
    markdownRef.current = next
    originalRef.current = next
  }

  function jump(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function addEncounter(encounter: NightEncounter): Promise<void> {
    if (!onAddEncounter) return
    setAddingId(encounter.id)
    try {
      const refs = [...encounter.combatants]
      for (const pc of partyNotes(path, noteIndex)) {
        if (!refs.some((c) => c.notePath === pc.relativePath)) {
          refs.push({ notePath: pc.relativePath, name: pc.stem, count: 1, kind: 'pc' })
        }
      }
      const items: EncounterAddItem[] = []
      for (const ref of refs) {
        const text = await window.tabledm.readFile(ref.notePath)
        const parsed = extractStatblock(text)?.block ?? fallbackStatblock(ref.notePath, text)
        for (let i = 1; i <= ref.count; i += 1) {
          const sourceId = ref.count > 1 ? `${ref.notePath}#${i}` : ref.notePath
          const label = combatantLabel(ref.kind, ref.name, parsed.name)
          const name = ref.count > 1 ? `${label} ${i}` : label
          items.push({ block: parsed, kind: ref.kind, sourceId, name })
        }
      }
      onAddEncounter(items)
    } finally {
      setAddingId(null)
    }
  }

  useEffect(() => {
    if (mapImage) onSelectImage?.(mapImage)
  }, [mapImage, onSelectImage])

  async function saveMapMarkdown(next: string): Promise<void> {
    setMarkdown(next)
    markdownRef.current = next
    try {
      const savedPath = await commitSave(path, next)
      if (!savedPath) {
        setSaveError('Could not save this file.')
        return
      }
      originalRef.current = next
      setOriginal(next)
      setSaveError('')
    } catch {
      setSaveError('Could not save this file.')
    }
  }

  const canShowArt = Boolean(onShowToPlayers && (kind === 'image' || selectedImage || mapImage))
  const canShowItem = Boolean(onShowToPlayers && itemMode)
  const handoutButtonLabel = pathHasFolder(path, 'spells')
    ? 'Show spell to players'
    : pathHasFolder(path, 'places')
      ? 'Show place to players'
      : pathHasFolder(path, 'factions')
        ? 'Show faction to players'
        : 'Show item to players'

  const { renderDocument, renderMarkdown } = createSessionNoteMarkdown({
    markdown,
    path,
    images,
    noteIndex,
    selectedImage,
    theme,
    disabled,
    musicTracks,
    videos,
    encounters,
    addingId,
    onOpenNote,
    onSelectImage,
    onAddEncounter,
    onAddEncounterClick: (encounter) => void addEncounter(encounter),
    activeCrawl,
    playerCrawl,
    onStopCrawl,
    onPlayCrawl,
    ...sequenceCards,
    activeLegend,
    playerLegend,
    onStopLegend,
    onPlayLegend,
    activeGallery,
    playerGallery,
    onStopGallery,
    onGalleryPrev,
    onGalleryNext,
    onPlayGallery,
    activeVideo,
    playerVideo,
    onStopVideo,
    onPlayVideo,
    blockEditEnabled,
    blockIndex,
    editingBlocks,
    onBlockEdit: toggleBlockEdit,
    onBlockDone: toggleBlockEdit,
    onBlockSave: (key, replacement) => void saveSheetBlock(key, replacement),
    onBlockInsert: (key, position, kind) => void insertSheetBlock(key, position, kind),
    onBlockDelete: (key) => void deleteSheetBlock(key),
    currencies,
    system,
    onEnsureGear,
    onEnsureMonster,
    gearNotes: noteIndex
  })

  return (
    <section
      className={`matrix-rain-well relative z-[1] flex min-h-0 flex-1 flex-col ${
        theme === 'matrix' && digitalRain ? 'bg-transparent' : 'bg-panel'
      }`}
    >
      <header className="border-b border-line bg-panel px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {onBack ? (
              <button
                type="button"
                title={backLabel ? `Back to ${backLabel}` : 'Back'}
                onClick={onBack}
                className="shrink-0 rounded border border-line px-2 py-1 text-xs hover:border-amber"
              >
                ← Back
              </button>
            ) : null}
            {onNext ? (
              <button
                type="button"
                title={nextLabel ? `Next: ${nextLabel}` : 'Next'}
                onClick={onNext}
                className="shrink-0 rounded border border-line px-2 py-1 text-xs hover:border-amber"
              >
                Next →
              </button>
            ) : null}
            {sheetChrome ? (
              path ? (
                <span className="min-w-0 truncate text-[11px] text-muted">{path.split(/[\\/]/)[0]}</span>
              ) : null
            ) : (
              <h2 className="min-w-0 truncate font-display text-lg text-amber">
                {path ? imageTitle(path).replace(/^PC\s+[—–-]\s+/i, '') : 'Notes'}
                {dirty ? <span className="ml-2 text-xs font-sans text-amber-dim">unsaved</span> : null}
              </h2>
            )}
          </div>
          <div className="flex items-center gap-2">
            {kind === 'note' && path && headings.length > 0 && !editing && !sheetChrome && !mapMode ? (
              <button
                type="button"
                onClick={() => setShowLinks((open) => !open)}
                className={`rounded px-2.5 py-1 text-xs ${
                  showLinks ? 'bg-amber font-semibold text-on-amber' : 'border border-line hover:border-amber'
                }`}
              >
                Links
              </button>
            ) : null}
            {kind === 'note' && path ? (
              editing ? (
                <>
                  <button
                    type="button"
                    onClick={requestCloseEditor}
                    className="rounded border border-line px-2.5 py-1 text-xs hover:border-amber"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => void save()}
                    className="rounded bg-amber px-2.5 py-1 text-xs font-semibold text-on-amber disabled:bg-line"
                  >
                    Save
                  </button>
                </>
              ) : (
                <>
                  {shopsEnabled && pathHasFolder(path, 'places') && looksLikeShopNote(markdown) ? (
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => void rerollShopStock()}
                      className="rounded border border-line px-2.5 py-1 text-xs hover:border-amber"
                    >
                      Reroll stock
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => setEditing(true)}
                    className="rounded border border-line px-2.5 py-1 text-xs hover:border-amber"
                  >
                    Edit
                  </button>
                </>
              )
            ) : null}
            {canShowArt ? (
              <button
                type="button"
                title="Show the selected art only (Alt+S)"
                onClick={() => onShowToPlayers?.({ mode: 'art', markdown })}
                className="rounded bg-amber px-2.5 py-1 text-xs font-semibold text-on-amber"
              >
                {itemMode ? 'Show art to players' : 'Show to players'}
              </button>
            ) : null}
            {canShowItem ? (
              <button
                type="button"
                title="Show art and item details. Shift+click includes GM-only notes (Alt+I)."
                onClick={(event) =>
                  onShowToPlayers?.({
                    mode: 'handout',
                    includeSecrets: event.shiftKey,
                    markdown
                  })
                }
                className="rounded border border-amber px-2.5 py-1 text-xs font-semibold text-amber hover:bg-amber/10"
              >
                {handoutButtonLabel}
              </button>
            ) : null}
          </div>
        </div>
        {path && !sheetChrome ? <div className="truncate text-[11px] text-muted">{path}</div> : null}
      </header>

      {kind === 'note' && headings.length > 0 && !editing && !sheetChrome && !mapMode && showLinks ? (
        <nav className="max-h-28 overflow-auto border-b border-line px-3 py-2 text-xs">
          {headings.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => jump(h.id)}
              className="block w-full truncate text-left text-muted hover:text-amber"
              style={{ paddingLeft: (h.level - 1) * 10 }}
            >
              {h.text}
            </button>
          ))}
        </nav>
      ) : null}

      {editing ? (
        <div className="flex min-h-0 flex-1 flex-col p-3 pt-2">
          <p className="mb-2 text-[11px] text-muted">Markdown · Ctrl+S saves · Esc cancels</p>
          {saveError ? <p className="mb-2 text-[11px] text-blood">{saveError}</p> : null}
          <textarea
            ref={editorRef}
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Tab') return
              e.preventDefault()
              const el = e.currentTarget
              const start = el.selectionStart
              const end = el.selectionEnd
              const next = `${markdown.slice(0, start)}  ${markdown.slice(end)}`
              setMarkdown(next)
              requestAnimationFrame(() => {
                el.selectionStart = el.selectionEnd = start + 2
              })
            }}
            spellCheck
            className="min-h-0 flex-1 resize-none rounded border border-line bg-ink p-3 font-mono text-[13px] leading-relaxed text-parchment outline-none focus:border-amber"
          />
        </div>
      ) : mapMode ? (
        <MapView
          key={path}
          markdown={markdown}
          path={path}
          images={images}
          notes={noteIndex}
          onChange={(next) => void saveMapMarkdown(next)}
          onLiveView={onMapLiveView}
          renderRoom={(text) => (
            <div className="markdown-body">
              {renderMarkdown(
                linkWikiNotes(
                  prepareNoteMarkdown(text, path, images, { injectPortrait: false }),
                  path,
                  noteIndex
                ),
                'map-room'
              )}
            </div>
          )}
        />
      ) : (
      <div className="min-h-0 flex-1 overflow-auto p-3">
        {!path ? (
          <GettingStarted
            hasCampaign={!disabled}
            onNewCampaign={onNewCampaign}
            onOpenCampaign={onOpenCampaign}
            onOpenSample={onOpenSample}
            recentCampaigns={recentCampaigns}
            onOpenRecent={onOpenRecent}
          />
        ) : kind === 'image' && imageUrl ? (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <img src={imageUrl} alt={imageTitle(path)} className="max-h-[70vh] max-w-full object-contain" />
            <p className="text-xs text-muted">Selected — press Show to players to put this on the second monitor.</p>
          </div>
        ) : kind === 'pdf' && imageUrl ? (
          <iframe
            title={imageTitle(path)}
            src={`${imageUrl}#navpanes=0&pagemode=none`}
            className="h-full min-h-[70vh] w-full rounded border border-line bg-ink"
          />
        ) : kind === 'audio' && imageUrl ? (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <p className="text-sm text-parchment">{imageTitle(path)}</p>
            <audio controls src={imageUrl} className="w-full max-w-md" />
            <p className="text-xs text-muted">Preview only — play table audio from the Music panel.</p>
          </div>
        ) : kind === 'other' ? (
          <p className="text-sm text-muted">No preview for this file type.</p>
        ) : kind === 'character' && character ? (
          <div className="mx-auto max-w-sm space-y-3">
            <CharacterCard character={character} />
            {character.notes ? <p className="text-sm text-parchment/90">{character.notes}</p> : null}
          </div>
        ) : npcMode && parsedNpc ? (
          <NpcSheet
            path={path}
            markdown={markdown}
            images={images}
            selectedImage={selectedImage}
            block={parsedNpc.block}
            onSelectImage={onSelectImage}
            onAddToCombat={onAddNpcToCombat ? () => onAddNpcToCombat(parsedNpc.block, path) : undefined}
            onSetPortrait={async (image: CreateNoteMapImage) => {
              const result = await window.tabledm.setNotePortrait(path, image)
              if (!result) return
              setMarkdown(result.markdown)
              setOriginal(result.markdown)
              markdownRef.current = result.markdown
              originalRef.current = result.markdown
              onCampaignChange?.(result.campaign)
            }}
            holo={holoPortraitsEnabled(theme, holoPortraits) && isHoloPortraitPath(path)}
            renderNotes={(body) =>
              renderDocument(
                linkWikiNotes(prepareNoteMarkdown(body, path, images, { injectPortrait: false }), path, noteIndex),
                'sheet'
              )
            }
          />
        ) : itemMode ? (
          <ItemSheet
            path={path}
            markdown={markdown}
            images={images}
            selectedImage={selectedImage}
            onSelectImage={onSelectImage}
            onSetPortrait={async (image: CreateNoteMapImage) => {
              const result = await window.tabledm.setNotePortrait(path, image)
              if (!result) return
              setMarkdown(result.markdown)
              setOriginal(result.markdown)
              markdownRef.current = result.markdown
              originalRef.current = result.markdown
              onCampaignChange?.(result.campaign)
            }}
            onRerollStock={shopsEnabled ? rerollShopStock : undefined}
            onChangeStock={shopsEnabled ? changeShopStock : undefined}
            onChangeStanding={changeShopStanding}
            holo={holoPortraitsEnabled(theme, holoPortraits) && isHoloPortraitPath(path)}
            renderNotes={(body) =>
              renderDocument(
                linkWikiNotes(prepareNoteMarkdown(body, path, images, { injectPortrait: false }), path, noteIndex),
                'sheet'
              )
            }
          />
        ) : (
          <div className="mx-auto max-w-3xl text-base">
            {theme && onThemeChange && isStartHerePath(path) ? (
              <StartHereTheme
                theme={theme}
                onChange={onThemeChange}
                holoPortraits={holoPortraits}
                onHoloPortraitsChange={onHoloPortraitsChange}
                digitalRain={digitalRain}
                onDigitalRainChange={onDigitalRainChange}
              />
            ) : null}
            {renderDocument(rendered || '_This file is empty._', 'note')}
          </div>
        )}
      </div>
      )}

      {confirmDiscard ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4"
          onClick={() => setConfirmDiscard(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="discard-edits-title"
            className="w-full max-w-sm rounded border border-line bg-panel p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="discard-edits-title" className="font-display text-lg text-amber">
              Discard edits?
            </h3>
            <p className="mt-2 text-sm text-parchment/90">
              You have unsaved changes to this file. Save them, or throw them away.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDiscard(false)}
                className="rounded border border-line px-3 py-1.5 text-sm hover:border-amber"
              >
                Keep editing
              </button>
              <button
                type="button"
                onClick={discardEdits}
                className="rounded border border-line px-3 py-1.5 text-sm hover:border-blood"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={() => void save()}
                className="rounded bg-amber px-3 py-1.5 text-sm font-semibold text-on-amber"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
