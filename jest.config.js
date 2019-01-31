/**
 * @type {jest.InitialOptions}
 */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  globals: {
    "ts-jest": {
      isolatedModules: !process.env.CI,
      diagnostics: {
        warnOnly: !process.env.CI,
      },
    },
  },
  moduleNameMapper: {
    "package.json": "<rootDir>/tests/stubs/package.json",
  },
};
