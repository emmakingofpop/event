// eslint.config.js
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    settings: {
      // 👇 tell eslint-plugin-import to accept RN Firebase subpath
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },
    rules: {
      // Optional: silence import/no-unresolved for firebase/auth/react-native
      'import/no-unresolved': [
        'error',
        { ignore: ['^firebase/auth/react-native$'] },
      ],
    },
  },
]);
