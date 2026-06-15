import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ["./vitest.setup.js"],
    globals: true,
    environment: 'node',
    testTimeout: 10000,
    include: ['tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'json-summary', 'html'],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60
      }
    },
  },
});
