import { useEffect, type MutableRefObject } from 'react'
import type { CampaignInfo } from '../../../shared/types'

export interface NoteAutosave {
  /** Save `contents` to `targetPath`, following any rename the main process makes. */
  commitSave: (targetPath: string, contents: string) => Promise<string | null>
  /** Save the open note if it has unsaved edits (used when leaving/hiding it). */
  flushOpenNote: (targetPath?: string) => Promise<void>
}

/**
 * Autosave lifecycle for the open note: a `commitSave` primitive (shared by the
 * manual save, block/shop edits, and map edits) and `flushOpenNote`, which
 * writes pending edits when the note is switched away from, the window is
 * hidden/closed, or the app quits. Content lives in refs owned by the caller so
 * the listeners can register once and always see the latest text.
 */
export function useNoteAutosave({
  markdownRef,
  originalRef,
  pathRef,
  setOriginal,
  setSaveError,
  onCampaignChange,
  onOpenNote
}: {
  markdownRef: MutableRefObject<string>
  originalRef: MutableRefObject<string>
  pathRef: MutableRefObject<string>
  setOriginal: (value: string) => void
  setSaveError: (value: string) => void
  onCampaignChange?: (campaign: CampaignInfo) => void
  onOpenNote?: (path: string) => void
}): NoteAutosave {
  async function commitSave(targetPath: string, contents: string): Promise<string | null> {
    const result = await window.tabledm.saveFile(targetPath, contents)
    if (!result) return null
    onCampaignChange?.(result.campaign)
    if (result.renamed && result.path !== targetPath) {
      if (pathRef.current === targetPath) {
        pathRef.current = result.path
        onOpenNote?.(result.path)
      }
    }
    return result.path
  }

  async function flushOpenNote(targetPath = pathRef.current): Promise<void> {
    if (!targetPath || markdownRef.current === originalRef.current) return
    try {
      const savedPath = await commitSave(targetPath, markdownRef.current)
      if (!savedPath) {
        setSaveError('Could not save this file.')
        return
      }
      originalRef.current = markdownRef.current
      setOriginal(markdownRef.current)
      setSaveError('')
    } catch {
      setSaveError('Could not save this file.')
    }
  }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { commitSave, flushOpenNote }
}
