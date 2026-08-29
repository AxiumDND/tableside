import type { CampaignTreeNode } from '../../../shared/types'

function displayName(name: string): string {
  return name
    .replace(/\.(md|markdown|txt|json|png|jpe?g|webp|gif|svg|bmp|pdf|mp3|ogg|wav|m4a|flac|webm|aac)$/i, '')
    .replace(/[-_]/g, ' ')
}

function foldSearch(value: string): string {
  return value
    .toLowerCase()
    .replace(/[—–−]/g, '-')
    .replace(/^pc\s*[-—–]+\s*/i, '')
    .replace(/[_/\\]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export interface FileSearchHit {
  node: CampaignTreeNode
  score: number
}

/** Ranked flat file matches for the campaign Files search box. */
export function searchCampaignFiles(nodes: CampaignTreeNode[], query: string): FileSearchHit[] {
  const q = foldSearch(query)
  if (!q) return []
  const hits: FileSearchHit[] = []

  const walk = (list: CampaignTreeNode[]): void => {
    for (const node of list) {
      if (node.type === 'dir') {
        walk(node.children ?? [])
        continue
      }
      const label = displayName(node.name)
      const foldedLabel = foldSearch(label)
      const foldedPath = foldSearch(node.relativePath)
      const foldedName = foldSearch(node.name)
      let score = 0
      if (foldedLabel === q || foldedName === q) score = 100
      else if (foldedLabel.startsWith(q)) score = 80
      else if (foldedLabel.includes(q)) score = 60
      else if (foldedPath.includes(q)) score = 40
      else if (q.split(' ').every((part) => part && (foldedLabel.includes(part) || foldedPath.includes(part)))) {
        score = 30
      }
      if (score > 0) hits.push({ node, score })
    }
  }

  walk(nodes)
  return hits.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    const aNote = /\.(md|markdown|txt)$/i.test(a.node.name) ? 0 : 1
    const bNote = /\.(md|markdown|txt)$/i.test(b.node.name) ? 0 : 1
    if (aNote !== bNote) return aNote - bNote
    const aDepth = a.node.relativePath.split(/[/\\]/).length
    const bDepth = b.node.relativePath.split(/[/\\]/).length
    if (aDepth !== bDepth) return aDepth - bDepth
    return (
      displayName(a.node.name).localeCompare(displayName(b.node.name)) ||
      a.node.relativePath.localeCompare(b.node.relativePath)
    )
  })
}

export function parentFolderLabel(path: string): string {
  const parts = path.replaceAll('\\', '/').split('/').filter(Boolean)
  if (parts.length < 2) return ''
  return parts.slice(0, -1).join(' / ')
}
