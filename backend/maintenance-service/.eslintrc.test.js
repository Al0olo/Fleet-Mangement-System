module.exports = {
  extends: './.eslintrc.js',
  parserOptions: {
    project: './tsconfig.jest.json'
  },
  rules: {
    // Relax rules for test files
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    'jest/no-disabled-tests': 'warn',
    'jest/no-focused-tests': 'error',
    'jest/no-identical-title': 'error',
    'jest/valid-expect': 'error'
  },
  plugins: ['jest'],
  env: {
    'jest/globals': true
  }
}; 