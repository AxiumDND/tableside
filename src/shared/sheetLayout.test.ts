import { describe, expect, it } from 'vitest'
import { liftStatblockToTop } from './sheetLayout'

describe('liftStatblockToTop', () => {
  it('moves a trailing statblock under the sheet header', () => {
    const src = `# Ghoul

[!monster]
![[Ghoul.webp]]
[!/monster]

*Hungry.*

## Notes

Three come through the doors.

\`\`\`statblock
name: Ghoul
ac: 12
\`\`\`
`
    const out = liftStatblockToTop(src)
    expect(out.indexOf('```statblock')).toBeLessThan(out.indexOf('## Notes'))
    expect(out).toContain('![[Ghoul.webp]]')
    expect(out.match(/```statblock/g)).toHaveLength(1)
  })

  it('drops a Combat heading and Combatants line that sat above the fence', () => {
    const src = `# Jackal

[!monster]
![[Jackal.webp]]
[!/monster]

## Notes

Add notes.

## Combat

**Combatants:** [[Jackal]] · party

\`\`\`statblock
name: Jackal
\`\`\`
`
    const out = liftStatblockToTop(src)
    expect(out).not.toContain('## Combat')
    expect(out).not.toContain('**Combatants:**')
    expect(out.indexOf('```statblock')).toBeLessThan(out.indexOf('## Notes'))
  })

  it('strips a leftover Stat block heading after the fence moves', () => {
    const src = `# *Dallas*

[!pc]
![[Dallas.webp]]
[!/pc]

## Notes

Hook.

## Stat block (DM combat reference)
[!gmonly]
Condensed from the player's sheet.
[!/gmonly]

#dnd

\`\`\`statblock
name: Dallas
\`\`\`
`
    const out = liftStatblockToTop(src)
    expect(out).not.toContain('## Stat block')
    expect(out).toContain('Condensed from the player')
    expect(out.indexOf('```statblock')).toBeLessThan(out.indexOf('## Notes'))
  })

  it('is a no-op when the fence is already under the sheet header', () => {
    const src = `# Ghoul

[!monster]
![[Ghoul.webp]]
[!/monster]

\`\`\`statblock
name: Ghoul
\`\`\`

## Notes

Three come through the doors.
`
    expect(liftStatblockToTop(src)).toBe(src.replace(/\n{3,}/g, '\n\n'))
  })

  it('still lifts under a legacy quote infobox', () => {
    const src = `# Ghoul

> [!infobox]+
> ![[Ghoul.webp]]
>

\`\`\`statblock
name: Ghoul
\`\`\`

## Notes

Done.
`
    const out = liftStatblockToTop(src)
    expect(out.indexOf('```statblock')).toBeLessThan(out.indexOf('## Notes'))
  })

  it('leaves notes without a statblock alone', () => {
    const src = '# Braun Family\n\nNo block here.\n'
    expect(liftStatblockToTop(src)).toBe(src)
  })
})
