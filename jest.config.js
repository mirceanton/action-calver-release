export default {
  testEnvironment: 'node',
  collectCoverageFrom: ['src/**/*.js', '!src/**/*.test.js'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testMatch: ['**/src/**/*.test.js'],
  verbose: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};
