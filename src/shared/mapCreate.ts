/** Art folder next to a new map note (`Maps` → `Maps/Art`). */
export function mapArtRelativeFolder(noteFolder: string): string {
  const posix = noteFolder.replaceAll('\\', '/').replace(/\/+$/, '')
  if (!posix) return 'Maps/Art'
  if (/(^|\/)art$/i.test(posix)) return posix
  return `${posix}/Art`
}

/** Set `image:` inside a map fence (or insert it if missing). */
export function setMapFenceImage(body: string, imageFile: string): string {
  if (/^image:\s*/m.test(body)) return body.replace(/^image:\s*[^\r\n]*/m, `image: ${imageFile}`)
  return body.replace(/```map\r?\n/, `\`\`\`map\nimage: ${imageFile}\n`)
}
