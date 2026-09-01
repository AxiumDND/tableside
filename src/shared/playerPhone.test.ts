import { describe, expect, it } from 'vitest'
import {
  parsePhoneFields,
  phoneNpcRef,
  phoneRingRef,
  replaceNthPhoneCallout,
  serializePhoneCallout
} from './playerPhone'

describe('phoneNpcRef', () => {
  it('reads a note wikilink', () => {
    expect(phoneNpcRef('[[Prince Lodin]]')).toBe('Prince Lodin')
  })

  it('reads an npc: field', () => {
    expect(phoneNpcRef('npc: [[Prince Lodin]]\nring: ![[tone.mp3]]')).toBe('Prince Lodin')
  })

  it('falls back to the callout title', () => {
    expect(phoneNpcRef('ring: ![[tone.mp3]]', 'Prince Lodin')).toBe('Prince Lodin')
  })

  it('ignores image and audio embeds', () => {
    expect(phoneNpcRef('![[face.png]]\nring: ![[ring.mp3]]')).toBeNull()
  })

  it('reads a resolved note markdown link', () => {
    expect(phoneNpcRef('[Ash](#note:NPCs%2FAsh.md)')).toBe('Ash')
  })
})

describe('phoneRingRef', () => {
  it('reads ring: or an audio embed', () => {
    expect(phoneRingRef('[[Lodin]]\nring: Audio/Sfx/phone.wav')).toBe('Audio/Sfx/phone.wav')
    expect(phoneRingRef('![[tone.mp3]]')).toBe('tone.mp3')
  })

  it('returns null when omitted', () => {
    expect(phoneRingRef('[[Lodin]]')).toBeNull()
  })
})

describe('phone callout rewrite', () => {
  it('serializes an NPC link and optional ring', () => {
    expect(
      serializePhoneCallout({
        npcRef: 'Prince Lodin',
        ringRef: 'Audio/Sfx/ring.mp3'
      })
    ).toBe(['[!phone]', '[[Prince Lodin]]', 'ring: ![[Audio/Sfx/ring.mp3]]', '[!/phone]'].join('\n'))
  })

  it('replaces the first phone block', () => {
    const src = '# Night\n\n> [!call] Old\n> [[A]]\n\n## Next\n'
    const next = replaceNthPhoneCallout(src, 0, {
      npcRef: 'B',
      ringRef: null
    })
    expect(next).toContain('[!phone]')
    expect(next).toContain('[[B]]')
    expect(next).toContain('[!/phone]')
    expect(next).not.toContain('[[A]]')
  })

  it('parses title and embeds', () => {
    expect(parsePhoneFields('Lodin', '[[face]]\nring: ![[tone.ogg]]')).toEqual({
      npcRef: 'face',
      ringRef: 'tone.ogg'
    })
  })
})
