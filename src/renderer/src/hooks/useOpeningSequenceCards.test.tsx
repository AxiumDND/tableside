// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useOpeningSequenceCards } from './useOpeningSequenceCards'
import type { CrawlCalloutFields } from '../../../shared/openingCrawl'

const addFiles = vi.fn()
const pickImageFile = vi.fn()
const copyArtToNote = vi.fn()

beforeEach(() => {
  addFiles.mockReset().mockResolvedValue({ campaign: { name: 'C' }, paths: ['Handouts/clip.mp4'] })
  pickImageFile.mockReset()
  copyArtToNote.mockReset()
  Object.defineProperty(window, 'tabledm', {
    value: { addFiles, pickImageFile, copyArtToNote },
    configurable: true,
    writable: true
  })
})

function setup(overrides: Record<string, unknown> = {}) {
  const markdownRef = { current: '' }
  const persistMarkdown = vi.fn().mockResolvedValue(undefined)
  const onCampaignChange = vi.fn()
  const onPlayCrawl = vi.fn()
  const onPlayVideo = vi.fn()
  const { result } = renderHook(() =>
    useOpeningSequenceCards({
      path: 'Sessions/one.md',
      images: [],
      markdownRef,
      persistMarkdown,
      onCampaignChange,
      onPlayCrawl,
      onPlayVideo,
      ...overrides
    })
  )
  return { result, persistMarkdown, onCampaignChange, onPlayCrawl, onPlayVideo }
}

describe('useOpeningSequenceCards', () => {
  it('loadVideoFile imports into Handouts and reports the campaign change', async () => {
    const { result, onCampaignChange } = setup()
    let path: string | null = null
    await act(async () => {
      path = await result.current.loadVideoFile()
    })
    expect(addFiles).toHaveBeenCalledWith('Handouts')
    expect(onCampaignChange).toHaveBeenCalledWith({ name: 'C' })
    expect(path).toBe('Handouts/clip.mp4')
  })

  it('loadCrawlMusic imports into the crawl music folder', async () => {
    const { result } = setup()
    await act(async () => {
      await result.current.loadCrawlMusic()
    })
    expect(addFiles).toHaveBeenCalledWith('Audio/Music/Crawl')
  })

  it('playCrawlCard forwards the callout fields to onPlayCrawl', async () => {
    const { result, onPlayCrawl } = setup()
    const fields = {
      title: 'Prologue',
      body: 'Long ago...',
      logoRef: '',
      endImageRef: '',
      preface: '',
      musicRef: ''
    } as unknown as CrawlCalloutFields
    await act(async () => {
      await result.current.playCrawlCard(0, fields)
    })
    expect(onPlayCrawl).toHaveBeenCalledOnce()
    expect(onPlayCrawl.mock.calls[0][0]).toBe('Prologue')
    expect(onPlayCrawl.mock.calls[0][1]).toBe('Long ago...')
  })
})
