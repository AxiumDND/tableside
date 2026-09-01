import { Menu, type BrowserWindow, type MenuItemConstructorOptions } from 'electron'

const SUGGESTION_CAP = 6

/** Closest Hunspell/OS language Electron actually has dictionaries for. */
export function pickSpellCheckerLanguage(locale: string, available: string[]): string | null {
  if (available.length === 0) return null
  const want = locale.replace(/_/g, '-')
  const lower = available.map((item) => item.toLowerCase())
  const exact = lower.indexOf(want.toLowerCase())
  if (exact >= 0) return available[exact]
  const prefix = (want.split('-')[0] ?? 'en').toLowerCase()
  const sameFamily = lower.findIndex((item) => item === prefix || item.startsWith(`${prefix}-`))
  if (sameFamily >= 0) return available[sameFamily]
  const english = lower.findIndex((item) => item === 'en-us' || item.startsWith('en-'))
  if (english >= 0) return available[english]
  return available[0] ?? null
}

export type EditContextParams = {
  misspelledWord: string
  dictionarySuggestions: string[]
  editFlags: {
    canUndo: boolean
    canRedo: boolean
    canCut: boolean
    canCopy: boolean
    canPaste: boolean
    canSelectAll: boolean
  }
}

export function spellSuggestions(params: Pick<EditContextParams, 'misspelledWord' | 'dictionarySuggestions'>): string[] {
  if (!params.misspelledWord) return []
  return (params.dictionarySuggestions ?? []).slice(0, SUGGESTION_CAP)
}

export function editContextTemplate(
  params: EditContextParams,
  onReplace: (word: string) => void,
  onLearn: (word: string) => void
): MenuItemConstructorOptions[] {
  const items: MenuItemConstructorOptions[] = []
  const suggestions = spellSuggestions(params)
  for (const word of suggestions) {
    items.push({ label: word, click: () => onReplace(word) })
  }
  if (params.misspelledWord) {
    items.push({
      label: 'Add to dictionary',
      click: () => onLearn(params.misspelledWord)
    })
  }
  if (items.length > 0) items.push({ type: 'separator' })
  const flags = params.editFlags
  items.push(
    { role: 'undo', enabled: flags.canUndo },
    { role: 'redo', enabled: flags.canRedo },
    { type: 'separator' },
    { role: 'cut', enabled: flags.canCut },
    { role: 'copy', enabled: flags.canCopy },
    { role: 'paste', enabled: flags.canPaste },
    { role: 'selectAll', enabled: flags.canSelectAll }
  )
  return items
}

/** Enable OS/Chromium spellcheck and a right-click menu with suggestions in the DM window. */
export function attachSpellChecker(win: BrowserWindow, locale = ''): void {
  const contents = win.webContents
  const ses = contents.session
  ses.setSpellCheckerEnabled(true)
  const language = pickSpellCheckerLanguage(locale, ses.availableSpellCheckerLanguages)
  if (language) {
    try {
      ses.setSpellCheckerLanguages([language])
    } catch {
      // Some Windows builds list a language they cannot activate; keep the OS default.
    }
  }
  contents.on('context-menu', (_event, params) => {
    if (!params.isEditable) return
    const menu = Menu.buildFromTemplate(
      editContextTemplate(
        {
          misspelledWord: params.misspelledWord,
          dictionarySuggestions: params.dictionarySuggestions,
          editFlags: params.editFlags
        },
        (word) => contents.replaceMisspelling(word),
        (word) => ses.addWordToSpellCheckerDictionary(word)
      )
    )
    menu.popup({ window: win })
  })
}
