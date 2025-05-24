import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import jest from 'eslint-plugin-jest';
import prettier from 'eslint-plugin-prettier';
import _import from 'eslint-plugin-import';
import { fixupPluginRules } from '@eslint/compat';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

export default [
  globalIgnores(['**/node_modules/', '**/dist/', '**/coverage/', '**/*.min.js']),

  ...compat.extends('eslint:recommended', 'plugin:jest/recommended', 'plugin:prettier/recommended'),

  {
    plugins: {
      import: fixupPluginRules(_import),
      jest,
      prettier
    },

    languageOptions: {
      globals: {
        ...globals.node
      },

      ecmaVersion: 2021,
      sourceType: 'module'
    },

    rules: {
      camelcase: 'off',
      'eslint-comments/no-use': 'off',
      'eslint-comments/no-unused-disable': 'off',
      'i18n-text/no-en': 'off',
      'import/no-namespace': 'off',
      'no-console': 'off',
      'no-shadow': 'off',
      'no-unused-vars': 'off',
      'prettier/prettier': 'error'
    }
  }
];
