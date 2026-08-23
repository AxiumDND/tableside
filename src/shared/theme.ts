/** Shipped DM-console looks. Add a theme: id here, labels/blurbs/window color, then tokens in index.css. */
export const THEME_IDS = ['classic', 'light', 'scifi', 'vampire', 'cyberpunk', 'matrix'] as const

export type ThemeId = (typeof THEME_IDS)[number]

/** Extra look flags saved on campaign.json. */
export interface ThemeOptions {
  holoPortraits?: boolean
  digitalRain?: boolean
}

export const DEFAULT_THEME: ThemeId = 'classic'

export const THEME_LABELS: Record<ThemeId, string> = {
  classic: 'Classic fantasy',
  light: 'Light',
  scifi: 'Sci-fi',
  vampire: 'Vampire',
  cyberpunk: 'Cyberpunk',
  matrix: 'Digital rain'
}

/** Setup dialog copy. Keep licensed names out of the UI. */
export const THEME_BLURBS: Record<ThemeId, string> = {
  classic: 'Dark ink, parchment text, gold titles.',
  light: 'Cream paper and dark text — daytime prep.',
  scifi: 'Navy briefing panels and hologram cyan.',
  vampire: 'Black and burgundy, blood-red accent.',
  cyberpunk: 'Charcoal, magenta accent, cyan muted.',
  matrix: 'Black canvas, phosphor green, faint falling code.'
}

/** Electron DM window chrome — matches each theme’s canvas so it does not flash classic-dark. */
export const THEME_WINDOW_BACKGROUND: Record<ThemeId, string> = {
  classic: '#0b0d11',
  light: '#f4efe4',
  scifi: '#020c18',
  vampire: '#0a0608',
  cyberpunk: '#0a0b10',
  matrix: '#010301'
}

export function isThemeId(value?: string | null): value is ThemeId {
  return Boolean(value && (THEME_IDS as readonly string[]).includes(value))
}

export function parseThemeId(value?: string | null): ThemeId {
  return isThemeId(value) ? value : DEFAULT_THEME
}

/** Open campaign wins; unknown or missing campaign theme falls back to the app default. */
export function resolveConsoleTheme(campaignTheme?: string | null, appTheme?: string | null): ThemeId {
  if (isThemeId(campaignTheme)) return campaignTheme
  return parseThemeId(appTheme)
}

export function applyThemeToDocument(theme: ThemeId): void {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = theme
}

/** Sci-fi hologram treatment on party / NPC / beast / gear portraits. On by default for Sci-fi. */
export function holoPortraitsEnabled(theme?: string | null, holoPortraits?: boolean | null): boolean {
  return parseThemeId(theme) === 'scifi' && holoPortraits !== false
}

/** Falling-code wallpaper in Digital rain wells. On by default for that look. */
export function digitalRainEnabled(theme?: string | null, digitalRain?: boolean | null): boolean {
  return parseThemeId(theme) === 'matrix' && digitalRain !== false
}
