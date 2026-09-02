import { describe, expect, it } from 'vitest'
import {
  applyDndBeyondUrl,
  dndBeyondUrlFromMarkdown,
  isDndBeyondFactLabel,
  parseDndBeyondCharacterUrl
} from './dndBeyond'

describe('parseDndBeyondCharacterUrl', () => {
  it('accepts a standard character URL and a slug', () => {
    expect(parseDndBeyondCharacterUrl('https://www.dndbeyond.com/characters/12345678-aria-vale')).toEqual({
      kind: 'character',
      characterId: '12345678',
      canonicalUrl: 'https://www.dndbeyond.com/characters/12345678',
      suggestedName: 'Aria Vale'
    })
  })

  it('accepts profile URLs, short links, and a bare id', () => {
    expect(parseDndBeyondCharacterUrl('https://www.dndbeyond.com/profile/Ada/characters/99')?.characterId).toBe(
      '99'
    )
    expect(parseDndBeyondCharacterUrl('https://ddb.ac/characters/99/AbCdEf')?.canonicalUrl).toBe(
      'https://www.dndbeyond.com/characters/99'
    )
    expect(parseDndBeyondCharacterUrl('44556677')?.canonicalUrl).toBe(
      'https://www.dndbeyond.com/characters/44556677'
    )
  })

  it('accepts official and homebrew monster pages', () => {
    expect(parseDndBeyondCharacterUrl('https://www.dndbeyond.com/monsters/16780-goblin')).toEqual({
      kind: 'monster',
      characterId: '16780-goblin',
      canonicalUrl: 'https://www.dndbeyond.com/monsters/16780-goblin',
      suggestedName: 'Goblin'
    })
    expect(parseDndBeyondCharacterUrl('https://www.dndbeyond.com/monsters/adult-black-dragon')?.canonicalUrl).toBe(
      'https://www.dndbeyond.com/monsters/adult-black-dragon'
    )
    expect(parseDndBeyondCharacterUrl('https://www.dndbeyond.com/monsters/4775812-dire-wolf')?.canonicalUrl).toBe(
      'https://www.dndbeyond.com/monsters/4775812-dire-wolf'
    )
    expect(
      parseDndBeyondCharacterUrl('https://www.dndbeyond.com/homebrew/monsters/12345')?.canonicalUrl
    ).toBe('https://www.dndbeyond.com/homebrew/monsters/12345')
  })

  it('rejects non-character D&D Beyond pages and unsafe schemes', () => {
    expect(parseDndBeyondCharacterUrl('https://www.dndbeyond.com/spells/fireball')).toBeNull()
    expect(parseDndBeyondCharacterUrl('https://example.com/characters/1')).toBeNull()
    expect(parseDndBeyondCharacterUrl('javascript:alert(1)')).toBeNull()
    expect(parseDndBeyondCharacterUrl('file:///etc/passwd')).toBeNull()
    expect(parseDndBeyondCharacterUrl('https://www.dndbeyond.com/characters/1\nhttps://evil.test')).toBeNull()
  })
})

describe('dndBeyondUrlFromMarkdown', () => {
  it('reads the infobox row and ignores other links', () => {
    const md = [
      '[!pc]',
      '| | |',
      '|---|---|',
      '| **Player** | Sam |',
      '| **D&D Beyond** | https://www.dndbeyond.com/characters/42-sam |',
      '[!/pc]',
      'See also https://www.dndbeyond.com/monsters/wolf'
    ].join('\n')
    expect(dndBeyondUrlFromMarkdown(md)).toBe('https://www.dndbeyond.com/characters/42')
  })
})

describe('applyDndBeyondUrl', () => {
  it('inserts a row after the infobox header and replaces an existing one', () => {
    const base = ['[!pc]', '| | |', '|---|---|', '| **Player** | Name |', '[!/pc]'].join('\n')
    const first = applyDndBeyondUrl(base, 'https://www.dndbeyond.com/characters/7')
    expect(first).toContain('| **Web sheet** | https://www.dndbeyond.com/characters/7 |')
    const next = applyDndBeyondUrl(first ?? '', '88')
    expect(next?.match(/Web sheet/g)?.length).toBe(1)
    expect(next).toContain('https://www.dndbeyond.com/characters/88')
  })

  it('returns null for a non-character URL', () => {
    expect(applyDndBeyondUrl('# Aria', 'https://www.dndbeyond.com/spells/fireball')).toBeNull()
  })

  it('writes a monster link onto an NPC sheet fence', () => {
    const patched = applyDndBeyondUrl(
      '[!npc] Hale\nA fence in Greystead.\n',
      'https://www.dndbeyond.com/monsters/scout'
    )
    expect(patched).toContain('| **Web sheet** | https://www.dndbeyond.com/monsters/scout |')
  })
})

describe('isDndBeyondFactLabel', () => {
  it('matches the common infobox labels', () => {
    expect(isDndBeyondFactLabel('D&D Beyond')).toBe(true)
    expect(isDndBeyondFactLabel('Dnd Beyond')).toBe(true)
    expect(isDndBeyondFactLabel('Web sheet')).toBe(true)
    expect(isDndBeyondFactLabel('Player')).toBe(false)
  })
})
