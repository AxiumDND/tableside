import { describe, expect, it } from 'vitest'
import {
  DEFAULT_THEME,
  digitalRainEnabled,
  holoPortraitsEnabled,
  isThemeId,
  parseThemeId,
  resolveConsoleTheme,
  THEME_BLURBS,
  THEME_IDS,
  THEME_LABELS,
  THEME_WINDOW_BACKGROUND
} from './theme'

describe('parseThemeId', () => {
  it('defaults to classic fantasy', () => {
    expect(parseThemeId(undefined)).toBe(DEFAULT_THEME)
    expect(parseThemeId('')).toBe('classic')
    expect(parseThemeId('nope')).toBe('classic')
  })

  it('accepts the shipped themes', () => {
    expect(parseThemeId('light')).toBe('light')
    expect(parseThemeId('scifi')).toBe('scifi')
    expect(parseThemeId('vampire')).toBe('vampire')
    expect(parseThemeId('cyberpunk')).toBe('cyberpunk')
    expect(parseThemeId('matrix')).toBe('matrix')
    expect(THEME_LABELS.classic).toBe('Classic fantasy')
    expect(THEME_LABELS.matrix).toBe('Digital rain')
    expect(THEME_WINDOW_BACKGROUND.light).toBe('#f4efe4')
    expect(THEME_WINDOW_BACKGROUND.matrix).toBe('#010301')
  })
})

describe('campaign theme', () => {
  it('lists every shipped look with a label and blurb for the setup dialog', () => {
    for (const id of THEME_IDS) {
      expect(THEME_LABELS[id].length).toBeGreaterThan(0)
      expect(THEME_BLURBS[id].length).toBeGreaterThan(0)
      expect(THEME_WINDOW_BACKGROUND[id]).toMatch(/^#/)
    }
  })

  it('lets a campaign override the last app theme', () => {
    expect(resolveConsoleTheme('vampire', 'classic')).toBe('vampire')
    expect(resolveConsoleTheme(undefined, 'scifi')).toBe('scifi')
    expect(resolveConsoleTheme('nope', 'light')).toBe('light')
    expect(isThemeId('cyberpunk')).toBe(true)
    expect(isThemeId('tomorrow')).toBe(false)
  })

  it('turns hologram portraits on by default for sci-fi', () => {
    expect(holoPortraitsEnabled('scifi', true)).toBe(true)
    expect(holoPortraitsEnabled('scifi', undefined)).toBe(true)
    expect(holoPortraitsEnabled('scifi', false)).toBe(false)
    expect(holoPortraitsEnabled('vampire', true)).toBe(false)
  })

  it('turns falling code on by default for digital rain', () => {
    expect(digitalRainEnabled('matrix', true)).toBe(true)
    expect(digitalRainEnabled('matrix', undefined)).toBe(true)
    expect(digitalRainEnabled('matrix', false)).toBe(false)
    expect(digitalRainEnabled('scifi', true)).toBe(false)
  })
})
