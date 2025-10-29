/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.+(ts|tsx|js)', '**/?(*.)+(spec|test).+(ts|tsx|js)'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          esModuleInterop: true,
          allowSyntheticDefaultImports: true
        }
      }
    ]
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/types/**/*',
    '!src/main.ts', // Entry point with hooks - integration test territory
    '!src/ui/ExistentialNPCGeneratorUI.ts', // Complex UI with lots of DOM manipulation
    '!src/ui/PortraitConfirmationDialog.ts', // Complex UI dialog
    '!src/generator/ExistentialNPCGenerator.ts', // Large generator with complex logic - focus on utilities
    '!src/services/AIService.ts', // AI service with external API calls
    '!src/utils/actorParsing.ts', // Complex Foundry actor creation logic
    '!src/utils/equipmentData.ts', // Large data constants
    '!src/utils/spellData.ts' // Large data constants
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  verbose: true
};
