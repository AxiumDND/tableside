#!/usr/bin/env node

/**
 * Verifies that the version in src/shared/version.ts matches package.json
 */

import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

async function checkVersionSync() {
  try {
    // Read package.json
    const packageJsonPath = join(rootDir, 'package.json');
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
    const packageVersion = packageJson.version;

    // Read version.ts
    const versionTsPath = join(rootDir, 'src', 'shared', 'version.ts');
    const versionTsContent = await readFile(versionTsPath, 'utf8');
    
    // Extract version from version.ts using regex
    const versionMatch = versionTsContent.match(/APP_VERSION\s*=\s*['"]([^'"]+)['"]/);
    
    if (!versionMatch) {
      console.error('❌ Could not find APP_VERSION in src/shared/version.ts');
      process.exit(1);
    }

    const appVersion = versionMatch[1];

    // Compare versions
    if (packageVersion !== appVersion) {
      console.error('❌ Version mismatch detected!');
      console.error(`   package.json: ${packageVersion}`);
      console.error(`   version.ts:   ${appVersion}`);
      console.error('');
      console.error('Please update src/shared/version.ts to match package.json version.');
      process.exit(1);
    }

    console.log(`✅ Version check passed: ${packageVersion}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Version check failed:', error.message);
    process.exit(1);
  }
}

checkVersionSync();
