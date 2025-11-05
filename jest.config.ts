import type { Config } from "jest";

const config: Config = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "src",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
        diagnostics: false,
        transpilation: true, // تم نقل الإعداد هنا بدل globals
      },
    ],
  },
  collectCoverageFrom: [
    "**/*.(t|j)s",
    "!**/*.spec.ts",
    "!**/*.interface.ts",
    "!**/*.dto.ts",
    "!**/*.entity.ts",
  ],
  coverageDirectory: "../coverage",
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/../test/setup.ts"],
  setupFiles: ["<rootDir>/../test/env-setup.ts"],
  testTimeout: 10000,
  verbose: true,
  clearMocks: true,
  restoreMocks: true,
  detectOpenHandles: true,
  forceExit: true,
  maxWorkers: "50%",
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/dist/",
    "<rootDir>/coverage/",
  ],
  transformIgnorePatterns: ["node_modules/(?!(.*\\.mjs$))"],
  modulePaths: ["<rootDir>"],
  moduleDirectories: ["node_modules", "src"],
  preset: "ts-jest",
  reporters: ["default"],
  watchman: true,
  cache: true,
  cacheDirectory: "<rootDir>/../.jest-cache",
  errorOnDeprecated: true,
  bail: false,
  logHeapUsage: true,
};

export default config;
