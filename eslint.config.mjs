import { FlatCompat } from '@eslint/eslintrc'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const config = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              // ADR 001 boundary. Allow the sanctioned public surfaces:
              //   @contexts/<name>          — UI-safe public surface
              //   @contexts/<name>/server   — server-only public surface
              // Forbid everything else (e.g., @contexts/<name>/repo,
              // @contexts/<name>/case-machine,
              // @contexts/<name>/workflows/*, @contexts/<name>/internals/*).
              // Enforcement test: tests/integration/lint/cross-context-imports.test.ts
              group: ['@contexts/*/*', '!@contexts/*/server'],
              message:
                'ADR 001: cross-context imports must go through the public surface (@contexts/<name> or @contexts/<name>/server). Reaching into internals is forbidden.',
            },
            {
              // Catches a source file in context A reaching into
              // ../B/internal-file via a relative path rather than
              // through the sanctioned @contexts alias.
              group: ['../contexts/*', '../../contexts/*', '../../../contexts/*'],
              message:
                'ADR 001: use the @contexts/<name> alias, not a relative path, when importing across contexts.',
            },
          ],
        },
      ],
    },
  },
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'drizzle/meta/**',
      'coverage/**',
      'next-env.d.ts', // Next.js owns + regenerates this file
      'playwright-report/**',
      'test-results/**',
    ],
  },
]

export default config
