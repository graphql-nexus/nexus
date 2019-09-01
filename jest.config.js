/**
 * @type {jest.InitialOptions}
 */
module.exports = {
  setupFilesAfterEnv: ["<rootDir>/tests/_setup.ts"],
  preset: "ts-jest",
  testEnvironment: "node",
  watchPlugins: [
    "jest-watch-typeahead/filename",
    "jest-watch-typeahead/testname",
  ],
  globals: {
    "ts-jest": {
      isolatedModules: !process.env.CI,
      diagnostics: {
        // FIXME: sloppy, can we make { core } not output in
        // typegen when its not needed?
        ignoreCodes: ["6133"],
      },
    },
  },
};
