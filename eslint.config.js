/**
 * ESLint Configuration for Simple Calendar Compatibility Bridge
 * Standalone configuration that doesn't depend on broken foundry-dev-tools ESLint config
 */

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  // Base JS rules
  eslint.configs.recommended,

  // TypeScript rules
  ...tseslint.configs.recommended,

  // Global configuration for all files
  {
    files: ['**/*.{js,ts}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Core Foundry globals
        game: 'readonly',
        canvas: 'readonly',
        ui: 'readonly',
        Hooks: 'readonly',
        CONFIG: 'readonly',
        foundry: 'readonly',

        // Template functions
        renderTemplate: 'readonly',
        loadTemplates: 'readonly',

        // Application classes
        Dialog: 'readonly',
        Application: 'readonly',
        FormApplication: 'readonly',
        DocumentSheet: 'readonly',
        ActorSheet: 'readonly',
        ItemSheet: 'readonly',

        // Document classes
        JournalEntry: 'readonly',
        User: 'readonly',
        Folder: 'readonly',
        Actor: 'readonly',
        Item: 'readonly',
        Scene: 'readonly',
        Playlist: 'readonly',
        Macro: 'readonly',

        // Additional common globals
        CONST: 'readonly',
        duplicate: 'readonly',
        mergeObject: 'readonly',
        setProperty: 'readonly',
        getProperty: 'readonly',
        hasProperty: 'readonly',
        expandObject: 'readonly',
        flattenObject: 'readonly',
        isObjectEmpty: 'readonly',

        // Node.js globals for build scripts
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
    rules: {
      // Custom rules for FoundryVTT modules
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': 'off', // Allow console for debugging in bridge module

      // TypeScript-specific relaxed rules for Foundry development
      '@typescript-eslint/no-explicit-any': 'off', // Allow any for API compatibility
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      'no-case-declarations': 'warn',
    },
  },

  // TypeScript-specific configuration with proper project reference
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
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
      '@typescript-eslint/no-unused-vars': 'error',
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
