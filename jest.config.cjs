module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.mjs'],
  coverageDirectory: 'coverage',
  moduleFileExtensions: ['js', 'mjs', 'cjs', 'json', 'node'],
  moduleNameMapper: {
    // '../../src/services/emailService.js': '<rootDir>/tests/__mocks__/emailService.js',
    '^\.\.\/src\/services\/emailService\.js$': '<rootDir>/tests/__mocks__/emailService.cjs',
  },
  testMatch: ['**/tests/**/*.test.js', '**/tests/**/*.spec.js'],
  testTimeout: 30000,
  transform: {},
};
