# Build Assets

This directory contains build-time assets for packaging the application.

## App Icons

Place app icons here for electron-builder packaging:

- `icon.ico` - Windows icon (256x256 or multi-resolution .ico file)
- `icon.icns` - macOS icon (if/when macOS support is added)
- `icon.png` - Linux icon (512x512 PNG, if/when Linux support is added)

### Creating Icons

1. Design an icon representing the app (suggested: d20 die, DM screen, or table motif)
2. Create at 512x512px minimum
3. Use a tool like `electron-icon-builder` or online converters to generate proper formats:
   ```bash
   npm install -g electron-icon-builder
   electron-icon-builder --input=icon-source.png --output=build
   ```

### Current Status

⚠️ **Icons are currently missing**. The app will use the default Electron icon until proper icons are added.

To add icons:
1. Place `icon.ico` in this directory
2. Update `package.json` build configuration (already configured to use `build/icon.ico`)
3. Rebuild the installer: `npm run dist`
