import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // The codebase already has an established, widely-used convention of
      // prefixing an intentionally-unused param with _ -- most often when a
      // function shares a call signature with sibling functions that DO use
      // that param (e.g. every buildXPreview(brief, variant, inspoContext,
      // colors, patterns) in preview/pages/, called uniformly from one
      // dispatch table regardless of whether a given page type varies by
      // pattern). Without this, no-unused-vars flagged every one of those
      // as if it were dead code, when removing them would have broken the
      // shared signature instead.
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
])
