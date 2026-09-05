import { describe, expect, it } from 'vitest'
import {
  DEFAULT_UPDATE_CHANNEL,
  allowPrereleaseUpdates,
  parseUpdateChannel,
  updateInstallPromptDetail
} from './updateChannel'

describe('parseUpdateChannel', () => {
  it('defaults to stable', () => {
    expect(parseUpdateChannel(undefined)).toBe(DEFAULT_UPDATE_CHANNEL)
    expect(parseUpdateChannel('')).toBe('stable')
    expect(parseUpdateChannel('nightly')).toBe('stable')
    expect(parseUpdateChannel('STABLE')).toBe('stable')
  })

  it('accepts the beta opt-in', () => {
    expect(parseUpdateChannel('beta')).toBe('beta')
  })
})

describe('allowPrereleaseUpdates', () => {
  it('is only true on the beta channel', () => {
    expect(allowPrereleaseUpdates('stable')).toBe(false)
    expect(allowPrereleaseUpdates('beta')).toBe(true)
  })
})

describe('updateInstallPromptDetail', () => {
  it('mentions a test build only on beta', () => {
    expect(updateInstallPromptDetail('stable')).toMatch(/Install now/)
    expect(updateInstallPromptDetail('stable')).not.toMatch(/beta/)
    expect(updateInstallPromptDetail('beta')).toMatch(/test \(beta\) build/)
  })
})
