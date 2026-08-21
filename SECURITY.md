# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in Table DM, please report it by:

1. **DO NOT** open a public issue
2. Email the maintainer at the email listed in the repository
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will acknowledge your report within 48 hours and provide a timeline for fixes.

## Security Considerations

### Electron Security

Table DM follows Electron security best practices:

- ✅ Context isolation enabled
- ✅ Node integration disabled in renderers
- ✅ Content Security Policy implemented
- ⚠️ Sandbox currently disabled (required for file system access patterns)

### File System Access

The application has read/write access to:
- User-selected campaign folders
- Application settings in userData
- Bundled example campaigns (read-only)

### Custom Protocol

The `tabledm://` protocol is used for:
- Loading campaign assets (images, PDFs) from the user's campaign folder
- Links are validated and sanitized before rendering

### External Content

- Markdown rendering uses `react-markdown` with sanitization
- External links open in the system browser (not in-app)
- No telemetry or external network requests

## Future Security Improvements

- [ ] Enable sandbox mode with proper IPC design
- [ ] Add code signing for Windows builds
- [ ] Implement auto-update with signature verification
- [ ] Add structured security logging
