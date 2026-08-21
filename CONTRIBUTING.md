# Contributing to Table DM

Thank you for your interest in contributing to Table DM! This document provides guidelines and instructions for contributing.

## Code of Conduct

Be respectful, inclusive, and considerate in all interactions.

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- Windows (for full testing, as the app currently only builds for Windows)
- Git

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/AxiumDND/table-dm.git
   cd table-dm
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run in development mode**
   ```bash
   npm run dev
   ```

4. **Build the application**
   ```bash
   npm run build
   ```

5. **Create a distributable**
   ```bash
   npm run dist
   ```

## Development Workflow

### Code Quality

Before submitting changes, ensure your code passes all checks:

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Format checking
npm run format:check

# Run all validations
npm run validate
```

### Code Style

- Use TypeScript strict mode
- Follow ESLint and Prettier configurations
- Use meaningful variable and function names
- Add comments for complex logic (avoid obvious comments)
- Keep functions small and focused

### Commit Messages

Use clear, descriptive commit messages:

- Start with a verb in the present tense (Add, Fix, Update, Remove, etc.)
- Keep the first line under 72 characters
- Add detailed explanation in the body if needed

Examples:
```
Add dice roller to player view

Fix combat tracker initiative sorting

Update session notes markdown rendering
```

## Project Structure

```
table-dm/
├── src/
│   ├── main/          # Electron main process
│   ├── preload/       # Preload scripts
│   ├── renderer/      # React UI components
│   └── shared/        # Shared types and utilities
├── examples/          # Example campaigns
├── scripts/           # Build and utility scripts
└── WOTC/             # Optional user content (gitignored)
```

## Making Changes

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

- Write clean, maintainable code
- Add comments where necessary
- Update documentation if needed
- Test your changes thoroughly

### 3. Test Your Changes

- Run the app in dev mode: `npm run dev`
- Test all affected functionality
- Verify both DM and player windows work correctly
- Test with different campaign folders

### 4. Commit Your Changes

```bash
git add .
git commit -m "Your descriptive commit message"
```

### 5. Push and Create a Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub with:
- Clear description of changes
- Screenshots/videos if UI changes
- Testing steps
- Any breaking changes noted

## Areas for Contribution

### High Priority

- Cross-platform support (macOS, Linux)
- Automated tests (unit, integration, E2E)
- Enable Electron sandbox mode
- Auto-update functionality
- Code signing for releases

### Feature Ideas

- Map/battlemat tools
- Sound/music integration
- Cloud campaign sync
- Mobile companion app
- Plugin system
- Additional SRD content

### Code Quality

- Refactor large components
- Improve error handling
- Add input validation
- Performance optimization
- Accessibility improvements

## Testing

Currently, the project does not have automated tests. Contributions to add testing infrastructure (Vitest, Playwright, etc.) are highly welcome!

Manual testing checklist:
- [ ] DM window loads correctly
- [ ] Player window displays on second monitor
- [ ] Campaign folder operations work
- [ ] Combat tracker functions properly
- [ ] Session notes save and load
- [ ] SRD lookup returns correct results
- [ ] Character sheets load and save
- [ ] Dice roller works
- [ ] Custom protocol loads assets

## Documentation

When adding features:
- Update README.md if user-facing
- Update CHANGELOG.md
- Add JSDoc comments for public APIs
- Update type definitions

## Questions?

- Open an issue for bugs or feature requests
- Check existing issues before creating new ones
- Be patient and respectful

Thank you for contributing! 🎲
