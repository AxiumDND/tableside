import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { CampaignInfo, CampaignTreeNode, CreateNoteMapImage } from '../../../shared/types'
import { AUDIO_EXT } from '../../../shared/audio'
import {
  artFolderRelativePath,
  folderIsOpenInTree,
  folderUsesArt,
  isArtFolderName,
  isAudioFolderName,
  isBestiaryFolderName,
  isFactionsFolderName,
  isGearFolderName,
  isMapsFolderName,
  isNpcFolderName,
  isPartyFolderName,
  isPlacesFolderName,
  isSessionsFolderName,
  isSpellsFolderName
} from '../../../shared/campaignLayout'
import { mapArtRelativeFolder } from '../../../shared/mapCreate'
import { sanitizeFileName, type SheetTemplateKind } from '../../../shared/sheetTemplates'
import { sheetAcceptsPortrait } from '../../../shared/sheetPortrait'
import { stockArtForTemplate, stockArtUrl } from '../../../shared/stockArt'
import { IMAGE_EXT, campaignFileUrl, flattenImages } from '../lib/images'
import { parentFolderLabel, searchCampaignFiles } from '../lib/campaignSearch'

export { campaignFileUrl }

const NOTE_EXT = new Set(['.md', '.txt', '.markdown'])

export type FileKind = 'note' | 'image' | 'character' | 'pdf' | 'audio' | 'other'

export function fileKind(node: CampaignTreeNode): FileKind {
  const ext = node.ext ?? ''
  if (NOTE_EXT.has(ext)) return 'note'
  if (IMAGE_EXT.has(ext)) return 'image'
  if (ext === '.pdf') return 'pdf'
  if (AUDIO_EXT.has(ext)) return 'audio'
  if (ext === '.json' && /^(party|npcs)\//.test(node.relativePath)) return 'character'
  return 'other'
}

function displayName(name: string): string {
  return name
    .replace(/\.(md|markdown|txt|json|png|jpe?g|webp|gif|svg|bmp|pdf|mp3|ogg|wav|m4a|flac|webm|aac)$/i, '')
    .replace(/[-_]/g, ' ')
}

function fileNameOf(path: string): string {
  return path.replaceAll('\\', '/').split('/').pop() ?? path
}

function parentRelativePath(path: string): string {
  const posix = path.replaceAll('\\', '/')
  const slash = posix.lastIndexOf('/')
  return slash === -1 ? '' : posix.slice(0, slash)
}

function fileExt(path: string): string {
  const name = fileNameOf(path)
  const dot = name.lastIndexOf('.')
  return dot === -1 ? '' : name.slice(dot)
}

function folderKind(
  name: string
): 'party' | 'npcs' | 'bestiary' | 'spells' | 'gear' | 'sessions' | 'maps' | 'places' | 'factions' | 'audio' | null {
  if (isPartyFolderName(name)) return 'party'
  if (isNpcFolderName(name)) return 'npcs'
  if (isBestiaryFolderName(name)) return 'bestiary'
  if (isSpellsFolderName(name)) return 'spells'
  if (isGearFolderName(name)) return 'gear'
  if (isSessionsFolderName(name)) return 'sessions'
  if (isMapsFolderName(name)) return 'maps'
  if (isPlacesFolderName(name)) return 'places'
  if (isFactionsFolderName(name)) return 'factions'
  if (isAudioFolderName(name)) return 'audio'
  return null
}

function folderKindForPath(path: string): ReturnType<typeof folderKind> {
  const parts = path.replaceAll('\\', '/').split('/').filter(Boolean)
  for (const part of parts) {
    const kind = folderKind(part)
    if (kind) return kind
  }
  return null
}

type MenuTarget =
  | { kind: 'root'; x: number; y: number }
  | { kind: 'node'; x: number; y: number; node: CampaignTreeNode }

type PromptState =
  | { kind: 'create'; folder: string; template: SheetTemplateKind; title: string }
  | { kind: 'duplicate'; from: string; title: string; defaultName: string }
  | { kind: 'delete'; path: string; title: string; fileName: string }

function TreeNode({
  node,
  depth,
  selected,
  onOpen,
  onMenu
}: {
  node: CampaignTreeNode
  depth: number
  selected?: string
  onOpen: (node: CampaignTreeNode) => void
  onMenu: (event: React.MouseEvent, node: CampaignTreeNode) => void
}) {
  const [userOpen, setUserOpen] = useState(false)
  const [collapsedFor, setCollapsedFor] = useState<string | undefined>(undefined)
  const isSelected = selected === node.relativePath
  const open =
    node.type === 'dir' &&
    folderIsOpenInTree(node.relativePath, node.name, selected, userOpen, collapsedFor)

  if (node.type === 'dir') {
    return (
      <div>
        <button
          type="button"
          onClick={() => {
            if (open) {
              setCollapsedFor(selected ?? '')
              setUserOpen(false)
            } else {
              setCollapsedFor(undefined)
              setUserOpen(true)
            }
          }}
          onContextMenu={(event) => onMenu(event, node)}
          className="flex w-full items-center gap-1 rounded px-2 py-1 text-left text-[13px] text-parchment/90 hover:bg-panel-2"
          style={{ paddingLeft: 8 + depth * 12 }}
        >
          <span className="w-3 text-[10px] text-muted">{open ? '▾' : '▸'}</span>
          <span className="truncate font-medium">{node.name}</span>
        </button>
        {open
          ? (node.children ?? []).map((child) => (
              <TreeNode
                key={child.relativePath}
                node={child}
                depth={depth + 1}
                selected={selected}
                onOpen={onOpen}
                onMenu={onMenu}
              />
            ))
          : null}
      </div>
    )
  }

  const kind = fileKind(node)
  return (
    <button
      type="button"
      onClick={() => onOpen(node)}
      onContextMenu={(event) => onMenu(event, node)}
      className={`flex w-full items-center gap-1 truncate rounded px-2 py-1 text-left text-[13px] ${
        isSelected ? 'bg-amber/20 text-amber' : 'hover:bg-panel-2'
      }`}
      style={{ paddingLeft: 20 + depth * 12 }}
    >
      {kind === 'image' ? (
        <img src={campaignFileUrl(node.relativePath)} alt="" className="h-7 w-7 shrink-0 rounded object-cover" />
      ) : (
        <span className="w-8 shrink-0 text-[10px] uppercase text-muted">
          {kind === 'character' ? 'pc' : kind === 'note' ? 'md' : kind === 'pdf' ? 'pdf' : node.ext?.slice(1)}
        </span>
      )}
      <span className="truncate">{displayName(node.name)}</span>
    </button>
  )
}

function SearchHitRow({
  node,
  selected,
  onOpen,
  onMenu
}: {
  node: CampaignTreeNode
  selected?: string
  onOpen: (node: CampaignTreeNode) => void
  onMenu: (event: React.MouseEvent, node: CampaignTreeNode) => void
}) {
  const kind = fileKind(node)
  const isSelected = selected === node.relativePath
  const folder = parentFolderLabel(node.relativePath)
  return (
    <button
      type="button"
      onClick={() => onOpen(node)}
      onContextMenu={(event) => onMenu(event, node)}
      className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[13px] ${
        isSelected ? 'bg-amber/20 text-amber' : 'hover:bg-panel-2'
      }`}
    >
      {kind === 'image' ? (
        <img src={campaignFileUrl(node.relativePath)} alt="" className="h-7 w-7 shrink-0 rounded object-cover" />
      ) : (
        <span className="w-8 shrink-0 text-[10px] uppercase text-muted">
          {kind === 'character' ? 'pc' : kind === 'note' ? 'md' : kind === 'pdf' ? 'pdf' : node.ext?.slice(1)}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{displayName(node.name)}</span>
        {folder ? <span className="block truncate text-[11px] text-muted">{folder}</span> : null}
      </span>
    </button>
  )
}

function MenuItem({
  label,
  onClick
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full truncate px-3 py-1.5 text-left text-[13px] hover:bg-amber/15 hover:text-amber"
    >
      {label}
    </button>
  )
}

export default function CampaignFiles({
  tree,
  campaignName,
  selected,
  onOpen,
  onTreeChange
}: {
  tree: CampaignTreeNode[]
  campaignName: string
  selected?: string
  onOpen: (node: CampaignTreeNode) => void
  onTreeChange?: (campaign: CampaignInfo, openPath?: string) => void
}) {
  const [menu, setMenu] = useState<MenuTarget | null>(null)
  const [prompt, setPrompt] = useState<PromptState | null>(null)
  const [name, setName] = useState('')
  const [mapImage, setMapImage] = useState<CreateNoteMapImage | null>(null)
  const [busy, setBusy] = useState(false)
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const promptInputRef = useRef<HTMLInputElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const count = useMemo(() => {
    const walk = (nodes: CampaignTreeNode[]): number =>
      nodes.reduce((sum, node) => sum + (node.type === 'file' ? 1 : walk(node.children ?? [])), 0)
    return walk(tree)
  }, [tree])

  const searching = query.trim().length > 0
  const searchHits = useMemo(() => searchCampaignFiles(tree, query), [tree, query])
  const campaignImages = useMemo(() => {
    const all = flattenImages(tree)
    return [...all].sort((a, b) => {
      const aMap = /(?:^|\/)maps\//i.test(a.relativePath) ? 0 : 1
      const bMap = /(?:^|\/)maps\//i.test(b.relativePath) ? 0 : 1
      if (aMap !== bMap) return aMap - bMap
      return a.relativePath.localeCompare(b.relativePath, undefined, { sensitivity: 'base' })
    })
  }, [tree])

  useEffect(() => {
    if (!prompt || prompt.kind === 'delete') return
    promptInputRef.current?.focus()
    promptInputRef.current?.select()
  }, [prompt])

  useEffect(() => {
    if (!menu) return
    const close = (): void => setMenu(null)
    window.addEventListener('click', close)
    window.addEventListener('scroll', close, true)
    return () => {
      window.removeEventListener('click', close)
      window.removeEventListener('scroll', close, true)
    }
  }, [menu])

  useEffect(() => {
    if (!searchOpen) return
    searchInputRef.current?.focus()
    searchInputRef.current?.select()
  }, [searchOpen])

  useEffect(() => {
    const typing = (target: EventTarget | null): boolean =>
      target instanceof HTMLElement &&
      (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)

    const onKey = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        if (searchOpen) {
          searchInputRef.current?.focus()
          searchInputRef.current?.select()
        } else {
          setSearchOpen(true)
        }
        return
      }
      if (e.key === '/' && !typing(e.target)) {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [searchOpen])

  function hideSearch(): void {
    setQuery('')
    setSearchOpen(false)
  }

  function openMenu(event: React.MouseEvent, node?: CampaignTreeNode): void {
    event.preventDefault()
    event.stopPropagation()
    const x = Math.min(event.clientX, window.innerWidth - 200)
    const y = Math.min(event.clientY, window.innerHeight - 360)
    setMenu(node ? { kind: 'node', x, y, node } : { kind: 'root', x, y })
  }

  function startCreate(folder: string, template: SheetTemplateKind): void {
    const titles: Record<SheetTemplateKind, string> = {
      blank: 'New note',
      player: 'New player',
      npc: 'New NPC',
      monster: 'New monster',
      spell: 'New spell',
      gear: 'New gear',
      nightsheet: 'New game night sheet',
      map: 'New map',
      place: 'New place',
      shop: 'New shop',
      faction: 'New faction'
    }
    setPrompt({ kind: 'create', folder, template, title: titles[template] })
    setName('')
    setMapImage(null)
    setMenu(null)
  }

  function startDuplicate(node: CampaignTreeNode): void {
    const ext = node.ext ?? ''
    const stem = node.name.replace(new RegExp(`${ext.replace('.', '\\.')}$`, 'i'), '')
    setPrompt({
      kind: 'duplicate',
      from: node.relativePath,
      title: 'Duplicate file',
      defaultName: `${stem} copy`
    })
    setName(`${stem} copy`)
    setMenu(null)
  }

  function startDelete(node: CampaignTreeNode): void {
    setPrompt({
      kind: 'delete',
      path: node.relativePath,
      title: 'Delete file',
      fileName: node.name
    })
    setMenu(null)
  }

  async function addFiles(folder: string, mode: 'files' | 'art' = 'files'): Promise<void> {
    setMenu(null)
    const result = await window.tabledm.addFiles(folder, mode)
    if (!result) return
    onTreeChange?.(result.campaign, result.paths[0])
  }

  async function loadMapImage(): Promise<void> {
    const picked = await window.tabledm.pickImageFile()
    if (!picked) return
    setMapImage({ kind: 'import', filePath: picked.filePath })
  }

  async function submitPrompt(): Promise<void> {
    if (!prompt || busy) return
    if (prompt.kind === 'delete') {
      setBusy(true)
      try {
        const result = await window.tabledm.deleteFile(prompt.path)
        if (result) {
          const closed = selected === prompt.path ? '' : undefined
          onTreeChange?.(result.campaign, closed)
        }
        setPrompt(null)
      } finally {
        setBusy(false)
      }
      return
    }
    const value = name.trim()
    if (!value) return
    setBusy(true)
    try {
      if (prompt.kind === 'create') {
        const image =
          prompt.template === 'map' || sheetAcceptsPortrait(prompt.template) ? mapImage : null
        const result = await window.tabledm.createNote(prompt.folder, value, prompt.template, image)
        if (result) onTreeChange?.(result.campaign, result.path)
      } else {
        const result = await window.tabledm.duplicateFile(prompt.from, value)
        if (result) onTreeChange?.(result.campaign, result.path)
      }
      setPrompt(null)
    } finally {
      setBusy(false)
    }
  }

  const folderPath = menu?.kind === 'node' && menu.node.type === 'dir' ? menu.node.relativePath : ''
  const folderHint = folderPath ? folderKindForPath(folderPath) : null
  const artMenu =
    menu?.kind === 'node' && menu.node.type === 'dir' && isArtFolderName(menu.node.name)
  const canAddArt = Boolean(folderPath && folderUsesArt(folderPath))
  const fileParent =
    menu?.kind === 'node' && menu.node.type === 'file' ? parentRelativePath(menu.node.relativePath) : ''
  const fileParentIsArt = isArtFolderName(fileParent.split('/').pop() ?? '')
  const fileParentUsesArt = Boolean(fileParent && folderUsesArt(fileParent))
  const createWantsArt =
    prompt?.kind === 'create' && (prompt.template === 'map' || sheetAcceptsPortrait(prompt.template))
  const createArtFolder =
    prompt?.kind === 'create' ? (prompt.template === 'map' ? mapArtRelativeFolder(prompt.folder) : artFolderRelativePath(prompt.folder)) : ''
  const stockArt =
    prompt?.kind === 'create' ? stockArtForTemplate(prompt.template) : []

  return (
    <aside className="matrix-rain-well flex min-h-0 flex-1 flex-col bg-ink">
      <header className="border-b border-line bg-ink px-3 py-2" onContextMenu={(event) => openMenu(event)}>
        <div className="flex items-baseline justify-between gap-2">
          <div className="font-display text-amber">Files</div>
          <button
            type="button"
            onClick={() => (searchOpen ? hideSearch() : setSearchOpen(true))}
            className="text-[11px] text-muted hover:text-amber"
            title={searchOpen ? 'Hide file search' : 'Search campaign files (Ctrl+F or /)'}
          >
            {searchOpen ? 'Hide search' : 'Search'}
          </button>
        </div>
        <div className="truncate text-[11px] text-muted">
          {campaignName} · {count} files · right-click to add
        </div>
        {searchOpen ? (
          <>
            <div className="relative mt-2">
              <input
                ref={searchInputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    event.preventDefault()
                    if (query) setQuery('')
                    else hideSearch()
                  }
                }}
                placeholder="Search notes, maps, art…"
                title="Search campaign files (Ctrl+F or /)"
                className="w-full rounded border border-line bg-ink py-1 pl-2 pr-7 text-[12px] outline-none focus:border-amber"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('')
                    searchInputRef.current?.focus()
                  }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 rounded px-1.5 text-[11px] text-muted hover:text-amber"
                  title="Clear search"
                >
                  ×
                </button>
              ) : null}
            </div>
            {searching ? (
              <div className="mt-1 text-[11px] text-muted">
                {searchHits.length === 0
                  ? 'No matches'
                  : `${searchHits.length} match${searchHits.length === 1 ? '' : 'es'}`}
              </div>
            ) : null}
          </>
        ) : null}
      </header>
      <nav className="min-h-0 flex-1 overflow-auto py-1" onContextMenu={(event) => openMenu(event)}>
        {searching ? (
          searchHits.length === 0 ? (
            <p className="px-3 py-4 text-xs text-muted">No files match “{query.trim()}”.</p>
          ) : (
            searchHits.map(({ node }) => (
              <SearchHitRow
                key={node.relativePath}
                node={node}
                selected={selected}
                onOpen={onOpen}
                onMenu={openMenu}
              />
            ))
          )
        ) : tree.length === 0 ? (
          <p className="px-3 py-4 text-xs text-muted">Open a campaign to see its folders.</p>
        ) : (
          tree.map((node) => (
            <TreeNode
              key={`${node.relativePath}::${(selected ?? '').replaceAll('\\', '/').split('/')[0]}`}
              node={node}
              depth={0}
              selected={selected}
              onOpen={onOpen}
              onMenu={openMenu}
            />
          ))
        )}
      </nav>

      {menu
        ? createPortal(
        <div
          className="fixed z-[80] min-w-44 rounded border border-line bg-panel py-1 shadow-lg"
          style={{ left: menu.x, top: menu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          {menu.kind === 'node' && menu.node.type === 'file' ? (
            <>
              <MenuItem label="Duplicate…" onClick={() => startDuplicate(menu.node)} />
              {fileParentUsesArt ? (
                <MenuItem label="Add art here…" onClick={() => void addFiles(fileParent, 'art')} />
              ) : null}
              {fileParentIsArt ? null : (
                <MenuItem label="Add files here…" onClick={() => void addFiles(fileParent)} />
              )}
              <MenuItem label="Delete…" onClick={() => startDelete(menu.node)} />
            </>
          ) : artMenu ? (
            <MenuItem label="Add art…" onClick={() => void addFiles(folderPath, 'art')} />
          ) : folderHint === 'audio' ? (
            <MenuItem label="Add audio…" onClick={() => void addFiles(folderPath)} />
          ) : (
            <>
              {folderHint === 'party' || !folderHint ? (
                <MenuItem label="New player…" onClick={() => startCreate(folderPath, 'player')} />
              ) : null}
              {folderHint === 'npcs' || !folderHint ? (
                <MenuItem label="New NPC…" onClick={() => startCreate(folderPath, 'npc')} />
              ) : null}
              {folderHint === 'bestiary' || !folderHint ? (
                <MenuItem label="New monster…" onClick={() => startCreate(folderPath, 'monster')} />
              ) : null}
              {folderHint === 'spells' || !folderHint ? (
                <MenuItem label="New spell…" onClick={() => startCreate(folderPath, 'spell')} />
              ) : null}
              {folderHint === 'gear' || !folderHint ? (
                <MenuItem label="New gear…" onClick={() => startCreate(folderPath, 'gear')} />
              ) : null}
              {folderHint === 'sessions' || !folderHint ? (
                <MenuItem label="New game night sheet…" onClick={() => startCreate(folderPath, 'nightsheet')} />
              ) : null}
              {folderHint === 'maps' || !folderHint ? (
                <MenuItem label="New map…" onClick={() => startCreate(folderPath, 'map')} />
              ) : null}
              {folderHint === 'places' || !folderHint ? (
                <>
                  <MenuItem label="New place…" onClick={() => startCreate(folderPath, 'place')} />
                  <MenuItem label="New shop…" onClick={() => startCreate(folderPath, 'shop')} />
                </>
              ) : null}
              {folderHint === 'factions' || !folderHint ? (
                <MenuItem label="New faction…" onClick={() => startCreate(folderPath, 'faction')} />
              ) : null}
              <MenuItem label="New note…" onClick={() => startCreate(folderPath, 'blank')} />
              {canAddArt ? (
                <MenuItem label="Add art…" onClick={() => void addFiles(folderPath, 'art')} />
              ) : null}
              <MenuItem label="Add files…" onClick={() => void addFiles(folderPath)} />
            </>
          )}
        </div>,
        document.body
      ) : null}

      {prompt
        ? createPortal(
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/70 p-4"
          onClick={() => !busy && setPrompt(null)}
        >
          <form
            className={`w-full rounded border border-line bg-panel p-4 ${
              createWantsArt && stockArt.length > 0 ? 'max-w-xl' : createWantsArt ? 'max-w-md' : 'max-w-sm'
            }`}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setPrompt(null)
            }}
            onSubmit={(event) => {
              event.preventDefault()
              void submitPrompt()
            }}
          >
            <h3 className="font-display text-lg text-amber">{prompt.title}</h3>
            <p className="mt-1 text-[11px] text-muted">
              {prompt.kind === 'delete'
                ? `Remove ${prompt.fileName} from this campaign. This cannot be undone.`
                : prompt.kind === 'create' && prompt.template === 'nightsheet'
                  ? 'Party and Scenes — each scene block can hold read-aloud, GM-only notes, secrets, treasure, NPCs, combat, and table cues. Existing Party characters are linked in. Copy a scene block to add another beat. Sci-fi campaigns include an Opening crawl sample.'
                  : prompt.kind === 'create' && prompt.template === 'map'
                  ? 'Pick a campaign image, or load one — loaded files go in this folder’s Art/ and are named after the map.'
                  : prompt.kind === 'create' && prompt.template === 'place'
                    ? 'Town, site, wilderness, or dungeon. Pick default art below, or load your own.'
                    : prompt.kind === 'create' && prompt.template === 'shop'
                      ? 'Pick a shop type below. Stock and services roll from that type. Link the proprietor as an NPC.'
                      : prompt.kind === 'create' && prompt.template === 'faction'
                        ? 'Guild, church, house, or cult. Pick a default emblem or scene below.'
                  : prompt.kind === 'create' && sheetAcceptsPortrait(prompt.template)
                    ? 'Optional portrait — load a file or pick campaign art. It lands in this folder’s Art/ named like the sheet. You can also load art later from the sheet.'
                  : prompt.kind === 'create' && prompt.template !== 'blank'
                    ? 'Uses the built-in sheet for this type.'
                    : prompt.kind === 'duplicate'
                      ? 'Creates a copy next to the original.'
                      : 'Creates an empty markdown note.'}
            </p>
            {prompt.kind === 'delete' ? null : (
              <input
                ref={promptInputRef}
                value={name}
                onChange={(event) => setName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') setPrompt(null)
                }}
                placeholder={prompt.kind === 'duplicate' ? prompt.defaultName : 'Name'}
                className="mt-3 w-full rounded border border-line bg-ink px-2 py-1.5 text-sm outline-none focus:border-amber"
              />
            )}
            {prompt.kind === 'create' && createWantsArt ? (
              <div className="mt-3 space-y-2">
                {stockArt.length > 0 ? (
                  <div>
                    <p className="text-[11px] text-muted">
                      {prompt.template === 'shop'
                        ? 'Shop type'
                        : prompt.template === 'faction'
                          ? 'Emblem'
                          : prompt.template === 'place'
                            ? 'Place type'
                            : 'Default art'}
                    </p>
                    <div className="mt-1 grid max-h-72 grid-cols-4 gap-1.5 overflow-y-auto pr-0.5">
                      {stockArt.map((item) => {
                        const selected = mapImage?.kind === 'stock' && mapImage.id === item.id
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() =>
                              setMapImage(selected ? null : { kind: 'stock', id: item.id })
                            }
                            className={`overflow-hidden rounded border text-left ${
                              selected ? 'border-amber ring-1 ring-amber' : 'border-line hover:border-amber'
                            }`}
                          >
                            <img
                              src={stockArtUrl(item.id)}
                              alt=""
                              className={`w-full object-cover ${
                                item.group === 'faction' ? 'aspect-square' : 'aspect-video'
                              }`}
                            />
                            <span className="block truncate px-1 py-0.5 text-[10px] text-parchment/90">
                              {item.title}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ) : null}
                <label className="block text-[11px] text-muted">
                  {prompt.template === 'map'
                    ? 'Map image'
                    : stockArt.length > 0
                      ? 'Or campaign art'
                    : prompt.template === 'place' || prompt.template === 'shop' || prompt.template === 'faction'
                      ? 'Art'
                      : 'Portrait'}
                  <select
                    value={mapImage?.kind === 'existing' ? mapImage.path : ''}
                    onChange={(event) => {
                      const path = event.target.value
                      setMapImage(path ? { kind: 'existing', path } : null)
                    }}
                    className="mt-1 w-full rounded border border-line bg-ink px-2 py-1.5 text-sm text-parchment outline-none focus:border-amber"
                  >
                    <option value="">Choose an existing image…</option>
                    {campaignImages.map((img) => (
                      <option key={img.relativePath} value={img.relativePath}>
                        {img.relativePath}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void loadMapImage()}
                    className="rounded border border-line px-2.5 py-1 text-xs hover:border-amber"
                  >
                    Load image…
                  </button>
                  {mapImage?.kind === 'import' ? (
                    <span className="min-w-0 truncate text-[11px] text-muted">
                      {fileNameOf(mapImage.filePath)}
                      {name.trim()
                        ? ` → ${createArtFolder}/${sanitizeFileName(name)}${fileExt(mapImage.filePath)}`
                        : ` → ${createArtFolder}/ (named after the ${prompt.template === 'map' ? 'map' : 'sheet'})`}
                    </span>
                  ) : mapImage?.kind === 'stock' ? (
                    <span className="min-w-0 truncate text-[11px] text-muted">
                      {mapImage.id}
                      {name.trim() ? ` → ${createArtFolder}/${sanitizeFileName(name)}.webp` : ''}
                    </span>
                  ) : null}
                </div>
              </div>
            ) : null}
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setPrompt(null)}
                className="rounded border border-line px-2.5 py-1 text-xs hover:border-amber"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy || (prompt.kind !== 'delete' && !name.trim())}
                className="rounded bg-amber px-2.5 py-1 text-xs font-semibold text-on-amber disabled:bg-line"
              >
                {busy
                  ? 'Working…'
                  : prompt.kind === 'delete'
                    ? 'Delete'
                    : prompt.kind === 'duplicate'
                      ? 'Duplicate'
                      : 'Create'}
              </button>
            </div>
          </form>
        </div>,
        document.body
      ) : null}
    </aside>
  )
}
