import { describe, expect, it } from 'vitest'
import {
  applyWebSheetUrl,
  webSheetUrlFromMarkdown,
  isWebSheetFactLabel,
  parseWebSheetUrl
} from './webSheet'

describe('parseWebSheetUrl', () => {
  it('accepts a standard character URL and a slug', () => {
    expect(parseWebSheetUrl('https://www.dndbeyond.com/characters/12345678-aria-vale')).toEqual({
      kind: 'character',
      characterId: '12345678',
      canonicalUrl: 'https://www.dndbeyond.com/characters/12345678',
      suggestedName: 'Aria Vale'
    })
  })

  it('accepts profile URLs, short links, and a bare id', () => {
    expect(parseWebSheetUrl('https://www.dndbeyond.com/profile/Ada/characters/99')?.characterId).toBe(
      '99'
    )
    expect(parseWebSheetUrl('https://ddb.ac/characters/99/AbCdEf')?.canonicalUrl).toBe(
      'https://www.dndbeyond.com/characters/99'
    )
    expect(parseWebSheetUrl('44556677')?.canonicalUrl).toBe(
      'https://www.dndbeyond.com/characters/44556677'
    )
  })

  it('accepts official and homebrew monster pages', () => {
    expect(parseWebSheetUrl('https://www.dndbeyond.com/monsters/16780-goblin')).toEqual({
      kind: 'monster',
      characterId: '16780-goblin',
      canonicalUrl: 'https://www.dndbeyond.com/monsters/16780-goblin',
      suggestedName: 'Goblin'
    })
    expect(parseWebSheetUrl('https://www.dndbeyond.com/monsters/adult-black-dragon')?.canonicalUrl).toBe(
      'https://www.dndbeyond.com/monsters/adult-black-dragon'
    )
    expect(parseWebSheetUrl('https://www.dndbeyond.com/monsters/4775812-dire-wolf')?.canonicalUrl).toBe(
      'https://www.dndbeyond.com/monsters/4775812-dire-wolf'
    )
    expect(
      parseWebSheetUrl('https://www.dndbeyond.com/homebrew/monsters/12345')?.canonicalUrl
    ).toBe('https://www.dndbeyond.com/homebrew/monsters/12345')
  })

  it('rejects non-character pages and unsafe schemes', () => {
    expect(parseWebSheetUrl('https://www.dndbeyond.com/spells/fireball')).toBeNull()
    expect(parseWebSheetUrl('https://example.com/characters/1')).toBeNull()
    expect(parseWebSheetUrl('javascript:alert(1)')).toBeNull()
    expect(parseWebSheetUrl('file:///etc/passwd')).toBeNull()
    expect(parseWebSheetUrl('https://www.dndbeyond.com/characters/1\nhttps://evil.test')).toBeNull()
  })
})

describe('webSheetUrlFromMarkdown', () => {
  it('reads the infobox row and ignores other links', () => {
    const md = [
      '[!pc]',
      '| | |',
      '|---|---|',
      '| **Player** | Sam |',
      '| **Web sheet** | https://www.dndbeyond.com/characters/42-sam |',
      '[!/pc]',
      'See also https://www.dndbeyond.com/monsters/wolf'
    ].join('\n')
    expect(webSheetUrlFromMarkdown(md)).toBe('https://www.dndbeyond.com/characters/42')
  })
})

describe('applyWebSheetUrl', () => {
  it('inserts a row after the infobox header and replaces an existing one', () => {
    const base = ['[!pc]', '| | |', '|---|---|', '| **Player** | Name |', '[!/pc]'].join('\n')
    const first = applyWebSheetUrl(base, 'https://www.dndbeyond.com/characters/7')
    expect(first).toContain('| **Web sheet** | https://www.dndbeyond.com/characters/7 |')
    const next = applyWebSheetUrl(first ?? '', '88')
    expect(next?.match(/Web sheet/g)?.length).toBe(1)
    expect(next).toContain('https://www.dndbeyond.com/characters/88')
  })

  it('returns null for a non-character URL', () => {
    expect(applyWebSheetUrl('# Aria', 'https://www.dndbeyond.com/spells/fireball')).toBeNull()
  })

  it('writes a monster link onto an NPC sheet fence', () => {
    const patched = applyWebSheetUrl(
      '[!npc] Hale\nA fence in Greystead.\n',
      'https://www.dndbeyond.com/monsters/scout'
    )
    expect(patched).toContain('| **Web sheet** | https://www.dndbeyond.com/monsters/scout |')
  })
})

describe('isWebSheetFactLabel', () => {
  it('matches the common infobox labels', () => {
    expect(isWebSheetFactLabel('Web sheet')).toBe(true)
    expect(isWebSheetFactLabel('Beyond')).toBe(true)
    expect(isWebSheetFactLabel(['D', '&', 'D', ' Beyond'].join(''))).toBe(true)
    expect(isWebSheetFactLabel('Player')).toBe(false)
  })
})
