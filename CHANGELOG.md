# Changelog

All notable changes to Table DM will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- ESLint and Prettier configuration for consistent code quality
- Structured logging system for better debugging
- Input validation utilities for IPC handlers
- Error handling utilities with user-friendly messages
- Content Security Policy (CSP) in renderer
- SECURITY.md with security policy and considerations
- CONTRIBUTING.md with development guidelines
- CHANGELOG.md to track version changes
- EditorConfig for consistent coding styles
- TypeScript type checking in CI pipeline
- Linting validation in CI pipeline
- Node.js engine requirements in package.json

### Changed
- Enhanced CI workflow to include typecheck and lint validation
- Improved code quality and maintainability

### Security
- Added Content Security Policy meta tag to HTML
- Added validation utilities to prevent malicious input
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

[Unreleased]: https://github.com/AxiumDND/table-dm/compare/v1.0.5...HEAD
[1.0.5]: https://github.com/AxiumDND/table-dm/releases/tag/v1.0.5
