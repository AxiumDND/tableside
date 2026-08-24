import { describe, expect, it } from 'vitest'
import {
  CRAWL_HOLD_MS,
  CRAWL_LOGO_MS,
  CRAWL_PREFACE_DEFAULT,
  CRAWL_PREFACE_MS,
  CRAWL_SYNC_MS,
  crawlDurationMs,
  crawlEndImageRef,
  crawlLogoRef,
  crawlMusicRef,
  crawlMusicStartDelayMs,
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

  it('drops the preface and music lines from the scrolling body', () => {
    expect(
      crawlPlainText(
        'preface: In an age before memory, beyond the rim of charted stars.\nmusic: Audio/Music/Crawl/Fanfare.mp3\n\nIt is a time of unrest.'
      )
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

describe('crawlMusicRef', () => {
  it('reads an optional crawl music path', () => {
    expect(crawlMusicRef('music: Audio/Music/Crawl/Fanfare.mp3\n\nGo.')).toBe(
      'Audio/Music/Crawl/Fanfare.mp3'
    )
    expect(crawlMusicRef('theme: [[Audio/Music/General/Town.mp3]]\nGo.')).toBe(
      'Audio/Music/General/Town.mp3'
    )
    expect(crawlMusicRef('music: none\nGo.')).toBeNull()
    expect(crawlMusicRef('It is a time of unrest.')).toBeNull()
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

describe('crawlEndImageRef', () => {
  it('reads an optional closing still', () => {
    expect(crawlEndImageRef('end: ![[Art/Planet.png]]\n\nGo.')).toBe('Art/Planet.png')
    expect(crawlEndImageRef('end image: Sessions/Ship.jpg\nGo.')).toBe('Sessions/Ship.jpg')
    expect(crawlEndImageRef('end: none\nGo.')).toBeNull()
    expect(crawlEndImageRef('It is a time of unrest.')).toBeNull()
  })
})

describe('crawl callout rewrite', () => {
  it('serializes title, preface, music, emblem, end image, and body', () => {
    expect(
      serializeCrawlCallout({
        title: 'The Siege of Kestrel',
        preface: 'In an age before memory, beyond the rim of charted stars.',
        musicRef: 'Audio/Music/Crawl/Fanfare.mp3',
        logoRef: 'Fleet Mark.png',
        endImageRef: 'Art/Planet.png',
        body: 'It is a time of unrest.\n\nThe outer colonies have gone silent.'
      })
    ).toBe(
      [
        '> [!crawl] The Siege of Kestrel',
        '> preface: In an age before memory, beyond the rim of charted stars.',
        '> music: Audio/Music/Crawl/Fanfare.mp3',
        '> ![[Fleet Mark.png]]',
        '> end: ![[Art/Planet.png]]',
        '>',
        '> It is a time of unrest.',
        '>',
        '> The outer colonies have gone silent.'
      ].join('\n')
    )
  })

  it('replaces the first crawl block in a night sheet', () => {
    const src = ['# Session 4', '', '> [!crawl] Old', '> preface: none', '> Go.', '', '## 1. The characters', ''].join('\n')
    const next = replaceNthCrawlCallout(src, 0, {
      title: 'New',
      preface: 'Past the last mapped sun.',
      logoRef: null,
      endImageRef: null,
      musicRef: null,
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

describe('crawlMusicStartDelayMs', () => {
  it('starts crawl music 0.5s before the emblem, after hold and far-off line', () => {
    expect(crawlMusicStartDelayMs(undefined)).toBe(CRAWL_HOLD_MS + CRAWL_PREFACE_MS - 500)
    expect(crawlMusicStartDelayMs('Past the rim.')).toBe(CRAWL_HOLD_MS + CRAWL_PREFACE_MS - 500)
    expect(crawlMusicStartDelayMs(null)).toBe(CRAWL_HOLD_MS - 500)
  })
})

describe('crawlDurationMs', () => {
  it('scrolls for a fixed 1:32 sync from music start (logo + lead subtracted)', () => {
    expect(CRAWL_SYNC_MS).toBe(92_000)
    expect(crawlDurationMs('Kestrel', 'Go.')).toBe(CRAWL_SYNC_MS - 500 - CRAWL_LOGO_MS)
    expect(crawlDurationMs('Title', Array.from({ length: 400 }, () => 'fleet').join(' '))).toBe(
      CRAWL_SYNC_MS - 500 - CRAWL_LOGO_MS
    )
    expect(crawlWordCount('Kestrel', 'Go.')).toBe(2)
  })
})
