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
      tsConfig: {
        // FIXME: sloppy, can we make { core } not output in
        // typegen when its not needed?
        noUnusedLocals: false,
      },
      diagnostics: {
        warnOnly: !process.env.CI,
      },
    },
  },
};
