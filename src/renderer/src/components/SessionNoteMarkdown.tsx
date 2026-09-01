import type { ReactNode } from 'react'
import { createSessionNoteRenderers } from './sessionNoteDispatch'
import { createNoteMarkdownComponents, createWrapSheetBlock } from './sessionNoteShell'
import type { SessionNoteMarkdownDeps } from './sessionNoteTypes'

export type { SessionNoteMarkdownDeps } from './sessionNoteTypes'

export function createSessionNoteMarkdown(deps: SessionNoteMarkdownDeps): {
  renderMarkdown: (
    text: string,
    keyPrefix: string,
    crawlOffset?: number,
    legendOffset?: number,
    galleryOffset?: number,
    videoOffset?: number,
    phoneOffset?: number,
    hyperOffset?: number,
    encounterScope?: string
  ) => ReactNode
  renderSectionedMarkdown: (
    text: string,
    keyPrefix: string,
    encounterScope?: string,
    crawlOffset?: number,
    legendOffset?: number,
    galleryOffset?: number,
    videoOffset?: number,
    phoneOffset?: number,
    hyperOffset?: number
  ) => ReactNode
  renderDocument: (text: string, keyPrefix: string) => ReactNode
} {
  const markdownComponents = createNoteMarkdownComponents({
    path: deps.path,
    images: deps.images,
    selectedImage: deps.selectedImage,
    onOpenNote: deps.onOpenNote,
    onSelectImage: deps.onSelectImage
  })
  const wrapSheetBlock = createWrapSheetBlock({
    blockEditEnabled: deps.blockEditEnabled ?? false,
    editingBlocks: deps.editingBlocks ?? new Set(),
    onBlockEdit: deps.onBlockEdit,
    onBlockDone: deps.onBlockDone,
    onBlockSave: deps.onBlockSave,
    onBlockInsert: deps.onBlockInsert,
    onBlockDelete: deps.onBlockDelete,
    blockIndex: deps.blockIndex,
    disabled: deps.disabled
  })
  return createSessionNoteRenderers({ ...deps, wrapSheetBlock, markdownComponents })
}
