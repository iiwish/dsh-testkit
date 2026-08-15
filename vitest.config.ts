import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: process.env.DSH_TESTKIT_E2E === '1'
      ? ['tests/e2e/**/*.test.ts']
      : ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    environment: 'node',
    testTimeout: 30_000,
    hookTimeout: 30_000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: ['src/**/*.ts'],
      thresholds: {
        statements: 45,
        branches: 60,
        functions: 45,
        lines: 45,
      },
    },
  },
})
