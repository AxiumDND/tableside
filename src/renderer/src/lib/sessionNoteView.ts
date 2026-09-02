import { pathHasFolder } from '../../../shared/campaignLayout'
import { webSheetUrlFromMarkdown } from '../../../shared/webSheet'
import { isMapNote } from './mapNote'
import { extractStatblock, fallbackStatblock, isNpcSheet, type ParsedStatblock } from './statblock'

export type SessionNoteFileKind = 'note' | 'image' | 'character' | 'pdf' | 'audio' | 'other'

export type SessionNoteFlags = {
  parsedNpc: { block: ParsedStatblock; rest: string } | null
  npcMode: boolean
  itemMode: boolean
  mapMode: boolean
  sheetChrome: boolean
  webSheetUrl: string | null
}

export function isItemSheetPath(path: string): boolean {
  return (
    pathHasFolder(path, 'gear') ||
    pathHasFolder(path, 'spells') ||
    pathHasFolder(path, 'places') ||
    pathHasFolder(path, 'factions')
  )
}

export function sessionNoteFlags({
  kind,
  path,
  markdown,
  editing
}: {
  kind: SessionNoteFileKind
  path: string
  markdown: string
  editing: boolean
}): SessionNoteFlags {
  const extracted = extractStatblock(markdown)
  const parsedNpc =
    extracted ??
    (kind === 'note' && isNpcSheet(markdown, path)
      ? { block: fallbackStatblock(path, markdown), rest: markdown }
      : null)
  const npcMode = Boolean(parsedNpc && kind === 'note' && !editing && isNpcSheet(markdown, path))
  const itemMode = kind === 'note' && Boolean(path) && !editing && isItemSheetPath(path)
  const mapMode = kind === 'note' && !editing && isMapNote(markdown)
  const webSheetUrl = kind === 'note' ? webSheetUrlFromMarkdown(markdown) : null
  return {
    parsedNpc,
    npcMode,
    itemMode,
    mapMode,
    sheetChrome: npcMode || itemMode,
    webSheetUrl
  }
}

export function handoutButtonLabel(path: string): string {
  if (pathHasFolder(path, 'spells')) return 'Show spell to players'
  if (pathHasFolder(path, 'places')) return 'Show place to players'
  if (pathHasFolder(path, 'factions')) return 'Show faction to players'
  return 'Show item to players'
}
