import { describe, expect, it } from 'vitest'
import {
  LEGEND_HOLD_MS,
  LEGEND_LOOK_DEFAULT,
  LEGEND_SYNC_MS,
  legendBodyDurationMs,
  legendDurationMs,
  legendEndImageRef,
  legendLogoRef,
  legendLook,
  legendMusicRef,
  legendMusicStartDelayMs,
  legendPlainText,
  legendPreface,
  parseLegendLook,
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
        'look: embers\npreface: In the reign of forgotten kings.\nmusic: Audio/Music/Crawl/Fanfare.mp3\n![[Sigil.png]]\n\nThe well runs cold.'
      )
    ).toBe('The well runs cold.')
  })
})

describe('legendLook', () => {
  it('defaults to mist and reads look / style aliases', () => {
    expect(legendLook('The well runs cold.')).toBe(LEGEND_LOOK_DEFAULT)
    expect(legendLook('look: embers\n\nGo.')).toBe('embers')
    expect(legendLook('style: blood\n\nGo.')).toBe('crimson')
    expect(legendLook('atmosphere: cyberpunk\n\nGo.')).toBe('neon')
    expect(parseLegendLook('strahd')).toBe('mist')
  })
})

describe('legendPreface', () => {
  it('ignores omitted preface (scroll starts on the body)', () => {
    expect(legendPreface('The well runs cold.')).toBeNull()
  })

  it('still reads a custom preface line for older notes', () => {
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
  it('serializes look, music, end image, and body', () => {
    expect(
      serializeLegendCallout({
        title: 'The Pale Well',
        preface: null,
        look: 'crimson',
        musicRef: 'Audio/Music/Crawl/Fanfare.mp3',
        logoRef: null,
        endImageRef: 'Art/Pale Well.webp',
        body: 'It is a quiet season.\n\nThe well runs cold.'
      })
    ).toBe(
      [
        '[!legend] The Pale Well',
        'look: crimson',
        'music: Audio/Music/Crawl/Fanfare.mp3',
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
    const src = ['# Session 1', '', '> [!legend] Old', '> look: mist', '> Go.', '', '## 1. The Party', ''].join('\n')
    const next = replaceNthLegendCallout(src, 0, {
      title: 'New',
      preface: null,
      look: 'embers',
      logoRef: null,
      endImageRef: null,
      musicRef: null,
      body: 'The well runs cold.'
    })
    expect(next).toContain('[!legend] New')
    expect(next).toContain('look: embers')
    expect(next).toContain('The well runs cold.')
    expect(next).toContain('[!/legend]')
    expect(next).toContain('## 1. The Party')
    expect(next).not.toContain('[!legend] Old')
  })
})

describe('legend timing', () => {
  it('holds mist briefly then scrolls the body for the full sync window', () => {
    expect(LEGEND_HOLD_MS).toBe(2000)
    expect(legendMusicStartDelayMs()).toBe(LEGEND_HOLD_MS - CRAWL_MUSIC_LEAD_MS)
    expect(legendMusicStartDelayMs(null)).toBe(LEGEND_HOLD_MS - CRAWL_MUSIC_LEAD_MS)
    expect(LEGEND_SYNC_MS).toBe(92_000)
    expect(legendDurationMs('The Pale Well', 'Go.')).toBe(LEGEND_SYNC_MS - CRAWL_MUSIC_LEAD_MS)
    expect(legendBodyDurationMs()).toBe(legendDurationMs())
  })
})
