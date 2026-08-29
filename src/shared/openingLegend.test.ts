import { describe, expect, it } from 'vitest'
import {
  LEGEND_HOLD_MS,
  LEGEND_HERALD_MS,
  LEGEND_PREFACE_DEFAULT,
  LEGEND_PREFACE_MS,
  LEGEND_SYNC_MS,
  legendBodyDurationMs,
  legendDurationMs,
  legendEndImageRef,
  legendLogoRef,
  legendMusicRef,
  legendMusicStartDelayMs,
  legendPlainText,
  legendPreface,
  replaceNthLegendCallout,
  serializeLegendCallout
} from './openingLegend'
import { CRAWL_MUSIC_LEAD_MS } from './openingCrawl'

describe('legendPlainText', () => {
  it('strips markdown and keeps paragraph breaks', () => {
    expect(
      legendPlainText('It is a **quiet** season.\n\nThe mayor swears it was [[bandits|thieves]].')
    ).toBe('It is a quiet season.\n\nThe mayor swears it was thieves.')
  })

  it('drops image embeds and field lines from the scroll body', () => {
    expect(
      legendPlainText(
        'preface: In the reign of forgotten kings.\nmusic: Audio/Music/Crawl/Fanfare.mp3\n![[Sigil.png]]\n\nThe well runs cold.'
      )
    ).toBe('The well runs cold.')
  })
})

describe('legendPreface', () => {
  it('uses original default copy when the note omits a preface', () => {
    expect(legendPreface('The well runs cold.')).toBe(LEGEND_PREFACE_DEFAULT)
    expect(LEGEND_PREFACE_DEFAULT).not.toMatch(/galaxy far/i)
  })

  it('reads a custom preface and can skip the card', () => {
    expect(legendPreface('preface: When the ridge road failed.\n\nGo.')).toBe('When the ridge road failed.')
    expect(legendPreface('opening: none\n\nGo.')).toBeNull()
  })
})

describe('legendMusicRef', () => {
  it('reads an optional legend music path', () => {
    expect(legendMusicRef('music: Audio/Music/Crawl/Fanfare.mp3\n\nGo.')).toBe(
      'Audio/Music/Crawl/Fanfare.mp3'
    )
    expect(legendMusicRef('music: none\nGo.')).toBeNull()
  })
})

describe('legendLogoRef', () => {
  it('reads the first wiki or markdown image', () => {
    expect(legendLogoRef('![[Sigil.png]]\n\nThe well runs cold.')).toBe('Sigil.png')
  })
})

describe('legendEndImageRef', () => {
  it('reads an optional closing still', () => {
    expect(legendEndImageRef('end: ![[Art/Pale Well.webp]]\n\nGo.')).toBe('Art/Pale Well.webp')
    expect(legendEndImageRef('end: none\nGo.')).toBeNull()
  })
})

describe('legend callout rewrite', () => {
  it('serializes title, preface, music, herald, end image, and body', () => {
    expect(
      serializeLegendCallout({
        title: 'The Pale Well',
        preface: 'In the year the ridge road failed.',
        musicRef: 'Audio/Music/Crawl/Fanfare.mp3',
        logoRef: 'Sigil.png',
        endImageRef: 'Art/Pale Well.webp',
        body: 'It is a quiet season.\n\nThe well runs cold.'
      })
    ).toBe(
      [
        '[!legend] The Pale Well',
        'preface: In the year the ridge road failed.',
        'music: Audio/Music/Crawl/Fanfare.mp3',
        '![[Sigil.png]]',
        'end: ![[Art/Pale Well.webp]]',
        '',
        'It is a quiet season.',
        '',
        'The well runs cold.',
        '[!/legend]'
      ].join('\n')
    )
  })

  it('replaces the first legend block in a night sheet', () => {
    const src = ['# Session 1', '', '> [!legend] Old', '> preface: none', '> Go.', '', '## 1. The Party', ''].join('\n')
    const next = replaceNthLegendCallout(src, 0, {
      title: 'New',
      preface: 'When the ridge road failed.',
      logoRef: null,
      endImageRef: null,
      musicRef: null,
      body: 'The well runs cold.'
    })
    expect(next).toContain('[!legend] New')
    expect(next).toContain('preface: When the ridge road failed.')
    expect(next).toContain('The well runs cold.')
    expect(next).toContain('[!/legend]')
    expect(next).toContain('## 1. The Party')
    expect(next).not.toContain('[!legend] Old')
  })
})

describe('legend timing', () => {
  it('holds parchment, then the opening line, then the herald', () => {
    expect(LEGEND_HOLD_MS).toBe(1500)
    expect(LEGEND_PREFACE_MS).toBe(6000)
    expect(LEGEND_HERALD_MS).toBe(2500)
  })

  it('starts legend music before the herald, after hold and opening line', () => {
    expect(legendMusicStartDelayMs(undefined)).toBe(LEGEND_HOLD_MS + LEGEND_PREFACE_MS - CRAWL_MUSIC_LEAD_MS)
    expect(legendMusicStartDelayMs(null)).toBe(LEGEND_HOLD_MS - CRAWL_MUSIC_LEAD_MS)
  })

  it('scrolls body for a fixed sync from music start', () => {
    expect(LEGEND_SYNC_MS).toBe(92_000)
    expect(legendDurationMs('The Pale Well', 'Go.')).toBe(LEGEND_SYNC_MS - CRAWL_MUSIC_LEAD_MS - LEGEND_HERALD_MS)
    expect(legendBodyDurationMs()).toBe(legendDurationMs())
  })
})
