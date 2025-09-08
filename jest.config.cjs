module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup/setupTests.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^hooks$': '<rootDir>/src/hooks/index.ts',
    '^hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^store/(.*)$': '<rootDir>/src/store/$1',
    '^utils/(.*)$': '<rootDir>/src/utils/$1',
  },
  globals: {
    'import.meta': {
      env: {
        DEV: false,
        PROD: true,
        NODE_ENV: 'test'
      }
    }
  },
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': ['babel-jest'],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
  ],
  testMatch: [
    '<rootDir>/tests/**/*.(test|spec).(ts|tsx|js)',
    '<rootDir>/src/**/*.(test|spec).(ts|tsx|js)',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(msw|@tanstack|react-router|lucide-react)/)',
  ],
  testTimeout: 10000,
}