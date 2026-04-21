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
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@contexts/*/!(index)', '@contexts/*/**'],
              message:
                'Cross-context imports must go through the public surface (@contexts/<name>). Deep imports are forbidden — see ADR 001.',
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
