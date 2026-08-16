import { describe, expect, it } from 'vitest'
import { searchCampaignFiles } from './campaignSearch'
import type { CampaignTreeNode } from '../../../shared/types'

const tree: CampaignTreeNode[] = [
  {
    name: 'Party',
    relativePath: 'Party',
    type: 'dir',
    children: [
      { name: 'PC — Mira Vess.md', relativePath: 'Party/PC — Mira Vess.md', type: 'file', ext: '.md' },
      { name: 'PC — Kael Thorn.md', relativePath: 'Party/PC — Kael Thorn.md', type: 'file', ext: '.md' }
    ]
  },
  {
    name: 'Bestiary',
    relativePath: 'Bestiary',
    type: 'dir',
    children: [
      { name: 'Wolf.md', relativePath: 'Bestiary/Wolf.md', type: 'file', ext: '.md' },
      {
        name: 'Art',
        relativePath: 'Bestiary/Art',
        type: 'dir',
        children: [
          { name: 'Wolf.png', relativePath: 'Bestiary/Art/Wolf.png', type: 'file', ext: '.png' }
        ]
      }
    ]
  },
  {
    name: 'Archive',
    relativePath: 'Archive',
    type: 'dir',
    children: [
      {
        name: 'Drafts',
        relativePath: 'Archive/Drafts',
        type: 'dir',
        children: [
          {
            name: 'Old Wolf Notes.md',
            relativePath: 'Archive/Drafts/Old Wolf Notes.md',
            type: 'file',
            ext: '.md'
          }
        ]
      }
    ]
  }
]

describe('searchCampaignFiles', () => {
  it('returns nothing for an empty query', () => {
    expect(searchCampaignFiles(tree, '  ')).toEqual([])
  })

  it('finds notes by display name and ignores PC prefix', () => {
    const hits = searchCampaignFiles(tree, 'mira')
    expect(hits.map((h) => h.node.relativePath)).toEqual(['Party/PC — Mira Vess.md'])
  })

  it('ranks exact-ish name matches above path matches and searches nested folders', () => {
    const hits = searchCampaignFiles(tree, 'wolf')
    expect(hits.map((h) => h.node.relativePath)).toEqual([
      'Bestiary/Wolf.md',
      'Bestiary/Art/Wolf.png',
      'Archive/Drafts/Old Wolf Notes.md'
    ])
  })

  it('matches multi-word queries across the path', () => {
    const hits = searchCampaignFiles(tree, 'archive wolf')
    expect(hits.map((h) => h.node.relativePath)).toEqual(['Archive/Drafts/Old Wolf Notes.md'])
  })
})
