// // @ts-check
// // Docs: https://eslint.org/docs/user-guide/configuring

// import eslint from '@eslint/js'
// import prettierConfig from 'eslint-config-prettier'
// import tseslint from 'typescript-eslint'

// export default tseslint.config(
//   eslint.configs.recommended,
//   ...tseslint.configs.recommendedTypeChecked,
//   {
//     languageOptions: {
//       parserOptions: {
//         ecmaVersion: 2022,
//         sourceType: 'module',
//         project: ['./tsconfig.json', './vite.config.ts'],
//         tsconfigRootDir: import.meta.dirname
//       }
//     }
//   },
//   prettierConfig
// )

import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }]
    }
  }
)
