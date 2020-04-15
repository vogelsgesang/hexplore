// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
    // Automatically clear mock calls and instances between every test
    clearMocks: true,

    // The directory where Jest should output its coverage files
    coverageDirectory: "coverage",

    // The maximum amount of workers used to run your tests. Can be specified as % or a number. E.g. maxWorkers: 10% will use 10% of your CPU amount + 1 as the maximum worker number. maxWorkers: 2 will use a maximum of 2 workers.
    // maxWorkers: "50%",

    // An array of directory names to be searched recursively up from the requiring module's location
    // moduleDirectories: [
    //   "node_modules"
    // ],

    // A map from regular expressions to module names that allow to stub out resources with a single module
    moduleNameMapper: {
        "\\.(css)$": "<rootDir>/__mocks__/styleMock.js",
    },

    // A preset that is used as a base for Jest's configuration
    preset: "ts-jest",

    // Use this configuration option to add custom reporters to Jest
    // reporters: undefined,

    // A path to a custom resolver
    // resolver: null,

    // Allows you to use a custom runner instead of Jest's default test runner
    // runner: "jest-runner",

    // The test environment that will be used for testing
    testEnvironment: "jsdom",

    // This option allows use of a custom test runner
    // testRunner: "jasmine2",

    // Setting this value to "fake" allows the use of fake timers for functions such as "setTimeout"
    timers: "fake",

    // A map from regular expressions to paths to transformers
    // transform: null,

    // An array of regexp pattern strings that are matched against all source file paths, matched files will skip transformation
    // transformIgnorePatterns: [
    //   "\\\\node_modules\\\\"
    // ],
};
