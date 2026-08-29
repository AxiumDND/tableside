import { beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('./mediaAssets', () => ({
  findSrdItemFile: () => null,
  findSrdPortraitFile: () => null,
  findSrdSchoolFile: () => null,
  findStockArtFile: () => null
}))

describe('schoolFromSpellMarkdown', () => {
  let schoolFromSpellMarkdown: typeof import('./campaignNotes').schoolFromSpellMarkdown

  beforeAll(async () => {
    ;({ schoolFromSpellMarkdown } = await import('./campaignNotes'))
  })

  it('extracts and normalizes a spell school', () => {
    expect(schoolFromSpellMarkdown('2nd-level Evocation')).toBe('Evocation')
    expect(schoolFromSpellMarkdown('**School:** ILLUSION')).toBe('Illusion')
  })

  it('returns null when no school is present', () => {
    expect(schoolFromSpellMarkdown('# Fire Bolt\nA cantrip.')).toBeNull()
  })
})

describe('noteFileName', () => {
  let noteFileName: typeof import('./campaignNotes').noteFileName

  beforeAll(async () => {
    ;({ noteFileName } = await import('./campaignNotes'))
  })

  it('sanitizes and appends .md', () => {
    expect(noteFileName('Places', 'The Well.md', 'place')).toBe('The Well.md')
  })

  it('prefixes Party player sheets with PC —', () => {
    expect(noteFileName('Party', 'Aria', 'player')).toBe('PC — Aria.md')
    expect(noteFileName('Party', 'PC — Aria', 'player')).toBe('PC — Aria.md')
  })

  it('does not force PC prefix outside Party', () => {
    expect(noteFileName('Notes', 'Aria', 'player')).toBe('Aria.md')
  })

  it('uses the game-night sheet stem for nightsheet templates', () => {
    expect(noteFileName('Sessions', 'River Ambush', 'nightsheet')).toMatch(/Game Night Sheet\.md$/i)
  })
})
