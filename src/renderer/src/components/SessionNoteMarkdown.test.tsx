// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createSessionNoteMarkdown, type SessionNoteMarkdownDeps } from './SessionNoteMarkdown'
import { linkWikiNotes, parseNightEncounters, type CampaignNote } from '../lib/notes'

const NOTES: CampaignNote[] = [
  { relativePath: 'NPCs/Ash.md', name: 'Ash.md', stem: 'Ash' },
  { relativePath: 'Bestiary/Wolf.md', name: 'Wolf.md', stem: 'Wolf' }
]

function deps(overrides: Partial<SessionNoteMarkdownDeps> = {}): SessionNoteMarkdownDeps {
  return {
    markdown: '',
    path: 'Sessions/Night.md',
    images: [],
    noteIndex: NOTES,
    encounters: [],
    addingId: null,
    onAddEncounterClick: vi.fn(),
    persistCrawl: vi.fn(),
    playCrawlCard: vi.fn(),
    loadCrawlLogo: async () => null,
    loadCrawlEndImage: async () => null,
    loadCrawlMusic: async () => null,
    persistLegend: vi.fn(),
    playLegendCard: vi.fn(),
    loadLegendLogo: async () => null,
    loadLegendEndImage: async () => null,
    loadLegendMusic: async () => null,
    persistGallery: vi.fn(),
    playGalleryCard: vi.fn(),
    persistVideo: vi.fn(),
    playVideoCard: vi.fn(),
    loadVideoFile: async () => null,
    ...overrides
  }
}

function renderNote(markdown: string, extra: Partial<SessionNoteMarkdownDeps> = {}) {
  const linked = linkWikiNotes(markdown, extra.path ?? 'Sessions/Night.md', extra.noteIndex ?? NOTES)
  const encounters =
    extra.encounters ?? parseNightEncounters(markdown, extra.path ?? 'Sessions/Night.md', extra.noteIndex ?? NOTES)
  const onOpenNote = vi.fn()
  const onAddEncounterClick = vi.fn()
  const bound = deps({
    ...extra,
    markdown: linked,
    encounters,
    onOpenNote,
    onAddEncounterClick,
    onAddEncounter: extra.onAddEncounter ?? vi.fn()
  })
  const { renderDocument } = createSessionNoteMarkdown(bound)
  const view = render(<div>{renderDocument(linked, 'note')}</div>)
  return { ...view, onOpenNote, onAddEncounterClick }
}

beforeEach(() => {
  ;(globalThis as unknown as { window: Window }).window.tabledm = {
    readFile: vi.fn().mockResolvedValue('# Ash\n')
  } as unknown as Window['tabledm']
})

describe('SessionNoteMarkdown', () => {
  it('turns a wiki link into a note button', async () => {
    const user = userEvent.setup()
    const { onOpenNote } = renderNote('Talk to [[Ash]] at the mill.\n')
    const link = screen.getByRole('button', { name: 'Ash' })
    expect(link).toBeTruthy()
    await user.click(link)
    expect(onOpenNote).toHaveBeenCalledWith('NPCs/Ash.md')
  })

  it('renders a warning callout card', () => {
    renderNote(['[!warning] Trip-line', 'DC 12 Perception or go prone.', '[!/warning]', ''].join('\n'))
    expect(screen.getByText('Warning')).toBeTruthy()
    expect(screen.getByText('Trip-line')).toBeTruthy()
    expect(screen.getByText(/DC 12 Perception/)).toBeTruthy()
  })

  it('renders a fenced combat block with Add to initiative', async () => {
    const user = userEvent.setup()
    const md = ['[!combat] Ambush', '**Combatants:** [[Wolf]] · party', '[!/combat]', ''].join('\n')
    const { onAddEncounterClick } = renderNote(md)
    expect(screen.getByText('Combat')).toBeTruthy()
    expect(screen.getByText('Ambush')).toBeTruthy()
    expect(screen.getByText('Wolf')).toBeTruthy()
    expect(screen.getByText('party')).toBeTruthy()
    const add = screen.getByRole('button', { name: 'Add to initiative' })
    await user.click(add)
    expect(onAddEncounterClick).toHaveBeenCalledTimes(1)
    expect(onAddEncounterClick.mock.calls[0][0]).toMatchObject({ heading: 'Ambush' })
  })

  it('boxes a Combat heading in a combat card', () => {
    const md = [
      '## Combat 1 — the door',
      '**Combatants:** [[Wolf]] · party',
      '',
      'After the fight they find a tin cup.',
      ''
    ].join('\n')
    renderNote(md)
    expect(screen.getByText('Combat')).toBeTruthy()
    expect(screen.getByText('Combat 1 — the door')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Add to initiative' })).toBeTruthy()
    expect(screen.getByText(/tin cup/)).toBeTruthy()
  })
})
