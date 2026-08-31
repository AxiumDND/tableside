import { existsSync, mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { _electron as electron, type ElectronApplication } from '@playwright/test'

/**
 * Absolute path to the Electron binary from the local `electron` package.
 * Reads path.txt directly so this file stays CJS-compatible under Playwright
 * (package.json is not `"type": "module"`, so `import.meta` / createRequire fail).
 */
export function localElectronPath(): string {
  const electronRoot = join(process.cwd(), 'node_modules', 'electron')
  const pathTxt = join(electronRoot, 'path.txt')
  if (!existsSync(pathTxt)) {
    throw new Error(`Electron path.txt missing at ${pathTxt}; run node_modules/electron/install.js`)
  }
  const relative = readFileSync(pathTxt, 'utf8').trim()
  return join(electronRoot, 'dist', relative)
}

/**
 * Launch Tableside against a fresh, isolated user-data profile so each spec is
 * hermetic: first launch loads the bundled Greystead sample into a writable
 * working copy under that temp profile, never the repo's example files.
 */
export async function launchTableside(): Promise<ElectronApplication> {
  const userDataDir = mkdtempSync(join(tmpdir(), 'tableside-e2e-'))
  return electron.launch({
    // Pin the local Electron binary so Playwright does not download another copy.
    executablePath: localElectronPath(),
    args: ['.', `--user-data-dir=${userDataDir}`, '--no-sandbox'],
    env: {
      ...process.env,
      NODE_ENV: 'production',
      TABLESIDE_E2E: '1'
    },
    timeout: 120_000
  })
}
