module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore',
      'perf', 'ci', 'build', 'revert', 'migration', 'infra'
    ]],
    'scope-enum': [1, 'always', [
      'backend', 'web', 'mobile', 'infra', 'db', 'docs', 'ci',
      'shared', 'contracts', 'bridge'
    ]],
  }
};
