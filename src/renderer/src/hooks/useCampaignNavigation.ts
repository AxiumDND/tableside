import { useCallback, useState } from 'react'
import type { CampaignInfo, CampaignTreeNode } from '../../../shared/types'
import { adjacentCampaignFile } from '../../../shared/campaignLayout'
import { fileKind, type FileKind } from '../components/CampaignFiles'
import { isImagePath, isPdfPath } from '../lib/images'

interface HistoryEntry {
  path: string
  kind: FileKind
}

export interface CampaignNavigation {
  openPath: string
  openKind: FileKind
  selectedImage: string | null
  history: HistoryEntry[]
  setSelectedImage: (src: string | null) => void
  /** Open a file, pushing the current one onto history (unless re-opening it). */
  navigateTo: (path: string, kind: FileKind) => void
  goBack: () => void
  goNextFile: () => void
  openNote: (notePath: string) => void
  openTreeFile: (node: CampaignTreeNode) => void
  /** Full reset when a new campaign loads: open `note`, clear history. */
  resetNavigation: (note: string) => void
  /** Restore a remembered file without touching history (initial load). */
  restoreOpen: (path: string, kind: FileKind) => void
  /** Clear the open file (e.g. the open note was deleted). */
  clearOpen: () => void
  /** Drop history entries whose path no longer passes `keep` (tree changed). */
  pruneHistory: (keep: (path: string) => boolean) => void
}

/** Open-file / navigation state for the DM console. */
export function useCampaignNavigation(campaign: CampaignInfo | null): CampaignNavigation {
  const [openPath, setOpenPath] = useState('')
  const [openKind, setOpenKind] = useState<FileKind>('note')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])

  const navigateTo = useCallback(
    (path: string, kind: FileKind): void => {
      if (!path || path === openPath) {
        setOpenKind(kind)
        setSelectedImage(kind === 'image' ? path : null)
        return
      }
      if (openPath) {
        setHistory((stack) => [...stack, { path: openPath, kind: openKind }].slice(-40))
      }
      setOpenPath(path)
      setOpenKind(kind)
      setSelectedImage(kind === 'image' ? path : null)
      void window.tabledm.saveSettings({ lastOpenPath: path, lastOpenKind: kind })
    },
    [openPath, openKind]
  )

  const showFile = useCallback((path: string, kind: FileKind): void => {
    setOpenPath(path)
    setOpenKind(kind)
    setSelectedImage(kind === 'image' ? path : null)
    void window.tabledm.saveSettings({ lastOpenPath: path, lastOpenKind: kind })
  }, [])

  const goBack = useCallback((): void => {
    if (history.length === 0) return
    const prev = history[history.length - 1]
    setHistory((stack) => stack.slice(0, -1))
    setOpenPath(prev.path)
    setOpenKind(prev.kind)
    setSelectedImage(prev.kind === 'image' ? prev.path : null)
    void window.tabledm.saveSettings({ lastOpenPath: prev.path, lastOpenKind: prev.kind })
  }, [history])

  const goNextFile = useCallback((): void => {
    if (!campaign) return
    const next = adjacentCampaignFile(campaign.tree, openPath, 1)
    if (!next) return
    showFile(next.relativePath, fileKind(next))
  }, [campaign, openPath, showFile])

  const openNote = useCallback(
    (notePath: string): void => {
      navigateTo(notePath, isImagePath(notePath) ? 'image' : isPdfPath(notePath) ? 'pdf' : 'note')
    },
    [navigateTo]
  )

  const openTreeFile = useCallback(
    (node: CampaignTreeNode): void => {
      navigateTo(node.relativePath, fileKind(node))
    },
    [navigateTo]
  )

  const resetNavigation = useCallback((note: string): void => {
    setOpenPath(note)
    setOpenKind('note')
    setSelectedImage(null)
    setHistory([])
    void window.tabledm.saveSettings({
      lastOpenPath: note || undefined,
      lastOpenKind: note ? 'note' : undefined
    })
  }, [])

  const restoreOpen = useCallback((path: string, kind: FileKind): void => {
    setOpenPath(path)
    setOpenKind(kind)
  }, [])

  const clearOpen = useCallback((): void => {
    setOpenPath('')
    setOpenKind('note')
    setSelectedImage(null)
    void window.tabledm.saveSettings({ lastOpenPath: undefined, lastOpenKind: undefined })
  }, [])

  const pruneHistory = useCallback((keep: (path: string) => boolean): void => {
    setHistory((stack) => stack.filter((item) => keep(item.path)))
  }, [])

  return {
    openPath,
    openKind,
    selectedImage,
    history,
    setSelectedImage,
    navigateTo,
    goBack,
    goNextFile,
    openNote,
    openTreeFile,
    resetNavigation,
    restoreOpen,
    clearOpen,
    pruneHistory
  }
}
