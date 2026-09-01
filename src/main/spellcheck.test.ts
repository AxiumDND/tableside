import { describe, expect, it } from 'vitest'
import { editContextTemplate, pickSpellCheckerLanguage, spellSuggestions } from './spellcheck'

const flags = {
  canUndo: true,
  canRedo: false,
  canCut: true,
  canCopy: true,
  canPaste: true,
  canSelectAll: true
}

describe('spellcheck language', () => {
  it('picks an exact locale when the dictionary exists', () => {
    expect(pickSpellCheckerLanguage('en-GB', ['en-US', 'en-GB'])).toBe('en-GB')
  })

  it('falls back to the same language family', () => {
    expect(pickSpellCheckerLanguage('en-AU', ['en-US', 'fr'])).toBe('en-US')
  })

  it('uses English when the OS locale is missing', () => {
    expect(pickSpellCheckerLanguage('cy-GB', ['fr', 'en-US'])).toBe('en-US')
  })

  it('returns null when Electron has no dictionaries', () => {
    expect(pickSpellCheckerLanguage('en-GB', [])).toBeNull()
  })
})

describe('spellcheck menu', () => {
  it('lists replacements then Add to dictionary', () => {
    const items = editContextTemplate(
      {
        misspelledWord: 'teh',
        dictionarySuggestions: ['the', 'tea'],
        editFlags: flags
      },
      () => undefined,
      () => undefined
    )
    expect(items[0]).toMatchObject({ label: 'the' })
    expect(items[1]).toMatchObject({ label: 'tea' })
    expect(items[2]).toMatchObject({ label: 'Add to dictionary' })
  })

  it('still offers cut/copy/paste when the word is spelled correctly', () => {
    const items = editContextTemplate(
      {
        misspelledWord: '',
        dictionarySuggestions: [],
        editFlags: flags
      },
      () => undefined,
      () => undefined
    )
    expect(items.some((item) => 'role' in item && item.role === 'paste')).toBe(true)
    expect(items.some((item) => 'label' in item && item.label === 'Add to dictionary')).toBe(false)
  })

  it('caps suggestion count', () => {
    expect(
      spellSuggestions({
        misspelledWord: 'recieve',
        dictionarySuggestions: ['receive', 'a', 'b', 'c', 'd', 'e', 'f', 'g']
      })
    ).toHaveLength(6)
  })
})
