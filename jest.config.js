const path = require('path')
const process = require('process')

/** @typedef {import('ts-jest')} */
/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  testPathIgnorePatterns: ['<rootDir>/docs'],
  setupFilesAfterEnv: ['<rootDir>/tests/_setup.ts'],
  preset: 'ts-jest',
  testEnvironment: 'node',
  watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],
  globals: {
    'ts-jest': {
      diagnostics: Boolean(process.env.CI)
        ? {
            pretty: true,
            pathRegex: '\\.(spec|test)\\.ts$',
          }
        : false,
    },
  },
  collectCoverageFrom: ['src/**/*'],
}
