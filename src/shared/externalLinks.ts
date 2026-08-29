const ALLOWED_EXTERNAL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:'])

/**
 * Whether a URL is safe to hand to the OS via shell.openExternal.
 *
 * Campaigns are arbitrary folders on disk and their Markdown can contain any
 * link, so we only allow ordinary web/email schemes. This blocks schemes such
 * as file:, javascript:, data:, and custom protocol handlers that a shared or
 * malicious campaign could otherwise use to reach the host.
 */
export function isAllowedExternalUrl(rawUrl: unknown): boolean {
  if (typeof rawUrl !== 'string') return false
  const trimmed = rawUrl.trim()
  if (trimmed === '') return false
  // Reject control characters (newlines, NUL, etc.) that can smuggle payloads.
  // Matching control characters is the intent here.
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(trimmed)) return false
  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return false
  }
  return ALLOWED_EXTERNAL_PROTOCOLS.has(parsed.protocol.toLowerCase())
}
