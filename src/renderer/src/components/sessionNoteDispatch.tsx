import { type ReactNode } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { blockKeyFromPath } from '../../../shared/blockIndex'
import { markdownUrlTransform } from '../lib/images'
import { splitCalloutBlocks } from '../lib/notes'
import { emptyMediaCounters, renderCalloutPart, type SessionNoteRendererDeps } from './sessionNoteCallouts'
import { renderNoteSections } from './sessionNoteSections'

export type SessionNoteRenderers = {
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
}

export function createSessionNoteRenderers(deps: SessionNoteRendererDeps): SessionNoteRenderers {
  const {
    markdown,
    path,
    noteIndex,
    encounters,
    addingId,
    onAddEncounter,
    onAddEncounterClick,
    blockEditEnabled = false,
    editingBlocks = new Set(),
    markdownComponents
  } = deps

  function renderMarkdown(
    text: string,
    keyPrefix: string,
    crawlOffset = 0,
    legendOffset = 0,
    galleryOffset = 0,
    videoOffset = 0,
    phoneOffset = 0,
    hyperOffset = 0,
    encounterScope?: string,
    sectionIndex = 0,
    blockPathPrefix: number[] = []
  ): ReactNode {
    const rawCrawls = splitCalloutBlocks(markdown).filter((block) => block.kind === 'crawl')
    const rawLegends = splitCalloutBlocks(markdown).filter((block) => block.kind === 'legend')
    const rawGalleries = splitCalloutBlocks(markdown).filter((block) => block.kind === 'gallery')
    const rawVideos = splitCalloutBlocks(markdown).filter((block) => block.kind === 'video')
    const rawPhones = splitCalloutBlocks(markdown).filter((block) => block.kind === 'phone')
    const rawHypers = splitCalloutBlocks(markdown).filter((block) => block.kind === 'hyperspace')
    const counters = emptyMediaCounters()
    let calloutLocal = 0
    return splitCalloutBlocks(text).map((part, i) => {
      const key = `${keyPrefix}-${i}`
      if (part.kind === 'prose') {
        if (!part.markdown.trim()) return null
        return (
          <Markdown key={key} remarkPlugins={[remarkGfm]} urlTransform={markdownUrlTransform} components={markdownComponents}>
            {part.markdown}
          </Markdown>
        )
      }

      const blockPath = [...blockPathPrefix, calloutLocal]
      calloutLocal += 1
      const blockKey = blockKeyFromPath(sectionIndex, blockPath)
      const blockEditing = blockEditEnabled && editingBlocks.has(blockKey)
      return renderCalloutPart(deps, {
        part,
        key,
        blockKey,
        blockEditing,
        counters,
        offsets: {
          crawl: crawlOffset,
          legend: legendOffset,
          gallery: galleryOffset,
          video: videoOffset,
          phone: phoneOffset,
          hyper: hyperOffset
        },
        rawCrawls,
        rawLegends,
        rawGalleries,
        rawVideos,
        rawPhones,
        rawHypers,
        encounterScope,
        sectionIndex,
        blockPath,
        renderSectionedMarkdown
      })
    })
  }

  function renderSectionedMarkdown(
    text: string,
    keyPrefix: string,
    encounterScope?: string,
    crawlOffset = 0,
    legendOffset = 0,
    galleryOffset = 0,
    videoOffset = 0,
    phoneOffset = 0,
    hyperOffset = 0,
    sectionIndex = 0,
    blockPathPrefix: number[] = []
  ): ReactNode {
    return renderNoteSections({
      text,
      keyPrefix,
      encounterScope,
      crawlOffset,
      legendOffset,
      galleryOffset,
      videoOffset,
      phoneOffset,
      hyperOffset,
      sectionIndexAt: () => sectionIndex,
      blockPathPrefix,
      wrapEmpty: false,
      renderMarkdown,
      encounters,
      addingId,
      onAddEncounter,
      onAddEncounterClick,
      path,
      noteIndex
    })
  }

  function renderDocument(text: string, keyPrefix: string): ReactNode {
    return renderNoteSections({
      text,
      keyPrefix,
      crawlOffset: 0,
      legendOffset: 0,
      galleryOffset: 0,
      videoOffset: 0,
      phoneOffset: 0,
      hyperOffset: 0,
      sectionIndexAt: (index) => index,
      blockPathPrefix: [],
      wrapEmpty: true,
      renderMarkdown,
      encounters,
      addingId,
      onAddEncounter,
      onAddEncounterClick,
      path,
      noteIndex
    })
  }

  return { renderMarkdown, renderSectionedMarkdown, renderDocument }
}
