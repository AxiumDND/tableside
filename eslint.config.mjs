import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'

export default tseslint.config(
  {
    ignores: [
      'out/**',
      'dist/**',
      'node_modules/**',
      // Generated SRD/system data snapshots — not hand-edited.
      'src/renderer/src/data/**',
      '**/*.d.ts'
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }
      ]
    }
  },
  {
    files: ['**/*.{ts,tsx,mts,cts,mjs,js}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser }
    }
  },
  {
    files: ['src/renderer/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn'
    }
  }
)
