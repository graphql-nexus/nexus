const path = require('path')
const { env } = require('process')

/**
 * @type {jest.InitialOptions}
 */
module.exports = {
  setupFilesAfterEnv: ['<rootDir>/tests/_setup.ts'],
  preset: 'ts-jest',
  testEnvironment: 'node',
  watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],
  globals: {
    'ts-jest': {
      diagnostics: Boolean(process.env.CI),
      tsConfig: path.join(__dirname, 'tests/tsconfig.json'),
    },
  },
  collectCoverageFrom: ['src/**/*'],
}
