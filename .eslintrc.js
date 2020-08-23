module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 11,
    sourceType: 'module',
  },
  env: {
    es6: true,
    node: true,
    browser: true,
  },
  plugins: [],
  extends: ['eslint:recommended'],
  globals: {},
  rules: {
    'no-console': process.env.NODE_ENV !== 'production' ? 0 : 2,
    'no-unused-vars': 1,
    'no-useless-escape': 0,
    'no-empty': 0,
  },
};
