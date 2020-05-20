// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
    // Automatically clear mock calls and instances between every test
    clearMocks: true,

    // The directory where Jest should output its coverage files
    coverageDirectory: "coverage",

    // A map from regular expressions to module names that allow to stub out resources with a single module
    moduleNameMapper: {
        "\\.(css)$": "<rootDir>/__mocks__/styleMock.js",
    },

    // A preset that is used as a base for Jest's configuration
    preset: "ts-jest",

    // The test environment that will be used for testing
    testEnvironment: "jsdom",

    // Setting this value to "fake" allows the use of fake timers for functions such as "setTimeout"
    timers: "fake",

    // The glob patterns Jest uses to detect test files
    testMatch: ["**/?(*.)+(spec|test).[tj]s?(x)"],

    // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
    testPathIgnorePatterns: ["/node_modules/", "/dist/"],
};
