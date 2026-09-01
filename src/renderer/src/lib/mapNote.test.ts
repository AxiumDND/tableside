import { describe, expect, it } from 'vitest'
import {
  clamp01,
  clampTokenScale,
  creatureSpaceFromMarkdown,
  ensureHeading,
  extractMapNote,
  isMapNote,
  mapOverviewMarkdown,
  mapRoomMarkdown,
  nextPinLabel,
  parseCreatureSpace,
  parseMapYaml,
  replaceMapFence,
  TOKEN_SCALE_MAX,
  tokenDiameter,
  tokenPortraitPath,
  uniquePinId
} from './mapNote'

const SAMPLE = `# Crypt Level 1

\`\`\`map
image: Crypt Level 1.jpg
pins:
  - id: a
    x: 0.22
    y: 0.31
    label: A
    heading: Room A — Entry
\`\`\`

Whole-map prep.

## Room A — Entry

Read-aloud at the door.

## Room B — Vault

Loot and a trap.
`

describe('map notes', () => {
  it('detects a fenced map block', () => {
    expect(isMapNote(SAMPLE)).toBe(true)
    expect(isMapNote('# Just a note')).toBe(false)
  })

  it('parses image and 0-1 pins', () => {
    const data = extractMapNote(SAMPLE)
    expect(data?.image).toBe('Crypt Level 1.jpg')
    expect(data?.pins).toHaveLength(1)
    expect(data?.pins[0]).toMatchObject({
      id: 'a',
      label: 'A',
      heading: 'Room A — Entry'
    })
    expect(data?.pins[0].x).toBeCloseTo(0.22)
    expect(data?.pins[0].y).toBeCloseTo(0.31)
  })

  it('clamps pin coordinates', () => {
    expect(clamp01(-0.2)).toBe(0)
    expect(clamp01(1.4)).toBe(1)
    const data = parseMapYaml('image: x.png\npins:\n  - id: a\n    x: 2\n    y: -1\n    label: A\n')
    expect(data.pins[0].x).toBe(1)
    expect(data.pins[0].y).toBe(0)
  })

  it('rewrites only the map fence', () => {
    const data = extractMapNote(SAMPLE)
    if (!data) throw new Error('expected map')
    data.pins.push({ id: 'b', x: 0.8, y: 0.4, label: 'B', heading: 'Room B — Vault' })
    const next = replaceMapFence(SAMPLE, data)
    expect(next).toContain('heading: Room B — Vault')
    expect(next).toContain('## Room A — Entry')
    expect(extractMapNote(next)?.pins).toHaveLength(2)
  })

  it('finds room sections and overview', () => {
    expect(mapOverviewMarkdown(SAMPLE)).toContain('Whole-map prep')
    expect(mapRoomMarkdown(SAMPLE, 'Room A — Entry')).toContain('Read-aloud')
    expect(mapRoomMarkdown(SAMPLE, 'room-a-entry')).toContain('Read-aloud')
  })

  it('appends a missing heading', () => {
    const next = ensureHeading(SAMPLE, 'Room C — Crypt')
    expect(next).toContain('## Room C — Crypt')
    expect(mapRoomMarkdown(next, 'Room C — Crypt')).toContain('Room notes')
  })

  it('picks the next pin label and unique ids', () => {
    expect(nextPinLabel([])).toBe('A1')
    expect(nextPinLabel([{ id: 'a', x: 0, y: 0, label: 'A1', heading: '' }])).toBe('A2')
    expect(nextPinLabel([{ id: 'p', x: 0, y: 0, label: 'P15', heading: '' }])).toBe('P16')
    expect(uniquePinId([{ id: 'a' }], 'A')).toBe('a-2')
  })

  it('round-trips fog in the map fence', () => {
    const data = parseMapYaml('image: x.png\npins: []\nfogSize: 16\nfog: AQID\n')
    expect(data.fogSize).toBe(16)
    expect(data.fog).toBe('AQID')
    const next = replaceMapFence('# Map\n\n```map\nimage: x.png\npins: []\n```\n', data)
    expect(next).toContain('fogSize: 16')
    expect(next).toContain('fog: AQID')
  })

  it('locks pins by default and can unlock', () => {
    expect(parseMapYaml('image: x.png\npins: []\n').pinsLocked).toBe(true)
    const unlocked = parseMapYaml('image: x.png\npins: []\npinsLocked: false\n')
    expect(unlocked.pinsLocked).toBe(false)
    expect(replaceMapFence('# Map\n\n```map\nimage: x.png\npins: []\n```\n', unlocked)).toContain('pinsLocked: false')
  })

  it('round-trips tokens with kind, space, and a map-wide scale', () => {
    const data = parseMapYaml(`image: x.png
pins: []
tokenScale: 0.06
tokens:
  - id: jasper
    kind: pc
    source: Party/PC — Jasper Alderwick.md
    x: 0.4
    y: 0.6
    space: small
    label: Jasper
  - id: dire-wolf
    kind: monster
    source: Bestiary/Dire Wolf.md
    x: 0.7
    y: 0.2
    space: large
    label: Dire Wolf
  - id: ghoul
    kind: monster
    source: Bestiary/Ghoul.md
    x: 0.5
    y: 0.5
    label: Ghoul
`)
    expect(data.tokenScale).toBeCloseTo(0.06)
    expect(data.tokens).toHaveLength(3)
    expect(data.tokens[0].space).toBe('small')
    expect(data.tokens[1].space).toBe('large')
    expect(data.tokens[2].space).toBe('medium')
    expect(tokenDiameter(data.tokenScale, 'large')).toBeCloseTo(0.12)
    expect(tokenDiameter(data.tokenScale, 'medium')).toBeCloseTo(0.06)
    expect(clampTokenScale(1)).toBe(TOKEN_SCALE_MAX)
    expect(clampTokenScale(0.001)).toBe(0.008)
    expect(parseCreatureSpace('Huge fiend')).toBe('huge')
    expect(creatureSpaceFromMarkdown('```statblock\nsize: Large\n```')).toBe('large')
    const next = replaceMapFence('# Map\n\n```map\nimage: x.png\npins: []\n```\n', data)
    expect(next).toContain('tokenScale: 0.06')
    expect(next).toContain('space: large')
    expect(next).not.toContain('size: 0.')
    expect(extractMapNote(next)?.tokens).toHaveLength(3)
  })

  it('round-trips the measured grid origin', () => {
    const data = parseMapYaml('image: x.png\npins: []\ntokenScale: 0.08\ngridX: 0.03\ngridY: 0.11\n')
    expect(data.gridX).toBeCloseTo(0.03)
    expect(data.gridY).toBeCloseTo(0.11)
    const next = replaceMapFence('# Map\n\n```map\nimage: x.png\npins: []\n```\n', data)
    expect(next).toContain('gridX: 0.03')
    expect(next).toContain('gridY: 0.11')
  })

  it('resolves a PC token portrait from the character name, not the PC — prefix', () => {
    const path = tokenPortraitPath(
      {
        id: 'jasper',
        kind: 'pc',
        source: 'Party/PC — Jasper Alderwick.md',
        x: 0.5,
        y: 0.5,
        space: 'small',
        label: 'Jasper Alderwick',
        image: ''
      },
      [
        {
          relativePath: 'Party/Art/Jasper Alderwick.png',
          name: 'Jasper Alderwick.png',
          title: 'Jasper Alderwick'
        }
      ]
    )
    expect(path).toBe('Party/Art/Jasper Alderwick.png')
  })
})
