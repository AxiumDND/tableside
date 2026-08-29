import type { SheetTemplateKind } from './sheetTemplates'
import { replaceSheetPortrait } from './sheetBlock'

/** Point the sheet’s portrait embed at a file in that folder’s Art/. */
export function setSheetPortraitEmbed(markdown: string, fileName: string): string {
  return replaceSheetPortrait(markdown, fileName)
}

export function sheetAcceptsPortrait(template: SheetTemplateKind): boolean {
  return (
    template === 'player' ||
    template === 'npc' ||
    template === 'monster' ||
    template === 'spell' ||
    template === 'gear' ||
    template === 'place' ||
    template === 'shop' ||
    template === 'faction'
  )
}
