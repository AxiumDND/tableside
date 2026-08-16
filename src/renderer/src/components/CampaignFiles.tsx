import { useEffect, useMemo, useRef, useState } from 'react'
import type { CampaignInfo, CampaignTreeNode } from '../../../shared/types'
import {
  DEFAULT_OPEN_FOLDERS,
  canonicalFolder,
  isBestiaryFolderName,
  isGearFolderName,
  isNpcFolderName,
  isPartyFolderName,
  isSessionsFolderName,
  isSpellsFolderName
} from '../../../shared/campaignLayout'
import type { SheetTemplateKind } from '../../../shared/sheetTemplates'
import { IMAGE_EXT, campaignFileUrl } from '../lib/images'
import { parentFolderLabel, searchCampaignFiles } from '../lib/campaignSearch'

export { campaignFileUrl }

const NOTE_EXT = new Set(['.md', '.txt', '.markdown'])
const DEFAULT_OPEN = DEFAULT_OPEN_FOLDERS

export type FileKind = 'note' | 'image' | 'character' | 'pdf' | 'other'

export function fileKind(node: CampaignTreeNode): FileKind {
  const ext = node.ext ?? ''
  if (NOTE_EXT.has(ext)) return 'note'
  if (IMAGE_EXT.has(ext)) return 'image'
  if (ext === '.pdf') return 'pdf'
  if (ext === '.json' && /^(party|npcs)\//.test(node.relativePath)) return 'character'
  return 'other'
}

function displayName(name: string): string {
  return name.replace(/\.(md|markdown|txt|json|png|jpe?g|webp|gif|svg|bmp|pdf)$/i, '').replace(/[-_]/g, ' ')
}

function folderKind(name: string): 'party' | 'npcs' | 'bestiary' | 'spells' | 'gear' | 'sessions' | null {
  if (isPartyFolderName(name)) return 'party'
  if (isNpcFolderName(name)) return 'npcs'
  if (isBestiaryFolderName(name)) return 'bestiary'
  if (isSpellsFolderName(name)) return 'spells'
  if (isGearFolderName(name)) return 'gear'
  if (isSessionsFolderName(name)) return 'sessions'
  return null
}

type MenuTarget =
  | { kind: 'root'; x: number; y: number }
  | { kind: 'node'; x: number; y: number; node: CampaignTreeNode }

type PromptState =
  | { kind: 'create'; folder: string; template: SheetTemplateKind; title: string }
  | { kind: 'duplicate'; from: string; title: string; defaultName: string }

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
  const [open, setOpen] = useState(DEFAULT_OPEN.has(canonicalFolder(node.name)) || depth === 0)
  const isSelected = selected === node.relativePath

  if (node.type === 'dir') {
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
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
  const [busy, setBusy] = useState(false)
  const [query, setQuery] = useState('')
  const promptInputRef = useRef<HTMLInputElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const count = useMemo(() => {
    const walk = (nodes: CampaignTreeNode[]): number =>
      nodes.reduce((sum, node) => sum + (node.type === 'file' ? 1 : walk(node.children ?? [])), 0)
    return walk(tree)
  }, [tree])

  const searching = query.trim().length > 0
  const searchHits = useMemo(() => searchCampaignFiles(tree, query), [tree, query])

  useEffect(() => {
    if (!prompt) return
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
    const typing = (target: EventTarget | null): boolean =>
      target instanceof HTMLElement &&
      (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)

    const onKey = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
        return
      }
      if (e.key === '/' && !typing(e.target)) {
        e.preventDefault()
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function openMenu(event: React.MouseEvent, node?: CampaignTreeNode): void {
    event.preventDefault()
    event.stopPropagation()
    const x = Math.min(event.clientX, window.innerWidth - 200)
    const y = Math.min(event.clientY, window.innerHeight - 220)
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
      nightsheet: 'New night sheet'
    }
    setPrompt({ kind: 'create', folder, template, title: titles[template] })
    setName('')
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

  async function addFiles(folder: string): Promise<void> {
    setMenu(null)
    const result = await window.tabledm.addFiles(folder)
    if (!result) return
    onTreeChange?.(result.campaign, result.paths[0])
  }

  async function submitPrompt(): Promise<void> {
    if (!prompt || busy) return
    const value = name.trim()
    if (!value) return
    setBusy(true)
    try {
      if (prompt.kind === 'create') {
        const result = await window.tabledm.createNote(prompt.folder, value, prompt.template)
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
  const folderHint = menu?.kind === 'node' && menu.node.type === 'dir' ? folderKind(menu.node.name) : null

  return (
    <aside className="flex min-h-0 flex-1 flex-col bg-ink">
      <header className="border-b border-line px-3 py-2" onContextMenu={(event) => openMenu(event)}>
        <div className="font-display text-amber">Files</div>
        <div className="truncate text-[11px] text-muted">
          {campaignName} · {count} files · right-click to add
        </div>
        <div className="relative mt-2">
          <input
            ref={searchInputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                if (query) {
                  event.preventDefault()
                  setQuery('')
                } else {
                  searchInputRef.current?.blur()
                }
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
              key={node.relativePath}
              node={node}
              depth={0}
              selected={selected}
              onOpen={onOpen}
              onMenu={openMenu}
            />
          ))
        )}
      </nav>

      {menu ? (
        <div
          className="fixed z-40 min-w-44 rounded border border-line bg-panel py-1 shadow-lg"
          style={{ left: menu.x, top: menu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          {menu.kind === 'node' && menu.node.type === 'file' ? (
            <>
              <MenuItem label="Duplicate…" onClick={() => startDuplicate(menu.node)} />
              <MenuItem
                label="Add files here…"
                onClick={() => {
                  const path = menu.node.relativePath.replaceAll('\\', '/')
                  const slash = path.lastIndexOf('/')
                  void addFiles(slash === -1 ? '' : path.slice(0, slash))
                }}
              />
            </>
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
                <MenuItem label="New night sheet…" onClick={() => startCreate(folderPath, 'nightsheet')} />
              ) : null}
              <MenuItem label="New note…" onClick={() => startCreate(folderPath, 'blank')} />
              <MenuItem label="Add files…" onClick={() => void addFiles(folderPath)} />
            </>
          )}
        </div>
      ) : null}

      {prompt ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4"
          onClick={() => !busy && setPrompt(null)}
        >
          <form
            className="w-full max-w-sm rounded border border-line bg-panel p-4"
            onClick={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault()
              void submitPrompt()
            }}
          >
            <h3 className="font-display text-lg text-amber">{prompt.title}</h3>
            <p className="mt-1 text-[11px] text-muted">
              {prompt.kind === 'create' && prompt.template !== 'blank'
                ? 'Uses the matching Templates file if you have one.'
                : prompt.kind === 'duplicate'
                  ? 'Creates a copy next to the original.'
                  : 'Creates an empty markdown note.'}
            </p>
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
                disabled={busy || !name.trim()}
                className="rounded bg-amber px-2.5 py-1 text-xs font-semibold text-ink disabled:bg-line"
              >
                {busy ? 'Working…' : prompt.kind === 'duplicate' ? 'Duplicate' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </aside>
  )
}
