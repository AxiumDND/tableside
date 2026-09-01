import { describe, expect, it } from 'vitest'
import {
  serializeFencedCallout,
  splitCalloutBlocks,
  stripAuthorComments
} from './callouts'

describe('stripAuthorComments', () => {
  it('removes // lines and HTML comments', () => {
    const raw = [
      '<!-- header note -->',
      '// Scene block — Opening',
      '[!scene] Opening',
      'Visible text',
      '[!/scene]',
      ''
    ].join('\n')
    expect(stripAuthorComments(raw)).toBe('\n[!scene] Opening\nVisible text\n[!/scene]\n')
  })
})

describe('fenced callouts', () => {
  it('parses nested scene with blank lines', () => {
    const md = [
      '[!scene] Opening — the Grey Mare',
      '',
      '![[The Grey Mare.webp]]',
      '',
      "Marta wants them upstairs.",
      '',
      '[!readaloud]',
      'Rain hammers the shutters.',
      '[!/readaloud]',
      '',
      '- Map: [[The Grey Mare]]',
      '[!/scene]'
    ].join('\n')
    const parts = splitCalloutBlocks(md).filter((p) => p.kind !== 'prose' || p.markdown.trim())
    expect(parts).toHaveLength(1)
    expect(parts[0]).toMatchObject({ kind: 'scene', title: 'Opening — the Grey Mare' })
    expect(parts[0]?.markdown).toContain('[!readaloud]')
    expect(parts[0]?.markdown).toContain('Rain hammers the shutters.')
    expect(parts[0]?.markdown).toContain('[!/readaloud]')
    const nested = splitCalloutBlocks(parts[0]?.markdown ?? '')
    expect(nested.some((p) => p.kind === 'readaloud')).toBe(true)
    expect(nested.find((p) => p.kind === 'readaloud')?.markdown).toBe('Rain hammers the shutters.')
  })

  it('parses nested combat inside a scene', () => {
    const md = [
      '[!scene] Ridge',
      '[!combat] Combat 1 — lookouts',
      '**Combatants:** [[Cultist]] ×2 · party',
      '[!/combat]',
      '[!/scene]'
    ].join('\n')
    const scene = splitCalloutBlocks(md).find((p) => p.kind === 'scene')
    expect(scene?.title).toBe('Ridge')
    const nested = splitCalloutBlocks(scene?.markdown ?? '')
    expect(nested.find((p) => p.kind === 'combat')).toMatchObject({
      kind: 'combat',
      title: 'Combat 1 — lookouts',
      markdown: '**Combatants:** [[Cultist]] ×2 · party'
    })
  })

  it('closes innermost with [!end]', () => {
    const md = ['[!scene] A', '[!readaloud]', 'Hi', '[!end]', 'After', '[!/scene]'].join('\n')
    const scene = splitCalloutBlocks(md).find((p) => p.kind === 'scene')
    expect(scene?.markdown).toContain('[!readaloud]\nHi\n[!end]')
    expect(scene?.markdown).toContain('After')
    const nested = splitCalloutBlocks(scene?.markdown ?? '')
    expect(nested.find((p) => p.kind === 'readaloud')?.markdown).toBe('Hi')
  })

  it('accepts [!endscene] and [!/beat] aliases', () => {
    const md = ['[!beat] Gate', 'Body', '[!endscene]'].join('\n')
    const scene = splitCalloutBlocks(md).find((p) => p.kind === 'scene')
    expect(scene?.markdown).toBe('Body')
    expect(scene?.type).toBe('beat')
  })

  it('keeps mismatched close inside scene body', () => {
    const md = ['[!scene] A', 'Text', '[!/readaloud]', 'More', '[!/scene]'].join('\n')
    const scene = splitCalloutBlocks(md).find((p) => p.kind === 'scene')
    expect(scene?.markdown).toContain('[!/readaloud]')
    expect(scene?.markdown).toContain('More')
  })

  it('parses a party roster block with nested focus note', () => {
    const md = [
      '[!party]',
      '- [[PC — Bren Oak|Bren Oak]]',
      '',
      '[!note] Focus tonight',
      'Soft spots.',
      '[!/note]',
      '[!/party]'
    ].join('\n')
    const party = splitCalloutBlocks(md).find((p) => p.kind === 'party')
    expect(party?.markdown).toContain('[[PC — Bren Oak|Bren Oak]]')
    expect(party?.markdown).toContain('[!note] Focus tonight')
    const nested = splitCalloutBlocks(party?.markdown ?? '')
    expect(nested.find((p) => p.kind === 'note')?.title).toBe('Focus tonight')
  })

  it('maps phone aliases', () => {
    expect(splitCalloutBlocks('[!call] Lodin\n![[face.png]]\n[!/call]')[0]?.kind).toBe('phone')
    expect(splitCalloutBlocks('[!incoming] Lodin\n[!/incoming]')[0]?.kind).toBe('phone')
  })

  it('maps hyperspace aliases', () => {
    expect(splitCalloutBlocks('[!jump] Alderaan\n[!/jump]')[0]?.kind).toBe('hyperspace')
    expect(splitCalloutBlocks('[!lightspeed] Kessel\n[!/lightspeed]')[0]?.kind).toBe('hyperspace')
  })

  it('still parses legacy quoted callouts', () => {
    const crawl = splitCalloutBlocks('> [!crawl] Title\n> Line one.\n').find((p) => p.kind === 'crawl')
    expect(crawl).toMatchObject({ title: 'Title', markdown: 'Line one.' })
  })

  it('serializes fences without quote prefixes', () => {
    expect(serializeFencedCallout('gallery', 'Faces', ['interval: 8s', '![[A.png]]'])).toBe(
      ['[!gallery] Faces', 'interval: 8s', '![[A.png]]', '[!/gallery]'].join('\n')
    )
  })
})
