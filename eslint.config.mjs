import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

export default defineConfig([
  globalIgnores(['**/node_modules/', '**/dist/', '**/coverage/', '**/*.min.js']),

  // Base configuration for all files
  {
    extends: compat.extends('eslint:recommended'),

    languageOptions: {
      globals: {
        ...globals.node
      },

      ecmaVersion: 2021,
      sourceType: 'module'
    },

    rules: {
      indent: ['error', 2],
      'linebreak-style': ['error', 'unix'],
      quotes: ['error', 'single'],
      semi: ['error', 'always'],

      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_'
        }
      ],

      'no-console': 'off',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'brace-style': ['error', '1tbs'],
      'comma-dangle': ['error', 'never'],
      'array-bracket-spacing': ['error', 'never'],
      'object-curly-spacing': ['error', 'always'],

      'keyword-spacing': [
        'error',
        {
          before: true,
          after: true
        }
      ],

      'space-before-blocks': ['error', 'always']
    }
  },

  // Jest configuration for test files
  {
    files: ['**/*.test.js', '**/*.spec.js'],
    extends: compat.extends('plugin:jest/recommended'),

    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest
      },

      ecmaVersion: 2021,
      sourceType: 'module'
    },

    rules: {
      indent: ['error', 2],
      'linebreak-style': ['error', 'unix'],
      quotes: ['error', 'single'],
      semi: ['error', 'always'],

      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_'
        }
      ],

      'no-console': 'off',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'brace-style': ['error', '1tbs'],
      'comma-dangle': ['error', 'never'],
      'array-bracket-spacing': ['error', 'never'],
      'object-curly-spacing': ['error', 'always'],

      'keyword-spacing': [
        'error',
        {
          before: true,
          after: true
        }
      ],

      'space-before-blocks': ['error', 'always'],

      // Jest-specific rule adjustments
      'jest/expect-expect': 'error',
      'jest/no-disabled-tests': 'warn',
      'jest/no-focused-tests': 'error',
      'jest/prefer-to-have-length': 'warn'
    }
  }
]);
