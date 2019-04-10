module.exports = {
  root: true,
  env: {
    browser: true,
  },
  extends: [
    'eslint-config-airbnb-base',
  ],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
    'indent': ['error', 4],
    'import/no-cycle': 'off',
  },
  parserOptions: {
    parser: 'babel-eslint',
  },
};
