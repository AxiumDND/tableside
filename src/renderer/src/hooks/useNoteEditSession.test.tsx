// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useNoteEditSession } from './useNoteEditSession'

function setup(opts: { markdown: string; original: string; commitResult?: string | null }) {
  const setMarkdown = vi.fn()
  const setOriginal = vi.fn()
  const setSaveError = vi.fn()
  const commitSave = vi.fn().mockResolvedValue(opts.commitResult === undefined ? 'note.md' : opts.commitResult)
  const editorRef = { current: null }
  const { result } = renderHook(() =>
    useNoteEditSession({
      path: 'note.md',
      markdown: opts.markdown,
      original: opts.original,
      setMarkdown,
      setOriginal,
      setSaveError,
      commitSave,
      editorRef
    })
  )
  return { result, setMarkdown, setOriginal, setSaveError, commitSave }
}

describe('useNoteEditSession', () => {
  it('save commits, syncs the baseline, and closes the editor', async () => {
    const { result, setOriginal, setSaveError, commitSave } = setup({ markdown: 'edited', original: 'old' })
    act(() => result.current.setEditing(true))
    await act(async () => {
      await result.current.save()
    })
    expect(commitSave).toHaveBeenCalledWith('note.md', 'edited')
    expect(setOriginal).toHaveBeenCalledWith('edited')
    expect(setSaveError).toHaveBeenCalledWith('')
    expect(result.current.editing).toBe(false)
  })

  it('save reports an error and stays open when the commit fails', async () => {
    const { result, setSaveError, setOriginal } = setup({ markdown: 'edited', original: 'old', commitResult: null })
    act(() => result.current.setEditing(true))
    await act(async () => {
      await result.current.save()
    })
    expect(setSaveError).toHaveBeenCalledWith('Could not save this file.')
    expect(setOriginal).not.toHaveBeenCalled()
    expect(result.current.editing).toBe(true)
  })

  it('requestCloseEditor confirms when dirty and closes when clean', () => {
    const dirty = setup({ markdown: 'a', original: 'b' })
    act(() => dirty.result.current.setEditing(true))
    act(() => dirty.result.current.requestCloseEditor())
    expect(dirty.result.current.confirmDiscard).toBe(true)
    expect(dirty.result.current.editing).toBe(true)

    const clean = setup({ markdown: 'same', original: 'same' })
    act(() => clean.result.current.setEditing(true))
    act(() => clean.result.current.requestCloseEditor())
    expect(clean.result.current.editing).toBe(false)
  })

  it('discardEdits reverts to the original and closes', () => {
    const { result, setMarkdown } = setup({ markdown: 'edited', original: 'orig' })
    act(() => result.current.setEditing(true))
    act(() => result.current.discardEdits())
    expect(setMarkdown).toHaveBeenCalledWith('orig')
    expect(result.current.editing).toBe(false)
  })
})
