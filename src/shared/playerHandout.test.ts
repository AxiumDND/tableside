import { describe, expect, it } from 'vitest'
import {
  buildPlayerHandout,
  markdownToPlayerPlain,
  noteHasGmSecrets,
  playerSafeNoteBody
} from './playerHandout'

const ITEM = `# Cloak of Shadows

[!gear]
![[Cloak of Shadows.png]]

### *Wondrous Item*

| | |
|---|---|
| **Rarity** | Rare |
| **Attunement** | Yes |
| **Weight** | 1 lb. |
[!/gear]

A dark cloak that muffles footsteps.

[!gmonly]
Cursed: attunement cannot be ended without Remove Curse.
[!/gmonly]
`

describe('playerSafeNoteBody', () => {
  it('strips gmonly by default and keeps player prose', () => {
    const body = playerSafeNoteBody(
      'A dark cloak that muffles footsteps.\n\n[!gmonly]\nCursed.\n[!/gmonly]'
    )
    expect(body).toContain('muffles')
    expect(body).not.toContain('Cursed')
  })

  it('includes gmonly when requested', () => {
    const body = playerSafeNoteBody(
      'Visible.\n\n[!gmonly]\nSecret curse.\n[!/gmonly]',
      true
    )
    expect(body).toContain('Visible')
    expect(body).toContain('Secret curse')
  })
})

describe('buildPlayerHandout', () => {
  it('builds title, facts, and body without secrets', () => {
    const handout = buildPlayerHandout('Gear/Magic Items/Cloak of Shadows.md', ITEM)
    expect(handout?.title).toBe('Cloak of Shadows')
    expect(handout?.subtitle).toBe('Wondrous Item')
    expect(handout?.facts?.some((f) => f.label === 'Rarity' && f.value === 'Rare')).toBe(true)
    expect(handout?.body).toContain('muffles')
    expect(handout?.body).not.toContain('Cursed')
    expect(handout?.includeSecrets).toBeUndefined()
  })

  it('can include GM secrets', () => {
    const handout = buildPlayerHandout('Gear/Magic Items/Cloak of Shadows.md', ITEM, {
      includeSecrets: true
    })
    expect(handout?.body).toContain('Cursed')
    expect(handout?.includeSecrets).toBe(true)
  })

  it('returns null outside handout folders', () => {
    expect(buildPlayerHandout('Party/PC — Aria.md', '# Aria\n\nHi')).toBeNull()
  })
})

describe('helpers', () => {
  it('detects gm secrets', () => {
    expect(noteHasGmSecrets(ITEM)).toBe(true)
    expect(noteHasGmSecrets('# Ring\n\nJust a ring.')).toBe(false)
  })

  it('flattens light markdown', () => {
    expect(markdownToPlayerPlain('**Bold** and [[Kay|the priest]]')).toBe('Bold and the priest')
  })
})
