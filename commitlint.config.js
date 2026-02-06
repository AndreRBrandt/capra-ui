export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-empty': [2, 'never'],
    'subject-max-length': [2, 'always', 72],
    'body-max-line-length': [1, 'always', 100],
  },
};
