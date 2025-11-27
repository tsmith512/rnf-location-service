import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';

export default [
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        // Cloudflare Workers globals
        caches: 'readonly',
        addEventListener: 'readonly',
        fetch: 'readonly',
        atob: 'readonly',
        // Secrets defined in wrangler.toml
        DB_ENDPOINT: 'readonly',
        DB_ADMIN_JWT: 'readonly',
        GMAPS_API_KEY: 'readonly',
        API_ADMIN_USER: 'readonly',
        API_ADMIN_PASS: 'readonly',
        GMAPS_API_ENDPOINT: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  prettier,
];
