import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ["./vitest.setup.js"],
    globals: true,
    environment: 'node',
    testTimeout: 10000,
    include: ['tests/**/*.test.js', 'test/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'json-summary', 'html'],
      thresholds: {
        lines: 30,
        functions: 30,
        branches: 20,
        statements: 30,
        // CRDT-critical module coverage: >= 60%
        // Phase F (offline-first) depends on these passing
      }
    },
  },
});
