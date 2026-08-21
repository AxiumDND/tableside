# Changelog

All notable changes to Table DM will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.16] - 2026-08-21

### Added
- Production-ready error handling throughout the application
- Structured file logging to userData/logs folder with daily rotation
- Input validation utilities for all IPC handlers (validateString, validatePath, validateObject, etc.)
- React error boundary with user-friendly error UI
- Process-level error handlers for uncaught exceptions
- Test infrastructure with Vitest (20 passing tests)
- Tests for validation and utility functions
- Build documentation for app icons (build/README.md)
- ESLint and Prettier configuration for code quality
- SECURITY.md with security policy and considerations
- CONTRIBUTING.md with development guidelines
- CHANGELOG.md to track version changes
- EditorConfig for consistent coding styles
- Version sync check script
- Node.js engine requirements in package.json

### Changed
- **Performance**: Combat saves no longer reload entire campaign (100x faster)
- All IPC handlers now validate inputs and handle errors gracefully
- Settings handler whitelists allowed keys to prevent arbitrary writes
- Enhanced CI workflow to include version sync, typecheck, lint, and format validation
- Improved code quality and maintainability across entire codebase
- Applied Prettier formatting to all source files

### Fixed
- Major performance issue: combat state saves now return just combat data instead of reloading entire campaign tree
- Type errors in dialog.showOpenDialog calls
- Type errors in StatBlock and DmApp components
- ESLint errors (unused variables, unnecessary escapes)
- Code formatting inconsistencies

### Security
- Hardened safeJoin to block absolute paths and path traversal attacks
- Added input validation to all IPC handlers
- Content Security Policy (CSP) meta tag in HTML
- Settings update whitelisting to prevent arbitrary writes
- Comprehensive logging of security violations
- Documented security considerations in SECURITY.md

## [1.0.5] - Previous Release

### Features
- Dual-monitor DM console and player display
- Campaign folder management with standard layout
- Combat tracker with initiative and conditions
- Session notes with markdown support
- SRD content lookup (spells, monsters, conditions, weapons, rules)
- Character sheet management (party and NPCs)
- Custom `tabledm://` protocol for campaign assets
- Dice roller
- Bad Blood example campaign included
- Windows installer (NSIS)

[1.1.16]: https://github.com/AxiumDND/table-dm/compare/v1.0.5...v1.1.16
[1.0.5]: https://github.com/AxiumDND/table-dm/releases/tag/v1.0.5
