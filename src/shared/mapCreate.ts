import { artFolderRelativePath } from './campaignLayout'

export type MapCreateKind = 'battle' | 'region' | 'world'

/** Art folder next to a new map note (`Maps` → `Maps/Art`). */
export function mapArtRelativeFolder(noteFolder: string): string {
  const posix = noteFolder.replaceAll('\\', '/').replace(/\/+$/, '')
  if (!posix) return 'Maps/Art'
  return artFolderRelativePath(posix)
}

/** Set `image:` inside a map fence (or insert it if missing). */
export function setMapFenceImage(body: string, imageFile: string): string {
  if (/^image:\s*/m.test(body)) return body.replace(/^image:\s*[^\r\n]*/m, `image: ${imageFile}`)
  return body.replace(/```map\r?\n/, `\`\`\`map\nimage: ${imageFile}\n`)
}

/** Set or clear `kind:` inside a map fence (battle omits the field). */
export function setMapFenceKind(body: string, kind: MapCreateKind): string {
  if (!/```map\r?\n/i.test(body)) return body
  if (kind === 'battle') {
    return body.replace(/^(kind|mapKind|type):\s*[^\r\n]*\r?\n?/im, '')
  }
  if (/^(kind|mapKind|type):\s*/im.test(body)) {
    return body.replace(/^(kind|mapKind|type):\s*[^\r\n]*/im, `kind: ${kind}`)
  }
  return body.replace(/```map\r?\n/i, `\`\`\`map\nkind: ${kind}\n`)
}
