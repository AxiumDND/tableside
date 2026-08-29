import { describe, expect, it } from 'vitest'
import { isAllowedExternalUrl } from './externalLinks'

describe('isAllowedExternalUrl', () => {
  it('allows ordinary web and email links', () => {
    expect(isAllowedExternalUrl('https://example.com/page')).toBe(true)
    expect(isAllowedExternalUrl('http://example.com')).toBe(true)
    expect(isAllowedExternalUrl('mailto:tableside.gm@gmail.com')).toBe(true)
    expect(isAllowedExternalUrl('HTTPS://EXAMPLE.COM')).toBe(true)
  })

  it('rejects schemes that can reach the host', () => {
    expect(isAllowedExternalUrl('file:///etc/passwd')).toBe(false)
    expect(isAllowedExternalUrl('file://server/share/x')).toBe(false)
    expect(isAllowedExternalUrl('javascript:alert(1)')).toBe(false)
    expect(isAllowedExternalUrl('vbscript:msgbox(1)')).toBe(false)
    expect(isAllowedExternalUrl('data:text/html,<script>alert(1)</script>')).toBe(false)
    expect(isAllowedExternalUrl('smb://host/share')).toBe(false)
    expect(isAllowedExternalUrl('tabledm://file/?path=x')).toBe(false)
  })

  it('rejects malformed, empty, and control-character input', () => {
    expect(isAllowedExternalUrl('')).toBe(false)
    expect(isAllowedExternalUrl('   ')).toBe(false)
    expect(isAllowedExternalUrl('not a url')).toBe(false)
    expect(isAllowedExternalUrl('https://exa\nmple.com')).toBe(false)
    expect(isAllowedExternalUrl('https://example.com/\u0000')).toBe(false)
    expect(isAllowedExternalUrl(null)).toBe(false)
    expect(isAllowedExternalUrl(undefined)).toBe(false)
    expect(isAllowedExternalUrl(42)).toBe(false)
  })
})
