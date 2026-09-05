import { useEffect, useMemo, useRef, useState } from 'react'
import type { ThemeId } from '../../../shared/theme'
import type { CampaignInfo, Character, CreateNoteMapImage, PlayerMapView } from '../../../shared/types'
import type { AudioTrack } from '../../../shared/audio'
import { prepareNoteMarkdown, type CampaignImage, type CampaignVideo } from '../lib/images'
import { flattenNotes, linkWikiNotes, parseNightEncounters, type CampaignNote } from '../lib/notes'
import type { ParsedStatblock } from '../lib/statblock'
import { isMapNote, mapImagePath } from '../lib/mapNote'
import { headingsFrom } from '../lib/noteHeadings'
import { collectEncounterAddItems, type EncounterAddItem } from '../lib/sessionNoteEncounter'
import { applyWebSheetUrl } from '../../../shared/webSheet'
import { handoutButtonLabel, sessionNoteFlags } from '../lib/sessionNoteView'
import MapView from './MapView'
import { createSessionNoteMarkdown } from './SessionNoteMarkdown'
import { SessionNotesDiscardDialog } from './SessionNotesDiscardDialog'
import { SessionNotesEditor } from './SessionNotesEditor'
import { SessionNotesHeader } from './SessionNotesHeader'
import { SessionNotesPreview } from './SessionNotesPreview'
import WebSheetPane from './WebSheetPane'
import { useOpeningSequenceCards } from '../hooks/useOpeningSequenceCards'
import { useNoteBlockEditing } from '../hooks/useNoteBlockEditing'
import { useShopStock } from '../hooks/useShopStock'
import { useNoteAutosave } from '../hooks/useNoteAutosave'
import { useNoteEditSession } from '../hooks/useNoteEditSession'
import type { FileKind } from './CampaignFiles'
import { buildBlockIndex } from '../../../shared/blockIndex'

export type { EncounterAddItem } from '../lib/sessionNoteEncounter'

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
  onPlayPhone,
  onStopPhone,
  onAnswerPhone,
  activePhone,
  playerPhone,
  onPlayHyperspace,
  onStopHyperspace,
  onArriveHyperspace,
  activeHyperspace,
  playerHyperspace,
  videos,
  musicTracks,
  onMapLiveView,
  onOpenNote,
  onBack,
  backLabel,
  onNext,
  nextLabel,
  onAddNpcToCombat,
  onAddTokensToCombat,
  onToggleTokenStatus,
  combat,
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
  onShowToPlayers?: (options?: {
    includeSecrets?: boolean
    markdown?: string
    mode?: 'art' | 'handout'
  }) => void
  onSelectImage?: (path: string) => void
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
  onPlayPhone?: (
    title: string | undefined,
    photoSrc: string | null,
    ringSrc: string | null,
    npcRef: string | null
  ) => void
  onStopPhone?: () => void
  onAnswerPhone?: () => void
  activePhone?: { title?: string; npcRef: string | null } | null
  playerPhone?: import('../../../shared/types').PlayerPhone | null
  onPlayHyperspace?: (
    title: string | undefined,
    shipSrc: string | null,
    planetSrc: string | null,
    shipRef: string | null,
    planetRef: string | null,
    enterSound?: string | null,
    loopSound?: string | null,
    exitSound?: string | null
  ) => void
  onStopHyperspace?: () => void
  onArriveHyperspace?: () => void
  activeHyperspace?: { title?: string; shipRef: string | null; planetRef: string | null } | null
  playerHyperspace?: import('../../../shared/types').PlayerHyperspace | null
  videos?: CampaignVideo[]
  musicTracks?: AudioTrack[]
  onMapLiveView?: (imagePath: string, view: PlayerMapView) => void
  onOpenNote?: (path: string) => void
  onBack?: () => void
  backLabel?: string
  onNext?: () => void
  nextLabel?: string
  onAddNpcToCombat?: (block: ParsedStatblock, notePath: string) => void
  onAddTokensToCombat?: (
    tokens: import('../lib/mapNote').MapToken[]
  ) => Promise<{ tokenId: string; combatantId: string }[]>
  onToggleTokenStatus?: (combatantId: string, statusId: string) => void
  combat?: import('../../../shared/types').CombatState | null
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
  const [addingId, setAddingId] = useState<string | null>(null)
  const [saveError, setSaveError] = useState('')
  const [showLinks, setShowLinks] = useState(false)
  const editorRef = useRef<HTMLTextAreaElement | null>(null)
  const markdownRef = useRef('')
  const originalRef = useRef('')
  const pathRef = useRef(path)
  markdownRef.current = markdown
  originalRef.current = original

  const { commitSave, flushOpenNote } = useNoteAutosave({
    markdownRef,
    originalRef,
    pathRef,
    setOriginal,
    setSaveError,
    onCampaignChange,
    onOpenNote
  })
  const {
    editing,
    setEditing,
    confirmDiscard,
    setConfirmDiscard,
    save,
    discardEdits,
    requestCloseEditor,
    resetEditSession
  } = useNoteEditSession({
    path,
    markdown,
    original,
    setMarkdown,
    setOriginal,
    setSaveError,
    commitSave,
    editorRef
  })

  const dirty = markdown !== original
  const noteIndex = notes ?? flattenNotes([])
  const rendered = useMemo(() => {
    const withImages = prepareNoteMarkdown(markdown, path, images)
    return linkWikiNotes(withImages, path, noteIndex)
  }, [markdown, path, images, noteIndex])
  const { parsedNpc, npcMode, itemMode, mapMode, sheetChrome, webSheetUrl } = useMemo(
    () => sessionNoteFlags({ kind, path, markdown, editing }),
    [kind, path, markdown, editing]
  )
  const [webSheetPane, setWebSheetPane] = useState(false)
  useEffect(() => {
    setWebSheetPane(false)
  }, [path])
  const showWebSheetPane = Boolean(webSheetUrl && webSheetPane && !editing && !mapMode)

  async function linkWebSheet(rawUrl: string): Promise<string | null> {
    const patched = applyWebSheetUrl(markdown, rawUrl)
    if (!patched) return 'Paste a character or monster page link.'
    try {
      const savedPath = await commitSave(path, patched)
      if (!savedPath) return 'Could not save this file.'
      setMarkdown(patched)
      markdownRef.current = patched
      originalRef.current = patched
      setOriginal(patched)
      setSaveError('')
      setWebSheetPane(true)
      return null
    } catch {
      return 'Could not save this file.'
    }
  }
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

  useEffect(() => {
    const prevPath = pathRef.current
    if (prevPath && prevPath !== path) {
      void flushOpenNote(prevPath)
    }
    pathRef.current = path
    resetEditSession()
    resetBlockEditing()
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
    // Reload + reset editing state only when the open note (path/kind) changes.
    // The reset helpers are recreated each render; listing them would reload the
    // note on every render and make editing impossible.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, kind])

  const sequenceCards = useOpeningSequenceCards({
    path,
    images,
    notes: noteIndex,
    markdownRef,
    persistMarkdown: (next) => persistShopMarkdown(next),
    onCampaignChange,
    onPlayCrawl,
    onPlayLegend,
    onPlayGallery,
    onPlayVideo,
    onPlayPhone,
    onPlayHyperspace
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

  async function addEncounter(encounter: import('../lib/notes').NightEncounter): Promise<void> {
    if (!onAddEncounter) return
    setAddingId(encounter.id)
    try {
      onAddEncounter(await collectEncounterAddItems(encounter, path, noteIndex, (notePath) => window.tabledm.readFile(notePath)))
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

  async function setNotePortrait(image: CreateNoteMapImage): Promise<void> {
    const result = await window.tabledm.setNotePortrait(path, image)
    if (!result) return
    setMarkdown(result.markdown)
    setOriginal(result.markdown)
    markdownRef.current = result.markdown
    originalRef.current = result.markdown
    onCampaignChange?.(result.campaign)
  }

  const canShowArt = Boolean(onShowToPlayers && (kind === 'image' || selectedImage || mapImage))
  const canShowItem = Boolean(onShowToPlayers && itemMode)

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
    activePhone,
    playerPhone,
    onStopPhone,
    onAnswerPhone,
    onPlayPhone,
    activeHyperspace,
    playerHyperspace,
    onStopHyperspace,
    onArriveHyperspace,
    onPlayHyperspace,
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
      <SessionNotesHeader
        path={path}
        kind={kind}
        sheetChrome={sheetChrome && !showWebSheetPane}
        mapMode={mapMode}
        editing={editing}
        dirty={dirty}
        headings={headings}
        showLinks={showLinks}
        onToggleLinks={() => setShowLinks((open) => !open)}
        onJump={(id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        onBack={onBack}
        backLabel={backLabel}
        onNext={onNext}
        nextLabel={nextLabel}
        disabled={disabled}
        shopsEnabled={shopsEnabled}
        markdown={markdown}
        onCancel={requestCloseEditor}
        onSave={() => void save()}
        onEdit={() => setEditing(true)}
        onRerollStock={() => void rerollShopStock()}
        canShowArt={canShowArt && !showWebSheetPane}
        canShowItem={canShowItem && !showWebSheetPane}
        itemMode={itemMode}
        onShowToPlayers={onShowToPlayers}
        handoutLabel={handoutButtonLabel(path)}
        webSheetUrl={webSheetUrl}
        webSheetPane={showWebSheetPane}
        onToggleWebSheet={() => setWebSheetPane((open) => !open)}
      />

      {editing ? (
        <SessionNotesEditor
          editorRef={editorRef}
          markdown={markdown}
          saveError={saveError}
          onChange={setMarkdown}
        />
      ) : showWebSheetPane && webSheetUrl ? (
        <WebSheetPane src={webSheetUrl} />
      ) : mapMode ? (
        <MapView
          key={path}
          markdown={markdown}
          path={path}
          images={images}
          notes={noteIndex}
          combat={combat}
          system={system}
          onAddTokensToCombat={onAddTokensToCombat}
          onToggleTokenStatus={onToggleTokenStatus}
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
          <SessionNotesPreview
            path={path}
            kind={kind}
            imageUrl={imageUrl}
            images={images}
            noteIndex={noteIndex}
            selectedImage={selectedImage}
            character={character}
            markdown={markdown}
            rendered={rendered}
            npcMode={npcMode}
            parsedNpc={parsedNpc}
            itemMode={itemMode}
            disabled={disabled}
            onSelectImage={onSelectImage}
            onAddNpcToCombat={onAddNpcToCombat}
            onNewCampaign={onNewCampaign}
            onOpenCampaign={onOpenCampaign}
            onOpenSample={onOpenSample}
            recentCampaigns={recentCampaigns}
            onOpenRecent={onOpenRecent}
            shopsEnabled={shopsEnabled}
            theme={theme}
            onThemeChange={onThemeChange}
            holoPortraits={holoPortraits}
            digitalRain={digitalRain}
            onHoloPortraitsChange={onHoloPortraitsChange}
            onDigitalRainChange={onDigitalRainChange}
            onSetPortrait={setNotePortrait}
            onLinkWebSheet={(url) => linkWebSheet(url)}
            onRerollStock={rerollShopStock}
            onChangeStock={changeShopStock}
            onChangeStanding={changeShopStanding}
            renderDocument={renderDocument}
          />
        </div>
      )}

      {confirmDiscard ? (
        <SessionNotesDiscardDialog
          onKeepEditing={() => setConfirmDiscard(false)}
          onDiscard={discardEdits}
          onSave={() => void save()}
        />
      ) : null}
    </section>
  )
}
