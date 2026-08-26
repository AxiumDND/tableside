import { defaultUrlTransform } from 'react-markdown'
import type { CampaignTreeNode } from '../../../shared/types'
import { pathHasFolder } from '../../../shared/campaignLayout'

export const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.bmp'])

/** Keep tabledm:// campaign files; otherwise use react-markdown's sanitizer. */
export function markdownUrlTransform(url: string): string {
  if (url.startsWith('tabledm://')) return url
  return defaultUrlTransform(url)
}

export interface CampaignImage {
  relativePath: string
  name: string
  title: string
}

export function campaignFileUrl(relativePath: string): string {
  return `tabledm://file/?path=${encodeURIComponent(relativePath).replace(/'/g, '%27')}`
}

export function srdPortraitUrl(name: string): string {
  const stem = name.replace(/\.[^.]+$/, '').trim()
  return `tabledm://srd-portrait/?name=${encodeURIComponent(stem)}`
}

export function srdItemUrl(name: string): string {
  const stem = name.replace(/\.[^.]+$/, '').trim()
  return `tabledm://srd-item/?name=${encodeURIComponent(stem)}`
}

export function srdSchoolUrl(school: string): string {
  const stem = school.replace(/\.[^.]+$/, '').trim()
  return `tabledm://srd-school/?name=${encodeURIComponent(stem)}`
}

export function portraitSrcForNote(
  notePath: string,
  images: CampaignImage[],
  title?: string
): string | null {
  const campaign = portraitForNote(notePath, images) ?? (title ? portraitForNote(`${title}.md`, images) : null)
  if (campaign) return campaignFileUrl(campaign)
  const file = notePath.replaceAll('\\', '/').split('/').pop() ?? notePath
  const stem = file.replace(/\.[^.]+$/, '')
  if (pathHasFolder(notePath, 'bestiary')) return srdPortraitUrl(title || stem)
  if (pathHasFolder(notePath, 'gear')) return srdItemUrl(title || stem)
  return null
}

export function isImagePath(path: string): boolean {
  const ext = path.slice(path.lastIndexOf('.')).toLowerCase()
  return IMAGE_EXT.has(ext)
}

export function isPdfPath(path: string): boolean {
  return path.slice(path.lastIndexOf('.')).toLowerCase() === '.pdf'
}

export const VIDEO_EXT = new Set(['.mp4', '.webm', '.mov', '.m4v'])

export function isVideoPath(path: string): boolean {
  const ext = path.slice(path.lastIndexOf('.')).toLowerCase()
  return VIDEO_EXT.has(ext)
}

export interface CampaignVideo {
  relativePath: string
  name: string
  title: string
}

export function flattenVideos(nodes: CampaignTreeNode[]): CampaignVideo[] {
  const out: CampaignVideo[] = []
  const walk = (list: CampaignTreeNode[]): void => {
    for (const node of list) {
      if (node.type === 'file' && node.ext && VIDEO_EXT.has(node.ext)) {
        out.push({
          relativePath: node.relativePath,
          name: node.name,
          title: imageTitle(node.relativePath)
        })
      }
      if (node.children) walk(node.children)
    }
  }
  walk(nodes)
  return out
}

export function imageTitle(path: string): string {
  const name = path.split('/').pop() ?? path
  return name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
}

export function flattenImages(nodes: CampaignTreeNode[]): CampaignImage[] {
  const out: CampaignImage[] = []
  const walk = (list: CampaignTreeNode[]): void => {
    for (const node of list) {
      if (node.type === 'file' && node.ext && IMAGE_EXT.has(node.ext)) {
        out.push({
          relativePath: node.relativePath,
          name: node.name,
          title: imageTitle(node.relativePath)
        })
      }
      if (node.children) walk(node.children)
    }
  }
  walk(nodes)
  return out
}

function normalize(path: string): string {
  return path.replaceAll('\\', '/').replace(/^\.\//, '').replace(/^\/+/, '')
}

function parentDir(path: string): string {
  const i = path.lastIndexOf('/')
  return i === -1 ? '' : path.slice(0, i)
}

function joinPath(dir: string, rel: string): string {
  const parts = [...(dir ? dir.split('/') : []), ...rel.split('/')].filter((p) => p && p !== '.')
  const stack: string[] = []
  for (const part of parts) {
    if (part === '..') stack.pop()
    else stack.push(part)
  }
  return stack.join('/')
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function stripSize(ref: string): string {
  return ref.split('|')[0].replace(/^<|>$/g, '').trim()
}

function foldName(value: string): string {
  return value.toLowerCase().replace(/[’‘`]/g, "'").replace(/[—–−]/g, '-').replace(/\s+/g, ' ').trim()
}

export function resolveImageRef(ref: string, notePath: string, images: CampaignImage[]): string | null {
  let cleaned = safeDecode(normalize(stripSize(ref).replace(/\\/g, '/')))
  if (!cleaned) return null

  const fileUrl = /^(?:file:\/\/\/|app:\/\/)/i.exec(cleaned)
  if (fileUrl) {
    cleaned = safeDecode(cleaned.replace(/^file:\/\/\//i, '').replace(/^app:\/\/[^/]+\//i, ''))
    cleaned = cleaned.split('/').pop() ?? cleaned
  }

  const exact = images.find((img) => foldName(img.relativePath) === foldName(cleaned))
  if (exact) return exact.relativePath

  const fromNote = joinPath(parentDir(notePath), cleaned)
  const besideNote = images.find((img) => foldName(img.relativePath) === foldName(fromNote))
  if (besideNote) return besideNote.relativePath

  const base = foldName(cleaned.split('/').pop() ?? cleaned)
  const byName = images.find((img) => foldName(img.name) === base)
  if (byName) return byName.relativePath

  const noExt = base.replace(/\.[^.]+$/, '')
  const sameFolder = images.find((img) => {
    const stem = foldName(img.name.replace(/\.[^.]+$/, ''))
    return stem === noExt && parentDir(img.relativePath) === parentDir(notePath)
  })
  if (sameFolder) return sameFolder.relativePath

  const byStem = images.find((img) => foldName(img.name.replace(/\.[^.]+$/, '')) === noExt)
  return byStem?.relativePath ?? null
}

export function portraitForNote(notePath: string, images: CampaignImage[]): string | null {
  const note = normalize(notePath)
  const file = note.split('/').pop() ?? note
  const stem = file.replace(/\.[^.]+$/, '')
  const withoutPc = stem.replace(/^pc\s*[—–-]\s*/i, '').trim()
  const stems = withoutPc && withoutPc !== stem ? [stem, withoutPc] : [stem]
  for (const candidate of stems) {
    const found = resolveImageRef(candidate, note, images)
    if (found) return found
  }
  return null
}

function wikiToMarkdown(raw: string, notePath: string, images: CampaignImage[]): string {
  const path = resolveImageRef(raw, notePath, images)
  if (!path) return `*[missing image: ${stripSize(raw)}]*`
  return `![${imageTitle(path)}](<${campaignFileUrl(path)}>)`
}

function extractFrontmatterImage(markdown: string, notePath: string, images: CampaignImage[]): string | null {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(markdown)
  if (!match) return null
  const keys = /^(?:image|cover|portrait|banner|photo|picture|img):\s*(.+)$/im.exec(match[1])
  if (!keys) return null
  const value = keys[1].trim().replace(/^["']|["']$/g, '').replace(/^\[\[|\]\]$/g, '')
  return resolveImageRef(value, notePath, images)
}

function expandHtmlImages(markdown: string, notePath: string, images: CampaignImage[]): string {
  return markdown.replace(/<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi, (_all, src: string) => {
    const path = resolveImageRef(src, notePath, images)
    return path ? `![${imageTitle(path)}](<${campaignFileUrl(path)}>)` : ''
  })
}

function expandWikiTargets(markdown: string, notePath: string, images: CampaignImage[]): string {
  const withBangs = markdown.replace(/!\[\[([^\]\n]+)\]\]/g, (_all, raw: string) =>
    wikiToMarkdown(raw, notePath, images)
  )
  return withBangs.replace(/(^|[^!])\[\[([^\]\n]+)\]\]/g, (all, prefix: string, raw: string) => {
    const target = stripSize(raw)
    if (!isImagePath(target) && !resolveImageRef(target, notePath, images)) return all
    const path = resolveImageRef(target, notePath, images)
    if (!path) return all
    if (!isImagePath(target) && path.replace(/\.[^.]+$/, '') === notePath.replace(/\.[^.]+$/, '')) {
      return `${prefix}![${imageTitle(path)}](<${campaignFileUrl(path)}>)`
    }
    if (isImagePath(target)) return `${prefix}![${imageTitle(path)}](<${campaignFileUrl(path)}>)`
    return all
  })
}

export function prepareNoteMarkdown(
  markdown: string,
  notePath: string,
  images: CampaignImage[],
  options?: { injectPortrait?: boolean }
): string {
  let text = expandHtmlImages(markdown, notePath, images)
  text = expandWikiTargets(text, notePath, images)

  if (options?.injectPortrait === false) return text

  const alreadyHasImage = /!\[[^\]]*\]\(<?tabledm:\/\/file\//.test(text) || /<img\b/i.test(text)
  const portrait = extractFrontmatterImage(markdown, notePath, images) ?? portraitForNote(notePath, images)
  if (portrait && !alreadyHasImage) {
    text = `![${imageTitle(portrait)}](<${campaignFileUrl(portrait)}>)\n\n${text}`
  }

  return text
}

export function resolveMarkdownImageSrc(
  src: string | undefined,
  notePath: string,
  images: CampaignImage[]
): { url: string; path: string | null } {
  if (!src) return { url: '', path: null }
  if (src.startsWith('tabledm://file/')) {
    try {
      const url = new URL(src)
      const fromQuery = url.searchParams.get('path')
      if (fromQuery) return { url: src, path: fromQuery }
    } catch {
      /* fall through */
    }
    const path = safeDecode(src.replace(/^tabledm:\/\/file\/\??/, '').replace(/^path=/, ''))
    return { url: src, path }
  }
  if (src.startsWith('tabledm://') || src.startsWith('data:') || /^https?:/i.test(src)) {
    return { url: src, path: null }
  }
  const path = resolveImageRef(src, notePath, images)
  return path ? { url: campaignFileUrl(path), path } : { url: src, path: null }
}
