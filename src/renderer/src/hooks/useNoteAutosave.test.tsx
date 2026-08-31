// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useNoteAutosave } from './useNoteAutosave'

const saveFile = vi.fn()
const onWillClose = vi.fn()
const confirmClose = vi.fn()

beforeEach(() => {
  saveFile.mockReset()
  onWillClose.mockReset().mockReturnValue(() => {})
  confirmClose.mockReset()
  Object.defineProperty(window, 'tabledm', {
    value: { saveFile, onWillClose, confirmClose },
    configurable: true,
    writable: true
  })
})

function setup(refs: { markdown: string; original: string; path: string }) {
  const markdownRef = { current: refs.markdown }
  const originalRef = { current: refs.original }
  const pathRef = { current: refs.path }
  const setOriginal = vi.fn()
  const setSaveError = vi.fn()
  const onCampaignChange = vi.fn()
  const onOpenNote = vi.fn()
  const { result } = renderHook(() =>
    useNoteAutosave({ markdownRef, originalRef, pathRef, setOriginal, setSaveError, onCampaignChange, onOpenNote })
  )
  return { result, markdownRef, originalRef, pathRef, setOriginal, setSaveError, onOpenNote }
}

describe('useNoteAutosave', () => {
  it('flushOpenNote is a no-op when the note is not dirty', async () => {
    const { result } = setup({ markdown: 'same', original: 'same', path: 'note.md' })
    await act(async () => {
      await result.current.flushOpenNote()
    })
    expect(saveFile).not.toHaveBeenCalled()
  })

  it('flushOpenNote saves pending edits and syncs the baseline', async () => {
    saveFile.mockResolvedValue({ campaign: { name: 'C' }, path: 'note.md', renamed: false })
    const { result, originalRef, setOriginal, setSaveError } = setup({
      markdown: 'edited',
      original: 'old',
      path: 'note.md'
    })
    await act(async () => {
      await result.current.flushOpenNote()
    })
    expect(saveFile).toHaveBeenCalledWith('note.md', 'edited')
    expect(originalRef.current).toBe('edited')
    expect(setOriginal).toHaveBeenCalledWith('edited')
    expect(setSaveError).toHaveBeenCalledWith('')
  })

  it('commitSave follows a rename from the main process', async () => {
    saveFile.mockResolvedValue({ campaign: { name: 'C' }, path: 'renamed.md', renamed: true })
    const { result, pathRef, onOpenNote } = setup({ markdown: 'x', original: 'y', path: 'old.md' })
    let saved: string | null = null
    await act(async () => {
      saved = await result.current.commitSave('old.md', 'x')
    })
    expect(saved).toBe('renamed.md')
    expect(pathRef.current).toBe('renamed.md')
    expect(onOpenNote).toHaveBeenCalledWith('renamed.md')
  })

  it('flushOpenNote reports an error when the save fails', async () => {
    saveFile.mockResolvedValue(null)
    const { result, setSaveError, setOriginal } = setup({ markdown: 'edited', original: 'old', path: 'note.md' })
    await act(async () => {
      await result.current.flushOpenNote()
    })
    expect(setSaveError).toHaveBeenCalledWith('Could not save this file.')
    expect(setOriginal).not.toHaveBeenCalled()
  })
})
