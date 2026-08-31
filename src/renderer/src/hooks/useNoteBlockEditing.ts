import { useCallback, useState, type MutableRefObject } from 'react'
import type { CampaignCurrency } from '../../../shared/currencies'
import type { CalloutKind } from '../../../shared/callouts'
import {
  buildBlockIndex,
  defaultBlockTemplate,
  deleteBlockByKey,
  insertBlockByKey,
  insertableBlockKindsForParent,
  replaceBlockByKey
} from '../../../shared/blockIndex'

type BlockIndex = ReturnType<typeof buildBlockIndex>

export interface NoteBlockEditing {
  editingBlocks: Set<string>
  toggleBlockEdit: (key: string) => void
  saveSheetBlock: (key: string, replacement: string) => Promise<void>
  insertSheetBlock: (key: string, position: 'above' | 'below', kind: CalloutKind) => Promise<void>
  deleteSheetBlock: (key: string) => Promise<void>
  resetBlockEditing: () => void
}

/**
 * Inline block editing inside a note (add/replace/delete the fenced callout
 * blocks a sheet is built from). Tracks which blocks are open for editing and
 * persists changes through the injected `persistMarkdown`.
 */
export function useNoteBlockEditing({
  markdownRef,
  blockIndex,
  currencies,
  persistMarkdown
}: {
  markdownRef: MutableRefObject<string>
  blockIndex: BlockIndex
  currencies?: CampaignCurrency[]
  persistMarkdown: (next: string) => Promise<void>
}): NoteBlockEditing {
  const [editingBlocks, setEditingBlocks] = useState<Set<string>>(() => new Set())

  function toggleBlockEdit(key: string): void {
    setEditingBlocks((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  async function saveSheetBlock(key: string, replacement: string): Promise<void> {
    const index = buildBlockIndex(markdownRef.current)
    const next = replaceBlockByKey(markdownRef.current, index, key, replacement)
    if (next === markdownRef.current) return
    await persistMarkdown(next)
  }

  async function insertSheetBlock(key: string, position: 'above' | 'below', kind: CalloutKind): Promise<void> {
    const keyParts = key.split(':')
    const parentKey = keyParts.length > 2 ? keyParts.slice(0, -1).join(':') : null
    const parentKind = parentKey ? blockIndex.get(parentKey)?.block.kind : null
    if (!insertableBlockKindsForParent(parentKind).includes(kind)) return
    const template = defaultBlockTemplate(kind, currencies)
    const { markdown: next, newKey } = insertBlockByKey(markdownRef.current, blockIndex, key, position, template)
    await persistMarkdown(next)
    setEditingBlocks(new Set([newKey]))
  }

  async function deleteSheetBlock(key: string): Promise<void> {
    const next = deleteBlockByKey(markdownRef.current, blockIndex, key)
    if (next === markdownRef.current) return
    await persistMarkdown(next)
    setEditingBlocks((prev) => {
      const nextSet = new Set(prev)
      nextSet.delete(key)
      return nextSet
    })
  }

  const resetBlockEditing = useCallback((): void => {
    setEditingBlocks(new Set())
  }, [])

  return { editingBlocks, toggleBlockEdit, saveSheetBlock, insertSheetBlock, deleteSheetBlock, resetBlockEditing }
}
