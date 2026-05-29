module.exports = {
  ignorePatterns: ['**/*.min.js', '**/dist/**'],
  root: true,
  extends: 'airbnb-base',
  env: { browser: true, mocha: true },
  parser: '@babel/eslint-parser',
  parserOptions: {
    allowImportExportEverywhere: true,
    sourceType: 'module',
    requireConfigFile: false,
  },
  rules: {
    'chai-friendly/no-unused-expressions': 2,
    'import/extensions': ['error', { js: 'always' }],
    'import/no-cycle': 0,
    'linebreak-style': ['error', 'unix'],
    'no-await-in-loop': 0,
    'no-param-reassign': [2, { props: false }],
    'no-restricted-syntax': [
      'error',
      {
        selector: 'ForInStatement',
        message: 'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.',
      },
      {
        selector: 'LabeledStatement',
        message: 'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
      },
      {
        selector: 'WithStatement',
        message: '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
      },
    ],
    'no-return-assign': ['error', 'except-parens'],
    'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-unused-expressions': 0,
    'object-curly-newline': ['error', {
      ObjectExpression: { multiline: true, minProperties: 6 },
      ObjectPattern: { multiline: true, minProperties: 6 },
      ImportDeclaration: { multiline: true, minProperties: 6 },
      ExportDeclaration: { multiline: true, minProperties: 6 },
    }],
  },
  overrides: [
    {
      files: ['test/**/*.js'],
      env: { jest: true },
      rules: {
        'no-console': 'off',
        'global-require': 'off',
        'no-underscore-dangle': 'off',
        'func-names': 'off',
        'prefer-arrow-callback': 'off',
        'max-len': 'off',
        'no-promise-executor-return': 'off',
        'no-global-assign': 'off',
      },
    },
    {
      files: ['nala/**/*.js', 'playwright.config.js', 'web-test-runner.config.js'],
      env: { node: true },
      rules: {
        'import/no-extraneous-dependencies': 'off',
        'import/extensions': 'off',
        'import/no-import-module-exports': 'off',
        'max-len': 'off',
        'class-methods-use-this': 'off',
        'no-plusplus': 'off',
      },
    },
  ],
  plugins: [
    'chai-friendly',
  ],
};
