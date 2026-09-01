import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

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

  it('uses the recap stem for recap templates', () => {
    expect(noteFileName('Sessions', 'River Ambush', 'recap')).toMatch(/Recap\.md$/i)
  })

  it('uses the roster stem for roster templates', () => {
    expect(noteFileName('Party', 'Party Roster', 'roster')).toBe('Party Roster.md')
    expect(noteFileName('Party', 'The Table', 'roster')).toBe('The Table — Roster.md')
  })
})

describe('saveCampaignFile rename', () => {
  let saveCampaignFile: typeof import('./campaignNotes').saveCampaignFile
  let configureCampaignNotes: typeof import('./campaignNotes').configureCampaignNotes
  let root: string

  beforeAll(async () => {
    ;({ saveCampaignFile, configureCampaignNotes } = await import('./campaignNotes'))
  })

  beforeEach(async () => {
    const { mkdtempSync, mkdirSync, writeFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const { tmpdir } = await import('node:os')
    root = mkdtempSync(join(tmpdir(), 'tableside-save-'))
    mkdirSync(join(root, 'Gear', 'Magic Items'), { recursive: true })
    writeFileSync(join(root, 'Gear', 'Magic Items', 'Potion of Healing.md'), '# Potion of Healing\n\nOld.\n', 'utf8')
    configureCampaignNotes({
      getCampaignFolder: () => root,
      samePath: (a, b) => a.replaceAll('\\', '/').toLowerCase() === b.replaceAll('\\', '/').toLowerCase(),
      openFiles: async () => ({ canceled: true, filePaths: [] }),
      onCampaignFilesChanged: async () => undefined
    })
  })

  it('renames the file when the # title changes', async () => {
    const { existsSync, readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const result = await saveCampaignFile(
      'Gear/Magic Items/Potion of Healing.md',
      '# Cloak of Shadows\n\nNew.\n'
    )
    expect(result?.renamed).toBe(true)
    expect(result?.path).toBe('Gear/Magic Items/Cloak of Shadows.md')
    expect(existsSync(join(root, 'Gear', 'Magic Items', 'Cloak of Shadows.md'))).toBe(true)
    expect(existsSync(join(root, 'Gear', 'Magic Items', 'Potion of Healing.md'))).toBe(false)
    expect(readFileSync(join(root, 'Gear', 'Magic Items', 'Cloak of Shadows.md'), 'utf8')).toContain(
      'Cloak of Shadows'
    )
  })

  it('does not rename when the title is unchanged', async () => {
    const result = await saveCampaignFile(
      'Gear/Magic Items/Potion of Healing.md',
      '# Potion of Healing\n\nStill.\n'
    )
    expect(result?.renamed).toBe(false)
    expect(result?.path).toBe('Gear/Magic Items/Potion of Healing.md')
  })
})