import { describe, expect, it } from 'vitest'
import {
  isVideoPath,
  replaceNthVideoCallout,
  serializeVideoCallout,
  videoMuted,
  videoRef
} from './playerVideo'

describe('videoRef', () => {
  it('reads wiki or video: field', () => {
    expect(videoRef('![[Sessions/Art/Intro.mp4]]')).toBe('Sessions/Art/Intro.mp4')
    expect(videoRef('video: Media/Clip.webm\nmute: true')).toBe('Media/Clip.webm')
    expect(videoRef('No clip here')).toBeNull()
  })
})

describe('videoMuted', () => {
  it('defaults off and reads mute line', () => {
    expect(videoMuted('![[Intro.mp4]]')).toBe(false)
    expect(videoMuted('mute: true\n![[Intro.mp4]]')).toBe(true)
    expect(videoMuted('mute: no\n![[Intro.mp4]]')).toBe(false)
  })
})

describe('isVideoPath', () => {
  it('recognizes common video extensions', () => {
    expect(isVideoPath('a.mp4')).toBe(true)
    expect(isVideoPath('a.webm')).toBe(true)
    expect(isVideoPath('a.png')).toBe(false)
  })
})

describe('video callout rewrite', () => {
  it('serializes title, mute, and clip', () => {
    expect(
      serializeVideoCallout({
        title: 'Opening',
        muted: true,
        videoRef: 'Art/Intro.mp4'
      })
    ).toBe(['[!video] Opening', 'mute: true', '![[Art/Intro.mp4]]', '[!/video]'].join('\n'))
  })

  it('replaces the first video block', () => {
    const src = '# Session\n\n> [!video] Old\n> ![[A.mp4]]\n\n## Next\n'
    const next = replaceNthVideoCallout(src, 0, {
      title: 'New',
      muted: false,
      videoRef: 'B.mp4'
    })
    expect(next).toContain('[!video] New')
    expect(next).toContain('![[B.mp4]]')
    expect(next).toContain('[!/video]')
    expect(next).not.toContain('Old')
  })
})
