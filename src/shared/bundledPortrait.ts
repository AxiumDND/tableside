export type BundledPortraitKind = 'bundled-ai' | 'bundled-srd'

const MARKER = /tablesidePortrait:\s*(bundled-ai|bundled-srd)/m

export function hasBundledPortrait(markdown: string): boolean {
  return MARKER.test(markdown)
}

export function markBundledPortrait(markdown: string, kind: BundledPortraitKind): string {
  if (MARKER.test(markdown)) {
    return markdown.replace(MARKER, `tablesidePortrait: ${kind}`)
  }
  const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(markdown)
  if (fm) {
    const body = markdown.slice(fm[0].length)
    return `---\n${fm[1].trimEnd()}\ntablesidePortrait: ${kind}\n---${body}`
  }
  return `---\ntablesidePortrait: ${kind}\n---\n\n${markdown}`
}
