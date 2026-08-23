import { describe, expect, it } from 'vitest'
import {
  CRAWL_HOLD_MS,
  CRAWL_LOGO_MS,
  CRAWL_PREFACE_DEFAULT,
  CRAWL_PREFACE_MS,
  crawlDurationMs,
  crawlLogoRef,
  crawlPlainText,
  crawlPreface,
  crawlWordCount,
  replaceNthCrawlCallout,
  serializeCrawlCallout
} from './openingCrawl'

describe('crawlPlainText', () => {
  it('strips markdown and keeps paragraph breaks', () => {
    expect(
      crawlPlainText('It is a **time** of unrest.\n\nA courier ship carries the last [[Kestrel|warning]].')
    ).toBe('It is a time of unrest.\n\nA courier ship carries the last warning.')
  })

  it('drops image embeds so they are not spoken as crawl text', () => {
    expect(crawlPlainText('![[Fleet Mark.png]]\n\nIt is a time of unrest.')).toBe('It is a time of unrest.')
  })

  it('drops the preface line from the scrolling body', () => {
    expect(
      crawlPlainText('preface: In an age before memory, beyond the rim of charted stars.\n\nIt is a time of unrest.')
    ).toBe('It is a time of unrest.')
  })
})

describe('crawlPreface', () => {
  it('uses original default copy when the note omits a preface', () => {
    expect(crawlPreface('It is a time of unrest.')).toBe(CRAWL_PREFACE_DEFAULT)
    expect(CRAWL_PREFACE_DEFAULT).not.toMatch(/galaxy far/i)
  })

  it('reads a custom preface and can skip the card', () => {
    expect(crawlPreface('preface: Past the last mapped sun.\n\nGo.')).toBe('Past the last mapped sun.')
    expect(crawlPreface('ago: none\n\nGo.')).toBeNull()
  })
})

describe('crawlLogoRef', () => {
  it('reads the first wiki or markdown image', () => {
    expect(crawlLogoRef('![[Fleet Mark.png]]\n\nIt is a time of unrest.')).toBe('Fleet Mark.png')
    expect(crawlLogoRef('![mark](<tabledm://file/?path=Sessions%2FArt%2FMark.png>)\nGo.')).toBe(
      'tabledm://file/?path=Sessions%2FArt%2FMark.png'
    )
  })
})

describe('crawl callout rewrite', () => {
  it('serializes title, preface, emblem, and body', () => {
    expect(
      serializeCrawlCallout({
        title: 'The Siege of Kestrel',
        preface: 'In an age before memory, beyond the rim of charted stars.',
        logoRef: 'Fleet Mark.png',
        body: 'It is a time of unrest.\n\nThe outer colonies have gone silent.'
      })
    ).toBe(`> [!crawl] The Siege of Kestrel
> preface: In an age before memory, beyond the rim of charted stars.
> ![[Fleet Mark.png]]
>
> It is a time of unrest.
>
> The outer colonies have gone silent.`)
  })

  it('replaces the first crawl block in a night sheet', () => {
    const src = `# Session 4

> [!crawl] Old
> preface: none
> Go.

## 1. The characters
`
    const next = replaceNthCrawlCallout(src, 0, {
      title: 'New',
      preface: 'Past the last mapped sun.',
      logoRef: null,
      body: 'A courier leaves the docks.'
    })
    expect(next).toContain('> [!crawl] New')
    expect(next).toContain('> preface: Past the last mapped sun.')
    expect(next).toContain('> A courier leaves the docks.')
    expect(next).toContain('## 1. The characters')
    expect(next).not.toContain('> [!crawl] Old')
  })
})

describe('crawl hold', () => {
  it('holds stars, then the far-off card, then the emblem', () => {
    expect(CRAWL_HOLD_MS).toBe(2000)
    expect(CRAWL_PREFACE_MS).toBe(8000)
    expect(CRAWL_LOGO_MS).toBe(2500)
  })
})

describe('crawlDurationMs', () => {
  it('clamps short copy to 20 seconds', () => {
    expect(crawlWordCount('Kestrel', 'Go.')).toBe(2)
    expect(crawlDurationMs('Kestrel', 'Go.')).toBe(20_000)
  })

  it('grows with word count and caps at 90 seconds', () => {
    const mid = Array.from({ length: 80 }, () => 'fleet').join(' ')
    expect(crawlDurationMs(undefined, mid)).toBe(Math.round((8 + 80 * 0.35) * 1000))
    const long = Array.from({ length: 400 }, () => 'fleet').join(' ')
    expect(crawlDurationMs('Title', long)).toBe(90_000)
  })
})
