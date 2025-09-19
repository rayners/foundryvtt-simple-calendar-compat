/**
 * ESLint Configuration for Simple Calendar Compatibility Bridge
 * Uses shared foundry-dev-tools configuration
 */

import foundryConfig from '@rayners/foundry-dev-tools/eslint';

export default [
  // Use the shared Foundry VTT configuration
  ...foundryConfig,

  // Override TypeScript project configuration from foundry-dev-tools
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Project-specific overrides for source files
  {
    files: ['src/**/*.{js,ts}'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Ensure compatibility with GitHub CodeQL requirements
      '@typescript-eslint/no-unused-vars': 'error',
      // Relax rules for compatibility bridge project
      '@typescript-eslint/no-unsafe-function-type': 'off',
      'no-case-declarations': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      // Allow any types for API compatibility layer
      '@typescript-eslint/no-explicit-any': 'off',
      // Allow console statements for debugging in this bridge module
      'no-console': 'off',
    },
  },

  // Test files with relaxed rules
  {
    files: ['test/**/*.{js,ts}', 'src/**/*.test.{js,ts}'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.test.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'error', // CodeQL compliance
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      'no-console': 'off',
      'prefer-const': 'warn',
    },
  },

  // Ignore build artifacts and dependencies
  {
    ignores: [
      'dist/',
      'node_modules/',
      'coverage/',
      '*.js',
      '*.mjs',
      '*.config.ts',
      '!eslint.config.js',
    ],
  },
];
