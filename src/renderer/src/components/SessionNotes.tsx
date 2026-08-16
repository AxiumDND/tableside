import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Character, PlayerMapView } from '../../../shared/types'
import {
  imageTitle,
  markdownUrlTransform,
  prepareNoteMarkdown,
  resolveMarkdownImageSrc,
  type CampaignImage
} from '../lib/images'
import {
  childText,
  combatantLabel,
  flattenNotes,
  headingId,
  linkWikiNotes,
  parseNightEncounters,
  partyNotes,
  splitMarkdownSections,
  splitCombatCardContent,
  splitCalloutBlocks,
  isCombatHeading,
  missingCombatantTokens,
  type CampaignNote,
  type NightEncounter
} from '../lib/notes'
import { extractStatblock, fallbackStatblock, isNpcSheet, type ParsedStatblock } from '../lib/statblock'
import { isMapNote, mapImagePath } from '../lib/mapNote'
import CalloutCard from './CalloutCard'
import CombatCard from './CombatCard'
import GettingStarted from './GettingStarted'
import GmOnly from './GmOnly'
import MapView from './MapView'
import ReadAloud from './ReadAloud'
import NpcSheet from './NpcSheet'
import { CharacterCard } from './StatBlock'
import type { FileKind } from './CampaignFiles'

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
  onMapLiveView,
  onOpenNote,
  onBack,
  backLabel,
  onAddNpcToCombat,
  onAddEncounter,
  onNewCampaign,
  onOpenCampaign,
  onOpenSample,
  recentCampaigns,
  onOpenRecent
}: {
  path: string
  kind: FileKind
  imageUrl?: string
  images: CampaignImage[]
  notes?: CampaignNote[]
  selectedImage?: string | null
  disabled?: boolean
  onSelectImage?: (path: string) => void
  onShowToPlayers?: () => void
  onMapLiveView?: (imagePath: string, view: PlayerMapView) => void
  onOpenNote?: (path: string) => void
  onBack?: () => void
  backLabel?: string
  onAddNpcToCombat?: (block: ParsedStatblock, notePath: string) => void
  onAddEncounter?: (items: EncounterAddItem[]) => void
  onNewCampaign?: () => void
  onOpenCampaign?: () => void
  onOpenSample?: () => void
  recentCampaigns?: import('../../../shared/types').RecentCampaign[]
  onOpenRecent?: (folder: string) => void
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
  async function flushOpenNote(targetPath = pathRef.current): Promise<void> {
    if (!targetPath || markdownRef.current === originalRef.current) return
    try {
      await window.tabledm.saveFile(targetPath, markdownRef.current)
      originalRef.current = markdownRef.current
      setOriginal(markdownRef.current)
      setSaveError('')
    } catch {
      setSaveError('Could not save this file.')
    }
  }

  useEffect(() => {
    const prevPath = pathRef.current
    if (prevPath && prevPath !== path) {
      void flushOpenNote(prevPath)
    }
    pathRef.current = path
    setEditing(false)
    setConfirmDiscard(false)
    setSaveError('')
    setShowLinks(false)
    setCharacter(null)
    if (!path || kind === 'image' || kind === 'pdf' || kind === 'other') {
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
    const onHidden = (): void => {
      void flushOpenNote()
    }
    const onVis = (): void => {
      if (document.visibilityState === 'hidden') void flushOpenNote()
    }
    window.addEventListener('beforeunload', onHidden)
    document.addEventListener('visibilitychange', onVis)
    const offClose = window.tabledm.onWillClose(async () => {
      await flushOpenNote()
      window.tabledm.confirmClose()
    })
    return () => {
      window.removeEventListener('beforeunload', onHidden)
      document.removeEventListener('visibilitychange', onVis)
      offClose()
    }
  }, [])

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
      await window.tabledm.saveFile(path, markdown)
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
      await window.tabledm.saveFile(path, next)
      originalRef.current = next
      setOriginal(next)
      setSaveError('')
    } catch {
      setSaveError('Could not save this file.')
    }
  }

  const canShow = Boolean(onShowToPlayers && (kind === 'image' || selectedImage || mapImage))

  const markdownComponents = {
    h1: ({ children }: { children?: ReactNode }) => {
      const text = childText(children)
      return <h1 id={headingId(text)}>{children}</h1>
    },
    h2: ({ children }: { children?: ReactNode }) => {
      const text = childText(children)
      return (
        <h2 id={headingId(text)} className="mt-0">
          {children}
        </h2>
      )
    },
    h3: ({ children }: { children?: ReactNode }) => {
      const text = childText(children)
      return <h3 id={headingId(text)}>{children}</h3>
    },
    p: ({ children }: { children?: ReactNode }) => {
      const text = childText(children)
      if (/^Combatants:/i.test(text)) {
        return <p className="combat-roster">{children}</p>
      }
      return <p>{children}</p>
    },
    a: ({ href, children }: { href?: string; children?: ReactNode }) => {
      if (href?.startsWith('#note:')) {
        const notePath = decodeURIComponent(href.slice(6))
        return (
          <button
            type="button"
            onClick={() => onOpenNote?.(notePath)}
            className="text-amber underline decoration-amber-dim underline-offset-2 hover:text-parchment"
          >
            {children}
          </button>
        )
      }
      return (
        <a href={href} className="text-amber underline">
          {children}
        </a>
      )
    },
    img: ({ src, alt }: { src?: string; alt?: string }) => {
      const resolved = resolveMarkdownImageSrc(src, path, images)
      const active = resolved.path != null && resolved.path === selectedImage
      return (
        <button
          type="button"
          onClick={() => resolved.path && onSelectImage?.(resolved.path)}
          className={`inline-block max-w-full rounded border p-1 text-left align-top ${
            active ? 'border-amber bg-amber/10' : 'border-transparent hover:border-amber-dim'
          }`}
        >
          <img src={resolved.url} alt={alt ?? ''} className="max-h-40 max-w-full object-contain" />
          <span className="mt-1 block max-w-[12rem] truncate text-[11px] text-muted">
            {active ? 'Selected — Show to players' : alt || 'Click to select'}
          </span>
        </button>
      )
    }
  }

  function renderMarkdown(text: string, keyPrefix: string) {
    return splitCalloutBlocks(text).map((part, i) => {
      const key = `${keyPrefix}-${i}`
      if (part.kind === 'readaloud') {
        return (
          <ReadAloud key={key} title={part.title}>
            <Markdown remarkPlugins={[remarkGfm]} urlTransform={markdownUrlTransform} components={markdownComponents}>
              {part.markdown || ''}
            </Markdown>
          </ReadAloud>
        )
      }
      if (part.kind === 'gmonly') {
        return (
          <GmOnly key={key} title={part.title}>
            <Markdown remarkPlugins={[remarkGfm]} urlTransform={markdownUrlTransform} components={markdownComponents}>
              {part.markdown || ''}
            </Markdown>
          </GmOnly>
        )
      }
      if (part.kind !== 'prose') {
        return (
          <CalloutCard key={key} type={part.kind === 'other' ? (part.type ?? 'note') : part.kind} title={part.title}>
            {part.markdown.trim() ? (
              <Markdown remarkPlugins={[remarkGfm]} urlTransform={markdownUrlTransform} components={markdownComponents}>
                {part.markdown}
              </Markdown>
            ) : null}
          </CalloutCard>
        )
      }
      if (!part.markdown.trim()) return null
      return (
        <Markdown key={key} remarkPlugins={[remarkGfm]} urlTransform={markdownUrlTransform} components={markdownComponents}>
          {part.markdown}
        </Markdown>
      )
    })
  }

  function renderDocument(text: string, keyPrefix: string) {
    const docSections = splitMarkdownSections(text)
    if (docSections.length === 0) {
      return <div className="markdown-body">{renderMarkdown(text || '_This file is empty._', keyPrefix)}</div>
    }
    return docSections.map((section, index) => {
      const encounter = encounters.find((item) => item.id === section.id)
      const boxed = Boolean(encounter) || isCombatHeading(section.heading)
      const key = `${keyPrefix}-${section.id || index}`
      if (!boxed) {
        return (
          <div key={key} className="markdown-body">
            {renderMarkdown(section.markdown || '_This file is empty._', key)}
          </div>
        )
      }
      const { card, rest } = splitCombatCardContent(section.markdown)
      return (
        <div key={key}>
          <CombatCard
            adding={Boolean(encounter && addingId === encounter.id)}
            onAdd={encounter && onAddEncounter ? () => void addEncounter(encounter) : undefined}
            missing={missingCombatantTokens(section.markdown, path, noteIndex)}
          >
            {renderMarkdown(card, `${key}-card`)}
          </CombatCard>
          {rest.trim() ? <div className="markdown-body">{renderMarkdown(rest, `${key}-rest`)}</div> : null}
        </div>
      )
    })
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-panel">
      <header className="border-b border-line px-3 py-2">
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
            <h2 className="min-w-0 truncate font-display text-lg text-amber">
              {path ? imageTitle(path).replace(/^PC\s+[—–-]\s+/i, '') : 'Notes'}
              {dirty ? <span className="ml-2 text-xs font-sans text-amber-dim">unsaved</span> : null}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {kind === 'note' && path && headings.length > 0 && !editing && !npcMode && !mapMode ? (
              <button
                type="button"
                onClick={() => setShowLinks((open) => !open)}
                className={`rounded px-2.5 py-1 text-xs ${
                  showLinks ? 'bg-amber font-semibold text-ink' : 'border border-line hover:border-amber'
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
                    className="rounded bg-amber px-2.5 py-1 text-xs font-semibold text-ink disabled:bg-line"
                  >
                    Save
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => setEditing(true)}
                  className="rounded border border-line px-2.5 py-1 text-xs hover:border-amber"
                >
                  Edit
                </button>
              )
            ) : null}
            {canShow ? (
              <button
                type="button"
                onClick={onShowToPlayers}
                className="rounded bg-amber px-2.5 py-1 text-xs font-semibold text-ink"
              >
                Show to players
              </button>
            ) : null}
          </div>
        </div>
        {path ? <div className="truncate text-[11px] text-muted">{path}</div> : null}
      </header>

      {kind === 'note' && headings.length > 0 && !editing && !npcMode && !mapMode && showLinks ? (
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
            onEdit={() => setEditing(true)}
            renderNotes={(body) =>
              renderDocument(
                linkWikiNotes(prepareNoteMarkdown(body, path, images, { injectPortrait: false }), path, noteIndex),
                'sheet'
              )
            }
          />
        ) : (
          <div className="mx-auto max-w-3xl text-base">{renderDocument(rendered || '_This file is empty._', 'note')}</div>
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
                className="rounded bg-amber px-3 py-1.5 text-sm font-semibold text-ink"
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
