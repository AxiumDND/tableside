import { describe, expect, it } from 'vitest'
import {
  buildBlockIndex,
  defaultBlockTemplate,
  deleteBlockByKey,
  insertBlockByKey,
  insertableBlockKindsForParent,
  insertableBlockKinds,
  replaceBlockByKey,
  serializeCalloutBlock
} from './blockIndex'
import { splitCalloutBlocks } from './callouts'

describe('serializeCalloutBlock', () => {
  it('round-trips a scene block', () => {
    const md = [
      '[!scene] Opening',
      'Body line',
      '[!/scene]'
    ].join('\n')
    const block = splitCalloutBlocks(md)[0]!
    expect(serializeCalloutBlock(block)).toBe(md)
  })
})

describe('buildBlockIndex', () => {
  it('indexes top-level and nested blocks', () => {
    const md = [
      '# Session',
      '[!scene] Opening',
      '[!readaloud]',
      'Rain.',
      '[!/readaloud]',
      '[!/scene]'
    ].join('\n')
    const index = buildBlockIndex(md)
    expect(index.has('0:0')).toBe(true)
    expect(index.get('0:0')?.block.kind).toBe('scene')
    expect(index.has('0:0:0')).toBe(true)
    expect(index.get('0:0:0')?.block.kind).toBe('readaloud')
  })
})

describe('replaceBlockByKey', () => {
  it('replaces a top-level block', () => {
    const md = ['# S', '[!note] A', 'one', '[!/note]', '[!note] B', 'two', '[!/note]'].join('\n')
    const index = buildBlockIndex(md)
    const next = replaceBlockByKey(md, index, '0:1', defaultBlockTemplate('readaloud'))
    expect(next).toContain('[!readaloud]')
    expect(next).not.toContain('two')
  })

  it('updates nested treasure without duplicating when prose precedes it', () => {
    const md = [
      '# S',
      '[!scene] Opening',
      'What could happen.',
      '',
      '[!treasure] Cache',
      '**Coin:** … pp · … gp · … sp · … cp',
      '**Mundane:**',
      '**Magic:**',
      '**Hidden:**',
      '**Notes:**',
      '[!/treasure]',
      '[!/scene]'
    ].join('\n')
    const index = buildBlockIndex(md)
    expect(index.get('0:0:0')?.block.kind).toBe('treasure')
    const next = replaceBlockByKey(
      md,
      index,
      '0:0:0',
      [
        '[!treasure] Cache',
        '**Coin:** 3 gp · … sp · … cp · … pp',
        '**Mundane:**',
        '**Magic:**',
        '**Hidden:**',
        '**Notes:**',
        '[!/treasure]'
      ].join('\n')
    )
    expect(next.match(/\[!treasure]/g)).toHaveLength(1)
    expect(next).toContain('3 gp')
    expect(next).toContain('What could happen.')
  })
})

describe('insertBlockByKey', () => {
  it('inserts below a scene block', () => {
    const md = ['# S', '[!scene] Opening', 'Body', '[!/scene]'].join('\n')
    const index = buildBlockIndex(md)
    const { markdown, newKey } = insertBlockByKey(md, index, '0:0', 'below', defaultBlockTemplate('readaloud'))
    expect(markdown).toContain('[!readaloud]')
    expect(markdown.indexOf('[!/scene]')).toBeLessThan(markdown.indexOf('[!readaloud]'))
    expect(newKey).toBe('0:1')
  })
})

describe('deleteBlockByKey', () => {
  it('removes a top-level block', () => {
    const md = ['# S', '[!note] A', 'one', '[!/note]', '[!note] B', 'two', '[!/note]'].join('\n')
    const index = buildBlockIndex(md)
    const next = deleteBlockByKey(md, index, '0:0')
    expect(next).not.toContain('one')
    expect(next).toContain('two')
  })
})

describe('insertableBlockKindsForParent', () => {
  it('hides scene, campfire, crawl, and party inside a scene', () => {
    const kinds = insertableBlockKindsForParent('scene')
    expect(kinds).not.toContain('scene')
    expect(kinds).not.toContain('legend')
    expect(kinds).not.toContain('crawl')
    expect(kinds).not.toContain('party')
    expect(kinds).toContain('readaloud')
    expect(kinds).toContain('combat')
    expect(kinds).toContain('treasure')
    expect(kinds).toContain('text')
    expect(kinds).toContain('video')
    expect(kinds).toContain('phone')
    expect(kinds).toContain('hyperspace')
    expect(kinds).toContain('gallery')
  })
})

describe('insertableBlockKinds', () => {
  it('includes phone and hyperspace for Add above / Add below', () => {
    expect(insertableBlockKinds()).toContain('phone')
    expect(insertableBlockKinds()).toContain('hyperspace')
  })
})
