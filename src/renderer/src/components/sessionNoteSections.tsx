import { type ReactNode } from 'react'
import {
  encounterSectionId,
  isCombatHeading,
  splitCalloutBlocks,
  splitMarkdownSections
} from '../lib/notes'
import { renderBoxedCombatSection, type RenderNoteMarkdown } from './sessionNoteCombat'
import type { SessionNoteMarkdownDeps } from './sessionNoteTypes'

export function renderNoteSections(opts: {
  text: string
  keyPrefix: string
  encounterScope?: string
  crawlOffset: number
  legendOffset: number
  galleryOffset: number
  videoOffset: number
  phoneOffset: number
  hyperOffset: number
  sectionIndexAt: (index: number) => number
  blockPathPrefix: number[]
  wrapEmpty: boolean
  renderMarkdown: RenderNoteMarkdown
  encounters: SessionNoteMarkdownDeps['encounters']
  addingId: string | null
  onAddEncounter: unknown
  onAddEncounterClick: SessionNoteMarkdownDeps['onAddEncounterClick']
  path: string
  noteIndex: SessionNoteMarkdownDeps['noteIndex']
}): ReactNode {
  const docSections = splitMarkdownSections(opts.text)
  if (docSections.length === 0) {
    const body = opts.renderMarkdown(
      opts.text || '_This file is empty._',
      opts.keyPrefix,
      opts.crawlOffset,
      opts.legendOffset,
      opts.galleryOffset,
      opts.videoOffset,
      opts.phoneOffset,
      opts.hyperOffset,
      opts.encounterScope,
      opts.sectionIndexAt(0),
      opts.blockPathPrefix
    )
    return opts.wrapEmpty ? <div className="markdown-body">{body}</div> : body
  }
  let crawlsBefore = 0
  let legendsBefore = 0
  let galleriesBefore = 0
  let videosBefore = 0
  let phonesBefore = 0
  let hypersBefore = 0
  return docSections.map((section, index) => {
    const sectionId = opts.encounterScope
      ? encounterSectionId(section.heading, opts.encounterScope)
      : section.id
    const encounter = opts.encounters.find((item) => item.id === sectionId)
    const boxed = Boolean(encounter) || isCombatHeading(section.heading)
    const key = `${opts.keyPrefix}-${section.id || index}`
    const parts = splitCalloutBlocks(section.markdown)
    const sectionCrawls = parts.filter((block) => block.kind === 'crawl').length
    const sectionLegends = parts.filter((block) => block.kind === 'legend').length
    const sectionGalleries = parts.filter((block) => block.kind === 'gallery').length
    const sectionVideos = parts.filter((block) => block.kind === 'video').length
    const sectionPhones = parts.filter((block) => block.kind === 'phone').length
    const sectionHypers = parts.filter((block) => block.kind === 'hyperspace').length
    const crawlOff = opts.crawlOffset + crawlsBefore
    const legendOff = opts.legendOffset + legendsBefore
    const galleryOff = opts.galleryOffset + galleriesBefore
    const videoOff = opts.videoOffset + videosBefore
    const phoneOff = opts.phoneOffset + phonesBefore
    const hyperOff = opts.hyperOffset + hypersBefore
    crawlsBefore += sectionCrawls
    legendsBefore += sectionLegends
    galleriesBefore += sectionGalleries
    videosBefore += sectionVideos
    phonesBefore += sectionPhones
    hypersBefore += sectionHypers
    const sectionIndex = opts.sectionIndexAt(index)
    if (!boxed) {
      return (
        <div key={key} className="markdown-body">
          {opts.renderMarkdown(
            section.markdown || '_This file is empty._',
            key,
            crawlOff,
            legendOff,
            galleryOff,
            videoOff,
            phoneOff,
            hyperOff,
            opts.encounterScope,
            sectionIndex,
            opts.blockPathPrefix
          )}
        </div>
      )
    }
    return renderBoxedCombatSection({
      key,
      heading: section.heading,
      markdown: section.markdown,
      encounter,
      addingId: opts.addingId,
      onAddEncounter: opts.onAddEncounter,
      onAddEncounterClick: opts.onAddEncounterClick,
      path: opts.path,
      noteIndex: opts.noteIndex,
      crawlOff,
      legendOff,
      galleryOff,
      videoOff,
      phoneOff,
      hyperOff,
      encounterScope: opts.encounterScope,
      sectionIndex,
      blockPathPrefix: opts.blockPathPrefix,
      renderMarkdown: opts.renderMarkdown
    })
  })
}
