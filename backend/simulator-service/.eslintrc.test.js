module.exports = {
  extends: './.eslintrc.js',
  rules: {
    // Turn off all rules for tests
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/ban-types': 'off',
    'import/no-extraneous-dependencies': 'off',
    'no-unused-expressions': 'off',
    'max-len': 'off',
    'no-undef': 'off'
  },
  env: {
    jest: true,
    node: true
  },
  // Disable parserOptions.project to avoid typescript parsing issues
  parserOptions: {
    project: null
  },
  globals: {
    describe: 'readonly',
    it: 'readonly',
    expect: 'readonly',
    beforeEach: 'readonly',
    afterEach: 'readonly',
    beforeAll: 'readonly',
    afterAll: 'readonly',
    jest: 'readonly'
  }
}; 