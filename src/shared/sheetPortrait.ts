const IMAGE_WIKI = /!\[\[([^\]\n]+\.(?:png|jpe?g|webp|gif|svg|bmp))\]\]/i

/** Point the sheet’s portrait embed at a file in that folder’s Art/. */
export function setSheetPortraitEmbed(markdown: string, fileName: string): string {
  const embed = `![[${fileName}]]`
  if (IMAGE_WIKI.test(markdown)) return markdown.replace(IMAGE_WIKI, embed)
  if (/>\s*\[!infobox\]/i.test(markdown)) {
    return markdown.replace(/(>\s*\[!infobox\][^\n]*\r?\n)/i, `$1> ${embed}\n>\n`)
  }
  return markdown.replace(/^(# .+\r?\n)/, `$1\n${embed}\n`)
}

export function sheetAcceptsPortrait(
  template: 'blank' | 'player' | 'npc' | 'monster' | 'spell' | 'gear' | 'nightsheet' | 'map'
): boolean {
  return template === 'player' || template === 'npc' || template === 'monster'
}
