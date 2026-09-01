import { type ComponentProps, type ReactNode } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  insertableBlockKinds,
  insertableBlockKindsForParent,
  serializeCalloutBlock,
  type BlockIndex
} from '../../../shared/blockIndex'
import type { CalloutBlock, CalloutKind } from '../../../shared/callouts'
import { markdownUrlTransform, resolveMarkdownImageSrc, type CampaignImage } from '../lib/images'
import { childText, headingId } from '../lib/notes'
import BlockMarkdownEditor from './BlockMarkdownEditor'
import CalloutCard from './CalloutCard'
import LinksCard, { type BlockNavEntry } from './LinksCard'
import NoteWikiLink from './NoteWikiLink'
import SheetBlockShell, { BLOCK_KIND_LABELS } from './SheetBlockShell'

export type MarkdownComponents = ComponentProps<typeof Markdown>['components']

export type WrapSheetBlock = (
  blockKey: string,
  part: CalloutBlock,
  defaultKind: CalloutKind,
  readContent: ReactNode,
  editContent?: ReactNode,
  headerRight?: ReactNode
) => ReactNode

export function sheetBlockKind(kind: CalloutKind): CalloutKind {
  return insertableBlockKinds().includes(kind) ? kind : 'note'
}

export function blockNavEntries(blockIndex: BlockIndex | undefined, excludeKey: string): BlockNavEntry[] {
  if (!blockIndex) return []
  return [...blockIndex.entries()]
    .filter(([key, item]) => key !== excludeKey && item.block.kind !== 'links')
    .sort((a, b) => a[1].range.from - b[1].range.from)
    .map(([key, item]) => ({
      key,
      kind: item.block.kind,
      title: item.block.title,
      depth: Math.max(0, key.split(':').length - 2)
    }))
}

export function createNoteMarkdownComponents(opts: {
  path: string
  images: CampaignImage[]
  selectedImage?: string | null
  onOpenNote?: (path: string) => void
  onSelectImage?: (path: string) => void
}): MarkdownComponents {
  return {
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
          <NoteWikiLink notePath={notePath} onOpenNote={opts.onOpenNote} images={opts.images}>
            {children}
          </NoteWikiLink>
        )
      }
      return (
        <a href={href} className="text-amber underline">
          {children}
        </a>
      )
    },
    img: ({ src, alt }: { src?: string; alt?: string }) => {
      const resolved = resolveMarkdownImageSrc(src, opts.path, opts.images)
      const active = resolved.path != null && resolved.path === opts.selectedImage
      return (
        <button
          type="button"
          onClick={() => resolved.path && opts.onSelectImage?.(resolved.path)}
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
}

export function createWrapSheetBlock(opts: {
  blockEditEnabled: boolean
  editingBlocks: ReadonlySet<string>
  onBlockEdit?: (key: string) => void
  onBlockDone?: (key: string) => void
  onBlockSave?: (key: string, markdown: string) => void
  onBlockInsert?: (key: string, position: 'above' | 'below', kind: CalloutKind) => void
  onBlockDelete?: (key: string) => void
  blockIndex?: BlockIndex
  disabled?: boolean
}): WrapSheetBlock {
  return (blockKey, part, defaultKind, readContent, editContent, headerRight) => {
    if (!opts.blockEditEnabled || !opts.onBlockEdit || !opts.onBlockDone) {
      return (
        <div id={`sheet-block-${blockKey.replace(/:/g, '-')}`} className="scroll-mt-3">
          {readContent}
        </div>
      )
    }
    const editing = opts.editingBlocks.has(blockKey)
    const keyParts = blockKey.split(':')
    const parentKey = keyParts.length > 2 ? keyParts.slice(0, -1).join(':') : null
    const parentKind = parentKey ? opts.blockIndex?.get(parentKey)?.block.kind : null
    const insertKinds = insertableBlockKindsForParent(parentKind)
    return (
      <SheetBlockShell
        blockKey={blockKey}
        editing={editing}
        disabled={opts.disabled}
        defaultKind={defaultKind}
        insertKinds={insertKinds}
        onEdit={() => opts.onBlockEdit?.(blockKey)}
        onDone={() => opts.onBlockDone?.(blockKey)}
        onInsertAbove={opts.onBlockInsert ? (kind) => opts.onBlockInsert?.(blockKey, 'above', kind) : undefined}
        onInsertBelow={opts.onBlockInsert ? (kind) => opts.onBlockInsert?.(blockKey, 'below', kind) : undefined}
        onDelete={opts.onBlockDelete ? () => opts.onBlockDelete?.(blockKey) : undefined}
        headerRight={headerRight}
      >
        {editing
          ? editContent ?? (
              <BlockMarkdownEditor
                title={part.title ?? ''}
                body={part.markdown}
                kindLabel={BLOCK_KIND_LABELS[defaultKind] ?? defaultKind}
                disabled={opts.disabled}
                onChange={({ title, body }) =>
                  opts.onBlockSave?.(
                    blockKey,
                    serializeCalloutBlock({
                      ...part,
                      title: title.trim() || undefined,
                      markdown: body
                    })
                  )
                }
              />
            )
          : readContent}
      </SheetBlockShell>
    )
  }
}

/** Fenced `[!links]` — auto TOC of other blocks on this sheet. */
export function renderLinksBlock(opts: {
  part: CalloutBlock
  key: string
  blockKey: string
  wrapSheetBlock: WrapSheetBlock
  blockIndex?: BlockIndex
  disabled?: boolean
  onBlockSave?: (key: string, markdown: string) => void
}): ReactNode {
  const entries = blockNavEntries(opts.blockIndex, opts.blockKey)
  const read = <LinksCard title={opts.part.title} entries={entries} />
  const edit = (
    <div className="space-y-2">
      <LinksCard title={opts.part.title} entries={entries} />
      <p className="pl-2 text-[11px] text-muted">
        Links update automatically from every other block on this sheet.
      </p>
      <BlockMarkdownEditor
        title={opts.part.title ?? ''}
        body=""
        kindLabel="Links"
        titleOnly
        disabled={opts.disabled}
        onChange={({ title }) =>
          opts.onBlockSave?.(
            opts.blockKey,
            serializeCalloutBlock({
              ...opts.part,
              title: title.trim() || undefined,
              markdown: ''
            })
          )
        }
      />
    </div>
  )
  return (
    <div key={opts.key}>
      {opts.wrapSheetBlock(opts.blockKey, opts.part, 'links', read, edit)}
    </div>
  )
}

/** Warning / tip / note / abstract and other leftover callout kinds. */
export function renderGenericCalloutBlock(opts: {
  part: CalloutBlock
  key: string
  blockKey: string
  wrapSheetBlock: WrapSheetBlock
  markdownComponents: MarkdownComponents
}): ReactNode {
  const read = (
    <CalloutCard type={opts.part.kind === 'other' ? (opts.part.type ?? 'note') : opts.part.kind} title={opts.part.title}>
      {opts.part.markdown.trim() ? (
        <Markdown remarkPlugins={[remarkGfm]} urlTransform={markdownUrlTransform} components={opts.markdownComponents}>
          {opts.part.markdown}
        </Markdown>
      ) : null}
    </CalloutCard>
  )
  return (
    <div key={opts.key}>
      {opts.wrapSheetBlock(opts.blockKey, opts.part, sheetBlockKind(opts.part.kind), read)}
    </div>
  )
}
