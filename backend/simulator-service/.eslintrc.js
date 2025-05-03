module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json'
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  env: {
    node: true,
    es6: true
  },
  rules: {
    // Add any custom rules here
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { 
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_'
    }]
  },
  ignorePatterns: ['dist', 'coverage', 'node_modules'],
  overrides: [
    {
      files: ['**/*.test.ts'],
      parserOptions: {
        project: './tsconfig.jest.json'
      }
    }
  ]
}; 