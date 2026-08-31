import { useEffect, useState, type MutableRefObject } from 'react'

export interface NoteEditSession {
  editing: boolean
  setEditing: (value: boolean) => void
  confirmDiscard: boolean
  setConfirmDiscard: (value: boolean) => void
  save: () => Promise<void>
  discardEdits: () => void
  requestCloseEditor: () => void
  /** Reset the edit session when a different note loads. */
  resetEditSession: () => void
}

/**
 * The full-note edit session: whether the editor is open, the unsaved-changes
 * confirm state, and the save / discard / close actions plus their Ctrl+S /
 * Escape shortcuts and editor focus. Saving goes through the injected
 * `commitSave`; note content lives in the caller (passed in).
 */
export function useNoteEditSession({
  path,
  markdown,
  original,
  setMarkdown,
  setOriginal,
  setSaveError,
  commitSave,
  editorRef
}: {
  path: string
  markdown: string
  original: string
  setMarkdown: (value: string) => void
  setOriginal: (value: string) => void
  setSaveError: (value: string) => void
  commitSave: (targetPath: string, contents: string) => Promise<string | null>
  editorRef: MutableRefObject<HTMLTextAreaElement | null>
}): NoteEditSession {
  const [editing, setEditing] = useState(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)

  async function save(): Promise<void> {
    if (!path) return
    try {
      const savedPath = await commitSave(path, markdown)
      if (!savedPath) {
        setSaveError('Could not save this file.')
        return
      }
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

  function resetEditSession(): void {
    setEditing(false)
    setConfirmDiscard(false)
  }

  useEffect(() => {
    if (editing) editorRef.current?.focus()
  }, [editing, editorRef])

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, markdown, path])

  return {
    editing,
    setEditing,
    confirmDiscard,
    setConfirmDiscard,
    save,
    discardEdits,
    requestCloseEditor,
    resetEditSession
  }
}
